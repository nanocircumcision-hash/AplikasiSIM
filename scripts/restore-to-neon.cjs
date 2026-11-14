const fs = require('fs');
const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_d3BoasIpP0YV@ep-nameless-shadow-ak91s6ld.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require';
const BACKUP_FILE = 'backups/cloud_sql_development_database_2026-09-10_07-55-48.sql';

async function run() {
  const content = fs.readFileSync(BACKUP_FILE, 'utf8');
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();
  console.log('Connected to Neon successfully!');

  const tablesInOrder = [
    'branches',
    'users',
    'clinic_settings',
    'guardians',
    'patients',
    'patient_categories',
    'circumcision_packages',
    'package_prices',
    'circumcision_methods',
    'doctors',
    'doctor_schedules',
    'doctor_fee_rules',
    'employees',
    'employee_fee_rules',
    'products',
    'package_included_items',
    'stock_movements',
    'bookings',
    'booking_status_history',
    'queues',
    'circumcision_procedures',
    'informed_consents',
    'certificates',
    'invoices',
    'transaction_items',
    'payments',
    'doctor_fee_transactions',
    'employee_fee_transactions',
    'payrolls',
    'expense_categories',
    'expense_transactions',
    'follow_ups',
    'audit_logs'
  ];

  function parseCopyBlock(sqlContent, tableName) {
    const regex = new RegExp('COPY public\\.' + tableName + ' \\(([^)]+)\\) FROM stdin;\\n([\\s\\S]*?)\\n\\\\\\.', 'm');
    const match = sqlContent.match(regex);
    if (!match) return null;
    const cols = match[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const rows = match[2].trim().split('\n').filter(l => l.trim().length > 0).map(line => {
      return line.split('\t').map(v => (v === '\\N' ? null : v));
    });
    return { cols, rows };
  }

  // Clear mock / sample seed data first so real data can be cleanly restored
  console.log('Cleaning mock/seed tables in Neon...');
  for (const table of [...tablesInOrder].reverse()) {
    try {
      await client.query(`TRUNCATE TABLE public."${table}" CASCADE;`);
    } catch (tErr) {
      // ignore if table doesn't exist
    }
  }

  console.log('Restoring tables from backup into Neon...');
  let totalRestoredRows = 0;

  for (const tableName of tablesInOrder) {
    const block = parseCopyBlock(content, tableName);
    if (!block || block.rows.length === 0) {
      continue;
    }

    const { cols, rows } = block;
    const colList = cols.map(c => `"${c}"`).join(', ');

    let inserted = 0;
    for (const row of rows) {
      const placeholders = row.map((_, idx) => `$${idx + 1}`).join(', ');
      const query = `INSERT INTO public."${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
      try {
        await client.query(query, row);
        inserted++;
      } catch (insErr) {
        console.warn(`[${tableName}] Insert error:`, insErr.message);
      }
    }
    console.log(`- Restored table ${tableName}: ${inserted}/${rows.length} rows`);
    totalRestoredRows += inserted;

    // Reset sequences for auto-increment IDs
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('public."${tableName}"', 'id'), COALESCE(MAX(id), 1)) FROM public."${tableName}";`);
    } catch (_seqErr) {}
  }

  console.log(`\nSUCCESS! Restored ${totalRestoredRows} rows across all tables into Neon!`);
  await client.end();
}

run().catch(err => {
  console.error('Fatal error during restore:', err);
  process.exit(1);
});
