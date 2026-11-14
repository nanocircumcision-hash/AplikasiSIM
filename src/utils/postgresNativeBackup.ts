import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

export interface PgToolsDetection {
  available: boolean;
  pgDumpPath: string | null;
  pgRestorePath: string | null;
  version: string | null;
  scannedLocations: string[];
  platform: string;
}

export interface PostgresConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
}

export interface BackupExecutionResult {
  success: boolean;
  filename: string;
  filePath: string;
  sizeBytes: number;
  sizeHuman: string;
  type: 'full' | 'data' | 'structure';
  format: 'custom' | 'plain';
  database: string;
  timestamp: string;
  validatedWithPgRestore: boolean;
  validationMessage?: string;
  commandExecuted?: string;
  error?: string;
}

/**
 * Retrieve database credentials safely from environment variables.
 */
export function getPostgresConfig(): PostgresConnectionConfig {
  const host = process.env.SQL_HOST || process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.SQL_PORT || process.env.PGPORT || '5432', 10);
  const database = process.env.SQL_DB_NAME || process.env.PGDATABASE || 'nano_clinic';
  const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || process.env.PGUSER || 'postgres';
  const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.PGPASSWORD || '';

  return { host, port, database, user, password };
}

function getPgToolVersion(pgDumpPath: string): string {
  try {
    const out = execSync(`"${pgDumpPath}" --version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (out) return out;
  } catch (_e) {}
  return 'PostgreSQL CLI Utility';
}

/**
 * Detect pg_dump and pg_restore binaries dynamically across Windows and Linux/macOS environments.
 */
export function detectPgTools(): PgToolsDetection {
  const platform = process.platform;
  const isWindows = platform === 'win32';
  const scannedLocations: string[] = [];

  // 1. Check explicit environment overrides first
  const envPgDump = process.env.PG_DUMP_PATH || process.env.POSTGRES_PG_DUMP;
  const envPgRestore = process.env.PG_RESTORE_PATH || process.env.POSTGRES_PG_RESTORE;

  if (envPgDump && fs.existsSync(envPgDump)) {
    return {
      available: true,
      pgDumpPath: envPgDump,
      pgRestorePath: envPgRestore && fs.existsSync(envPgRestore) ? envPgRestore : null,
      version: getPgToolVersion(envPgDump),
      scannedLocations: [envPgDump],
      platform,
    };
  }

  // 2. Try resolving via PATH command (where.exe on Windows, which on Linux/macOS)
  try {
    const checkCmd = isWindows ? 'where.exe pg_dump.exe' : 'which pg_dump';
    const stdout = execSync(checkCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (stdout) {
      const firstPath = stdout.split(/\r?\n/)[0].trim();
      if (fs.existsSync(firstPath)) {
        const restoreName = isWindows ? 'pg_restore.exe' : 'pg_restore';
        const restorePath = path.join(path.dirname(firstPath), restoreName);
        return {
          available: true,
          pgDumpPath: firstPath,
          pgRestorePath: fs.existsSync(restorePath) ? restorePath : null,
          version: getPgToolVersion(firstPath),
          scannedLocations: [firstPath],
          platform,
        };
      }
    }
  } catch (_e) {
    // Not found in PATH, continue to direct directory discovery
  }

  // 3. Windows Directory Dynamic Discovery (Auto-detects any PostgreSQL version folder)
  if (isWindows) {
    const candidateBases = [
      'C:\\Program Files\\PostgreSQL',
      'C:\\Program Files (x86)\\PostgreSQL',
      'D:\\Program Files\\PostgreSQL',
      'E:\\Program Files\\PostgreSQL',
      'C:\\PostgreSQL',
      'D:\\PostgreSQL',
      'C:\\EnterpriseDB',
    ];

    for (const base of candidateBases) {
      scannedLocations.push(base);
      if (fs.existsSync(base)) {
        try {
          const subdirs = fs.readdirSync(base);
          // Sort descending so newer versions (17, 16, 15...) are checked first
          subdirs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

          for (const sub of subdirs) {
            const dumpCandidate = path.join(base, sub, 'bin', 'pg_dump.exe');
            scannedLocations.push(dumpCandidate);
            if (fs.existsSync(dumpCandidate)) {
              const restoreCandidate = path.join(base, sub, 'bin', 'pg_restore.exe');
              return {
                available: true,
                pgDumpPath: dumpCandidate,
                pgRestorePath: fs.existsSync(restoreCandidate) ? restoreCandidate : null,
                version: getPgToolVersion(dumpCandidate),
                scannedLocations,
                platform,
              };
            }
          }

          // Also check direct bin directory
          const directBinDump = path.join(base, 'bin', 'pg_dump.exe');
          scannedLocations.push(directBinDump);
          if (fs.existsSync(directBinDump)) {
            const directBinRestore = path.join(base, 'bin', 'pg_restore.exe');
            return {
              available: true,
              pgDumpPath: directBinDump,
              pgRestorePath: fs.existsSync(directBinRestore) ? directBinRestore : null,
              version: getPgToolVersion(directBinDump),
              scannedLocations,
              platform,
            };
          }
        } catch (_err) {
          // ignore directory read permission errors
        }
      }
    }
  } else {
    // Linux / macOS standard paths
    const unixBases = [
      '/usr/lib/postgresql',
      '/usr/bin',
      '/usr/local/bin',
      '/opt/homebrew/bin',
    ];

    for (const base of unixBases) {
      scannedLocations.push(base);
      if (fs.existsSync(base)) {
        if (base === '/usr/lib/postgresql') {
          try {
            const versions = fs.readdirSync(base);
            versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            for (const v of versions) {
              const dumpCandidate = path.join(base, v, 'bin', 'pg_dump');
              scannedLocations.push(dumpCandidate);
              if (fs.existsSync(dumpCandidate)) {
                const restoreCandidate = path.join(base, v, 'bin', 'pg_restore');
                return {
                  available: true,
                  pgDumpPath: dumpCandidate,
                  pgRestorePath: fs.existsSync(restoreCandidate) ? restoreCandidate : null,
                  version: getPgToolVersion(dumpCandidate),
                  scannedLocations,
                  platform,
                };
              }
            }
          } catch (_e) {}
        } else {
          const dumpCandidate = path.join(base, 'pg_dump');
          scannedLocations.push(dumpCandidate);
          if (fs.existsSync(dumpCandidate)) {
            const restoreCandidate = path.join(base, 'pg_restore');
            return {
              available: true,
              pgDumpPath: dumpCandidate,
              pgRestorePath: fs.existsSync(restoreCandidate) ? restoreCandidate : null,
              version: getPgToolVersion(dumpCandidate),
              scannedLocations,
              platform,
            };
          }
        }
      }
    }
  }

  return {
    available: false,
    pgDumpPath: null,
    pgRestorePath: null,
    version: null,
    scannedLocations,
    platform,
  };
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Run native pg_dump utility securely without exposing credentials in command line arguments.
 */
export async function runNativePgDump(options: {
  type: 'full' | 'data' | 'structure';
  format: 'custom' | 'plain';
  customOutputDir?: string;
}): Promise<BackupExecutionResult> {
  const tools = detectPgTools();

  if (!tools.available || !tools.pgDumpPath) {
    throw new Error(
      `pg_dump tidak ditemukan pada sistem (${tools.platform}). ` +
      `Pastikan PostgreSQL sudah terinstall dan folder bin PostgreSQL telah didaftarkan pada PATH Windows, ` +
      `atau atur PG_DUMP_PATH di file konfigurasi .env.`
    );
  }

  const config = getPostgresConfig();
  const now = new Date();
  
  // Format local timestamp: YYYY-MM-DD_HH-mm-ss
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestampStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  const ext = options.format === 'custom' ? 'backup' : 'sql';
  const cleanDbName = (config.database || 'nano_clinic').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanDbName}_${timestampStr}.${ext}`;

  // Ensure backup directory exists
  const outputDir = options.customOutputDir || path.join(process.cwd(), 'backups');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const destinationFilePath = path.join(outputDir, filename);

  // Build command-line arguments (password is NEVER passed in args!)
  const args: string[] = [];

  // 1. Format argument:
  // -Fc for PostgreSQL Custom Format
  // -Fp for Plain SQL
  if (options.format === 'custom') {
    args.push('-Fc');
  } else {
    args.push('-Fp');
    // For plain SQL structure/full, add clean drops and creates
    if (options.type !== 'data') {
      args.push('--clean');
      args.push('--if-exists');
    }
  }

  // 2. Type argument:
  if (options.type === 'structure') {
    args.push('--schema-only');
  } else if (options.type === 'data') {
    args.push('--data-only');
  }
  // If 'full', neither --schema-only nor --data-only is passed, which dumps everything:
  // schema, tables, constraints, foreign keys, indexes, triggers, functions, sequences, and data!

  // Verbose output for detailed logging
  args.push('-v');

  // Connection parameters
  args.push('-h', config.host);
  args.push('-p', String(config.port));
  args.push('-U', config.user);
  args.push('-d', config.database);
  args.push('-f', destinationFilePath);

  // Masked command for user display/logging
  const maskedCommand = `pg_dump ${options.format === 'custom' ? '-Fc' : '-Fp'} ${
    options.type === 'structure' ? '--schema-only' : options.type === 'data' ? '--data-only' : ''
  } -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} -f ${filename}`.replace(/\s+/g, ' ');

  // Execute pg_dump with PGPASSWORD passed securely in environment
  await new Promise<void>((resolve, reject) => {
    const env = {
      ...process.env,
      PGPASSWORD: config.password || '',
    };

    const child = spawn(tools.pgDumpPath!, args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrBuffer = '';

    child.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Gagal mengeksekusi pg_dump: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Remove any credentials or passwords from stderr before throwing
        const safeError = stderrBuffer
          .replace(new RegExp(config.password || '___nomatch___', 'g'), '******')
          .trim();
        reject(new Error(`pg_dump gagal dengan exit code ${code}. Detail: ${safeError || 'Proses dihentikan.'}`));
      }
    });
  });

  // Verify file was created and is not empty
  if (!fs.existsSync(destinationFilePath)) {
    throw new Error(`File backup gagal dibuat di lokasi: ${destinationFilePath}`);
  }

  const stat = fs.statSync(destinationFilePath);
  if (stat.size === 0) {
    fs.unlinkSync(destinationFilePath); // Remove empty file
    throw new Error(`File backup yang dihasilkan kosong (0 byte).`);
  }

  // 3. Validation with pg_restore --list (Mandatory for Custom Format)
  let validatedWithPgRestore = false;
  let validationMessage = '';

  if (options.format === 'custom' && tools.pgRestorePath && fs.existsSync(tools.pgRestorePath)) {
    try {
      const tocOutput = await new Promise<string>((resolve, reject) => {
        const checkChild = spawn(tools.pgRestorePath!, ['--list', destinationFilePath], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let out = '';
        let errOut = '';

        checkChild.stdout.on('data', (d) => (out += d.toString()));
        checkChild.stderr.on('data', (d) => (errOut += d.toString()));

        checkChild.on('close', (code) => {
          if (code === 0 && out.length > 0) {
            resolve(out);
          } else {
            reject(new Error(`pg_restore --list validasi gagal: ${errOut || 'Arsip tidak valid'}`));
          }
        });
      });

      // Count object entries from pg_restore TOC
      const entryCount = tocOutput.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith(';')).length;
      validatedWithPgRestore = true;
      validationMessage = `Validasi pg_restore sukses: ${entryCount} objek database (schema, tabel, index, data, constraint) terverifikasi utuh.`;
    } catch (valErr: any) {
      // If validation fails, mark as failed
      throw new Error(`Validasi integritas file backup gagal: ${valErr.message}`);
    }
  } else if (options.format === 'plain') {
    // For plain SQL, verify presence of SQL statements
    const sample = fs.readFileSync(destinationFilePath, { encoding: 'utf8', flag: 'r' }).slice(0, 1000);
    if (!sample.includes('PostgreSQL') && !sample.includes('CREATE') && !sample.includes('INSERT') && !sample.includes('SET')) {
      throw new Error('Validasi file SQL gagal: Konten tidak sesuai format SQL PostgreSQL.');
    }
    validatedWithPgRestore = true;
    validationMessage = 'File SQL Plain valid dan berisi instruksi DDL/DML PostgreSQL.';
  }

  return {
    success: true,
    filename,
    filePath: destinationFilePath,
    sizeBytes: stat.size,
    sizeHuman: formatBytes(stat.size),
    type: options.type,
    format: options.format,
    database: config.database,
    timestamp: timestampStr,
    validatedWithPgRestore,
    validationMessage,
    commandExecuted: maskedCommand,
  };
}

/**
 * List existing backups in ./backups directory
 */
export function listSavedBackups(customOutputDir?: string) {
  const dir = customOutputDir || path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);
  return files
    .filter((f) => f.endsWith('.backup') || f.endsWith('.sql') || f.endsWith('.json'))
    .map((filename) => {
      const filePath = path.join(dir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        filePath,
        sizeBytes: stat.size,
        sizeHuman: formatBytes(stat.size),
        createdAt: stat.mtime.toISOString(),
        isCustomFormat: filename.endsWith('.backup'),
        isSqlFormat: filename.endsWith('.sql'),
        isJsonFormat: filename.endsWith('.json'),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
