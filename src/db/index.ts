import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: pg.Pool | undefined;
}

function isTransientError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err?.cause?.code || '';
  const msg = (String(err.message || '') + ' ' + String(err?.cause?.message || '')).toLowerCase();
  return (
    code === 'EPIPE' ||
    code === 'ECONNRESET' ||
    code === '57P01' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOENT' ||
    msg.includes('enoent') ||
    msg.includes('.s.pgsql.') ||
    msg.includes('connect enoent') ||
    msg.includes('epipe') ||
    msg.includes('econnreset') ||
    msg.includes('connection terminated') ||
    msg.includes('socket has been ended') ||
    msg.includes('closed the connection unexpectedly') ||
    msg.includes('resource exhausted') ||
    msg.includes('resourceexhausted') ||
    msg.includes('cooldown active') ||
    msg.includes('stream_sql_data_connection_rate') ||
    msg.includes('quota exceeded')
  );
}

function maskDbUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return `${u.protocol}//${u.username || 'user'}:****@${u.host}${u.pathname}`;
  } catch {
    return 'URL_TERPASANG';
  }
}

// Function to create or retrieve the connection pool
export const createPool = () => {
  if (!global._postgresPool) {
    let poolConfig: pg.PoolConfig;

    const rawDbUrl = (
      process.env.DATABASE_URL || 
      process.env.DATABASE_PRIVATE_URL || 
      process.env.DATABASE_PUBLIC_URL || 
      process.env.POSTGRES_URL || 
      ''
    ).trim();

    if (rawDbUrl) {
      const isLocal = rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1');
      const isSocket = rawDbUrl.startsWith('/') || rawDbUrl.includes('cloudsql');
      const isRailwayInternal = rawDbUrl.includes('.railway.internal');
      const isSslDisabled = rawDbUrl.includes('sslmode=disable') || process.env.DB_SSL === 'false' || isRailwayInternal;
      const requiresSsl = !isSslDisabled && !isSocket && (process.env.DB_SSL === 'true' || rawDbUrl.includes('sslmode=require') || (!isLocal && !isRailwayInternal));

      console.log(`[Database Init] Menggunakan URL database: ${maskDbUrl(rawDbUrl)} (SSL: ${requiresSsl ? 'aktif' : 'non-aktif'})`);

      poolConfig = {
        connectionString: rawDbUrl,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 10000,
        keepAlive: !isSocket,
        keepAliveInitialDelayMillis: 10000,
      };
    } else {
      const host = (
        process.env.PGHOST || 
        process.env.SQL_HOST || 
        process.env.DB_HOST || 
        'localhost'
      ).trim();
      const isSocket = typeof host === 'string' && (host.startsWith('/') || host.includes('cloudsql'));
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      const isRailwayInternal = host.includes('.railway.internal');
      const isSslDisabled = process.env.DB_SSL === 'false' || isRailwayInternal;
      const requiresSsl = !isSocket && !isSslDisabled && (process.env.DB_SSL === 'true' || (!isLocal && !isRailwayInternal));

      const port = Number(process.env.PGPORT || process.env.SQL_PORT || process.env.DB_PORT) || 5432;
      const user = process.env.PGUSER || process.env.SQL_ADMIN_USER || process.env.SQL_USER || process.env.DB_USER || 'postgres';
      const password = process.env.PGPASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || process.env.DB_PASSWORD || 'postgres';
      const database = process.env.PGDATABASE || process.env.SQL_DB_NAME || process.env.DB_NAME || 'nano_clinic';

      if (isLocal) {
        console.warn(`[Database Warning] DATABASE_URL tidak terdeteksi. Mencoba koneksi lokal ke ${host}:${port}/${database}. Jika di Railway, pastikan variabel DATABASE_URL sudah dimasukkan di tab Variables!`);
      } else {
        console.log(`[Database Init] Menggunakan host: ${host}:${port}/${database} (User: ${user}, SSL: ${requiresSsl ? 'aktif' : 'non-aktif'})`);
      }

      poolConfig = {
        host,
        port,
        user,
        password,
        database,
        ssl: isSocket ? false : (requiresSsl ? { rejectUnauthorized: false } : undefined),
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 10000,
        keepAlive: !isSocket,
        keepAliveInitialDelayMillis: 10000,
      };
    }

    const createdPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors on idle clients from crashing Node
    createdPool.on('error', (err: any) => {
      console.warn('[Database Pool] Idle client socket closed or reset by server:', err?.message || err);
    });

    // Wrap query with bounded exponential backoff with jitter
    // as per Cloud SQL guidelines for transient socket drops (EPIPE, ENOENT, Connection terminated)
    const originalQuery = createdPool.query.bind(createdPool);
    (createdPool as any).query = async function resilientQuery(...args: any[]) {
      let attempts = 0;
      const maxAttempts = 8;
      while (attempts < maxAttempts) {
        try {
          return await (originalQuery as any)(...args);
        } catch (err: any) {
          attempts++;
          if (isTransientError(err) && attempts < maxAttempts) {
            const delay = 350 * attempts + Math.floor(Math.random() * 200);
            console.warn(`[Database Pool] Transient socket state detected (${err.code || err.message}). Retrying query in ${delay}ms (attempt ${attempts}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw err;
        }
      }
    };

    // Wrap connect for transactions and direct clients (used by Drizzle ORM)
    const originalConnect = createdPool.connect.bind(createdPool);
    (createdPool as any).connect = async function resilientConnect(...args: any[]) {
      let attempts = 0;
      const maxAttempts = 8;
      while (attempts < maxAttempts) {
        try {
          const client = await (originalConnect as any)(...args);
          // Wrap client.query so queries executed directly by Drizzle on this client are resilient
          if (client && !client._resilientWrapped) {
            client._resilientWrapped = true;
            const origClientQuery = client.query.bind(client);
            client.query = async function (...qArgs: any[]) {
              let qAttempts = 0;
              const maxQAttempts = 5;
              while (qAttempts < maxQAttempts) {
                try {
                  return await (origClientQuery as any)(...qArgs);
                } catch (qErr: any) {
                  qAttempts++;
                  if (isTransientError(qErr) && qAttempts < maxQAttempts) {
                    const delay = 300 * qAttempts + Math.floor(Math.random() * 150);
                    console.warn(`[Database Client] Transient socket error (${qErr.code || qErr.message}). Retrying query in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                  }
                  throw qErr;
                }
              }
            };
          }
          return client;
        } catch (err: any) {
          attempts++;
          if (isTransientError(err) && attempts < maxAttempts) {
            const delay = 350 * attempts + Math.floor(Math.random() * 200);
            console.warn(`[Database Pool] Transient connect state (${err.code || err.message}). Retrying connect in ${delay}ms (attempt ${attempts}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw err;
        }
      }
    };

    global._postgresPool = createdPool;
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

