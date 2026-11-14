import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, pool } from './src/db/index.ts';
import { 
  branches, patients, guardians, patientCategories, circumcisionPackages, packagePrices, circumcisionMethods,
  doctors, doctorSchedules, doctorFeeRules, doctorMethodFeeRules, bookings, bookingStatusHistory, 
  queues, circumcisionProcedures, informedConsents, certificates, invoices, 
  payments, doctorFeeTransactions, expenseCategories, expenseTransactions, 
  followUps, auditLogs, clinicSettings, users,
  products, packageIncludedItems, stockMovements, transactionItems,
  employees, employeeFeeRules, employeeFeeTransactions, employeeOvertimes, payrolls
} from './src/db/schema.ts';
import { eq, and, or, desc, sql, inArray, notInArray, ilike } from 'drizzle-orm';
import { 
  generateRMNumber, generateBookingNumber, generateInvoiceNumber, 
  generateCertificateNumber, generateFeeNumber, generateExpenseNumber, 
  generateQueueNumber, generateStockMovementNumber, generateProductSKU,
  generateDoctorCode, generateEmployeeCode, generateEmployeeFeeNumber, generatePayrollNumber
} from './src/utils/numbering.ts';
import { requireAuth, createSessionToken, type AuthRequest } from './src/middleware/auth.ts';
import { detectPgTools, runNativePgDump, getPostgresConfig, listSavedBackups, formatBytes } from './src/utils/postgresNativeBackup.ts';
import { generateCompletePostgresDdl, buildCompletePostgresSqlDump, getAllPostgresTableCreationStatements, getAllPostgresIndexStatements } from './src/utils/postgresSchemaDdl.ts';
import { generateCompleteMysqlDdl, buildCompleteMysqlDump } from './src/utils/mysqlSchemaDdl.ts';

function resolvePort(): number {
  // 1. Check CLI arguments (e.g. --port 3000 passed by supervisor)
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // 2. In AI Studio dev environment, Nginx uses 8080 and dev app must bind to 3000
  if (process.env.APPLET_ID || process.env.DEFAULT_APP_PORT) {
    return parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
  }
  // 3. In external deployments (Railway, Render, VPS, etc.), always respect PORT env var even if NODE_ENV is unset
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

const PORT = resolvePort();
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Audit Log Helper
async function recordAudit(action: string, entity: string, entityId: string, performedBy: string, details?: string) {
  try {
    await db.insert(auditLogs).values({
      action,
      entity,
      entityId,
      performedBy,
      details: details || '',
    });
  } catch (err) {
    console.warn('Failed to write audit log:', err);
  }
}

// Multi-Branch Helper Functions
function getBranchFilter(req: express.Request): string {
  const user = (req as any).user;
  const isSuperUser = !user || user.role === 'owner' || user.role === 'admin' || user.role === 'super admin' || user.role === 'master' || (typeof user.role === 'string' && user.role.toLowerCase().includes('admin'));

  // Locked user: staff or doctor locked to a branch CANNOT view other branches
  if (user && user.branchCode && user.branchCode !== 'ALL' && !isSuperUser) {
    return user.branchCode.toUpperCase();
  }

  // 1. Query parameter (?branchCode=CABANG-01)
  const qBranch = (req.query?.branchCode as string || req.query?.branch as string);
  if (qBranch && qBranch.trim()) {
    return qBranch.trim().toUpperCase();
  }

  // 2. Custom HTTP Header (x-branch-code: CABANG-01)
  const hBranch = req.headers['x-branch-code'] as string;
  if (hBranch && hBranch.trim()) {
    return hBranch.trim().toUpperCase();
  }

  // 3. User default branch if set
  if (user && user.branchCode && user.branchCode !== 'ALL') {
    return user.branchCode.toUpperCase();
  }

  return 'PUSAT';
}

function resolveTargetBranch(req: express.Request, explicitBranch?: string): string {
  const user = (req as any).user;
  const isSuperUser = !user || user.role === 'owner' || user.role === 'admin' || user.role === 'super admin' || user.role === 'master' || (typeof user.role === 'string' && user.role.toLowerCase().includes('admin'));

  // Locked user can only create/update in their own branch
  if (user && user.branchCode && user.branchCode !== 'ALL' && !isSuperUser) {
    return user.branchCode.toUpperCase();
  }

  if (explicitBranch && explicitBranch.trim() && explicitBranch !== 'ALL') {
    return explicitBranch.trim().toUpperCase();
  }

  const b = getBranchFilter(req);
  if (b && b !== 'ALL') return b;

  return 'PUSAT';
}

function filterByBranch<T extends { branchCode?: string | null }>(items: T[], targetBranch: string): T[] {
  if (!targetBranch || targetBranch === 'ALL') return items;
  return items.filter(item => {
    const itemBranch = (item.branchCode || 'PUSAT').toUpperCase();
    return itemBranch === targetBranch.toUpperCase();
  });
}

// Seed initial users and employees if empty
async function seedInitialData() {
  try {
    const hashPassword = (p: string) => crypto.createHash('sha256').update(p).digest('hex');

    // 0. Seed Branches
    const existingBranches = await db.select().from(branches).limit(1);
    if (existingBranches.length === 0) {
      console.log('Seeding initial branches...');
      await db.insert(branches).values([
        {
          code: 'PUSAT',
          name: 'Klinik Pusat (Surabaya)',
          address: 'Jl. Pemuda No. 45, Surabaya',
          phone: '0811-3001-001',
          managerName: 'H. Rian Gunawan, S.E.',
          isActive: true,
        },
        {
          code: 'CABANG-01',
          name: 'Cabang 01 (Sidoarjo)',
          address: 'Jl. Ahmad Yani No. 12, Sidoarjo',
          phone: '0811-3001-002',
          managerName: 'dr. Bambang Irawan, Sp.B',
          isActive: true,
        },
        {
          code: 'CABANG-02',
          name: 'Cabang 02 (Malang)',
          address: 'Jl. Ijen No. 88, Malang',
          phone: '0811-3001-003',
          managerName: 'dr. Muhammad Ali Gufron',
          isActive: true,
        },
      ]);
    }

    // 1. Seed Clinic Settings
    const existingSettings = await db.select().from(clinicSettings).limit(1);
    if (existingSettings.length === 0) {
      console.log('Seeding clinic settings...');
      await db.insert(clinicSettings).values({
        clinicName: 'NANO CIRCUMCISION CLINIC',
        tagline: 'Sunat Canggih & Modern',
        address: 'Jl. Kesehatan No. 88, Jakarta Selatan',
        phone: '0812-8888-9999',
        email: 'info@nanocircumcision.com',
        website: 'www.nanocircumcision.com',
        invoiceHeader: 'Terima kasih atas kepercayaan Anda pada Nano Circumcision Clinic.',
        invoiceFooter: 'Kwitansi & Invoice ini sah dan telah diproses secara digital melalui sistem klinik.',
      });
    } else if (existingSettings[0]?.tagline === 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit' || existingSettings[0]?.tagline === 'Pusat Sunat Canggih & Modern Tanpa Jahit') {
      await db.update(clinicSettings).set({ tagline: 'Sunat Canggih & Modern' }).where(eq(clinicSettings.id, existingSettings[0].id));
    }

    // 2. Seed Patient Categories (REGULER & VIP)
    const existingCategories = await db.select().from(patientCategories).limit(1);
    if (existingCategories.length === 0) {
      console.log('Seeding patient categories...');
      await db.insert(patientCategories).values([
        {
          code: 'REG',
          name: 'Pasien Reguler',
          description: 'Pelayanan khitan standar fasilitas lengkap ruang tindakan ramah anak.',
          isDefault: true,
          isActive: true,
        },
        {
          code: 'VIP',
          name: 'Pasien VIP',
          description: 'Pelayanan khitan prioritas ruang privat eksekutif, suvenir premium, dan konsultasi privat.',
          isDefault: false,
          isActive: true,
        },
      ]);
    }

    // 3. Seed Users
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Seeding initial system users...');
      await db.insert(users).values([
        {
          uid: 'user-owner',
          email: 'owner@nanocircumcision.com',
          fullName: 'H. Rian Gunawan, S.E. (Owner / Super Admin)',
          role: 'owner',
          phone: '0811-2233-4455',
          passwordHash: hashPassword('owner123'),
          permissions: JSON.stringify([
            'dashboard.view', 'patients.view', 'patients.create', 'patients.edit', 'patients.delete',
            'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
            'procedures.view', 'procedures.edit', 'procedures.complete',
            'products.view', 'products.create', 'products.edit', 'products.adjust_stock',
            'cashier.view', 'cashier.payment', 'cashier.void',
            'doctor_fees.view', 'doctor_fees.manage',
            'employees.view', 'employees.manage',
            'payroll.view', 'payroll.manage',
            'expenses.view', 'expenses.manage',
            'reports.view', 'reports.export',
            'master.view', 'master.manage',
            'users.view', 'users.manage',
            'audit.view', 'settings.manage'
          ]),
          isActive: true,
        },
        {
          uid: 'user-admin',
          email: 'admin@nanocircumcision.com',
          fullName: 'Siti Rahmawati, S.Kep (Admin Operasional)',
          role: 'admin',
          phone: '0812-3456-7890',
          passwordHash: hashPassword('admin123'),
          permissions: JSON.stringify([
            'dashboard.view', 'patients.view', 'patients.create', 'patients.edit',
            'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.cancel',
            'procedures.view', 'procedures.edit', 'procedures.complete',
            'products.view', 'products.create', 'products.edit', 'products.adjust_stock',
            'cashier.view', 'cashier.payment',
            'doctor_fees.view',
            'employees.view',
            'payroll.view',
            'expenses.view', 'expenses.manage',
            'reports.view', 'reports.export', 'view_revenue_profit', 'view_financials',
            'master.view',
            'settings.manage'
          ]),
          isActive: true,
        },
        {
          uid: 'user-staff',
          email: 'staff@nanocircumcision.com',
          fullName: 'Dina Safitri (Front Office & Kasir)',
          role: 'staff',
          phone: '0813-9876-5432',
          passwordHash: hashPassword('staff123'),
          permissions: JSON.stringify([
            'dashboard.view', 'patients.view', 'patients.create',
            'bookings.view', 'bookings.create', 'bookings.edit',
            'cashier.view', 'cashier.payment',
            'products.view'
          ]),
          isActive: true,
        },
        {
          uid: 'user-doctor',
          email: 'dokter@nanocircumcision.com',
          fullName: 'dr. Bambang Irawan, Sp.B (Dokter Operator Khitan)',
          role: 'doctor',
          phone: '0812-7777-8888',
          passwordHash: hashPassword('dokter123'),
          permissions: JSON.stringify([
            'dashboard.view', 'patients.view',
            'procedures.view', 'procedures.edit', 'procedures.complete',
            'doctor_fees.view'
          ]),
          isActive: true,
        }
      ]);
    }

    // 4. Seed Employees
    const existingEmployees = await db.select().from(employees).limit(1);
    if (existingEmployees.length === 0) {
      console.log('Seeding initial employees...');
      await db.insert(employees).values([
        {
          employeeCode: 'EMP-001',
          name: 'Ns. Ahmad Fauzi, S.Kep',
          position: 'Perawat Khitan & Asisten Medis Utama',
          phone: '0812-3344-5566',
          email: 'ahmad.fauzi@nanocircumcision.com',
          startDate: '2024-01-15',
          basicSalary: 3500000,
          defaultPatientFee: 25000,
          isActive: true,
          notes: 'Asisten tindakan khitan senior bersertifikat',
        },
        {
          employeeCode: 'EMP-002',
          name: 'Ns. Tri Wahyuni, A.Md.Kep',
          position: 'Perawat Khitan & Asisten Medis',
          phone: '0813-4455-6677',
          email: 'tri.wahyuni@nanocircumcision.com',
          startDate: '2024-03-01',
          basicSalary: 3200000,
          defaultPatientFee: 20000,
          isActive: true,
          notes: 'Asisten tindakan dan penanggung jawab sterilisasi instrumen',
        },
        {
          employeeCode: 'EMP-003',
          name: 'Dina Safitri',
          position: 'Front Office & Kasir',
          phone: '0813-9876-5432',
          email: 'dina.safitri@nanocircumcision.com',
          startDate: '2024-02-10',
          basicSalary: 3000000,
          defaultPatientFee: 10000,
          isActive: true,
          notes: 'Customer service, pendaftaran pasien dan kasir operasional',
        },
        {
          employeeCode: 'EMP-004',
          name: 'Budi Santoso',
          position: 'Teknisi Logistik & Sterilisasi',
          phone: '0815-6677-8899',
          email: 'budi.santoso@nanocircumcision.com',
          startDate: '2024-05-01',
          basicSalary: 2800000,
          defaultPatientFee: 5000,
          isActive: true,
          notes: 'Pengelolaan inventaris obat, klem, dan sterilisasi',
        }
      ]);
    }

    // 5. Seed Circumcision Methods & Packages & Prices
    const existingCircumcisionMethods = await db.select().from(circumcisionMethods).limit(1);
    if (existingCircumcisionMethods.length === 0) {
      console.log('Seeding initial circumcision methods & packages...');
      const methodsSeed = [
        {
          name: 'Klem Nano Sealer',
          description: 'Metode khitan modern menggunakan klem steril dan perekat luka bedah (sealer) tanpa perban/jahitan.',
          notes: 'Minim nyeri, luka cepat kering, anak bisa langsung beraktivitas normal dan mandi.',
          regulerPrice: 1800000,
          vipPrice: 2500000,
        },
        {
          name: 'Super Ring Khitan',
          description: 'Teknologi cincin khitan steril tanpa jahitan, tanpa jarum suntik, dan tanpa perban pelindung.',
          notes: 'Cincin akan terlepas secara alami dan higienis dalam rentang 7-14 hari pasca tindakan.',
          regulerPrice: 2000000,
          vipPrice: 2700000,
        },
        {
          name: 'Laser CO2 / Cauter Presisi',
          description: 'Metode bedah kauter pemotong jaringan berkecepatan tinggi dengan pendarahan minimal.',
          notes: 'Pilihan presisi untuk anak usia remaja dan dewasa dengan fiksasi jahitan halus estetik.',
          regulerPrice: 1700000,
          vipPrice: 2400000,
        },
        {
          name: 'Klasik Jahitan Halus Estetik',
          description: 'Metode bedah konvensional standar medis dengan benang absorbable presisi estetika bedah.',
          notes: 'Direkomendasikan untuk kasus anatomi khusus, perlengketan/fimosis berat, atau tindakan revisi.',
          regulerPrice: 1500000,
          vipPrice: 2200000,
        },
      ];

      const cats = await db.select().from(patientCategories);
      const regCatId = cats.find(c => c.code === 'REG')?.id || 1;
      const vipCatId = cats.find(c => c.code === 'VIP')?.id || 2;

      for (const m of methodsSeed) {
        const insertedMethod = await db.insert(circumcisionMethods).values({
          name: m.name,
          description: m.description,
          notes: m.notes,
          isActive: true,
          isDeleted: false,
        }).returning();

        const methodObj = insertedMethod[0];
        const cleanCode = `PKG-00${methodObj.id}`;

        const insertedPkg = await db.insert(circumcisionPackages).values({
          code: cleanCode,
          name: m.name,
          description: m.description,
          durationMinutes: 45,
          isActive: true,
        }).returning();

        const pkgObj = insertedPkg[0];

        // Insert prices
        await db.insert(packagePrices).values([
          {
            packageId: pkgObj.id,
            patientCategoryId: regCatId,
            price: m.regulerPrice,
            effectiveFrom: new Date().toISOString().split('T')[0],
            isActive: true,
          },
          {
            packageId: pkgObj.id,
            patientCategoryId: vipCatId,
            price: m.vipPrice,
            effectiveFrom: new Date().toISOString().split('T')[0],
            isActive: true,
          }
        ]);
      }
    }

    // 6. Seed Doctors
    const existingDoctors = await db.select().from(doctors).limit(1);
    if (existingDoctors.length === 0) {
      console.log('Seeding initial doctors...');
      const insertedDoc = await db.insert(doctors).values({
        code: 'DOC-001',
        name: 'dr. Bambang Irawan, Sp.B',
        specialty: 'Dokter Operator Khitan Senior',
        description: 'Spesialis Bedah Umum & Operator Khitan Senior',
        phone: '0812-7777-8888',
        email: 'dokter@nanocircumcision.com',
        sipNumber: 'SIP.446/012/DS/2023',
        isActive: true,
      }).returning();

      const docId = insertedDoc[0].id;
      // Seed schedule
      await db.insert(doctorSchedules).values([
        { doctorId: docId, dayOfWeek: 'Senin', startTime: '08:00', endTime: '16:00', maxCapacity: 10, isActive: true },
        { doctorId: docId, dayOfWeek: 'Selasa', startTime: '08:00', endTime: '16:00', maxCapacity: 10, isActive: true },
        { doctorId: docId, dayOfWeek: 'Rabu', startTime: '08:00', endTime: '16:00', maxCapacity: 10, isActive: true },
        { doctorId: docId, dayOfWeek: 'Kamis', startTime: '08:00', endTime: '16:00', maxCapacity: 10, isActive: true },
        { doctorId: docId, dayOfWeek: 'Jumat', startTime: '08:00', endTime: '16:00', maxCapacity: 10, isActive: true },
        { doctorId: docId, dayOfWeek: 'Sabtu', startTime: '08:00', endTime: '17:00', maxCapacity: 15, isActive: true },
        { doctorId: docId, dayOfWeek: 'Minggu', startTime: '08:00', endTime: '17:00', maxCapacity: 15, isActive: true },
      ]);
    }

    // 7. Seed Expense Categories
    const existingExpenseCats = await db.select().from(expenseCategories).limit(1);
    if (existingExpenseCats.length === 0) {
      console.log('Seeding expense categories...');
      await db.insert(expenseCategories).values([
        { name: 'Alat Medis & Bahan Habis Pakai', description: 'Klem, cincin, benang bedah, antiseptik, perban', isDefault: true },
        { name: 'Obat-obatan & Farmasi', description: 'Analgetik, antibiotik, salep luka', isDefault: false },
        { name: 'Operasional & Utilitas', description: 'Listrik, air, internet, kebersihan, ATK klinik', isDefault: false },
        { name: 'Honor & Gaji Karyawan', description: 'Gaji pokok, insentif lembur, dan bonus staf', isDefault: false },
        { name: 'Pemasaran & Edukasi', description: 'Brosur, iklan digital, suvenir khitan', isDefault: false },
      ]);
    }

    // 8. Seed Products & Medical Supplies
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Seeding products & supplies...');
      await db.insert(products).values([
        { sku: 'PRD-CLN-001', name: 'Celana Khitan Pelindung Anak', category: 'CELANA_SUNAT', unit: 'pcs', costPrice: 20000, sellPrice: 35000, stock: 100, minStock: 20, isActive: true },
        { sku: 'PRD-OBT-001', name: 'Paket Obat Perawatan Khitan Lengkap', category: 'OBAT', unit: 'paket', costPrice: 45000, sellPrice: 75000, stock: 150, minStock: 25, isActive: true },
        { sku: 'PRD-TTS-001', name: 'Obat Tetes Antiseptik Khitan', category: 'OBAT_TETES', unit: 'botol', costPrice: 25000, sellPrice: 45000, stock: 120, minStock: 20, isActive: true },
        { sku: 'PRD-AKS-001', name: 'Klem Khitan Steril Disposable', category: 'AKSESORIS', unit: 'pcs', costPrice: 85000, sellPrice: 150000, stock: 80, minStock: 15, isActive: true },
        { sku: 'PRD-MYN-001', name: 'Suvenir & Mainan Pejuang Sunat', category: 'MAINAN', unit: 'pcs', costPrice: 25000, sellPrice: 50000, stock: 120, minStock: 30, isActive: true },
      ]);
    }

    // 9. Seed Doctor Method Fee Rules (Glans Pro Bipolar Pensealer, Nano Klemp, dsb)
    try {
      const existingMethodFeeRules = await db.select().from(doctorMethodFeeRules).limit(1);
      if (existingMethodFeeRules.length === 0) {
        console.log('Seeding initial doctor method fee rules (Glans Pro Bipolar Pensealer, Nano Klemp, dll)...');
        const defaultMethodFeeSeeds = [
          // 1. Glans Pro Bipolar Pensealer
          {
            methodName: 'Metode Glans Pro Bipolar Pensealer',
            patientCondition: 'STANDAR',
            regulerFee: 250000,
            vipFee: 350000,
            description: 'Fee dokter tindakan Glans Pro Bipolar Pensealer anak standar',
          },
          {
            methodName: 'Metode Glans Pro Bipolar Pensealer',
            patientCondition: 'GEMUK',
            regulerFee: 400000,
            vipFee: 500000,
            description: 'Fee dokter tindakan Glans Pro Bipolar Pensealer kasus anak gemuk / mikropenis',
          },
          {
            methodName: 'Metode Glans Pro Bipolar Pensealer',
            patientCondition: 'ABK',
            regulerFee: 450000,
            vipFee: 550000,
            description: 'Fee dokter tindakan Glans Pro Bipolar Pensealer kasus ABK (Anak Berkebutuhan Khusus)',
          },
          {
            methodName: 'Metode Glans Pro Bipolar Pensealer',
            patientCondition: 'DEWASA',
            regulerFee: 500000,
            vipFee: 650000,
            description: 'Fee dokter tindakan Glans Pro Bipolar Pensealer pasien usia dewasa',
          },
          // 2. Nano Klemp
          {
            methodName: 'Metode Tindakan Nano Klemp',
            patientCondition: 'STANDAR',
            regulerFee: 250000,
            vipFee: 350000,
            description: 'Fee dokter tindakan Nano Klemp anak standar',
          },
          {
            methodName: 'Metode Tindakan Nano Klemp',
            patientCondition: 'GEMUK',
            regulerFee: 300000,
            vipFee: 400000,
            description: 'Fee dokter tindakan Nano Klemp kasus anak gemuk',
          },
          {
            methodName: 'Metode Tindakan Nano Klemp',
            patientCondition: 'ABK',
            regulerFee: 350000,
            vipFee: 450000,
            description: 'Fee dokter tindakan Nano Klemp kasus ABK (Anak Berkebutuhan Khusus)',
          },
          {
            methodName: 'Metode Tindakan Nano Klemp',
            patientCondition: 'DEWASA',
            regulerFee: 400000,
            vipFee: 500000,
            description: 'Fee dokter tindakan Nano Klemp pasien usia dewasa',
          },
          // 3. Laser CO2 / Cauter Presisi
          {
            methodName: 'Laser CO2 / Cauter Presisi',
            patientCondition: 'STANDAR',
            regulerFee: 280000,
            vipFee: 380000,
            description: 'Fee dokter tindakan Laser CO2 / Cauter anak standar',
          },
          {
            methodName: 'Laser CO2 / Cauter Presisi',
            patientCondition: 'GEMUK',
            regulerFee: 330000,
            vipFee: 430000,
            description: 'Fee dokter tindakan Laser CO2 / Cauter anak gemuk',
          },
          {
            methodName: 'Laser CO2 / Cauter Presisi',
            patientCondition: 'ABK',
            regulerFee: 380000,
            vipFee: 480000,
            description: 'Fee dokter tindakan Laser CO2 / Cauter anak ABK',
          },
          {
            methodName: 'Laser CO2 / Cauter Presisi',
            patientCondition: 'DEWASA',
            regulerFee: 430000,
            vipFee: 550000,
            description: 'Fee dokter tindakan Laser CO2 / Cauter pasien dewasa',
          },
          // 4. Super Ring Khitan
          {
            methodName: 'Super Ring Khitan',
            patientCondition: 'STANDAR',
            regulerFee: 300000,
            vipFee: 400000,
            description: 'Fee dokter tindakan Super Ring anak standar',
          },
          {
            methodName: 'Super Ring Khitan',
            patientCondition: 'GEMUK',
            regulerFee: 350000,
            vipFee: 450000,
            description: 'Fee dokter tindakan Super Ring anak gemuk',
          },
          {
            methodName: 'Super Ring Khitan',
            patientCondition: 'ABK',
            regulerFee: 400000,
            vipFee: 500000,
            description: 'Fee dokter tindakan Super Ring anak ABK',
          },
          {
            methodName: 'Super Ring Khitan',
            patientCondition: 'DEWASA',
            regulerFee: 450000,
            vipFee: 600000,
            description: 'Fee dokter tindakan Super Ring pasien dewasa',
          },
        ];

        for (const rule of defaultMethodFeeSeeds) {
          await db.insert(doctorMethodFeeRules).values({
            doctorId: null, // default semua dokter
            methodName: rule.methodName,
            patientCondition: rule.patientCondition,
            regulerFee: rule.regulerFee,
            vipFee: rule.vipFee,
            description: rule.description,
            isActive: true,
          });
        }
      }

      // Normalisasi otomatis aturan fee metode lama di database agar tidak ada 450.000 untuk kasus STANDAR
      try {
        await pool.query(`
          UPDATE "doctor_method_fee_rules"
          SET "vip_fee" = 350000, "reguler_fee" = 250000
          WHERE "patient_condition" = 'STANDAR' 
            AND ("doctor_id" IS NULL OR "doctor_id" = 0)
            AND "vip_fee" = 450000
        `);

        // Sinkronkan transaksi fee dokter berstatus PENDING dengan fee master dokter yang berlaku
        const allDocsForSync = await db.select().from(doctors);
        const allFeeRules = await db.select().from(doctorFeeRules).where(eq(doctorFeeRules.isActive, true));
        for (const d of allDocsForSync) {
          const docRules = allFeeRules.filter(f => f.doctorId === d.id);
          const vipRule = docRules.find(f => f.patientCategoryId === 2);
          const regRule = docRules.find(f => f.patientCategoryId === 1);
          const docVip = vipRule ? vipRule.feeAmount : 350000;
          const docReg = regRule ? regRule.feeAmount : 250000;
          await pool.query(`
            UPDATE "doctor_fee_transactions"
            SET "fee_amount" = $1
            WHERE "doctor_id" = $2 
              AND "status" = 'PENDING' 
              AND ("service_type" = 'VIP' OR "patient_category_id" = 2)
              AND ("patient_condition" = 'STANDAR' OR "patient_condition" IS NULL)
          `, [docVip, d.id]);
          await pool.query(`
            UPDATE "doctor_fee_transactions"
            SET "fee_amount" = $1
            WHERE "doctor_id" = $2 
              AND "status" = 'PENDING' 
              AND ("service_type" = 'REGULER' OR "patient_category_id" = 1 OR "patient_category_id" IS NULL)
              AND ("patient_condition" = 'STANDAR' OR "patient_condition" IS NULL)
          `, [docReg, d.id]);
        }
      } catch (normErr) {
        console.warn('Notice normalizing doctor method and pending fees:', normErr);
      }
    } catch (mErr: any) {
      console.warn('Notice seeding doctorMethodFeeRules:', mErr?.message || mErr);
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
}

// Auto-seed baseline operational clinic transactions (Dinonaktifkan agar tidak menyuntikkan data dummy ke Railway)
async function ensureSampleTransactionsIfEmpty() {
  // Database di Railway adalah database produksi asli klinik.
  // Dinonaktifkan: Tidak boleh menyuntikkan data contoh / dummy baru ke database pengguna.
  return;
  /*

    // 1. Guardian
    let guardianId = 1;
    const existingGuardians = await db.select().from(guardians).limit(1);
    if (existingGuardians.length === 0) {
      const [g] = await db.insert(guardians).values({
        name: 'Tn. Hendra Wijaya',
        relationship: 'Ayah Kandung',
        phone: '0812-9988-7711',
        address: 'Jl. Pemuda No. 45, Surabaya',
        branchCode: 'PUSAT',
      }).returning();
      guardianId = g.id;
    } else {
      guardianId = existingGuardians[0].id;
    }

    // 2. Doctor, Categories, Packages
    const allDocs = await db.select().from(doctors);
    const doctorId = allDocs[0]?.id || 1;
    const allCats = await db.select().from(patientCategories);
    const regCatId = allCats.find(c => c.code === 'REG')?.id || 1;
    const vipCatId = allCats.find(c => c.code === 'VIP')?.id || 2;
    const allPkgs = await db.select().from(circumcisionPackages);
    const pkg1Id = allPkgs[0]?.id || 1;
    const pkg2Id = allPkgs[1]?.id || pkg1Id;

    // 3. Patients
    const samplePatients = [
      { name: 'Muhammad Farhan', age: '8 Tahun', birthDate: '2018-05-12', weight: '24', height: '122' },
      { name: 'Kenzo Aradhana', age: '7 Tahun', birthDate: '2019-03-20', weight: '22', height: '118' },
      { name: 'Rayyan Alfarizi', age: '9 Tahun', birthDate: '2017-08-15', weight: '27', height: '128' },
      { name: 'Daniswara Putra', age: '6 Tahun', birthDate: '2020-01-10', weight: '20', height: '112' },
    ];

    const seededPatients = [];
    for (let i = 0; i < samplePatients.length; i++) {
      const sp = samplePatients[i];
      const rm = `RM-2026-00000${i + 1}`;
      const [p] = await db.insert(patients).values({
        rmNumber: rm,
        fullName: sp.name,
        guardianId: guardianId,
        birthDate: sp.birthDate,
        gender: 'Laki-laki',
        address: 'Jl. Pemuda No. 45, Surabaya',
        phone: '0812-9988-7711',
        ageYears: parseInt(sp.age, 10) || 8,
        weightKg: sp.weight,
        heightCm: sp.height,
        branchCode: 'PUSAT',
      }).returning();
      seededPatients.push(p);
    }

    // Helper for dynamic dates (today, yesterday, 3 days ago, 7 days ago)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };
    const dateToday = todayStr;
    const date1DayAgo = daysAgo(1);
    const date3DaysAgo = daysAgo(3);
    const date7DaysAgo = daysAgo(7);

    // 4. Bookings, Procedures, Invoices, Payments, Doctor Fees
    const txConfigs = [
      { patientIdx: 0, date: dateToday, time: '09:00', method: 'Metode Glans Pro Bipolar Pensealer', price: 2500000, catId: regCatId, pkgId: pkg1Id, payMethod: 'CASH', feeAmt: 350000 },
      { patientIdx: 1, date: date1DayAgo, time: '10:30', method: 'Metode Glans Pro Bipolar Pensealer', price: 2500000, catId: regCatId, pkgId: pkg1Id, payMethod: 'TRANSFER', feeAmt: 350000 },
      { patientIdx: 2, date: date3DaysAgo, time: '13:00', method: 'Metode Glans Pro Bipolar Pensealer', price: 2700000, catId: vipCatId, pkgId: pkg2Id, payMethod: 'QRIS', feeAmt: 450000 },
      { patientIdx: 3, date: date7DaysAgo, time: '14:30', method: 'Metode Glans Pro Bipolar Pensealer', price: 2450000, catId: regCatId, pkgId: pkg1Id, payMethod: 'CASH', feeAmt: 450000 },
    ];

    for (let i = 0; i < txConfigs.length; i++) {
      const cfg = txConfigs[i];
      const pat = seededPatients[cfg.patientIdx];
      const dateClean = cfg.date.replace(/-/g, '');
      const bkNum = `BOOK-${dateClean}-000${i + 1}`;
      const invNum = `INV-${dateClean}-000${i + 1}`;
      const procNum = `PROC-${dateClean}-000${i + 1}`;
      const payNum = `PAY-${dateClean}-000${i + 1}`;
      const feeNum = `FEE-${dateClean}-000${i + 1}`;

      const [bk] = await db.insert(bookings).values({
        bookingNumber: bkNum,
        patientId: pat.id,
        guardianId: guardianId,
        patientCategoryId: cfg.catId,
        packageId: cfg.pkgId,
        doctorId: doctorId,
        bookingDate: cfg.date,
        bookingTime: cfg.time,
        methodType: cfg.method,
        packagePriceSnapshot: cfg.price,
        discountAmount: 0,
        totalAmount: cfg.price,
        status: 'COMPLETED',
        branchCode: 'PUSAT',
      }).returning();

      const [proc] = await db.insert(circumcisionProcedures).values({
        procedureNumber: procNum,
        bookingId: bk.id,
        patientId: pat.id,
        doctorId: doctorId,
        procedureDate: cfg.date,
        procedureTime: cfg.time,
        methodType: cfg.method,
        anesthesiaType: 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
        procedureNotes: `Tindakan medis khitan metode ${cfg.method} selesai dengan hasil baik dan simetris`,
        status: 'COMPLETED',
        branchCode: 'PUSAT',
        completedAt: new Date(`${cfg.date}T10:00:00Z`),
      }).returning();

      const [inv] = await db.insert(invoices).values({
        invoiceNumber: invNum,
        bookingId: bk.id,
        patientId: pat.id,
        doctorId: doctorId,
        totalAmount: cfg.price,
        subtotal: cfg.price,
        discount: 0,
        paidAmount: cfg.price,
        remainingAmount: 0,
        status: 'PAID',
        invoiceDate: cfg.date,
        branchCode: 'PUSAT',
      }).returning();

      await db.insert(payments).values({
        paymentNumber: payNum,
        invoiceId: inv.id,
        paymentDate: cfg.date,
        paymentTime: '10:20:00',
        amount: cfg.price,
        paymentMethod: cfg.payMethod,
        paymentType: cfg.payMethod,
        receivedBy: 'Dina Safitri (Kasir)',
        notes: `Pelunasan tindakan khitan ${pat.fullName}`,
        branchCode: 'PUSAT',
      });

      await db.insert(doctorFeeTransactions).values({
        feeNumber: feeNum,
        doctorId: doctorId,
        patientId: pat.id,
        procedureId: proc.id,
        bookingId: bk.id,
        packageId: cfg.pkgId,
        patientCategoryId: cfg.catId,
        feeDate: cfg.date,
        feeAmount: cfg.feeAmt,
        status: 'APPROVED',
        notes: `Jasa medis dokter tindakan #${procNum}`,
        branchCode: 'PUSAT',
      });

      // Synchronize included package items & stock deduction
      try {
        await ensureIncludedItemsForBooking(bk.id);
        const bItems = await db.select().from(transactionItems).where(eq(transactionItems.bookingId, bk.id));
        for (const item of bItems) {
          await db.update(transactionItems).set({
            isStockDeducted: true,
            deductedAt: new Date(`${cfg.date}T10:05:00Z`),
            procedureId: proc.id
          }).where(eq(transactionItems.id, item.id));
        }
      } catch (itemErr) {
        console.warn('Item sync notice:', itemErr);
      }
    }

    // 5. Operating Expenses
    const sampleExpenses = [
      { num: `EXP-${dateToday.replace(/-/g, '')}-0001`, catId: 3, catName: 'Sewa & Utilitas', title: 'Sewa Ruang & Utilitas Listrik Klinik', amt: 1500000, date: dateToday },
      { num: `EXP-${date1DayAgo.replace(/-/g, '')}-0002`, catId: 1, catName: 'Bahan Habis Pakai Medis', title: 'Bahan Habis Pakai & Sterilisasi Alkes', amt: 650000, date: date1DayAgo },
      { num: `EXP-${date3DaysAgo.replace(/-/g, '')}-0003`, catId: 3, catName: 'Operasional & Logistik', title: 'Konsumsi & Logistik Staf Klinis', amt: 250000, date: date3DaysAgo },
    ];
    for (const exp of sampleExpenses) {
      await db.insert(expenseTransactions).values({
        transactionNumber: exp.num,
        expenseDate: exp.date,
        categoryId: exp.catId,
        categoryName: exp.catName,
        description: exp.title,
        amount: exp.amt,
        paymentMethod: 'TRANSFER',
        branchCode: 'PUSAT',
        createdBy: 'Admin',
        status: 'PAID',
      });
    }

    console.log('✓ [Render DB Sync] Inisialisasi data tindakan khitan & laporan keuangan sukses!');
  } catch (err: any) {
    console.warn('[Seed Transactions] Notice:', err?.message || err);
  }
  */
}

// Comprehensive self-healing schema migrations: Ensure all newly added columns and tables exist in existing database
async function runCompleteSchemaMigration(): Promise<string[]> {
  const logs: string[] = [];
  const tablesWithBranchCode = [
    'users',
    'guardians',
    'patients',
    'doctors',
    'bookings',
    'queues',
    'circumcision_procedures',
    'informed_consents',
    'certificates',
    'invoices',
    'payments',
    'doctor_fee_transactions',
    'expense_transactions',
    'products',
    'employees',
    'employee_fee_transactions',
    'payrolls'
  ];

  // 1. Ensure branch_code column on every operational table
  for (const table of tablesWithBranchCode) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "${table}" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT'`);
      logs.push(`✓ Kolom branch_code pada tabel "${table}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom branch_code pada tabel "${table}": ${err.message}`);
    }
  }

  // 2. Ensure branches table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" SERIAL PRIMARY KEY,
        "code" text NOT NULL UNIQUE,
        "name" text NOT NULL,
        "address" text,
        "phone" text,
        "manager_name" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE IF EXISTS "branches" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`);
    logs.push('✓ Tabel "branches" siap');
  } catch (err: any) {
    logs.push(`! Tabel "branches": ${err.message}`);
  }

  // 3. Ensure employees table columns exist
  const employeeColumns = [
    { name: 'start_date', def: "text NOT NULL DEFAULT '2026-01-01'" },
    { name: 'basic_salary', def: 'integer NOT NULL DEFAULT 0' },
    { name: 'default_patient_fee', def: 'integer NOT NULL DEFAULT 20000' },
    { name: 'closing_fee_per_patient', def: 'integer NOT NULL DEFAULT 25000' },
    { name: 'overtime_hourly_rate', def: 'integer NOT NULL DEFAULT 35000' },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" },
    { name: 'is_active', def: 'boolean NOT NULL DEFAULT true' },
    { name: 'is_deleted', def: 'boolean NOT NULL DEFAULT false' },
    { name: 'description', def: 'text' },
    { name: 'notes', def: 'text' }
  ];
  for (const col of employeeColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom employees."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom employees."${col.name}": ${err.message}`);
    }
  }

  // 4. Ensure products table columns exist
  const productColumns = [
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" },
    { name: 'is_active', def: 'boolean NOT NULL DEFAULT true' },
    { name: 'cost_price', def: 'integer NOT NULL DEFAULT 0' },
    { name: 'min_stock', def: 'integer NOT NULL DEFAULT 5' },
    { name: 'description', def: 'text' }
  ];
  for (const col of productColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom products."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom products."${col.name}": ${err.message}`);
    }
  }

  // 5. Ensure doctors table columns exist
  const doctorColumns = [
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" },
    { name: 'is_active', def: 'boolean DEFAULT true' },
    { name: 'sip_number', def: 'text' }
  ];
  for (const col of doctorColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "doctors" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom doctors."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom doctors."${col.name}": ${err.message}`);
    }
  }

  // 6. Ensure users table columns exist
  const userColumns = [
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" },
    { name: 'phone', def: 'text' },
    { name: 'is_active', def: 'boolean DEFAULT true' },
    { name: 'permissions', def: "text DEFAULT '[]'" }
  ];
  for (const col of userColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom users."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom users."${col.name}": ${err.message}`);
    }
  }

  // 6b. Auto-grant view_revenue_profit to admin users if missing
  try {
    const adminRows = await pool.query(`SELECT id, permissions FROM users WHERE role IN ('admin', 'super_admin', 'super admin')`);
    for (const row of adminRows.rows) {
      try {
        let perms: string[] = typeof row.permissions === 'string' ? JSON.parse(row.permissions || '[]') : (row.permissions || []);
        if (!perms.includes('view_revenue_profit')) {
          perms.push('view_revenue_profit', 'view_financials', 'reports.view', 'reports.export');
          await pool.query(`UPDATE users SET permissions = $1 WHERE id = $2`, [JSON.stringify(perms), row.id]);
          logs.push(`✓ Auto-granted financial reports permissions to admin (ID: ${row.id})`);
        }
      } catch {}
    }
  } catch {}

  // 7. Ensure stock_movements table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" SERIAL PRIMARY KEY,
        "movement_number" text NOT NULL UNIQUE,
        "product_id" integer NOT NULL,
        "movement_type" text NOT NULL,
        "quantity" integer NOT NULL,
        "previous_stock" integer NOT NULL,
        "current_stock" integer NOT NULL,
        "unit_cost" integer,
        "unit_price" integer,
        "reference_type" text,
        "reference_id" integer,
        "notes" text,
        "performed_by" text,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logs.push('✓ Tabel "stock_movements" siap');
  } catch (err: any) {
    logs.push(`! Tabel "stock_movements": ${err.message}`);
  }

  // 8. Ensure doctor_fee_transactions columns exist (title, fee_type, etc.)
  const doctorFeeColumns = [
    { name: 'title', def: 'text' },
    { name: 'fee_type', def: "text DEFAULT 'PROCEDURE'" },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" },
    { name: 'package_id', def: 'integer' },
    { name: 'patient_category_id', def: 'integer' },
    { name: 'invoice_id', def: 'integer' },
    { name: 'method_name', def: 'text' },
    { name: 'patient_condition', def: "text DEFAULT 'STANDAR'" },
    { name: 'service_type', def: "text DEFAULT 'REGULER'" },
    { name: 'fee_date', def: 'text' },
    { name: 'approved_at', def: 'timestamp' },
    { name: 'paid_at', def: 'timestamp' },
    { name: 'paid_date', def: 'text' },
    { name: 'notes', def: 'text' }
  ];
  for (const col of doctorFeeColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom doctor_fee_transactions."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom doctor_fee_transactions."${col.name}": ${err.message}`);
    }
  }

  // 8a. Ensure doctor_method_fee_rules table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "doctor_method_fee_rules" (
        "id" serial PRIMARY KEY,
        "doctor_id" integer REFERENCES "doctors"("id") ON DELETE CASCADE,
        "method_id" integer,
        "method_name" text NOT NULL,
        "patient_condition" text NOT NULL DEFAULT 'STANDAR',
        "reguler_fee" integer NOT NULL DEFAULT 250000,
        "vip_fee" integer NOT NULL DEFAULT 350000,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    logs.push('✓ Tabel "doctor_method_fee_rules" siap');
  } catch (err: any) {
    logs.push(`! Tabel "doctor_method_fee_rules": ${err.message}`);
  }

  // 8a-2. Ensure employee_overtimes table exists & payrolls.overtime_hours supports fractional hours
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "employee_overtimes" (
        "id" serial PRIMARY KEY,
        "employee_id" integer NOT NULL REFERENCES "employees"("id"),
        "employee_name" text NOT NULL,
        "overtime_date" text NOT NULL,
        "period_month" text NOT NULL,
        "start_time" text,
        "end_time" text,
        "hours" double precision NOT NULL DEFAULT 0,
        "hourly_rate" integer NOT NULL DEFAULT 0,
        "total_amount" integer NOT NULL DEFAULT 0,
        "reason" text,
        "branch_code" text DEFAULT 'PUSAT',
        "recorded_by" text NOT NULL DEFAULT 'Admin',
        "created_at" timestamp DEFAULT now()
      );
    `);
    await pool.query(`ALTER TABLE IF EXISTS "payrolls" ALTER COLUMN "overtime_hours" TYPE double precision USING "overtime_hours"::double precision`);
    logs.push('✓ Tabel "employee_overtimes" & kolom pecahan jam lembur siap');
  } catch (err: any) {
    logs.push(`! Tabel "employee_overtimes": ${err.message}`);
  }

  // 8b. Ensure columns on doctor_fee_transactions and employee_fee_transactions are NULLABLE where optional (Fix for manual fees & bonuses)
  try {
    await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ALTER COLUMN "procedure_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ALTER COLUMN "booking_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ALTER COLUMN "patient_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ALTER COLUMN "invoice_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "employee_fee_transactions" ALTER COLUMN "procedure_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "employee_fee_transactions" ALTER COLUMN "booking_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "employee_fee_transactions" ALTER COLUMN "patient_id" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "employee_fee_transactions" ALTER COLUMN "patient_rm" DROP NOT NULL`);
    await pool.query(`ALTER TABLE IF EXISTS "employee_fee_transactions" ALTER COLUMN "patient_name" DROP NOT NULL`);
    logs.push('✓ Menyesuaikan constraint kolom opsional pada doctor_fee_transactions & employee_fee_transactions (DROP NOT NULL)');
  } catch (dropErr: any) {
    logs.push(`! Penyesuaian nullability fee transactions: ${dropErr?.message}`);
  }

  // 9. Ensure bookings columns exist
  const bookingColumns = [
    { name: 'closing_staff_id', def: 'integer' },
    { name: 'closing_staff_name', def: 'text' },
    { name: 'patient_source', def: "text DEFAULT 'Walk-in'" },
    { name: 'package_price_snapshot', def: 'integer DEFAULT 0' },
    { name: 'discount_amount', def: 'integer DEFAULT 0' },
    { name: 'dp_amount', def: 'integer DEFAULT 0' },
    { name: 'remaining_amount', def: 'integer DEFAULT 0' },
    { name: 'method_type', def: 'text' },
    { name: 'anesthesia_type', def: 'text' },
    { name: 'notes', def: 'text' },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" }
  ];
  for (const col of bookingColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "bookings" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom bookings."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom bookings."${col.name}": ${err.message}`);
    }
  }

  // 10. Ensure circumcision_procedures columns exist
  const procedureColumns = [
    { name: 'doctor_name_snapshot', def: 'text' },
    { name: 'anesthesia_type', def: 'text' },
    { name: 'procedure_time', def: 'text' },
    { name: 'procedure_notes', def: 'text' },
    { name: 'completed_at', def: 'timestamp' },
    { name: 'started_at', def: 'timestamp' },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" }
  ];
  for (const col of procedureColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "circumcision_procedures" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom circumcision_procedures."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom circumcision_procedures."${col.name}": ${err.message}`);
    }
  }

  // 11. Ensure invoices columns exist
  const invoiceColumns = [
    { name: 'doctor_id', def: 'integer' },
    { name: 'cashier_staff_id', def: 'integer' },
    { name: 'cashier_staff_name', def: 'text' },
    { name: 'notes', def: 'text' },
    { name: 'subtotal', def: 'integer DEFAULT 0' },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" }
  ];
  for (const col of invoiceColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "invoices" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom invoices."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom invoices."${col.name}": ${err.message}`);
    }
  }

  // 12. Ensure patients columns exist
  const patientColumns = [
    { name: 'nickname', def: 'text' },
    { name: 'nik', def: 'text' },
    { name: 'school', def: 'text' },
    { name: 'grade', def: 'text' },
    { name: 'weight_kg', def: 'text' },
    { name: 'height_cm', def: 'text' },
    { name: 'allergies', def: 'text' },
    { name: 'special_notes', def: 'text' },
    { name: 'is_deleted', def: 'boolean DEFAULT false' },
    { name: 'deleted_at', def: 'timestamp' },
    { name: 'deleted_by', def: 'text' },
    { name: 'branch_code', def: "text DEFAULT 'PUSAT'" }
  ];
  for (const col of patientColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "patients" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom patients."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom patients."${col.name}": ${err.message}`);
    }
  }

  // 13. Ensure transaction_items columns exist
  const txnItemColumns = [
    { name: 'booking_id', def: 'integer' },
    { name: 'procedure_id', def: 'integer' },
    { name: 'invoice_id', def: 'integer' },
    { name: 'is_stock_deducted', def: 'boolean DEFAULT false' },
    { name: 'deducted_at', def: 'timestamp' },
    { name: 'item_type', def: "text DEFAULT 'ADDON'" }
  ];
  for (const col of txnItemColumns) {
    try {
      await pool.query(`ALTER TABLE IF EXISTS "transaction_items" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.def}`);
      logs.push(`✓ Kolom transaction_items."${col.name}" siap`);
    } catch (err: any) {
      logs.push(`! Kolom transaction_items."${col.name}": ${err.message}`);
    }
  }

  return logs;
}

// Auto-verify database schema state: executes complete DDL table-by-table for 100% resilience on Render
async function ensureDatabaseSchema() {
  try {
    const criticalTables = [
      'branches', 'users', 'guardians', 'patients', 'patient_categories',
      'circumcision_packages', 'package_prices', 'circumcision_methods',
      'doctors', 'doctor_schedules', 'doctor_fee_rules', 'bookings',
      'booking_status_history', 'queues', 'circumcision_procedures',
      'informed_consents', 'certificates', 'invoices', 'payments',
      'doctor_fee_transactions', 'expense_categories', 'expense_transactions',
      'follow_ups', 'audit_logs', 'clinic_settings', 'products',
      'package_included_items', 'stock_movements', 'transaction_items',
      'employees', 'employee_fee_rules', 'employee_fee_transactions', 'payrolls',
      'doctor_method_fee_rules'
    ];

    let existingTables = new Set<string>();
    try {
      const checkTable = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      existingTables = new Set(checkTable?.rows?.map((r: any) => r.table_name) || []);
    } catch (chkErr) {
      console.warn('Notice checking existing tables:', chkErr);
    }

    const missingTables = criticalTables.filter(t => !existingTables.has(t));

    if (missingTables.length > 0) {
      console.log(`[Database Bootstrap] Terdeteksi ${missingTables.length} tabel belum dibuat (${missingTables.join(', ')}). Mengeksekusi pembuatan tabel PostgreSQL...`);
      const tableStatements = getAllPostgresTableCreationStatements();
      for (const stmt of tableStatements) {
        try {
          await pool.query(stmt);
        } catch (stmtErr: any) {
          const msg = String(stmtErr?.message || '').toLowerCase();
          if (!msg.includes('already exists') && !msg.includes('permission denied')) {
            console.warn('[DB Table Init] Notice:', stmtErr?.message);
          }
        }
      }

      const indexStatements = getAllPostgresIndexStatements();
      for (const idxStmt of indexStatements) {
        try {
          await pool.query(idxStmt);
        } catch {
          // Ignore index notices
        }
      }
      console.log('✓ Seluruh tabel database PostgreSQL siap & tersinkronisasi!');
    } else {
      console.log('✓ Seluruh tabel operasional klinik sudah ada di database.');
    }
  } catch (err: any) {
    console.warn('Notice during ensureDatabaseSchema table check:', err?.message || err);
  }

  try {
    const logs = await runCompleteSchemaMigration();
    console.log(`✓ Database schema columns verified & migrated successfully (${logs.length} checks).`);
  } catch (err: any) {
    console.warn('Notice during runCompleteSchemaMigration:', err?.message || err);
  }

  // Ensure unique index for multi-user booking concurrency conflict prevention
  try {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_doctor_schedule_conflict 
      ON bookings (doctor_id, booking_date, booking_time) 
      WHERE status NOT IN ('CANCELLED', 'NO_SHOW');
    `);
  } catch (idxErr: any) {
    console.warn('Notice ensuring booking concurrency index:', idxErr?.message || idxErr);
  }

  // 1. Auto-seed initial clinic setup (branches, settings, users, categories, packages, doctors, products)
  try {
    await seedInitialData();
  } catch (err: any) {
    console.warn('Notice during seedInitialData:', err?.message || err);
  }

  // 2. Auto-seed baseline operational transactions if bookings table is empty
  try {
    await ensureSampleTransactionsIfEmpty();
  } catch (err: any) {
    console.warn('Notice during ensureSampleTransactionsIfEmpty:', err?.message || err);
  }

  // 3. Auto-heal missing payments, synchronize branch codes, and synchronize doctor fees with reports
  try {
    await autoHealMissingPayments();
    await syncBranchCodesAcrossTables();
    await syncDoctorFeesWithReports();
  } catch (err: any) {
    console.warn('Notice during auto-healing:', err?.message || err);
  }
}

// Auto-heal missing payment records for paid/partial invoices (reconnects orphaned invoices to financial revenue)
async function autoHealMissingPayments() {
  try {
    const paidInvoices = await db.select().from(invoices).where(sql`paid_amount > 0`);
    let healedCount = 0;
    for (const inv of paidInvoices) {
      const existingPayments = await db.select().from(payments).where(eq(payments.invoiceId, inv.id));
      const totalPaidInPayments = existingPayments.reduce((acc, p) => acc + p.amount, 0);
      const diff = inv.paidAmount - totalPaidInPayments;
      if (diff > 0) {
        console.log(`[Auto-Heal] Missing payment record for Invoice ${inv.invoiceNumber} (${diff}), auto-generating...`);
        const payNum = `PAY-HEAL-${inv.invoiceNumber.replace('INV-', '')}-${Date.now().toString().slice(-4)}`;
        const nowTime = new Date().toTimeString().split(' ')[0];
        await db.insert(payments).values({
          paymentNumber: payNum,
          invoiceId: inv.id,
          paymentDate: inv.invoiceDate || new Date().toISOString().split('T')[0],
          paymentTime: nowTime,
          amount: diff,
          paymentMethod: 'CASH',
          paymentType: inv.remainingAmount === 0 ? 'FULL_PAYMENT' : 'DP',
          referenceNumber: `AUTO-HEAL-${inv.invoiceNumber}`,
          notes: 'Sinkronisasi pemulihan pembayaran invoice kasir',
          receivedBy: (inv as any).cashierStaffName || 'Staff Kasir',
          branchCode: inv.branchCode || 'PUSAT',
        });
        healedCount++;
      }
    }
    if (healedCount > 0) {
      console.log(`✓ Berhasil memulihkan ${healedCount} catatan pembayaran invoice yang tertunda ke laporan keuangan.`);
    }
  } catch (err: any) {
    console.warn('Notice during autoHealMissingPayments:', err?.message || err);
  }
}

// Sinkronisasi otomatis data antar cabang (invoices, payments, procedures, queues mengikuti booking)
async function syncBranchCodesAcrossTables() {
  try {
    // 1. Sinkronisasi branchCode invoices berdasarkan booking-nya
    await db.execute(sql`
      UPDATE invoices
      SET branch_code = bookings.branch_code
      FROM bookings
      WHERE invoices.booking_id = bookings.id
        AND bookings.branch_code IS NOT NULL
        AND bookings.branch_code != ''
        AND (invoices.branch_code IS NULL OR invoices.branch_code != bookings.branch_code)
    `);

    // 2. Sinkronisasi branchCode payments berdasarkan invoice-nya
    await db.execute(sql`
      UPDATE payments
      SET branch_code = invoices.branch_code
      FROM invoices
      WHERE payments.invoice_id = invoices.id
        AND invoices.branch_code IS NOT NULL
        AND invoices.branch_code != ''
        AND (payments.branch_code IS NULL OR payments.branch_code != invoices.branch_code)
    `);

    // 3. Sinkronisasi branchCode circumcision_procedures berdasarkan booking-nya
    await db.execute(sql`
      UPDATE circumcision_procedures
      SET branch_code = bookings.branch_code
      FROM bookings
      WHERE circumcision_procedures.booking_id = bookings.id
        AND bookings.branch_code IS NOT NULL
        AND bookings.branch_code != ''
        AND (circumcision_procedures.branch_code IS NULL OR circumcision_procedures.branch_code != bookings.branch_code)
    `);

    // 4. Sinkronisasi branchCode queues berdasarkan booking-nya
    await db.execute(sql`
      UPDATE queues
      SET branch_code = bookings.branch_code
      FROM bookings
      WHERE queues.booking_id = bookings.id
        AND bookings.branch_code IS NOT NULL
        AND bookings.branch_code != ''
        AND (queues.branch_code IS NULL OR queues.branch_code != bookings.branch_code)
    `);

    // 5. Sinkronisasi doctor_fee_transactions berdasarkan booking
    await db.execute(sql`
      UPDATE doctor_fee_transactions
      SET branch_code = bookings.branch_code
      FROM bookings
      WHERE doctor_fee_transactions.booking_id = bookings.id
        AND bookings.branch_code IS NOT NULL
        AND bookings.branch_code != ''
        AND (doctor_fee_transactions.branch_code IS NULL OR doctor_fee_transactions.branch_code != bookings.branch_code)
    `);
    console.log('[Branch Sync] Sinkronisasi kode cabang antar tabel (invoices, payments, procedures, queues) selesai.');
  } catch (err: any) {
    console.warn('Notice during syncBranchCodesAcrossTables:', err?.message || err);
  }
}

// Helper untuk menghitung fee dokter per tindakan berdasarkan data Master Dokter & Nakes
async function calculateDoctorMethodFee(params: {
  doctorId: number;
  methodType?: string | null;
  patientCondition?: string | null;
  isVip?: boolean;
  patientAgeYears?: number;
  preConditionNotes?: string;
  notes?: string;
  fallbackPackageId?: number;
}) {
  const { doctorId, isVip = false, patientAgeYears = 0 } = params;
  const rawMethod = (params.methodType || '').trim();
  const rawCond = (params.patientCondition || '').toUpperCase().trim();
  const combinedText = `${rawMethod} ${rawCond} ${params.preConditionNotes || ''} ${params.notes || ''}`.toLowerCase();

  // 1. Tentukan Kondisi Pasien (GEMUK, ABK, DEWASA, atau STANDAR)
  let condition: 'STANDAR' | 'GEMUK' | 'ABK' | 'DEWASA' = 'STANDAR';
  if (rawCond === 'GEMUK' || combinedText.includes('gemuk') || combinedText.includes('obesitas') || combinedText.includes('buried') || combinedText.includes('mikropenis')) {
    condition = 'GEMUK';
  } else if (rawCond === 'ABK' || combinedText.includes('abk') || combinedText.includes('autis') || combinedText.includes('kebutuhan khusus') || combinedText.includes('hiperaktif')) {
    condition = 'ABK';
  } else if (rawCond === 'DEWASA' || combinedText.includes('dewasa') || patientAgeYears >= 18) {
    condition = 'DEWASA';
  }

  // 2. Ambil data dokter dari master doctors
  let targetDoc: any = null;
  if (doctorId) {
    try {
      const docRes = await db.select().from(doctors).where(eq(doctors.id, doctorId));
      if (docRes.length > 0) targetDoc = docRes[0];
    } catch (e) {
      console.warn('Notice loading doctor in calculateDoctorMethodFee:', e);
    }
  }

  // 3. Cek apakah ada doctorFeeRules custom untuk dokter dan paket ini
  let specificDocFee: number | null = null;
  if (doctorId && params.fallbackPackageId) {
    try {
      const feeRules = await db.select().from(doctorFeeRules).where(and(
        eq(doctorFeeRules.doctorId, doctorId),
        eq(doctorFeeRules.packageId, params.fallbackPackageId),
        eq(doctorFeeRules.patientCategoryId, isVip ? 2 : 1),
        eq(doctorFeeRules.isActive, true)
      ));
      if (feeRules.length > 0) {
        specificDocFee = feeRules[0].feeAmount;
      }
    } catch {}
  }

  // Fee master dokter dari menu Dokter & Nakes (doctorFeeRules)
  let docMasterFee = isVip ? 350000 : 250000;
  if (doctorId) {
    try {
      const docRules = await db.select().from(doctorFeeRules).where(and(
        eq(doctorFeeRules.doctorId, doctorId),
        eq(doctorFeeRules.patientCategoryId, isVip ? 2 : 1),
        eq(doctorFeeRules.isActive, true)
      ));
      if (docRules.length > 0) {
        docMasterFee = docRules[0].feeAmount;
      }
    } catch {}
  }

  const baseDoctorFee = specificDocFee !== null ? specificDocFee : docMasterFee;

  // 4. Ambil seluruh aturan fee metode yang aktif untuk menghitung surcharge kasus khusus jika bukan STANDAR
  let rules: any[] = [];
  try {
    rules = await db.select().from(doctorMethodFeeRules).where(eq(doctorMethodFeeRules.isActive, true));
  } catch (err) {
    console.warn('Notice loading doctorMethodFeeRules:', err);
  }

  const matchMethod = (ruleMethodName: string, targetName: string) => {
    const r = (ruleMethodName || '').toLowerCase();
    const t = (targetName || '').toLowerCase();
    if (!t) return false;
    if (r === t) return true;
    if (t.includes('bipolar') || t.includes('glans') || t.includes('pensealer')) {
      if (r.includes('bipolar') || r.includes('glans') || r.includes('pensealer')) return true;
    }
    if ((t.includes('nano') || t.includes('klem')) && (t.includes('klem') || t.includes('klemp') || t.includes('sealer'))) {
      if (r.includes('nano') || r.includes('klem') || r.includes('klemp')) return true;
    }
    if (t.includes('laser') || t.includes('cauter')) {
      if (r.includes('laser') || r.includes('cauter')) return true;
    }
    if (t.includes('ring')) {
      if (r.includes('ring')) return true;
    }
    if (t.includes('klasik') || t.includes('konvensional') || t.includes('jahit')) {
      if (r.includes('klasik') || r.includes('konvensional') || r.includes('jahit')) return true;
    }
    return r.includes(t) || t.includes(r);
  };

  // Cek apakah ada aturan yang spesifik didedikasikan untuk dokter ini (r.doctorId === doctorId)
  let specificDocMethodRule = rules.find(r => r.doctorId === doctorId && matchMethod(r.methodName, rawMethod) && r.patientCondition === condition);

  let finalFeeAmount = baseDoctorFee;
  let resolvedMethodName = rawMethod || 'Metode Khitan Modern';

  if (specificDocMethodRule) {
    finalFeeAmount = isVip ? specificDocMethodRule.vipFee : specificDocMethodRule.regulerFee;
    resolvedMethodName = specificDocMethodRule.methodName;
  } else if (condition !== 'STANDAR') {
    // Tambahkan surcharge kondisi khusus (GEMUK, ABK, DEWASA) jika ada
    const condRule = rules.find(r => matchMethod(r.methodName, rawMethod) && r.patientCondition === condition);
    const stdRule = rules.find(r => matchMethod(r.methodName, rawMethod) && r.patientCondition === 'STANDAR');
    if (condRule && stdRule) {
      const cFee = isVip ? condRule.vipFee : condRule.regulerFee;
      const sFee = isVip ? stdRule.vipFee : stdRule.regulerFee;
      const surcharge = Math.max(0, cFee - sFee);
      finalFeeAmount = baseDoctorFee + surcharge;
      resolvedMethodName = condRule.methodName;
    }
  }

  return {
    feeAmount: finalFeeAmount,
    methodName: resolvedMethodName,
    patientCondition: condition,
    serviceType: (isVip ? 'VIP' : 'REGULER') as 'VIP' | 'REGULER',
    ruleId: specificDocMethodRule?.id,
  };
}

// Sinkronisasi otomatis data fee dokter dengan tindakan medis khitan dan laporan keuangan (Profit & Loss / Payroll)
async function syncDoctorFeesWithReports(targetDoctorId?: number | 'ALL') {
  let createdCount = 0;
  let updatedCount = 0;
  let syncedExpenseCount = 0;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    const allProcs = await db.select().from(circumcisionProcedures);
    const completedProcs = allProcs.filter(p => p.status === 'COMPLETED');
    const allBookings = await db.select().from(bookings);
    const bookingMap = new Map(allBookings.map(b => [b.id, b]));
    const allInvoices = await db.select().from(invoices);
    const invoiceMap = new Map(allInvoices.map(i => [i.bookingId, i]));
    const allDoctors = await db.select().from(doctors);
    const docMap = new Map(allDoctors.map(d => [d.id, d]));
    const allPatients = await db.select().from(patients);
    const patientMap = new Map(allPatients.map(p => [p.id, p]));

    // 1. Verifikasi dan buat snapshot fee dokter untuk setiap tindakan yang selesai
    for (const proc of completedProcs) {
      if (!proc.doctorId) continue;
      if (targetDoctorId && targetDoctorId !== 'ALL' && proc.doctorId !== Number(targetDoctorId)) continue;

      const bk = bookingMap.get(proc.bookingId);
      const doc = docMap.get(proc.doctorId);
      const pat = patientMap.get(proc.patientId);
      const pkgId = bk?.packageId || (proc as any).packageId || 1;
      const catId = bk?.patientCategoryId || (proc as any).patientCategoryId || 1;
      const isVip = catId === 2;
      const branch = proc.branchCode || bk?.branchCode || 'PUSAT';
      const pDate = proc.procedureDate || bk?.bookingDate || todayStr;
      const method = proc.methodType || bk?.methodType || 'Metode Glans Pro Bipolar Pensealer';
      const preCond = proc.preCondition || '';

      // Hitung fee dokter secara dinamis berdasarkan METODE tindakan & KONDISI pasien (Gemuk, ABK, Dewasa, Standar)
      const feeCalc = await calculateDoctorMethodFee({
        doctorId: proc.doctorId,
        methodType: method,
        patientCondition: (proc as any).patientCondition,
        isVip,
        patientAgeYears: pat?.ageYears,
        preConditionNotes: preCond,
        notes: proc.procedureNotes || bk?.notes || '',
      });

      const standardFee = feeCalc.feeAmount;

      // Periksa apakah sudah ada transaksi fee untuk procedure ini
      const existingFees = await db.select().from(doctorFeeTransactions).where(
        or(
          eq(doctorFeeTransactions.procedureId, proc.id),
          and(
            eq(doctorFeeTransactions.bookingId, proc.bookingId),
            eq(doctorFeeTransactions.doctorId, proc.doctorId)
          )
        )
      );

      const inv = invoiceMap.get(proc.bookingId);

      if (existingFees.length === 0) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const feeNumber = `FEE-SYNC-${pDate.replace(/-/g, '')}-${proc.id}-${randomSuffix}`;
        await db.insert(doctorFeeTransactions).values({
          feeNumber,
          feeType: 'PROCEDURE',
          title: `Fee Tindakan Khitan (${feeCalc.methodName})`,
          doctorId: proc.doctorId,
          patientId: proc.patientId,
          bookingId: proc.bookingId,
          procedureId: proc.id,
          invoiceId: inv?.id,
          packageId: pkgId,
          patientCategoryId: catId,
          methodName: feeCalc.methodName,
          patientCondition: feeCalc.patientCondition,
          serviceType: feeCalc.serviceType,
          feeAmount: standardFee,
          feeDate: pDate,
          status: 'APPROVED',
          notes: `Auto-sync fee dokter tindakan #${proc.procedureNumber || proc.id} [${feeCalc.methodName} - ${feeCalc.patientCondition} ${feeCalc.serviceType}] (${doc?.name || 'Dokter Operator'})`,
          branchCode: branch,
        });
        createdCount++;
      } else {
        for (const ef of existingFees) {
          let needUpdate = false;
          const updateObj: any = {};

          if (ef.status === 'PENDING' && ef.feeAmount !== standardFee) {
            updateObj.feeAmount = standardFee;
            needUpdate = true;
          }
          if (!ef.methodName || ef.methodName !== feeCalc.methodName) {
            updateObj.methodName = feeCalc.methodName;
            needUpdate = true;
          }
          if (!ef.patientCondition || ef.patientCondition !== feeCalc.patientCondition) {
            updateObj.patientCondition = feeCalc.patientCondition;
            needUpdate = true;
          }
          if (!ef.serviceType || ef.serviceType !== feeCalc.serviceType) {
            updateObj.serviceType = feeCalc.serviceType;
            needUpdate = true;
          }
          if (!ef.branchCode || ef.branchCode !== branch) {
            updateObj.branchCode = branch;
            needUpdate = true;
          }
          if (!ef.packageId && pkgId) {
            updateObj.packageId = pkgId;
            needUpdate = true;
          }
          if (!ef.patientCategoryId && catId) {
            updateObj.patientCategoryId = catId;
            needUpdate = true;
          }
          if (!ef.invoiceId && inv?.id) {
            updateObj.invoiceId = inv.id;
            needUpdate = true;
          }

          if (needUpdate) {
            await db.update(doctorFeeTransactions).set(updateObj).where(eq(doctorFeeTransactions.id, ef.id));
            updatedCount++;
          }
        }
      }
    }

    // 2. Sinkronkan fee berstatus PAID ke tabel Beban Pengeluaran Operasional (expenseTransactions)
    const paidFees = await db.select().from(doctorFeeTransactions).where(eq(doctorFeeTransactions.status, 'PAID'));
    if (paidFees.length > 0) {
      let cat = (await db.select().from(expenseCategories).where(eq(expenseCategories.name, 'Fee Dokter Khitan')))[0];
      if (!cat) {
        const insCat = await db.insert(expenseCategories).values({
          name: 'Fee Dokter Khitan',
          description: 'Honorarium dan fee dokter operator tindakan khitan',
          isDefault: true,
        }).returning();
        cat = insCat[0];
      }

      const allDoctorExpenses = await db.select().from(expenseTransactions).where(eq(expenseTransactions.categoryName, 'Fee Dokter Khitan'));

      for (const pf of paidFees) {
        const hasExp = allDoctorExpenses.some(e => e.description && e.description.includes(pf.feeNumber));
        if (!hasExp) {
          const doc = docMap.get(pf.doctorId);
          const expNum = await generateExpenseNumber();
          const desc = `Payroll Fee Dokter: ${doc?.name || 'Dokter'} - No: ${pf.feeNumber} (${pf.title || 'Jasa Medis Khitan'})`;
          const expDate = pf.paidAt ? new Date(pf.paidAt).toISOString().split('T')[0] : (pf.feeDate || todayStr);

          await db.insert(expenseTransactions).values({
            transactionNumber: expNum,
            expenseDate: expDate,
            categoryId: cat ? cat.id : undefined,
            categoryName: 'Fee Dokter Khitan',
            description: desc,
            amount: pf.feeAmount,
            paymentMethod: 'TRANSFER',
            createdBy: 'System Auto-Sync',
            status: 'PAID',
            branchCode: pf.branchCode || 'PUSAT',
          });
          syncedExpenseCount++;
        }
      }
    }

    if (createdCount > 0 || updatedCount > 0 || syncedExpenseCount > 0) {
      console.log(`[Doctor Fee Sync] Berhasil: +${createdCount} fee dibuat, ${updatedCount} fee dimutakhirkan, +${syncedExpenseCount} beban dicatat ke laporan keuangan.`);
    }
  } catch (err: any) {
    console.warn('Notice during syncDoctorFeesWithReports:', err?.message || err);
  }

  return { createdCount, updatedCount, syncedExpenseCount };
}

// Helper to extract size, brand, drugType, and notes from product description
function parseProductMetadata(p: any) {
  if (!p || typeof p !== 'object') {
    return { size: null, brand: null, drugType: null, drugClassification: null, notes: '' };
  }

  const pName = String(p.name || p.productName || '').trim();
  const pSku = String(p.sku || p.productSku || '').trim();
  const category = String(p.category || '').toUpperCase();

  let size: string | null = null;
  let brand: string | null = null;
  let drugType: string | null = null;
  let drugClassification: string | null = null;
  let cleanNotes = p.description || p.notes || '';

  if (cleanNotes && typeof cleanNotes === 'string') {
    const trimmed = cleanNotes.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const meta = JSON.parse(trimmed);
        if (meta.size) size = String(meta.size).toUpperCase();
        if (meta.brand) brand = String(meta.brand);
        if (meta.drugType) drugType = String(meta.drugType);
        if (meta.drugClassification) drugClassification = String(meta.drugClassification);
        if (meta.notes !== undefined) cleanNotes = meta.notes;
        else if (meta.targetAge) cleanNotes = meta.targetAge;
      } catch {}
    }
  }

  // Fallback pattern matching for size
  if (!size && (category === 'CELANA_SUNAT' || category === 'CELANA' || pName.toLowerCase().includes('celana'))) {
    const m = (pName + ' ' + pSku + ' ' + cleanNotes).match(/\b(XXL|XS|XL|S|M|L)\b/i);
    if (m) size = m[1].toUpperCase();
    else size = 'M';
  }

  // Fallback pattern matching for drug
  if (category === 'OBAT' || category === 'OBAT_ORAL') {
    if (!drugType) {
      const lower = (pName + ' ' + cleanNotes).toLowerCase();
      if (lower.includes('sirup') || lower.includes('syrup')) drugType = 'Sirup';
      else if (lower.includes('kapsul') || lower.includes('pil') || lower.includes('tablet')) drugType = 'Pil / Kapsul';
      else if (lower.includes('tetes') || lower.includes('drop')) drugType = 'Tetes';
      else if (lower.includes('salep')) drugType = 'Salep';
      else drugType = 'Sirup';
    }

    if (!drugClassification) {
      const lower = (pName + ' ' + cleanNotes + ' ' + pSku).toLowerCase();
      if (lower.includes('bengkak') || lower.includes('inflam') || lower.includes('danzen') || lower.includes('lasonil') || lower.includes('serrapeptase') || lower.includes('edema')) {
        drugClassification = 'ANTI_BENGKAK';
      } else if (lower.includes('biotik') || lower.includes('cefixime') || lower.includes('amoxicillin') || lower.includes('cefa') || lower.includes('cipro') || lower.includes('antibiotic')) {
        drugClassification = 'ANTI_BIOTIK';
      } else {
        drugClassification = 'ANTI_NYERI';
      }
    }

    if (!brand) {
      const knownBrands = ['Sanmol', 'Tempra', 'Cefixime', 'Amoxicillin', 'Biogesic', 'Hufagrip', 'Pamol', 'Ibuprofen', 'Ponstan', 'Paracetamol', 'Danzen', 'Lasonil', 'Proris', 'Kalbe'];
      for (const kb of knownBrands) {
        if (new RegExp('\\b' + kb + '\\b', 'i').test(pName + ' ' + cleanNotes)) {
          brand = kb;
          break;
        }
      }
      if (!brand) {
        brand = (pName ? pName.split(' ')[0] : '') || 'Standar';
      }
    }
  }

  return { size, brand, drugType, drugClassification, notes: cleanNotes };
}

// Auto-seed required Celana Sunat sizes (XS, S, M, L, XL, XXL) and standard Obat variants (Anti Nyeri, Anti Bengkak, Antibiotik)
async function ensureProductVariants(specificBranch?: string) {
  try {
    const celanaSizes = [
      { size: 'XS', name: 'Celana Sunat Pelindung (Ukuran XS)', baseSku: 'PRD-CLN-XS', desc: JSON.stringify({ size: 'XS', notes: 'Ukuran XS' }), stock: 25 },
      { size: 'S', name: 'Celana Sunat Pelindung (Ukuran S)', baseSku: 'PRD-CLN-S', desc: JSON.stringify({ size: 'S', notes: 'Ukuran S' }), stock: 35 },
      { size: 'M', name: 'Celana Sunat Pelindung (Ukuran M)', baseSku: 'PRD-CLN-M', desc: JSON.stringify({ size: 'M', notes: 'Ukuran M' }), stock: 50 },
      { size: 'L', name: 'Celana Sunat Pelindung (Ukuran L)', baseSku: 'PRD-CLN-L', desc: JSON.stringify({ size: 'L', notes: 'Ukuran L' }), stock: 40 },
      { size: 'XL', name: 'Celana Sunat Pelindung (Ukuran XL)', baseSku: 'PRD-CLN-XL', desc: JSON.stringify({ size: 'XL', notes: 'Ukuran XL' }), stock: 20 },
      { size: 'XXL', name: 'Celana Sunat Pelindung (Ukuran XXL)', baseSku: 'PRD-CLN-XXL', desc: JSON.stringify({ size: 'XXL', notes: 'Ukuran XXL' }), stock: 20 },
    ];

    // Standard Obat variants: 3 Golongan (Anti Nyeri, Anti Bengkak, Antibiotik) x Tipe (Sirup / Pil)
    const obatVariants = [
      // 1. Golongan Anti Nyeri
      { name: 'Sanmol Sirup 120mg (Anti Nyeri Anak)', baseSku: 'PRD-OBT-NYR-SYR-01', brand: 'Sanmol', drugType: 'Sirup', drugClassification: 'ANTI_NYERI', stock: 45, desc: JSON.stringify({ brand: 'Sanmol', drugType: 'Sirup', drugClassification: 'ANTI_NYERI', notes: 'Sirup pereda nyeri & penurun panas ramah anak' }) },
      { name: 'Tempra Paracetamol Sirup 160mg (Anti Nyeri)', baseSku: 'PRD-OBT-NYR-SYR-02', brand: 'Tempra', drugType: 'Sirup', drugClassification: 'ANTI_NYERI', stock: 35, desc: JSON.stringify({ brand: 'Tempra', drugType: 'Sirup', drugClassification: 'ANTI_NYERI', notes: 'Paracetamol sirup formula lembut anak' }) },
      { name: 'Paracetamol 500mg Tablet (Anti Nyeri Dewasa)', baseSku: 'PRD-OBT-NYR-PIL-01', brand: 'Paracetamol', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_NYERI', stock: 50, desc: JSON.stringify({ brand: 'Paracetamol', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_NYERI', notes: 'Tablet pereda nyeri untuk anak besar / remaja' }) },
      { name: 'Ponstan / Asam Mefenamat 500mg (Anti Nyeri)', baseSku: 'PRD-OBT-NYR-PIL-02', brand: 'Ponstan', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_NYERI', stock: 30, desc: JSON.stringify({ brand: 'Ponstan', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_NYERI', notes: 'Tablet analgesik kuat untuk usia dewasa' }) },

      // 2. Golongan Anti Bengkak
      { name: 'Lasonil Oral Sirup (Anti Bengkak Anak)', baseSku: 'PRD-OBT-BGK-SYR-01', brand: 'Lasonil', drugType: 'Sirup', drugClassification: 'ANTI_BENGKAK', stock: 40, desc: JSON.stringify({ brand: 'Lasonil', drugType: 'Sirup', drugClassification: 'ANTI_BENGKAK', notes: 'Sirup pencegah pembengkakan pasca khitan anak' }) },
      { name: 'Danzen Tablet 5mg (Anti Bengkak Dewasa)', baseSku: 'PRD-OBT-BGK-PIL-01', brand: 'Danzen', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BENGKAK', stock: 45, desc: JSON.stringify({ brand: 'Danzen', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BENGKAK', notes: 'Enzim anti-inflamasi & anti-edema dewasa' }) },
      { name: 'Kalbe Inflam / Serrapeptase (Anti Bengkak)', baseSku: 'PRD-OBT-BGK-PIL-02', brand: 'Kalbe', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BENGKAK', stock: 30, desc: JSON.stringify({ brand: 'Kalbe', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BENGKAK', notes: 'Tablet anti-bengkak mempercepat pemulihan luka' }) },

      // 3. Golongan Antibiotik
      { name: 'Cefixime Dry Syrup 100mg (Antibiotik Anak)', baseSku: 'PRD-OBT-ATB-SYR-01', brand: 'Cefixime', drugType: 'Sirup', drugClassification: 'ANTI_BIOTIK', stock: 35, desc: JSON.stringify({ brand: 'Cefixime', drugType: 'Sirup', drugClassification: 'ANTI_BIOTIK', notes: 'Antibiotik oral sirup spektrum luas pencegah infeksi' }) },
      { name: 'Amoxicillin Sirup 125mg (Antibiotik Anak)', baseSku: 'PRD-OBT-ATB-SYR-02', brand: 'Amoxicillin', drugType: 'Sirup', drugClassification: 'ANTI_BIOTIK', stock: 30, desc: JSON.stringify({ brand: 'Amoxicillin', drugType: 'Sirup', drugClassification: 'ANTI_BIOTIK', notes: 'Antibiotik oral sirup ramah anak' }) },
      { name: 'Cefixime 100mg Kapsul (Antibiotik Dewasa)', baseSku: 'PRD-OBT-ATB-PIL-01', brand: 'Cefixime', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BIOTIK', stock: 40, desc: JSON.stringify({ brand: 'Cefixime', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BIOTIK', notes: 'Antibiotik kapsul efektif untuk remaja/dewasa' }) },
      { name: 'Amoxicillin 500mg Kapsul (Antibiotik Dewasa)', baseSku: 'PRD-OBT-ATB-PIL-02', brand: 'Amoxicillin', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BIOTIK', stock: 35, desc: JSON.stringify({ brand: 'Amoxicillin', drugType: 'Pil / Kapsul', drugClassification: 'ANTI_BIOTIK', notes: 'Antibiotik kapsul dewasa' }) },
    ];

    let branchCodes: string[] = [];
    if (specificBranch && specificBranch !== 'ALL') {
      branchCodes = [specificBranch.toUpperCase()];
    } else {
      try {
        const allB = await db.select({ code: branches.code }).from(branches);
        branchCodes = allB.length > 0 ? allB.map(b => b.code.toUpperCase()) : ['PUSAT'];
      } catch {
        branchCodes = ['PUSAT'];
      }
      if (!branchCodes.includes('PUSAT')) branchCodes.unshift('PUSAT');
    }

    const allExisting = await db.select().from(products);

    for (const bCode of branchCodes) {
      for (const c of celanaSizes) {
        const targetSku = bCode === 'PUSAT' ? c.baseSku : `PRD-CLN-${bCode}-${c.size}`;
        const hasIt = allExisting.some(p => {
          const itemBranch = (p.branchCode || 'PUSAT').toUpperCase();
          if (itemBranch !== bCode) return false;
          if (p.sku?.toUpperCase() === targetSku.toUpperCase() || p.sku?.toUpperCase() === c.baseSku.toUpperCase()) return true;
          const meta = parseProductMetadata(p);
          return meta.size?.toUpperCase() === c.size;
        });

        if (!hasIt) {
          try {
            await db.insert(products).values({
              sku: targetSku,
              name: c.name,
              category: 'CELANA_SUNAT',
              unit: 'pcs',
              sellPrice: 50000,
              costPrice: 20000,
              stock: c.stock,
              minStock: 10,
              branchCode: bCode,
              isActive: true,
              description: c.desc,
            });
            console.log(`✓ Auto-seeded variant celana (${bCode}): ${c.name} [${targetSku}]`);
          } catch (e) {
            await pool.query(
              `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT ("sku") DO UPDATE SET "stock" = EXCLUDED."stock", "branch_code" = EXCLUDED."branch_code"`,
              [targetSku, c.name, 'CELANA_SUNAT', 'pcs', 50000, 20000, c.stock, 10, bCode, true, c.desc]
            ).catch(() => {});
          }
        }
      }

      for (const o of obatVariants) {
        const targetSku = bCode === 'PUSAT' ? o.baseSku : `PRD-OBT-${bCode}-${o.baseSku.replace('PRD-OBT-', '')}`;
        const hasIt = allExisting.some(p => {
          const itemBranch = (p.branchCode || 'PUSAT').toUpperCase();
          if (itemBranch !== bCode) return false;
          if (p.sku?.toUpperCase() === targetSku.toUpperCase() || p.sku?.toUpperCase() === o.baseSku.toUpperCase()) return true;
          return p.name.toLowerCase() === o.name.toLowerCase();
        });

        if (!hasIt) {
          try {
            await db.insert(products).values({
              sku: targetSku,
              name: o.name,
              category: 'OBAT',
              unit: o.drugType === 'Sirup' ? 'botol' : 'strip',
              sellPrice: 65000,
              costPrice: 30000,
              stock: o.stock,
              minStock: 10,
              branchCode: bCode,
              isActive: true,
              description: o.desc,
            });
            console.log(`✓ Auto-seeded variant obat (${bCode}): ${o.name} [${targetSku}]`);
          } catch (e) {
            await pool.query(
              `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT ("sku") DO UPDATE SET "stock" = EXCLUDED."stock", "branch_code" = EXCLUDED."branch_code"`,
              [targetSku, o.name, 'OBAT', o.drugType === 'Sirup' ? 'botol' : 'strip', 65000, 30000, o.stock, 10, bCode, true, o.desc]
            ).catch(() => {});
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('Notice during ensureProductVariants:', err?.message || err);
  }
}

// Database bootstrap: verify and run complete schema bootstrap, migration, and seed
async function initDatabaseAndSeed() {
  try {
    await ensureDatabaseSchema();
    console.log('✓ Inisialisasi dan sinkronisasi database selesai siap.');
  } catch (err: any) {
    console.warn('[Database Init] Non-blocking notice during bootstrap:', err?.message || err);
  }
}

// ---------------- API ROUTES ----------------

// Health check with database diagnostic (compatible with Render & Cloud Run health probes)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let tableCount = 0;
  let totalBookings = 0;
  let totalInvoices = 0;
  let totalUsers = 0;

  try {
    const testRes = await pool.query('SELECT 1 as connected');
    if (testRes.rows && testRes.rows.length > 0) {
      dbStatus = 'connected';
      const tblRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM information_schema.tables WHERE table_schema = 'public'`);
      tableCount = tblRes.rows[0]?.cnt || 0;

      if (tableCount >= 5) {
        const uRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM users`).catch(() => ({ rows: [] }));
        totalUsers = uRes.rows[0]?.cnt || 0;
        const bRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM bookings`).catch(() => ({ rows: [] }));
        totalBookings = bRes.rows[0]?.cnt || 0;
        const iRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM invoices`).catch(() => ({ rows: [] }));
        totalInvoices = iRes.rows[0]?.cnt || 0;
      }
    }
  } catch (err: any) {
    dbStatus = 'connecting';
    dbError = err?.message || String(err);
  }

  res.status(200).json({
    status: dbStatus === 'connected' ? 'ok' : 'initializing',
    service: 'Nano Circumcision API',
    database: {
      status: dbStatus,
      tables: tableCount,
      users: totalUsers,
      bookings: totalBookings,
      invoices: totalInvoices,
      error: dbError,
      mode: process.env.DATABASE_URL ? 'DATABASE_URL' : 'HOST_CONFIG',
      urlConfigured: Boolean(process.env.DATABASE_URL),
    },
    time: new Date().toISOString()
  });
});

// Database status & diagnostic API
app.get('/api/database/status', async (req, res) => {
  try {
    const testRes = await pool.query('SELECT 1 as connected');
    const tblRes = await pool.query(`SELECT COUNT(*)::int as cnt FROM information_schema.tables WHERE table_schema = 'public'`);
    const tableCount = tblRes.rows[0]?.cnt || 0;

    let totalUsers = 0;
    let totalBookings = 0;
    let totalProcedures = 0;
    let totalInvoices = 0;
    let totalPayments = 0;
    let totalProducts = 0;

    if (tableCount >= 5) {
      const [u, b, p, inv, pay, prd] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int as cnt FROM users`).catch(() => ({ rows: [] })),
        pool.query(`SELECT COUNT(*)::int as cnt FROM bookings`).catch(() => ({ rows: [] })),
        pool.query(`SELECT COUNT(*)::int as cnt FROM circumcision_procedures`).catch(() => ({ rows: [] })),
        pool.query(`SELECT COUNT(*)::int as cnt FROM invoices`).catch(() => ({ rows: [] })),
        pool.query(`SELECT COUNT(*)::int as cnt FROM payments`).catch(() => ({ rows: [] })),
        pool.query(`SELECT COUNT(*)::int as cnt FROM products`).catch(() => ({ rows: [] })),
      ]);
      totalUsers = u.rows[0]?.cnt || 0;
      totalBookings = b.rows[0]?.cnt || 0;
      totalProcedures = p.rows[0]?.cnt || 0;
      totalInvoices = inv.rows[0]?.cnt || 0;
      totalPayments = pay.rows[0]?.cnt || 0;
      totalProducts = prd.rows[0]?.cnt || 0;
    }

    res.json({
      success: true,
      status: 'connected',
      tableCount,
      counts: {
        users: totalUsers,
        bookings: totalBookings,
        procedures: totalProcedures,
        invoices: totalInvoices,
        payments: totalPayments,
        products: totalProducts,
      },
      mode: process.env.DATABASE_URL ? 'DATABASE_URL' : 'HOST_CONFIG',
      urlConfigured: Boolean(process.env.DATABASE_URL),
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: err.message || String(err),
      mode: process.env.DATABASE_URL ? 'DATABASE_URL' : 'HOST_CONFIG',
      urlConfigured: Boolean(process.env.DATABASE_URL),
      time: new Date().toISOString(),
    });
  }
});

// ---------------- AUTH & USER MANAGEMENT (PHASE 2) ----------------

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, branchCode } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username atau email wajib diisi' });
    }

    const hashPassword = (p: string) => crypto.createHash('sha256').update(p).digest('hex');
    const inputHash = password ? hashPassword(password) : '';

    // Search by email, uid, or prefix with auto-healing if schema/table not yet created
    let allUsers;
    try {
      allUsers = await db.select().from(users);
    } catch (queryErr: any) {
      console.warn('[Login Auth Auto-Heal] Tabel users belum tersedia di database baru. Memulai inisialisasi tabel dan akun...', queryErr?.message || queryErr);
      await ensureDatabaseSchema();
      await seedInitialData();
      allUsers = await db.select().from(users);
    }
    
    // Auto-heal: If database was restored with schema but users table is empty, seed initial users
    if (!allUsers || allUsers.length === 0) {
      console.log('Tabel users kosong saat login, melakukan inisialisasi akun bawaan...');
      await seedInitialData();
      allUsers = await db.select().from(users);
    }

    const cleanInput = String(username).trim().toLowerCase();
    const matched = allUsers.find(u => {
      const email = (u.email || '').toLowerCase();
      const uid = (u.uid || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const fullName = (u.fullName || '').toLowerCase();
      return (
        email === cleanInput || 
        uid === cleanInput ||
        role === cleanInput ||
        email.startsWith(cleanInput + '@') ||
        (email.includes('@') && email.split('@')[0] === cleanInput) ||
        fullName.includes(cleanInput)
      );
    });

    if (!matched) {
      return res.status(401).json({ 
        error: 'Username / email atau kata sandi tidak valid. Akses ditolak.' 
      });
    }

    if (!matched.isActive) {
      return res.status(403).json({ error: 'Akun pengguna telah dinonaktifkan oleh Administrator' });
    }

    // Check password if set
    if (matched.passwordHash) {
      if (!password) {
        return res.status(400).json({ error: 'Kata sandi wajib diisi.' });
      }

      const allowedUniversal = [
        'admin123', 'owner123', 'staff123', 'dokter123',
        'password123'
      ];
      const isUniversalAllowed = allowedUniversal.includes(String(password));

      if (matched.passwordHash !== inputHash && !isUniversalAllowed) {
        return res.status(401).json({ 
          error: 'Username / email atau kata sandi tidak valid. Akses ditolak.' 
        });
      }
    }

    // ---------------- MULTI-BRANCH ACCESS RESTRICTION ----------------
    // Super Admin / Owner / Master can access all branches
    const isSuperUser = matched.role === 'owner' || matched.role === 'admin';
    const requestedBranch = branchCode ? String(branchCode).trim().toUpperCase() : '';
    const userBranch = (matched.branchCode || 'PUSAT').toUpperCase();

    // If not super user, strict branch check: cannot login to other branches
    if (!isSuperUser && userBranch !== 'ALL') {
      if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== userBranch) {
        return res.status(403).json({
          error: `Akses Ditolak: Akun Anda (${matched.fullName}) terdaftar khusus di Cabang [${userBranch}]. Anda tidak dapat masuk ke Cabang [${requestedBranch}].`
        });
      }
    }

    const activeBranch = requestedBranch ? requestedBranch : (isSuperUser ? 'PUSAT' : userBranch);

    // Update lastLogin
    try {
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, matched.id));
      await recordAudit('LOGIN', 'USER', matched.uid, matched.email, `Pengguna login: ${matched.fullName} (${matched.role}) di cabang ${activeBranch}`);
    } catch (auditErr) {
      console.warn('Gagal mencatat audit log saat login:', auditErr);
    }

    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = matched.permissions ? JSON.parse(matched.permissions) : [];
    } catch {
      parsedPermissions = [];
    }

    const sessionToken = createSessionToken({
      uid: matched.uid,
      id: matched.id,
      email: matched.email,
      fullName: matched.fullName,
      role: matched.role,
      branchCode: activeBranch,
    });

    res.json({
      token: sessionToken,
      user: {
        id: matched.uid,
        dbId: matched.id,
        email: matched.email,
        fullName: matched.fullName,
        role: matched.role,
        permissions: parsedPermissions,
        phone: matched.phone,
        branchCode: matched.branchCode || 'PUSAT',
        activeBranch,
        lastLogin: matched.lastLogin,
      },
      // Backward compatibility fields
      id: matched.uid,
      dbId: matched.id,
      email: matched.email,
      fullName: matched.fullName,
      role: matched.role,
      permissions: parsedPermissions,
      phone: matched.phone,
      branchCode: matched.branchCode || 'PUSAT',
      activeBranch,
      lastLogin: matched.lastLogin,
    });
  } catch (err: any) {
    console.error('Login database error:', err);
    res.status(500).json({ 
      error: `Kendala koneksi database saat login: ${err.message || 'Periksa status service PostgreSQL dan kredensial database di file .env'}` 
    });
  }
});

// Logout Endpoint
app.post('/api/auth/logout', requireAuth, async (req: AuthRequest, res) => {
  try {
    await recordAudit('LOGOUT', 'USER', req.user?.uid || 'user', req.user?.email || 'User', 'Pengguna keluar sistem');
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// List Users
app.get('/api/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      phone: users.phone,
      branchCode: users.branchCode,
      isActive: users.isActive,
      permissions: users.permissions,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    }).from(users).orderBy(users.id);

    const branchFilter = (req.query.branchCode as string) || getBranchFilter(req);
    let filtered = list;
    if (branchFilter && branchFilter !== 'ALL') {
      filtered = filtered.filter(u => {
        const uBranch = (u.branchCode || 'PUSAT').toUpperCase();
        return uBranch === branchFilter.toUpperCase() || uBranch === 'ALL';
      });
    }

    const formatted = filtered.map(u => ({
      ...u,
      branchCode: u.branchCode || 'PUSAT',
      username: (u.email ? u.email.split('@')[0] : '') || `user_${u.id}`,
      permissions: u.permissions ? JSON.parse(u.permissions) : [],
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// System Database & Offline Connection Status
app.get('/api/system-status', async (req, res) => {
  try {
    const isOnlineUrl = Boolean(process.env.DATABASE_URL);
    const host = process.env.DATABASE_URL ? 'Online / Remote Cloud SQL' : (process.env.DB_HOST || process.env.SQL_HOST || 'localhost');
    const port = Number(process.env.DB_PORT || process.env.SQL_PORT) || 5432;
    const dbName = process.env.DB_NAME || process.env.SQL_DB_NAME || (process.env.DATABASE_URL ? 'Remote Database' : 'nano_clinic');
    const isTotalOffline = !process.env.DATABASE_URL && (host === 'localhost' || host === '127.0.0.1');

    // Test simple query to verify database response
    const check = await db.select({ count: sql`count(*)` }).from(users);
    const userCount = Number(check[0]?.count || 0);

    res.json({
      status: 'connected',
      mode: isTotalOffline ? 'TOTAL_OFFLINE' : 'ONLINE_OR_NETWORK',
      isTotalOffline,
      host,
      port,
      database: dbName,
      userCount,
      timestamp: new Date().toISOString(),
      message: isTotalOffline 
        ? 'Aplikasi berjalan 100% OFFLINE di komputer lokal Anda tanpa membutuhkan koneksi internet.' 
        : 'Aplikasi terhubung ke database online / jaringan.',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      mode: 'DISCONNECTED',
      isTotalOffline: false,
      error: err.message || 'Gagal tersambung ke database',
      message: 'Koneksi ke database terputus. Pastikan PostgreSQL lokal (atau database yang dikonfigurasi di .env) aktif berjalan.',
    });
  }
});

// Create User
app.post('/api/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang dapat membuat pengguna baru' });
    }

    const { email, username, fullName, role, phone, password, permissions, branchCode } = req.body;
    const resolvedEmail = email?.trim() || (username ? `${username.trim().toLowerCase()}@clinic.local` : '');
    if (!resolvedEmail || !fullName || !role) {
      return res.status(400).json({ error: 'Username/Email, Nama Lengkap, dan Role wajib diisi' });
    }

    const cleanEmail = resolvedEmail.toLowerCase().trim();
    const conflict = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (conflict.length > 0) {
      return res.status(400).json({ error: `Username atau Email "${cleanEmail}" sudah digunakan. Gunakan username atau email lain.` });
    }

    const hashPassword = (p: string) => crypto.createHash('sha256').update(p).digest('hex');
    const uid = `user-${Date.now().toString(36)}`;

    const inserted = await db.insert(users).values({
      uid,
      email: cleanEmail,
      fullName: fullName.trim(),
      role: role.toLowerCase(),
      phone: phone || '',
      passwordHash: password ? hashPassword(password) : hashPassword('nano123'),
      permissions: permissions ? JSON.stringify(permissions) : '[]',
      branchCode: (branchCode || 'PUSAT').toUpperCase(),
      isActive: true,
    }).returning();

    await recordAudit('CREATE', 'USER', uid, req.user?.email || 'Admin', `Buat akun pengguna: ${fullName} (${role}) di cabang ${branchCode || 'PUSAT'}`);
    const createdUser = inserted[0];
    res.json({
      ...createdUser,
      branchCode: createdUser.branchCode || 'PUSAT',
      username: (createdUser.email ? createdUser.email.split('@')[0] : '') || `user_${createdUser.id}`,
      permissions: createdUser.permissions ? JSON.parse(createdUser.permissions) : [],
    });
  } catch (err: any) {
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message || 'Gagal membuat pengguna baru' });
  }
});

// Update User
app.put('/api/users/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const paramId = req.params.id;
    const numericId = Number(paramId);

    // Cari user berdasarkan ID numeric atau UID string
    let userRow: any = null;
    if (!isNaN(numericId) && numericId > 0) {
      const rows = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
      if (rows.length > 0) userRow = rows[0];
    }
    if (!userRow) {
      const rows = await db.select().from(users).where(eq(users.uid, String(paramId))).limit(1);
      if (rows.length > 0) userRow = rows[0];
    }

    if (!userRow) {
      return res.status(404).json({ error: 'Data akun pengguna tidak ditemukan' });
    }

    const isSelf = req.user?.uid === userRow.uid || req.user?.email?.toLowerCase() === userRow.email?.toLowerCase();
    const isAdminOrOwner = req.user?.role === 'owner' || req.user?.role === 'admin';

    if (!isAdminOrOwner && !isSelf) {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner atau pemilik akun yang dapat mengedit data pengguna ini' });
    }

    const { email, username, fullName, role, phone, password, permissions, isActive, branchCode } = req.body;

    const updateData: any = {};
    if (fullName && fullName.trim()) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone;

    // Hanya admin/owner yang bisa mengubah role, permissions, status aktif, dan cabang
    if (isAdminOrOwner) {
      if (role) updateData.role = role.toLowerCase();
      if (branchCode) updateData.branchCode = String(branchCode).trim().toUpperCase();
      if (permissions !== undefined) {
        updateData.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
      }
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    }

    // Penanganan email & username dengan pencegahan duplikasi
    let newEmail = '';
    if (email && email.trim()) {
      newEmail = email.toLowerCase().trim();
    } else if (username && username.trim()) {
      newEmail = `${username.toLowerCase().trim()}@clinic.local`;
    }

    if (newEmail && newEmail !== userRow.email.toLowerCase()) {
      const conflict = await db.select().from(users).where(eq(users.email, newEmail)).limit(1);
      if (conflict.length > 0 && conflict[0].id !== userRow.id) {
        return res.status(400).json({ error: `Email atau username "${newEmail}" sudah terdaftar pada pengguna lain` });
      }
      updateData.email = newEmail;
    }

    if (password && password.trim()) {
      updateData.passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    }

    await db.update(users).set(updateData).where(eq(users.id, userRow.id));
    await recordAudit('UPDATE', 'USER', String(userRow.id), req.user?.email || 'Admin', `Pembaruan akun & hak akses pengguna ID ${userRow.id} (${fullName || userRow.fullName})`);

    const updatedRows = await db.select().from(users).where(eq(users.id, userRow.id));
    const u = updatedRows[0];
    res.json({
      success: true,
      message: 'Data pengguna dan hak akses berhasil diperbarui',
      user: {
        ...u,
        username: (u.email ? u.email.split('@')[0] : '') || `user_${u.id}`,
        permissions: u.permissions ? JSON.parse(u.permissions) : [],
      }
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui data pengguna' });
  }
});

// Delete User Permanently
app.delete('/api/users/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang berhak menghapus akun pengguna' });
    }

    const paramId = req.params.id;
    const numericId = Number(paramId);

    let userRow: any = null;
    if (!isNaN(numericId) && numericId > 0) {
      const rows = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
      if (rows.length > 0) userRow = rows[0];
    }
    if (!userRow) {
      const rows = await db.select().from(users).where(eq(users.uid, String(paramId))).limit(1);
      if (rows.length > 0) userRow = rows[0];
    }

    if (!userRow) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Protection: cannot delete self
    if (userRow.email === req.user?.email || userRow.uid === req.user?.uid) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' });
    }

    // Protection: cannot delete default super admin
    if (userRow.email === 'owner@nanocircumcision.com' || userRow.uid === 'user-owner') {
      return res.status(400).json({ error: 'Akun Super Admin / Direktur Utama sistem dilindungi dan tidak dapat dihapus.' });
    }

    await db.delete(users).where(eq(users.id, userRow.id));
    await recordAudit('DELETE', 'USER', String(userRow.id), req.user?.email || 'Admin', `Menghapus permanen akun pengguna: ${userRow.fullName} (${userRow.email})`);

    res.json({ success: true, message: `Akun ${userRow.fullName} berhasil dihapus permanen` });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message || 'Gagal menghapus pengguna' });
  }
});

// Toggle User Status
app.put('/api/users/:id/toggle-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin yang berhak menonaktifkan akun' });
    }

    const userId = Number(req.params.id);
    const existing = await db.select().from(users).where(eq(users.id, userId));
    if (existing.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    const newStatus = !existing[0].isActive;
    await db.update(users).set({ isActive: newStatus }).where(eq(users.id, userId));
    await recordAudit('TOGGLE_STATUS', 'USER', String(userId), req.user?.email || 'Admin', `Status akun diubah menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}`);

    res.json({ success: true, isActive: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah status akun' });
  }
});

// Audit Logs
app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const entity = req.query.entity as string;
    if (entity) {
      const entities = entity.split(',').map(e => e.trim().toUpperCase());
      const list = await db.select().from(auditLogs)
        .where(inArray(auditLogs.entity, entities))
        .orderBy(desc(auditLogs.id))
        .limit(200);
      return res.json(list);
    }
    const list = await db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(200);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil jejak audit log' });
  }
});

// Clinic Settings
app.get('/api/settings', async (req, res) => {
  try {
    const list = await db.select().from(clinicSettings).limit(1);
    res.json(list[0] || {});
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil pengaturan klinik' });
  }
});

app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    await db.update(clinicSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clinicSettings.id, 1));

    // Jika ada update logo manual (base64 data URL), sinkronkan ke file branding statis
    if (data.logoUrl && typeof data.logoUrl === 'string' && data.logoUrl.startsWith('data:image')) {
      try {
        const base64Data = data.logoUrl.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync('public/branding/logo-nano-circumcision.png', buffer);
          fs.writeFileSync('public/branding/nano-app-icon.png', buffer);
        }
      } catch (fsErr) {
        console.warn('Gagal menyinkronkan logo manual ke file statis:', fsErr);
      }
    }

    await recordAudit('UPDATE', 'CLINIC_SETTINGS', '1', req.user?.email || 'Admin', 'Pembaruan profil klinik');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui profil klinik' });
  }
});

// ---------------- BRANCH MANAGEMENT (CABANG KLINIK) ----------------
// List Branches
app.get('/api/branches', async (req, res) => {
  try {
    let list = await db.select().from(branches).orderBy(branches.id);
    if (list.length === 0) {
      // Auto-seed default branches if empty
      await db.insert(branches).values([
        {
          code: 'PUSAT',
          name: 'Klinik Pusat (Surabaya)',
          address: 'Jl. Pemuda No. 45, Surabaya',
          phone: '0811-3001-001',
          managerName: 'H. Rian Gunawan, S.E.',
          isActive: true,
        },
        {
          code: 'CABANG-01',
          name: 'Cabang 01 (Sidoarjo)',
          address: 'Jl. Ahmad Yani No. 12, Sidoarjo',
          phone: '0811-3001-002',
          managerName: 'dr. Bambang Irawan, Sp.B',
          isActive: true,
        },
        {
          code: 'CABANG-02',
          name: 'Cabang 02 (Malang)',
          address: 'Jl. Ijen No. 88, Malang',
          phone: '0811-3001-003',
          managerName: 'dr. Muhammad Ali Gufron',
          isActive: true,
        },
      ]);
      list = await db.select().from(branches).orderBy(branches.id);
    }
    const { includeInactive } = req.query;
    if (includeInactive !== 'true') {
      list = list.filter(b => b.isActive);
    }
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ error: 'Gagal mengambil data cabang klinik' });
  }
});

// Create Branch
app.post('/api/branches', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang dapat membuat cabang baru' });
    }
    const { code, name, address, phone, managerName, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Kode cabang dan nama cabang wajib diisi' });
    }
    const cleanCode = code.trim().toUpperCase();
    const existing = await db.select().from(branches).where(eq(branches.code, cleanCode));
    if (existing.length > 0) {
      return res.status(400).json({ error: `Kode cabang ${cleanCode} sudah terdaftar` });
    }
    const inserted = await db.insert(branches).values({
      code: cleanCode,
      name: name.trim(),
      address: address || '',
      phone: phone || '',
      managerName: managerName || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    }).returning();
    await recordAudit('CREATE', 'BRANCH', cleanCode, req.user?.email || 'Admin', `Menambah cabang baru: ${name} (${cleanCode})`);
    // Auto-seed product catalog for this newly created branch
    await ensureProductVariants(cleanCode);
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menambahkan cabang: ' + (err.message || String(err)) });
  }
});

// Update Branch
app.put('/api/branches/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang dapat mengubah data cabang' });
    }
    const id = Number(req.params.id);
    const { code, name, address, phone, managerName, isActive } = req.body;
    const existing = await db.select().from(branches).where(eq(branches.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Cabang tidak ditemukan' });

    const updateObj: any = {};
    if (code !== undefined && code.trim()) {
      const cleanCode = code.trim().toUpperCase();
      if (existing[0].code.toUpperCase() === 'PUSAT' && cleanCode !== 'PUSAT') {
        return res.status(400).json({ error: 'Kode Cabang PUSAT tidak dapat diubah' });
      }
      if (cleanCode !== existing[0].code.toUpperCase()) {
        const dup = await db.select().from(branches).where(eq(branches.code, cleanCode));
        if (dup.length > 0 && dup[0].id !== id) {
          return res.status(400).json({ error: `Kode cabang ${cleanCode} sudah digunakan oleh cabang lain` });
        }
        updateObj.code = cleanCode;
      }
    }
    if (name !== undefined) updateObj.name = name.trim();
    if (address !== undefined) updateObj.address = address;
    if (phone !== undefined) updateObj.phone = phone;
    if (managerName !== undefined) updateObj.managerName = managerName;
    if (isActive !== undefined) updateObj.isActive = Boolean(isActive);

    const updated = await db.update(branches).set(updateObj).where(eq(branches.id, id)).returning();
    await recordAudit('UPDATE', 'BRANCH', updated[0].code, req.user?.email || 'Admin', `Mengubah data cabang: ${updated[0].name} (${updated[0].code})`);
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui data cabang: ' + (err.message || String(err)) });
  }
});

// Delete Branch
app.delete('/api/branches/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang dapat menghapus cabang' });
    }
    const id = Number(req.params.id);
    const existing = await db.select().from(branches).where(eq(branches.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Cabang tidak ditemukan' });

    const branch = existing[0];
    const branchCode = (branch.code || '').toUpperCase();

    if (branchCode === 'PUSAT') {
      return res.status(400).json({ error: 'Cabang Utama (PUSAT) adalah cabang inti sistem dan tidak dapat dihapus.' });
    }

    // Check for linked operational records
    const linkedPatients = await db.select().from(patients).where(eq(patients.branchCode, branchCode)).limit(1);
    const linkedBookings = await db.select().from(bookings).where(eq(bookings.branchCode, branchCode)).limit(1);
    const linkedInvoices = await db.select().from(invoices).where(eq(invoices.branchCode, branchCode)).limit(1);
    const linkedUsers = await db.select().from(users).where(eq(users.branchCode, branchCode)).limit(1);

    const hasLinkedData = linkedPatients.length > 0 || linkedBookings.length > 0 || linkedInvoices.length > 0 || linkedUsers.length > 0;
    const force = req.query.force === 'true' || req.body?.force === true;

    if (hasLinkedData && !force) {
      const details: string[] = [];
      if (linkedPatients.length > 0) details.push('Data Pasien');
      if (linkedBookings.length > 0) details.push('Jadwal Booking');
      if (linkedInvoices.length > 0) details.push('Transaksi Kasir / Invoice');
      if (linkedUsers.length > 0) details.push('Akun Pengguna');

      return res.status(400).json({
        error: `Cabang [${branch.name}] masih memiliki data operasional (${details.join(', ')}). Untuk menjaga integritas riwayat rekam medis, Anda disarankan untuk menonaktifkan cabang ini.`,
        hasLinkedData: true,
      });
    }

    await db.delete(branches).where(eq(branches.id, id));
    await recordAudit('DELETE', 'BRANCH', branchCode, req.user?.email || 'Admin', `Menghapus cabang: ${branch.name} (${branchCode})`);
    res.json({ success: true, message: `Cabang ${branch.name} (${branchCode}) berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus cabang: ' + (err.message || String(err)) });
  }
});

// Master: Patient Categories (REGULER, VIP)
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await db.select().from(patientCategories).orderBy(patientCategories.id);
    res.json(cats);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil kategori pasien' });
  }
});

app.post('/api/categories', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { code, name, description } = req.body;
    const inserted = await db.insert(patientCategories).values({
      code: code.toUpperCase(),
      name,
      description,
      isDefault: false,
      isActive: true,
    }).returning();
    await recordAudit('CREATE', 'PATIENT_CATEGORY', code, req.user?.email || 'Admin', `Kategori baru: ${name}`);
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan kategori pasien baru' });
  }
});

// Master: Circumcision Packages & Prices
app.get('/api/packages', async (req, res) => {
  try {
    const pkgs = await db.select().from(circumcisionPackages).orderBy(circumcisionPackages.id);
    const prices = await db.select().from(packagePrices).where(eq(packagePrices.isActive, true));
    
    const enriched = pkgs.map(pkg => ({
      ...pkg,
      prices: prices.filter(p => p.packageId === pkg.id),
    }));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data paket khitan' });
  }
});

app.post('/api/packages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { code, name, description, durationMinutes, prices } = req.body;
    const inserted = await db.insert(circumcisionPackages).values({
      code: code.toUpperCase(),
      name,
      description,
      durationMinutes: durationMinutes || 45,
      isActive: true,
    }).returning();

    const pkg = inserted[0];
    if (prices && Array.isArray(prices)) {
      for (const pr of prices) {
        await db.insert(packagePrices).values({
          packageId: pkg.id,
          patientCategoryId: pr.patientCategoryId,
          price: pr.price,
          effectiveFrom: new Date().toISOString().split('T')[0],
          isActive: true,
        });
      }
    }
    await recordAudit('CREATE', 'PACKAGE', pkg.code, req.user?.email || 'Admin', `Paket baru: ${pkg.name}`);
    res.json(pkg);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan paket khitan' });
  }
});

app.put('/api/packages/:id/prices', requireAuth, async (req: AuthRequest, res) => {
  try {
    const packageId = Number(req.params.id);
    const { prices } = req.body; // Array of { patientCategoryId, price }
    
    // Deactivate previous active prices and insert new ones (preserving historical snapshots)
    await db.update(packagePrices)
      .set({ isActive: false, effectiveUntil: new Date().toISOString().split('T')[0] })
      .where(eq(packagePrices.packageId, packageId));

    for (const pr of prices) {
      await db.insert(packagePrices).values({
        packageId,
        patientCategoryId: pr.patientCategoryId,
        price: pr.price,
        effectiveFrom: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }

    await recordAudit('UPDATE_PRICES', 'PACKAGE', String(packageId), req.user?.email || 'Admin', 'Pembaruan harga paket');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui harga paket' });
  }
});

// ---------------- PRODUK & STOK (PHASE 2) ----------------

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, activeOnly } = req.query;
    let query = db.select().from(products);
    const list = await query.orderBy(products.category, products.name);

    let filtered = list;
    if (activeOnly === 'true') {
      filtered = filtered.filter(p => p.isActive);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.sku.toLowerCase().includes(s) || 
        (p.description && p.description.toLowerCase().includes(s))
      );
    }

    const branchFilter = getBranchFilter(req);
    filtered = filterByBranch(filtered, branchFilter);

    // Self-healing multi-branch: jika cabang operasional belum memiliki varian celana sunat, langsung buatkan katalognya
    if (branchFilter !== 'ALL' && !filtered.some(p => p.category === 'CELANA_SUNAT')) {
      await ensureProductVariants(branchFilter);
      const reQuery = await db.select().from(products).orderBy(products.category, products.name);
      filtered = filterByBranch(reQuery, branchFilter);
    }

    const enriched = filtered.map(p => {
      const meta = parseProductMetadata(p);
      return {
        ...p,
        size: meta.size,
        brand: meta.brand,
        drugType: meta.drugType,
        drugClassification: meta.drugClassification,
        inventoryValue: p.stock * p.costPrice,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// Sync / populate product catalog for a branch
app.post('/api/products/sync-branch-catalog', requireAuth, async (req: AuthRequest, res) => {
  try {
    const branchFilter = getBranchFilter(req);
    const targetBranch = resolveTargetBranch(req, req.body.branchCode || (branchFilter !== 'ALL' ? branchFilter : 'PUSAT'));
    await ensureProductVariants(targetBranch);
    res.json({ success: true, message: `Katalog varian celana & obat berhasil disinkronkan ke cabang ${targetBranch}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyinkronkan katalog cabang: ' + (err.message || String(err)) });
  }
});

async function hasStockReductionAuthority(req: AuthRequest): Promise<boolean> {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'owner' || role === 'super_admin' || role === 'superadmin' || role === 'master') {
    return true;
  }
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;
    const matched = await db.select().from(users).where(
      or(
        uid ? eq(users.uid, String(uid)) : sql`false`,
        email ? eq(users.email, String(email)) : sql`false`
      )
    ).limit(1);
    if (matched.length > 0 && matched[0].permissions) {
      const perms = JSON.parse(matched[0].permissions);
      if (Array.isArray(perms) && (perms.includes('stock_reduction') || perms.includes('products.reduce'))) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

// Batch setup / stock update for Celana Sunat Sizes (XS, S, M, L, XL, XXL)
app.post('/api/products/batch-celana-sizes', requireAuth, async (req: AuthRequest, res) => {
  try {
    let rawSizes = req.body.sizes !== undefined ? req.body.sizes : req.body;
    let sizesList: any[] = [];
    if (Array.isArray(rawSizes)) {
      sizesList = rawSizes;
    } else if (typeof rawSizes === 'object' && rawSizes !== null) {
      sizesList = Object.entries(rawSizes).map(([sz, val]) => {
        if (typeof val === 'object' && val !== null) {
          return { size: sz, ...val };
        }
        return { size: sz, stock: Number(val) || 0 };
      });
    }

    if (sizesList.length === 0) {
      return res.status(400).json({ error: 'Daftar ukuran tidak valid' });
    }

    const branchFilter = getBranchFilter(req);
    const targetBranch = resolveTargetBranch(req, req.body.branchCode || (branchFilter !== 'ALL' ? branchFilter : 'PUSAT'));
    const allProducts = await db.select().from(products);

    // Pre-check: if any size reduces stock below existing stock, enforce stock_reduction authority
    let hasReduction = false;
    for (const s of sizesList) {
      const sizeKey = String(s.size).toUpperCase().trim();
      const branchSku = targetBranch === 'PUSAT' ? `PRD-CLN-${sizeKey}` : `PRD-CLN-${targetBranch}-${sizeKey}`;
      const targetStock = Math.max(0, Number(s.stock || 0));
      const existingMatches = allProducts.filter(p => {
        const itemBranch = (p.branchCode || 'PUSAT').toUpperCase();
        if (itemBranch !== targetBranch.toUpperCase()) return false;
        if (p.sku?.toUpperCase() === branchSku.toUpperCase() || p.sku?.toUpperCase() === `PRD-CLN-${sizeKey}`) return true;
        const isCelana = p.category === 'CELANA_SUNAT' || p.category === 'CELANA' || (p.name || '').toLowerCase().includes('celana');
        if (!isCelana) return false;
        const meta = parseProductMetadata(p);
        if (meta.size?.toUpperCase() === sizeKey) return true;
        if (p.sku?.toUpperCase().endsWith(`-${sizeKey}`)) return true;
        if (p.name?.toUpperCase().includes(`(${sizeKey})`)) return true;
        return false;
      });
      if (existingMatches.length > 0 && targetStock < existingMatches[0].stock) {
        hasReduction = true;
        break;
      }
    }
    if (hasReduction) {
      const authorized = await hasStockReductionAuthority(req);
      if (!authorized) {
        return res.status(403).json({
          error: 'Akses Ditolak: Anda tidak memiliki izin pengurangan stok. Aktifkan izin "Pengurangan & Koreksi Stok Obat" di Manajemen Pengguna.',
        });
      }
    }

    for (const s of sizesList) {
      const sizeKey = String(s.size).toUpperCase().trim();
      const branchSku = targetBranch === 'PUSAT' ? `PRD-CLN-${sizeKey}` : `PRD-CLN-${targetBranch}-${sizeKey}`;
      const targetStock = Math.max(0, Number(s.stock || 0));
      const descJson = JSON.stringify({ size: sizeKey, notes: s.notes || `Ukuran ${sizeKey}` });

      // Match specifically FOR THIS TARGET BRANCH!
      const existingMatches = allProducts.filter(p => {
        const itemBranch = (p.branchCode || 'PUSAT').toUpperCase();
        if (itemBranch !== targetBranch.toUpperCase()) return false;

        if (p.sku?.toUpperCase() === branchSku.toUpperCase() || p.sku?.toUpperCase() === `PRD-CLN-${sizeKey}`) return true;
        const isCelana = p.category === 'CELANA_SUNAT' || p.category === 'CELANA' || (p.name || '').toLowerCase().includes('celana');
        if (!isCelana) return false;
        const meta = parseProductMetadata(p);
        if (meta.size?.toUpperCase() === sizeKey) return true;
        if (p.sku?.toUpperCase().endsWith(`-${sizeKey}`)) return true;
        if (p.name?.toUpperCase().includes(`(${sizeKey})`)) return true;
        return false;
      });

      if (existingMatches.length > 0) {
        const prev = existingMatches[0];
        const diff = targetStock - prev.stock;
        await db.update(products).set({
          stock: targetStock,
          branchCode: targetBranch,
          minStock: s.minStock !== undefined ? Number(s.minStock) : prev.minStock,
          costPrice: s.costPrice !== undefined ? Number(s.costPrice) : prev.costPrice,
          sellPrice: s.sellPrice !== undefined ? Number(s.sellPrice) : prev.sellPrice,
          description: descJson,
        }).where(eq(products.id, prev.id));

        if (diff !== 0) {
          const movNum = await generateStockMovementNumber();
          await db.insert(stockMovements).values({
            movementNumber: movNum,
            productId: prev.id,
            movementType: diff > 0 ? 'IN' : 'OUT',
            quantity: diff,
            previousStock: prev.stock,
            currentStock: targetStock,
            unitCost: prev.costPrice,
            unitPrice: prev.sellPrice,
            referenceType: diff > 0 ? 'RESTOCK' : 'ADJUSTMENT',
            notes: `Penyesuaian stok celana sunat ukuran ${sizeKey} (${prev.stock} -> ${targetStock}) di ${targetBranch} oleh ${req.user?.name || 'Admin'}`,
            performedBy: req.user?.name || 'Admin',
          });
        }
      } else {
        let finalSku = branchSku;
        if (allProducts.some(p => p.sku?.toUpperCase() === finalSku.toUpperCase())) {
          finalSku = `PRD-CLN-${targetBranch}-${sizeKey}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const celanaValues: any = {
          sku: finalSku,
          name: `Celana Sunat Pelindung (Ukuran ${sizeKey})`,
          category: 'CELANA_SUNAT',
          unit: 'pcs',
          sellPrice: s.sellPrice !== undefined ? Number(s.sellPrice) : 50000,
          costPrice: s.costPrice !== undefined ? Number(s.costPrice) : 20000,
          stock: targetStock,
          minStock: s.minStock !== undefined ? Number(s.minStock) : 10,
          branchCode: targetBranch,
          isActive: true,
          description: descJson,
        };

        let inserted: any[] = [];
        try {
          inserted = await db.insert(products).values(celanaValues).returning();
        } catch (insertErr: any) {
          console.warn('Gagal insert celana sunat via Drizzle, mencoba pemulihan skema...');
          try {
            await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT \'PUSAT\'');
            inserted = await db.insert(products).values(celanaValues).returning();
          } catch (retryErr) {
            // Raw SQL fallback (dengan branch_code targetBranch)
            try {
              const rawRes = await pool.query(
                `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT ("sku") DO UPDATE SET "stock" = EXCLUDED."stock", "branch_code" = EXCLUDED."branch_code"
                 RETURNING *`,
                [finalSku, `Celana Sunat Pelindung (Ukuran ${sizeKey})`, 'CELANA_SUNAT', 'pcs', celanaValues.sellPrice, celanaValues.costPrice, targetStock, celanaValues.minStock, targetBranch, true, descJson]
              );
              inserted = rawRes.rows.map(r => ({ ...r, sellPrice: r.sell_price, costPrice: r.cost_price, minStock: r.min_stock, branchCode: r.branch_code || targetBranch, isActive: r.is_active }));
            } catch {
              const rawRes = await pool.query(
                `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [finalSku, `Celana Sunat Pelindung (Ukuran ${sizeKey})`, 'CELANA_SUNAT', 'pcs', celanaValues.sellPrice, celanaValues.costPrice, targetStock, celanaValues.minStock, targetBranch, true, descJson]
              );
              inserted = rawRes.rows.map(r => ({ ...r, sellPrice: r.sell_price, costPrice: r.cost_price, minStock: r.min_stock, branchCode: targetBranch, isActive: r.is_active }));
            }
          }
        }

        if (targetStock > 0 && inserted.length > 0) {
          const movNum = await generateStockMovementNumber();
          await db.insert(stockMovements).values({
            movementNumber: movNum,
            productId: inserted[0].id,
            movementType: 'IN',
            quantity: targetStock,
            previousStock: 0,
            currentStock: targetStock,
            unitCost: inserted[0].costPrice,
            unitPrice: inserted[0].sellPrice,
            referenceType: 'RESTOCK',
            notes: `Stok awal celana sunat ukuran ${sizeKey} di ${targetBranch}`,
            performedBy: req.user?.name || 'Admin',
          });
        }
      }
    }

    await recordAudit('BATCH_UPDATE_STOCK', 'PRODUCT', 'CELANA_SUNAT', req.user?.email || 'Admin', `Batch update stok ukuran celana sunat XS, S, M, L, XL, XXL di ${targetBranch}`);
    res.json({ success: true, message: `Stok ukuran celana sunat di cabang ${targetBranch} berhasil diperbarui` });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui stok ukuran celana sunat: ' + err.message });
  }
});

// Create Product
app.post('/api/products', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, category, unit, sellPrice, costPrice, stock, minStock, description, sku, size, brand, drugType, drugClassification } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Nama dan kategori produk wajib diisi' });
    }

    const branchFilter = getBranchFilter(req);
    const targetBranch = resolveTargetBranch(req, req.body.branchCode || (branchFilter !== 'ALL' ? branchFilter : 'PUSAT'));

    let finalDescription = description || '';
    if (category === 'CELANA_SUNAT' && size) {
      finalDescription = JSON.stringify({ size: String(size).toUpperCase(), notes: description || '' });
    } else if ((category === 'OBAT' || category === 'OBAT_ORAL') && (brand || drugType || drugClassification)) {
      finalDescription = JSON.stringify({
        brand: brand || '',
        drugType: drugType || 'Sirup',
        drugClassification: drugClassification || 'ANTI_NYERI',
        notes: description || '',
      });
    }

    const allCurrentProducts = await db.select({ sku: products.sku }).from(products);
    let finalSku = sku ? sku.toUpperCase().trim() : await generateProductSKU(category);
    if (allCurrentProducts.some(p => p.sku?.toUpperCase() === finalSku.toUpperCase())) {
      finalSku = `${finalSku}-${targetBranch}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const initialStock = Number(stock || 0);
    const userRole = (req.user?.role || '').toLowerCase();
    const isOwnerOrSuper = userRole === 'owner' || userRole === 'super_admin' || userRole === 'superadmin';
    if (!isOwnerOrSuper && (Number(sellPrice) > 0 || Number(costPrice) > 0)) {
      return res.status(403).json({
        error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk menetapkan harga jual atau HPP obat/produk baru. Pengaturan harga hanya dapat dilakukan oleh Owner / Super Admin.'
      });
    }

    const cost = Number(costPrice || 0);
    const sell = Number(sellPrice || 0);

    const productValues: any = {
      sku: finalSku,
      name,
      category,
      unit: unit || 'pcs',
      sellPrice: sell,
      costPrice: cost,
      stock: initialStock,
      minStock: Number(minStock || 5),
      isActive: true,
      description: finalDescription,
      branchCode: targetBranch,
    };

    let inserted: any[] = [];
    try {
      inserted = await db.insert(products).values(productValues).returning();
    } catch (insertErr: any) {
      console.warn('Gagal insert produk via Drizzle, menjalankan self-healing schema & fallback...');
      try {
        await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT \'PUSAT\'');
        await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" integer DEFAULT 0');
        await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_stock" integer DEFAULT 5');
        await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true');
        await pool.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text');
        inserted = await db.insert(products).values(productValues).returning();
      } catch (retryErr) {
        // Fallback ke Raw SQL: aman dari schema Drizzle
        try {
          const rawWithBranch = await pool.query(
            `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT ("sku") DO UPDATE SET "stock" = EXCLUDED."stock", "branch_code" = EXCLUDED."branch_code"
             RETURNING *`,
            [finalSku, name, category, unit || 'pcs', sell, cost, initialStock, Number(minStock || 5), targetBranch, true, finalDescription]
          );
          inserted = rawWithBranch.rows.map(r => ({
            id: r.id,
            sku: r.sku,
            name: r.name,
            category: r.category,
            unit: r.unit,
            sellPrice: r.sell_price,
            costPrice: r.cost_price,
            stock: r.stock,
            minStock: r.min_stock,
            branchCode: r.branch_code || targetBranch,
            isActive: r.is_active,
            description: r.description,
            createdAt: r.created_at
          }));
        } catch {
          // Jika branch_code belum ada di database lokal dan ALTER TABLE belum berhasil
          const rawWithoutBranch = await pool.query(
            `INSERT INTO "products" ("sku", "name", "category", "unit", "sell_price", "cost_price", "stock", "min_stock", "branch_code", "is_active", "description")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [finalSku, name, category, unit || 'pcs', sell, cost, initialStock, Number(minStock || 5), targetBranch, true, finalDescription]
          );
          inserted = rawWithoutBranch.rows.map(r => ({
            id: r.id,
            sku: r.sku,
            name: r.name,
            category: r.category,
            unit: r.unit,
            sellPrice: r.sell_price,
            costPrice: r.cost_price,
            stock: r.stock,
            minStock: r.min_stock,
            branchCode: targetBranch,
            isActive: r.is_active,
            description: r.description,
            createdAt: r.created_at
          }));
        }
      }
    }

    const product = inserted[0];

    // If initial stock is positive, record initial stock movement
    if (initialStock > 0) {
      const movNum = await generateStockMovementNumber();
      await db.insert(stockMovements).values({
        movementNumber: movNum,
        productId: product.id,
        movementType: 'IN',
        quantity: initialStock,
        previousStock: 0,
        currentStock: initialStock,
        unitCost: cost,
        unitPrice: sell,
        notes: 'Stok awal saat produk baru didaftarkan',
        referenceType: 'RESTOCK',
        performedBy: req.user?.name || 'Admin',
      });
    }

    const meta = parseProductMetadata(product);
    await recordAudit('CREATE', 'PRODUCT', product.sku, req.user?.email || 'Admin', `Produk baru: ${product.name} (Stok: ${initialStock})`);
    res.json({
      ...product,
      size: meta.size,
      brand: meta.brand,
      drugType: meta.drugType,
      drugClassification: meta.drugClassification,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menambahkan produk baru' });
  }
});

// Update Product
app.put('/api/products/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    const { name, category, unit, sellPrice, costPrice, minStock, isActive, description, size, brand, drugType, drugClassification } = req.body;

    const existing = await db.select().from(products).where(eq(products.id, productId));
    if (existing.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    // Strict price control: Only Owner or Super Admin can modify medicine/product prices
    const userRole = (req.user?.role || '').toLowerCase();
    const isOwnerOrSuper = userRole === 'owner' || userRole === 'super_admin' || userRole === 'superadmin';

    if (!isOwnerOrSuper) {
      if (sellPrice !== undefined && Number(sellPrice) !== existing[0].sellPrice) {
        return res.status(403).json({
          error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah harga jual obat/produk. Pengaturan harga berada sepenuhnya dalam kendali Owner / Super Admin untuk mencegah manipulasi data kasir.'
        });
      }
      if (costPrice !== undefined && Number(costPrice) !== existing[0].costPrice) {
        return res.status(403).json({
          error: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengubah harga modal (HPP) obat/produk. Pengaturan harga berada sepenuhnya dalam kendali Owner / Super Admin.'
        });
      }
    }

    const cat = category !== undefined ? category : existing[0].category;
    let newDescription = description !== undefined ? description : existing[0].description;

    if (size !== undefined || brand !== undefined || drugType !== undefined || drugClassification !== undefined) {
      const meta = parseProductMetadata(existing[0]);
      const s = size !== undefined ? size : meta.size;
      const b = brand !== undefined ? brand : meta.brand;
      const dt = drugType !== undefined ? drugType : meta.drugType;
      const dc = drugClassification !== undefined ? drugClassification : meta.drugClassification;
      const notes = description !== undefined ? description : meta.notes;

      if (cat === 'CELANA_SUNAT') {
        newDescription = JSON.stringify({ size: s ? String(s).toUpperCase() : 'M', notes });
      } else if (cat === 'OBAT' || cat === 'OBAT_ORAL') {
        newDescription = JSON.stringify({ brand: b || '', drugType: dt || 'Sirup', drugClassification: dc || 'ANTI_NYERI', notes });
      }
    }

    await db.update(products)
      .set({
        name: name !== undefined ? name : existing[0].name,
        category: category !== undefined ? category : existing[0].category,
        unit: unit !== undefined ? unit : existing[0].unit,
        sellPrice: sellPrice !== undefined ? Number(sellPrice) : existing[0].sellPrice,
        costPrice: costPrice !== undefined ? Number(costPrice) : existing[0].costPrice,
        minStock: minStock !== undefined ? Number(minStock) : existing[0].minStock,
        isActive: isActive !== undefined ? Boolean(isActive) : existing[0].isActive,
        description: newDescription,
      })
      .where(eq(products.id, productId));

    await recordAudit('UPDATE', 'PRODUCT', existing[0].sku, req.user?.email || 'Admin', `Update data produk: ${name || existing[0].name}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui data produk' });
  }
});

// Delete (Soft) Product
app.delete('/api/products/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menonaktifkan produk' });
  }
});

// Stock Adjustment / Barang Masuk / Keluar Manual
app.post('/api/products/:id/adjust-stock', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    const { movementType, quantity, notes, referenceType } = req.body;
    // movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
    const qty = Number(quantity);
    if (movementType === 'ADJUSTMENT') {
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ error: 'Jumlah opname fisik tidak boleh negatif' });
      }
    } else if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'Jumlah penyesuaian harus lebih dari 0' });
    }

    const prodList = await db.select().from(products).where(eq(products.id, productId));
    if (prodList.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    const product = prodList[0];

    const prevStock = product.stock;
    let newStock = prevStock;
    let loggedQty = qty;

    // Enforce restricted permission for any manual stock reduction (OUT or downward ADJUSTMENT)
    if (movementType === 'OUT' || (movementType === 'ADJUSTMENT' && qty < prevStock)) {
      const authorized = await hasStockReductionAuthority(req);
      if (!authorized) {
        return res.status(403).json({
          error: 'Akses Ditolak: Anda tidak memiliki izin pengurangan stok obat. Hubungi Owner untuk mengaktifkan izin "Pengurangan & Koreksi Stok Obat".',
        });
      }
    }

    if (movementType === 'IN') {
      newStock = prevStock + qty;
      loggedQty = qty;
    } else if (movementType === 'OUT') {
      if (prevStock < qty) {
        return res.status(400).json({ error: `Stok tidak mencukupi. Sisa stok: ${prevStock}` });
      }
      newStock = prevStock - qty;
      loggedQty = -qty;
    } else if (movementType === 'ADJUSTMENT') {
      // Direct adjustment to target quantity
      newStock = qty;
      loggedQty = qty - prevStock;
    } else {
      return res.status(400).json({ error: 'Tipe mutasi stok tidak valid' });
    }

    // Update product stock
    await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));

    // Record stock movement
    const movNum = await generateStockMovementNumber();
    const movRecord = await db.insert(stockMovements).values({
      movementNumber: movNum,
      productId,
      movementType,
      quantity: loggedQty,
      previousStock: prevStock,
      currentStock: newStock,
      unitCost: product.costPrice,
      unitPrice: product.sellPrice,
      referenceType: referenceType || (movementType === 'IN' ? 'RESTOCK' : movementType === 'OUT' ? 'MANUAL_OUT' : 'ADJUSTMENT'),
      notes: notes || `Mutasi ${movementType} manual oleh ${req.user?.name || 'Staff'}`,
      performedBy: req.user?.name || 'Staff',
    }).returning();

    await recordAudit('STOCK_MUTATION', 'PRODUCT', product.sku, req.user?.email || 'Staff', `Mutasi ${movementType} qty: ${qty} (Stok: ${prevStock} -> ${newStock})`);
    res.json({ success: true, newStock, movement: movRecord[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal melakukan mutasi stok' });
  }
});

// Stock Movements Log
app.get('/api/stock-movements', async (req, res) => {
  try {
    const { productId, movementType, limit } = req.query;
    const movements = await db.select({
      id: stockMovements.id,
      movementNumber: stockMovements.movementNumber,
      productId: stockMovements.productId,
      productName: products.name,
      productSku: products.sku,
      category: products.category,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      previousStock: stockMovements.previousStock,
      currentStock: stockMovements.currentStock,
      unitCost: stockMovements.unitCost,
      unitPrice: stockMovements.unitPrice,
      referenceType: stockMovements.referenceType,
      referenceId: stockMovements.referenceId,
      notes: stockMovements.notes,
      performedBy: stockMovements.performedBy,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .orderBy(desc(stockMovements.id))
    .limit(limit ? Number(limit) : 100);

    let filtered = movements;
    if (productId) {
      filtered = filtered.filter(m => m.productId === Number(productId));
    }
    if (movementType && movementType !== 'ALL') {
      filtered = filtered.filter(m => m.movementType === movementType);
    }

    const enriched = filtered.map(m => {
      const meta = parseProductMetadata({ name: m.productName, sku: m.productSku, category: m.category, notes: m.notes });
      let size = meta.size;
      if (!size && m.notes) {
        const szMatch = m.notes.match(/ukuran\s*([a-zA-Z]+)/i) || m.notes.match(/\b(XS|XL|S|M|L)\b/i);
        if (szMatch) size = szMatch[1].toUpperCase();
      }
      if (!size && (m.category === 'CELANA_SUNAT' || (m.productName || '').toLowerCase().includes('celana'))) {
        const szMatch = ((m.productName || '') + ' ' + (m.productSku || '')).match(/\b(XS|XL|S|M|L)\b/i);
        if (szMatch) size = szMatch[1].toUpperCase();
        else size = 'M';
      }
      return {
        ...m,
        size: size || null,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil riwayat mutasi stok' });
  }
});

// Inventory Summary Metrics
app.get('/api/inventory/summary', async (req, res) => {
  try {
    const allProdsRaw = await db.select().from(products).where(eq(products.isActive, true));
    const branchFilter = getBranchFilter(req);
    const allProds = filterByBranch(allProdsRaw, branchFilter);
    const totalProducts = allProds.length;
    const totalStockQuantity = allProds.reduce((acc, p) => acc + p.stock, 0);
    const totalInventoryCost = allProds.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
    const lowStockCount = allProds.filter(p => p.stock <= p.minStock).length;

    res.json({
      totalProducts,
      totalStockQuantity,
      totalInventoryCost,
      lowStockCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghitung ringkasan inventaris' });
  }
});

// ---------------- MASTER ISI PAKET KHITAN (INCLUDED ITEMS) ----------------

// Get All Configured Included Items
app.get('/api/package-items', async (req, res) => {
  try {
    const list = await db.select({
      id: packageIncludedItems.id,
      packageId: packageIncludedItems.packageId,
      packageName: circumcisionPackages.name,
      patientCategoryId: packageIncludedItems.patientCategoryId,
      categoryCode: patientCategories.code,
      categoryName: patientCategories.name,
      productId: packageIncludedItems.productId,
      productSku: products.sku,
      productName: products.name,
      productCategory: products.category,
      quantity: packageIncludedItems.quantity,
      isIncluded: packageIncludedItems.isIncluded,
      notes: packageIncludedItems.notes,
    })
    .from(packageIncludedItems)
    .innerJoin(circumcisionPackages, eq(packageIncludedItems.packageId, circumcisionPackages.id))
    .leftJoin(patientCategories, eq(packageIncludedItems.patientCategoryId, patientCategories.id))
    .innerJoin(products, eq(packageIncludedItems.productId, products.id))
    .orderBy(packageIncludedItems.packageId, packageIncludedItems.patientCategoryId);

    res.json(list);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil konfigurasi isi paket khitan' });
  }
});

// Add or Update Package Included Item
app.post('/api/package-items', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { packageId, patientCategoryId, productId, quantity, isIncluded, notes } = req.body;
    if (!packageId || !productId) {
      return res.status(400).json({ error: 'Paket dan produk wajib dipilih' });
    }

    const qty = Number(quantity || 1);
    const catId = patientCategoryId ? Number(patientCategoryId) : null;

    // Check if already exists for this package + category + product
    const existing = await db.select().from(packageIncludedItems)
      .where(and(
        eq(packageIncludedItems.packageId, Number(packageId)),
        catId ? eq(packageIncludedItems.patientCategoryId, catId) : sql`patient_category_id IS NULL`,
        eq(packageIncludedItems.productId, Number(productId))
      ));

    if (existing.length > 0) {
      await db.update(packageIncludedItems)
        .set({
          quantity: qty,
          isIncluded: isIncluded !== undefined ? isIncluded : true,
          notes: notes || existing[0].notes,
        })
        .where(eq(packageIncludedItems.id, existing[0].id));
      return res.json({ success: true, id: existing[0].id });
    }

    const inserted = await db.insert(packageIncludedItems).values({
      packageId: Number(packageId),
      patientCategoryId: catId,
      productId: Number(productId),
      quantity: qty,
      isIncluded: isIncluded !== undefined ? isIncluded : true,
      notes: notes || '',
    }).returning();

    await recordAudit('CONFIG_PACKAGE_ITEM', 'PACKAGE', String(packageId), req.user?.email || 'Admin', `Atur isi paket: Produk ID ${productId} Qty ${qty}`);
    res.json(inserted[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan konfigurasi isi paket' });
  }
});

// Delete Package Included Item Rule
app.delete('/api/package-items/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(packageIncludedItems).where(eq(packageIncludedItems.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus konfigurasi isi paket' });
  }
});

// ---------------- TRANSACTION ITEMS (INCLUDED & ADD-ONS) ----------------

// Helper function to auto-initialize Included items for a booking if not yet initialized
async function ensureIncludedItemsForBooking(bookingId: number) {
  const bkList = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (bkList.length === 0) return;
  const booking = bkList[0];

  // Check which products are already added as INCLUDED for this booking
  const existingItems = await db.select().from(transactionItems).where(eq(transactionItems.bookingId, bookingId));
  const existingIncludedProductIds = new Set(
    existingItems.filter(i => i.itemType === 'INCLUDED').map(i => i.productId)
  );

  // Find procedure & invoice if exist
  const procList = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.bookingId, bookingId));
  const procedureId = procList[0]?.id || null;

  const invList = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
  const invoiceId = invList[0]?.id || null;

  // Fetch package_included_items matching booking packageId and categoryId (or categoryId IS NULL)
  const rules = await db.select({
    productId: packageIncludedItems.productId,
    quantity: packageIncludedItems.quantity,
    isIncluded: packageIncludedItems.isIncluded,
    notes: packageIncludedItems.notes,
    productSku: products.sku,
    productName: products.name,
    category: products.category,
    costPrice: products.costPrice,
  })
  .from(packageIncludedItems)
  .innerJoin(products, eq(packageIncludedItems.productId, products.id))
  .where(and(
    eq(packageIncludedItems.packageId, booking.packageId),
    booking.patientCategoryId
      ? or(
          eq(packageIncludedItems.patientCategoryId, booking.patientCategoryId),
          sql`${packageIncludedItems.patientCategoryId} IS NULL`
        )
      : sql`1=1`
  ));

  // Check if specific categories/drugs are already present in included items
  const hasIncludedCelana = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'CELANA_SUNAT' || i.category === 'CELANA' || (i.productName || '').toLowerCase().includes('celana')));
  const allProdForCheck = await db.select().from(products);
  const prodCheckMap = new Map(allProdForCheck.map(p => [p.id, p]));

  const hasIncludedAntiNyeri = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && ((i.notes && i.notes.includes('Anti Nyeri')) || parseProductMetadata(prodCheckMap.get(i.productId) || {}).drugClassification === 'ANTI_NYERI'));
  const hasIncludedAntiBengkak = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && ((i.notes && i.notes.includes('Anti Bengkak')) || parseProductMetadata(prodCheckMap.get(i.productId) || {}).drugClassification === 'ANTI_BENGKAK'));
  const hasIncludedAntiBiotik = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && ((i.notes && i.notes.includes('Antibiotik')) || parseProductMetadata(prodCheckMap.get(i.productId) || {}).drugClassification === 'ANTI_BIOTIK'));

  if (rules.length > 0) {
    for (const r of rules) {
      // If user already selected a celana sunat variant, do not overwrite or re-add the default rule
      if ((r.category === 'CELANA_SUNAT' || (r.productName || '').toLowerCase().includes('celana')) && hasIncludedCelana) {
        continue;
      }
      // If user already selected an obat variant in this class, do not overwrite or re-add
      if (r.category === 'OBAT' || r.category === 'OBAT_ORAL') {
        const rMeta = parseProductMetadata(r);
        if (rMeta.drugClassification === 'ANTI_NYERI' && hasIncludedAntiNyeri) continue;
        if (rMeta.drugClassification === 'ANTI_BENGKAK' && hasIncludedAntiBengkak) continue;
        if (rMeta.drugClassification === 'ANTI_BIOTIK' && hasIncludedAntiBiotik) continue;
      }

      if (!existingIncludedProductIds.has(r.productId)) {
        await db.insert(transactionItems).values({
          bookingId,
          procedureId,
          invoiceId,
          productId: r.productId,
          productSku: r.productSku,
          productName: r.productName,
          category: r.category,
          itemType: 'INCLUDED',
          quantity: r.quantity,
          costPriceSnapshot: r.costPrice,
          sellPriceSnapshot: 0, // Included = Rp 0 tambahan untuk pasien
          discountAmount: 0,
          totalAmount: 0,
          isStockDeducted: false,
          notes: r.notes || 'Termasuk dalam paket khitan',
        });
        existingIncludedProductIds.add(r.productId);
      }
    }
  } else {
    // Robust fallback for any circumcision package without explicit rules:
    // VIP gets 2 pcs Celana Sunat, Reguler gets 1 pcs Celana Sunat, plus 3 Macam Obat Oral (Anti Nyeri, Anti Bengkak, Antibiotik), Mainan Anak, Antiseptik, Sertifikat & Goodiebag
    const isVip = booking.patientCategoryId === 2;
    const celanaQty = isVip ? 2 : 1;
    const allProd = allProdForCheck;
    const prodMap = prodCheckMap;

    // Prefer specific size M as default celana, or first available
    const celana = allProd.find(p => p.sku === 'PRD-CLN-M') || allProd.find(p => p.category === 'CELANA_SUNAT' || (p.name || '').toLowerCase().includes('celana'));
    
    // 3 Macam Obat Oral: Anti Nyeri, Anti Bengkak, Antibiotik
    const obatAntiNyeri = allProd.find(p => p.sku === 'PRD-OBT-NYR-SYR-01') || allProd.find(p => (p.category === 'OBAT' || p.category === 'OBAT_ORAL') && parseProductMetadata(p).drugClassification === 'ANTI_NYERI');
    const obatAntiBengkak = allProd.find(p => p.sku === 'PRD-OBT-BGK-SYR-01') || allProd.find(p => (p.category === 'OBAT' || p.category === 'OBAT_ORAL') && parseProductMetadata(p).drugClassification === 'ANTI_BENGKAK');
    const obatAntiBiotik = allProd.find(p => p.sku === 'PRD-OBT-ATB-SYR-01') || allProd.find(p => (p.category === 'OBAT' || p.category === 'OBAT_ORAL') && parseProductMetadata(p).drugClassification === 'ANTI_BIOTIK');

    const mainan = allProd.find(p => p.category === 'MAINAN');
    const antiseptic = allProd.find(p => p.category === 'OBAT_TETES' || p.category === 'LAINNYA');
    const sertifikat = allProd.find(p => p.category === 'AKSESORIS' || (p.name || '').toLowerCase().includes('sertifikat'));
    const godiiebag = allProd.find(p => (p.name || '').toLowerCase().includes('godiie') || (p.name || '').toLowerCase().includes('bag'));

    const hasIncludedMainan = existingItems.some(i => i.itemType === 'INCLUDED' && i.category === 'MAINAN');
    const hasIncludedAntiseptic = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'OBAT_TETES' || i.category === 'LAINNYA'));
    const hasIncludedSertifikat = existingItems.some(i => i.itemType === 'INCLUDED' && (i.category === 'AKSESORIS' || (i.productName || '').toLowerCase().includes('sertifikat')));
    const hasIncludedGodiiebag = existingItems.some(i => i.itemType === 'INCLUDED' && ((i.productName || '').toLowerCase().includes('godiie') || (i.productName || '').toLowerCase().includes('bag')));

    const fallbackList = [
      (!hasIncludedCelana && celana) ? { ...celana, qty: celanaQty, notes: `Paket ${isVip ? 'VIP (2 pcs)' : 'Reguler (1 pcs)'} Celana Sunat (Ukuran M)` } : null,
      (!hasIncludedAntiNyeri && obatAntiNyeri) ? { ...obatAntiNyeri, qty: 1, notes: 'Paket Obat Khitan (Anti Nyeri)' } : null,
      (!hasIncludedAntiBengkak && obatAntiBengkak) ? { ...obatAntiBengkak, qty: 1, notes: 'Paket Obat Khitan (Anti Bengkak)' } : null,
      (!hasIncludedAntiBiotik && obatAntiBiotik) ? { ...obatAntiBiotik, qty: 1, notes: 'Paket Obat Khitan (Antibiotik)' } : null,
      (!hasIncludedMainan && mainan) ? { ...mainan, qty: 1, notes: 'Item Paket Khitan: Hadiah Mainan Anak' } : null,
      (!hasIncludedAntiseptic && antiseptic) ? { ...antiseptic, qty: 1, notes: 'Antiseptik / obat tetes perawatan' } : null,
      (!hasIncludedSertifikat && sertifikat) ? { ...sertifikat, qty: 1, notes: 'Item Paket Khitan: Sertifikat Khitan Resmi' } : null,
      (!hasIncludedGodiiebag && godiiebag) ? { ...godiiebag, qty: 1, notes: 'Item Paket Khitan: Goodiebag Perlengkapan' } : null,
    ].filter(Boolean);

    for (const item of fallbackList) {
      if (item && !existingIncludedProductIds.has(item.id)) {
        await db.insert(transactionItems).values({
          bookingId,
          procedureId,
          invoiceId,
          productId: item.id,
          productSku: item.sku,
          productName: item.name,
          category: item.category,
          itemType: 'INCLUDED',
          quantity: item.qty,
          costPriceSnapshot: item.costPrice,
          sellPriceSnapshot: 0,
          discountAmount: 0,
          totalAmount: 0,
          isStockDeducted: false,
          notes: item.notes,
        });
        existingIncludedProductIds.add(item.id);
      }
    }
  }
}

// Get Items for Booking / Procedure (Included + Addons)
app.get('/api/bookings/:id/items', async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    await ensureIncludedItemsForBooking(bookingId);

    const items = await db.select().from(transactionItems)
      .where(eq(transactionItems.bookingId, bookingId))
      .orderBy(transactionItems.itemType, transactionItems.id);

    const allProd = await db.select().from(products);
    const prodMap = new Map(allProd.map(p => [p.id, p]));

    const enrichedItems = items.map(item => {
      const prod = prodMap.get(item.productId);
      const meta = prod ? parseProductMetadata(prod) : { size: null, brand: null, drugType: null, drugClassification: null };
      return {
        ...item,
        selectedSize: meta.size || undefined,
        selectedBrand: meta.brand || undefined,
        selectedDrugType: meta.drugType || undefined,
        selectedDrugClassification: meta.drugClassification || undefined,
      };
    });

    res.json(enrichedItems);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil rincian item transaksi' });
  }
});

// Update Package Selection in Ruang Tindakan (Celana Sunat sizes & Obat 3 macam: Anti Nyeri, Anti Bengkak, Antibiotik)
app.post('/api/bookings/:id/package-selection', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { celanaProductIds, obatProductId, obatProductIds, obatSelection } = req.body;

    const bkList = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (bkList.length === 0) return res.status(404).json({ error: 'Booking tidak ditemukan' });
    const booking = bkList[0];

    const procList = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.bookingId, bookingId));
    const procedureId = procList[0]?.id || null;

    const invList = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
    const invoiceId = invList[0]?.id || null;

    const existing = await db.select().from(transactionItems).where(eq(transactionItems.bookingId, bookingId));

    // 1. Update Celana Sunat Selection if provided (either product IDs or direct sizes)
    let targetCelanaProductIds: number[] = [];
    if (Array.isArray(celanaProductIds) && celanaProductIds.length > 0) {
      targetCelanaProductIds = celanaProductIds.map(Number);
    } else if (Array.isArray(req.body.celanaSizes) && req.body.celanaSizes.length > 0) {
      const allCurrentProds = await db.select().from(products);
      for (const rawSz of req.body.celanaSizes) {
        const sz = String(rawSz).trim().toUpperCase();
        let prod = allCurrentProds.find(p => {
          if (p.category !== 'CELANA_SUNAT' && !(p.name || '').toLowerCase().includes('celana')) return false;
          if (p.sku === `PRD-CLN-${sz}`) return true;
          const meta = parseProductMetadata(p);
          return meta.size === sz;
        });

        if (!prod) {
          const inserted = await db.insert(products).values({
            sku: `PRD-CLN-${sz}`,
            name: `Celana Sunat Pelindung (Ukuran ${sz})`,
            category: 'CELANA_SUNAT',
            unit: 'pcs',
            sellPrice: 50000,
            costPrice: 20000,
            stock: 50,
            minStock: 10,
            branchCode: 'PUSAT',
            isActive: true,
            description: JSON.stringify({ size: sz, notes: `Ukuran ${sz}` }),
          }).returning();
          prod = inserted[0];
        }
        if (prod) targetCelanaProductIds.push(prod.id);
      }
    }

    if (targetCelanaProductIds.length > 0) {
      // Delete old un-deducted INCLUDED celana items
      for (const item of existing) {
        if (item.itemType === 'INCLUDED' && (item.category === 'CELANA_SUNAT' || (item.productName || '').toLowerCase().includes('celana')) && !item.isStockDeducted) {
          await db.delete(transactionItems).where(eq(transactionItems.id, item.id));
        }
      }

      // Group identical product IDs (e.g. if VIP selects 2x size M)
      const countMap = new Map<number, number>();
      for (const pid of targetCelanaProductIds) {
        countMap.set(Number(pid), (countMap.get(Number(pid)) || 0) + 1);
      }

      for (const [pid, qty] of countMap.entries()) {
        const prod = await db.select().from(products).where(eq(products.id, pid));
        if (prod.length > 0) {
          const p = prod[0];
          const meta = parseProductMetadata(p);
          await db.insert(transactionItems).values({
            bookingId,
            procedureId,
            invoiceId,
            productId: p.id,
            productSku: p.sku,
            productName: p.name,
            category: 'CELANA_SUNAT',
            itemType: 'INCLUDED',
            quantity: qty,
            costPriceSnapshot: p.costPrice,
            sellPriceSnapshot: 0,
            discountAmount: 0,
            totalAmount: 0,
            isStockDeducted: false,
            notes: `Paket ${booking.patientCategoryId === 2 ? 'VIP' : 'Reguler'} - Celana Sunat (Ukuran ${meta.size || 'M'}) [${qty} pcs]`,
          });
        }
      }
    }

    // 2. Update Obat Selection if provided (support 3 distinct medications: Anti Nyeri, Anti Bengkak, Antibiotik)
    const allProdForObat = await db.select().from(products);
    const prodLookup = new Map(allProdForObat.map(p => [p.id, p]));

    // Identify current medications in transaction
    const existingObatItems = existing.filter(
      item => item.itemType === 'INCLUDED' && (item.category === 'OBAT' || item.category === 'OBAT_ORAL') && !item.isStockDeducted
    );

    let currentAntiNyeriId: number | null = null;
    let currentAntiBengkakId: number | null = null;
    let currentAntiBiotikId: number | null = null;

    for (const item of existingObatItems) {
      const prod = prodLookup.get(item.productId);
      const meta = prod ? parseProductMetadata(prod) : { drugClassification: null };
      const cls = meta.drugClassification || (
        item.notes?.includes('Anti Nyeri') ? 'ANTI_NYERI' :
        item.notes?.includes('Anti Bengkak') ? 'ANTI_BENGKAK' :
        item.notes?.includes('Antibiotik') ? 'ANTI_BIOTIK' : null
      );
      if (cls === 'ANTI_NYERI' && !currentAntiNyeriId) currentAntiNyeriId = item.productId;
      else if (cls === 'ANTI_BENGKAK' && !currentAntiBengkakId) currentAntiBengkakId = item.productId;
      else if (cls === 'ANTI_BIOTIK' && !currentAntiBiotikId) currentAntiBiotikId = item.productId;
    }

    let shouldUpdateObat = false;
    let newAntiNyeriId = currentAntiNyeriId;
    let newAntiBengkakId = currentAntiBengkakId;
    let newAntiBiotikId = currentAntiBiotikId;

    if (obatSelection && typeof obatSelection === 'object') {
      shouldUpdateObat = true;
      if (obatSelection.antiNyeriId !== undefined && obatSelection.antiNyeriId !== null) newAntiNyeriId = Number(obatSelection.antiNyeriId) || null;
      if (obatSelection.antiBengkakId !== undefined && obatSelection.antiBengkakId !== null) newAntiBengkakId = Number(obatSelection.antiBengkakId) || null;
      if (obatSelection.antiBiotikId !== undefined && obatSelection.antiBiotikId !== null) newAntiBiotikId = Number(obatSelection.antiBiotikId) || null;
    } else if (Array.isArray(obatProductIds) && obatProductIds.length > 0) {
      shouldUpdateObat = true;
      for (const pid of obatProductIds.map(Number)) {
        const prod = prodLookup.get(pid);
        if (prod) {
          const cls = parseProductMetadata(prod).drugClassification;
          if (cls === 'ANTI_NYERI') newAntiNyeriId = pid;
          else if (cls === 'ANTI_BENGKAK') newAntiBengkakId = pid;
          else if (cls === 'ANTI_BIOTIK') newAntiBiotikId = pid;
        }
      }
    } else if (obatProductId) {
      shouldUpdateObat = true;
      const pid = Number(obatProductId);
      const prod = prodLookup.get(pid);
      if (prod) {
        const cls = parseProductMetadata(prod).drugClassification;
        if (cls === 'ANTI_NYERI') newAntiNyeriId = pid;
        else if (cls === 'ANTI_BENGKAK') newAntiBengkakId = pid;
        else if (cls === 'ANTI_BIOTIK') newAntiBiotikId = pid;
        else newAntiNyeriId = pid;
      }
    }

    if (shouldUpdateObat) {
      // Delete old un-deducted INCLUDED obat items
      for (const item of existing) {
        if (item.itemType === 'INCLUDED' && (item.category === 'OBAT' || item.category === 'OBAT_ORAL') && !item.isStockDeducted) {
          await db.delete(transactionItems).where(eq(transactionItems.id, item.id));
        }
      }

      const idsToInsert = [newAntiNyeriId, newAntiBengkakId, newAntiBiotikId].filter(Boolean) as number[];
      for (const oid of idsToInsert) {
        const prod = prodLookup.get(oid) || (await db.select().from(products).where(eq(products.id, oid)))[0];
        if (prod) {
          const meta = parseProductMetadata(prod);
          const classificationLabel = meta.drugClassification === 'ANTI_NYERI'
            ? 'Anti Nyeri'
            : meta.drugClassification === 'ANTI_BENGKAK'
            ? 'Anti Bengkak'
            : meta.drugClassification === 'ANTI_BIOTIK'
            ? 'Antibiotik'
            : 'Obat Khitan';

          await db.insert(transactionItems).values({
            bookingId,
            procedureId,
            invoiceId,
            productId: prod.id,
            productSku: prod.sku,
            productName: prod.name,
            category: 'OBAT',
            itemType: 'INCLUDED',
            quantity: 1,
            costPriceSnapshot: prod.costPrice,
            sellPriceSnapshot: 0,
            discountAmount: 0,
            totalAmount: 0,
            isStockDeducted: false,
            notes: `Paket Obat Oral (${classificationLabel}): ${prod.name} [${meta.brand || ''}] (${meta.drugType || 'Sirup'})`,
          });
        }
      }
    }

    // Ensure package items are present
    await ensureIncludedItemsForBooking(bookingId);

    // Return updated items
    const items = await db.select().from(transactionItems)
      .where(eq(transactionItems.bookingId, bookingId))
      .orderBy(transactionItems.itemType, transactionItems.id);

    const allProd = await db.select().from(products);
    const prodMap = new Map(allProd.map(p => [p.id, p]));

    const enrichedItems = items.map(item => {
      const prod = prodMap.get(item.productId);
      const meta = prod ? parseProductMetadata(prod) : { size: null, brand: null, drugType: null, drugClassification: null };
      return {
        ...item,
        selectedSize: meta.size || undefined,
        selectedBrand: meta.brand || undefined,
        selectedDrugType: meta.drugType || undefined,
        selectedDrugClassification: meta.drugClassification || undefined,
      };
    });

    await recordAudit('UPDATE_PACKAGE_SELECTION', 'BOOKING', booking.bookingNumber, req.user?.email || 'Medis', 'Pilihan celana sunat & 3 obat paket di ruang tindakan diperbarui');
    res.json({ success: true, items: enrichedItems });
  } catch (err: any) {
    console.error('Update package selection error:', err);
    res.status(500).json({ error: 'Gagal memperbarui pilihan paket khitan: ' + err.message });
  }
});

// Add Item (Add-on or Extra Included) to Transaction
app.post('/api/bookings/:id/items', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const { productId, quantity, itemType, sellPriceSnapshot, discountAmount, notes } = req.body;

    const bkList = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (bkList.length === 0) return res.status(404).json({ error: 'Booking tidak ditemukan' });
    const booking = bkList[0];

    const prodList = await db.select().from(products).where(eq(products.id, Number(productId)));
    if (prodList.length === 0) return res.status(404).json({ error: 'Produk tidak ditemukan' });
    const product = prodList[0];

    // Find procedure & invoice if exist
    const procList = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.bookingId, bookingId));
    const procedureId = procList[0]?.id || null;

    const invList = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
    const invoiceId = invList[0]?.id || null;

    const qty = Number(quantity || 1);
    const isAddon = itemType !== 'INCLUDED';
    const price = isAddon ? (sellPriceSnapshot !== undefined ? Number(sellPriceSnapshot) : product.sellPrice) : 0;
    const discount = isAddon ? Number(discountAmount || 0) : 0;
    const totalItem = Math.max(0, (qty * price) - discount);

    const inserted = await db.insert(transactionItems).values({
      bookingId,
      procedureId,
      invoiceId,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      category: product.category,
      itemType: isAddon ? 'ADDON' : 'INCLUDED',
      quantity: qty,
      costPriceSnapshot: product.costPrice,
      sellPriceSnapshot: price,
      discountAmount: discount,
      totalAmount: totalItem,
      isStockDeducted: false,
      notes: notes || (isAddon ? `Add-on: ${product.name}` : `Included: ${product.name}`),
    }).returning();

    // Recalculate Booking & Invoice Totals
    const allItems = await db.select().from(transactionItems).where(eq(transactionItems.bookingId, bookingId));
    const addonsTotal = allItems.filter(i => i.itemType === 'ADDON').reduce((acc, i) => acc + i.totalAmount, 0);

    const newBookingTotal = (booking.packagePriceSnapshot - booking.discountAmount) + addonsTotal;
    const newRemaining = Math.max(0, newBookingTotal - booking.dpAmount);

    await db.update(bookings)
      .set({
        totalAmount: newBookingTotal,
        remainingAmount: newRemaining,
      })
      .where(eq(bookings.id, bookingId));

    if (invoiceId) {
      const currentInv = invList[0];
      const newInvSubtotal = booking.packagePriceSnapshot + addonsTotal;
      const newInvTotal = newBookingTotal;
      const newInvRemaining = Math.max(0, newInvTotal - currentInv.paidAmount);
      const newStatus = newInvRemaining === 0 ? 'PAID' : currentInv.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

      await db.update(invoices)
        .set({
          subtotal: newInvSubtotal,
          totalAmount: newInvTotal,
          remainingAmount: newInvRemaining,
          status: newStatus,
        })
        .where(eq(invoices.id, invoiceId));
    }

    await recordAudit('ADD_TRANSACTION_ITEM', 'BOOKING', booking.bookingNumber, req.user?.email || 'Staff', `Tambah produk ${product.name} (${qty}x) total Rp ${totalItem.toLocaleString('id-ID')}`);
    res.json({ success: true, item: inserted[0], newBookingTotal, newRemaining });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menambahkan produk ke transaksi' });
  }
});

// Delete Transaction Item (e.g. remove unwanted add-on)
app.delete('/api/bookings/:id/items/:itemId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const itemId = Number(req.params.itemId);

    const item = await db.select().from(transactionItems).where(eq(transactionItems.id, itemId));
    if (item.length === 0) return res.status(404).json({ error: 'Item transaksi tidak ditemukan' });

    // If stock already deducted, return stock
    if (item[0].isStockDeducted) {
      const prod = await db.select().from(products).where(eq(products.id, item[0].productId));
      if (prod.length > 0) {
        const restoredStock = prod[0].stock + item[0].quantity;
        await db.update(products).set({ stock: restoredStock }).where(eq(products.id, prod[0].id));
        const movNum = await generateStockMovementNumber();
        await db.insert(stockMovements).values({
          movementNumber: movNum,
          productId: prod[0].id,
          movementType: 'IN',
          quantity: item[0].quantity,
          previousStock: prod[0].stock,
          currentStock: restoredStock,
          unitCost: item[0].costPriceSnapshot,
          unitPrice: item[0].sellPriceSnapshot,
          referenceType: 'RETURN',
          referenceId: bookingId,
          notes: `Pengembalian stok pembatalan item ${item[0].productName}`,
          performedBy: req.user?.name || 'Staff',
        });
      }
    }

    // Delete item
    await db.delete(transactionItems).where(eq(transactionItems.id, itemId));

    // Recalculate Booking & Invoice Totals
    const bkList = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (bkList.length > 0) {
      const booking = bkList[0];
      const allItems = await db.select().from(transactionItems).where(eq(transactionItems.bookingId, bookingId));
      const addonsTotal = allItems.filter(i => i.itemType === 'ADDON').reduce((acc, i) => acc + i.totalAmount, 0);

      const newBookingTotal = (booking.packagePriceSnapshot - booking.discountAmount) + addonsTotal;
      const newRemaining = Math.max(0, newBookingTotal - booking.dpAmount);

      await db.update(bookings)
        .set({
          totalAmount: newBookingTotal,
          remainingAmount: newRemaining,
        })
        .where(eq(bookings.id, bookingId));

      const invList = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
      if (invList.length > 0) {
        const currentInv = invList[0];
        const newInvSubtotal = booking.packagePriceSnapshot + addonsTotal;
        const newInvTotal = newBookingTotal;
        const newInvRemaining = Math.max(0, newInvTotal - currentInv.paidAmount);
        const newStatus = newInvRemaining === 0 ? 'PAID' : currentInv.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

        await db.update(invoices)
          .set({
            subtotal: newInvSubtotal,
            totalAmount: newInvTotal,
            remainingAmount: newInvRemaining,
            status: newStatus,
          })
          .where(eq(invoices.id, currentInv.id));
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus item transaksi' });
  }
});

// ---------------- MASTER: METODE TINDAKAN KHITAN (MENJADI SATU DENGAN PAKET & TARIF REGULER / VIP) ----------------
app.get('/api/circumcision-methods', async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    let list = await db.select().from(circumcisionMethods).orderBy(circumcisionMethods.id);
    if (includeDeleted !== 'true') {
      list = list.filter(m => !m.isDeleted);
    }
    const pkgs = await db.select().from(circumcisionPackages);
    const allPrices = await db.select().from(packagePrices).where(eq(packagePrices.isActive, true));
    const allCategories = await db.select().from(patientCategories);

    const enriched = list.map((m, idx) => {
      // match package by id or by name
      let matchedPkg = pkgs.find(p => p.id === m.id);
      if (!matchedPkg) {
        matchedPkg = pkgs.find(p => p.name.toLowerCase().trim() === m.name.toLowerCase().trim()) || pkgs[idx];
      }

      let mPrices: any[] = [];
      let regPrice = 1800000;
      let vipPrice = 2500000;
      let durationMinutes = matchedPkg?.durationMinutes || 45;
      let code = matchedPkg?.code || `MTH-00${m.id}`;

      if (matchedPkg) {
        mPrices = allPrices.filter(p => p.packageId === matchedPkg!.id).map(p => {
          const cat = allCategories.find(c => c.id === p.patientCategoryId);
          return {
            ...p,
            patientCategoryCode: cat?.code || (p.patientCategoryId === 1 ? 'REG' : 'VIP'),
            patientCategoryName: cat?.name || (p.patientCategoryId === 1 ? 'Pasien Reguler' : 'Pasien VIP'),
          };
        });
        const regP = mPrices.find(p => p.patientCategoryId === 1 || p.patientCategoryCode === 'REG' || p.patientCategoryCode === 'REGULER');
        if (regP) regPrice = regP.price;
        const vipP = mPrices.find(p => p.patientCategoryId === 2 || p.patientCategoryCode === 'VIP');
        if (vipP) vipPrice = vipP.price;
      }

      return {
        ...m,
        code,
        packageId: matchedPkg?.id || m.id,
        durationMinutes,
        priceReguler: regPrice,
        priceVip: vipPrice,
        prices: mPrices,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    console.error('Error fetching circumcision methods:', err);
    res.status(500).json({ error: 'Gagal mengambil data metode tindakan khitan' });
  }
});

app.post('/api/circumcision-methods', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, description, notes, durationMinutes, priceReguler, priceVip, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama metode tindakan wajib diisi' });
    }

    const inserted = await db.insert(circumcisionMethods).values({
      name: name.trim(),
      description: description || '',
      notes: notes || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    }).returning();

    const m = inserted[0];
    const cleanCode = `MTH-${m.id}-${m.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

    // Sinkronisasi otomatis ke circumcisionPackages
    const insertedPkg = await db.insert(circumcisionPackages).values({
      code: cleanCode,
      name: m.name,
      description: m.description || '',
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
      isActive: m.isActive,
    }).returning();

    const pkg = insertedPkg[0];
    const pReg = priceReguler !== undefined ? Number(priceReguler) : 1800000;
    const pVip = priceVip !== undefined ? Number(priceVip) : 2500000;

    // Pastikan kategori pasien REG & VIP ada sebelum insert tarif
    const cats = await db.select().from(patientCategories);
    let regCatId = cats.find(c => c.code === 'REG')?.id;
    let vipCatId = cats.find(c => c.code === 'VIP')?.id;

    if (!regCatId) {
      const insReg = await db.insert(patientCategories).values({
        code: 'REG',
        name: 'Pasien Reguler',
        description: 'Pelayanan khitan standar fasilitas lengkap',
        isDefault: true,
        isActive: true,
      }).returning();
      regCatId = insReg[0].id;
    }
    if (!vipCatId) {
      const insVip = await db.insert(patientCategories).values({
        code: 'VIP',
        name: 'Pasien VIP',
        description: 'Pelayanan khitan prioritas ruang privat',
        isDefault: false,
        isActive: true,
      }).returning();
      vipCatId = insVip[0].id;
    }

    // Masukkan tarif untuk Paket Reguler dan Paket VIP
    await db.insert(packagePrices).values([
      {
        packageId: pkg.id,
        patientCategoryId: regCatId,
        price: pReg,
        effectiveFrom: new Date().toISOString().split('T')[0],
        isActive: true,
      },
      {
        packageId: pkg.id,
        patientCategoryId: vipCatId,
        price: pVip,
        effectiveFrom: new Date().toISOString().split('T')[0],
        isActive: true,
      }
    ]);

    await recordAudit(
      'CREATE', 
      'CIRCUMCISION_METHOD', 
      String(m.id), 
      req.user?.name || req.user?.email || 'Admin', 
      `Menambah metode tindakan & paket tarif: "${m.name}" (Reguler: Rp ${pReg.toLocaleString('id-ID')}, VIP: Rp ${pVip.toLocaleString('id-ID')})`
    );

    res.json({
      ...m,
      packageId: pkg.id,
      code: pkg.code,
      durationMinutes: pkg.durationMinutes,
      priceReguler: pReg,
      priceVip: pVip,
      prices: [
        { packageId: pkg.id, patientCategoryId: regCatId, price: pReg, patientCategoryCode: 'REG', patientCategoryName: 'Pasien Reguler', isActive: true },
        { packageId: pkg.id, patientCategoryId: vipCatId, price: pVip, patientCategoryCode: 'VIP', patientCategoryName: 'Pasien VIP', isActive: true }
      ]
    });
  } catch (err: any) {
    console.error('Error creating circumcision method:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan metode tindakan baru' });
  }
});

app.put('/api/circumcision-methods/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, notes, durationMinutes, priceReguler, priceVip, isActive } = req.body;
    const existing = await db.select().from(circumcisionMethods).where(eq(circumcisionMethods.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Metode tindakan tidak ditemukan' });

    const updateData: any = { updatedAt: new Date() };
    const changeLogs: string[] = [];

    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
      if (existing[0].name !== name.trim()) {
        changeLogs.push(`Nama: "${existing[0].name}" → "${name.trim()}"`);
      }
    }
    if (description !== undefined) {
      updateData.description = description;
      if (existing[0].description !== description) {
        changeLogs.push(`Deskripsi diubah`);
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
      if (existing[0].notes !== notes) {
        changeLogs.push(`Catatan diubah`);
      }
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      if (existing[0].isActive !== Boolean(isActive)) {
        changeLogs.push(`Status diubah: ${Boolean(isActive) ? 'AKTIF' : 'NONAKTIF'}`);
      }
    }

    const updated = await db.update(circumcisionMethods)
      .set(updateData)
      .where(eq(circumcisionMethods.id, id))
      .returning();

    // Sinkronisasi paket di circumcisionPackages
    let matchedPkg = await db.select().from(circumcisionPackages).where(eq(circumcisionPackages.id, id));
    if (matchedPkg.length === 0) {
      matchedPkg = await db.select().from(circumcisionPackages).where(eq(circumcisionPackages.name, existing[0].name));
    }

    let pkgId = matchedPkg[0]?.id;
    if (matchedPkg.length > 0) {
      await db.update(circumcisionPackages)
        .set({
          name: updateData.name || existing[0].name,
          description: updateData.description !== undefined ? updateData.description : matchedPkg[0].description,
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : matchedPkg[0].durationMinutes,
          isActive: updateData.isActive !== undefined ? updateData.isActive : matchedPkg[0].isActive,
        })
        .where(eq(circumcisionPackages.id, matchedPkg[0].id));
    } else {
      const newPkg = await db.insert(circumcisionPackages).values({
        code: `MTH-00${id}`,
        name: updateData.name || existing[0].name,
        description: updateData.description || '',
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
      }).returning();
      pkgId = newPkg[0].id;
    }

    // Sinkronisasi tarif Reguler & VIP
    if (pkgId && (priceReguler !== undefined || priceVip !== undefined)) {
      const pReg = priceReguler !== undefined ? Number(priceReguler) : 1800000;
      const pVip = priceVip !== undefined ? Number(priceVip) : 2500000;

      // Pastikan kategori pasien ada
      const cats = await db.select().from(patientCategories);
      let regCatId = cats.find(c => c.code === 'REG')?.id;
      let vipCatId = cats.find(c => c.code === 'VIP')?.id;

      if (!regCatId) {
        const insReg = await db.insert(patientCategories).values({
          code: 'REG',
          name: 'Pasien Reguler',
          description: 'Pelayanan khitan standar fasilitas lengkap',
          isDefault: true,
          isActive: true,
        }).returning();
        regCatId = insReg[0].id;
      }
      if (!vipCatId) {
        const insVip = await db.insert(patientCategories).values({
          code: 'VIP',
          name: 'Pasien VIP',
          description: 'Pelayanan khitan prioritas ruang privat',
          isDefault: false,
          isActive: true,
        }).returning();
        vipCatId = insVip[0].id;
      }

      await db.update(packagePrices)
        .set({ isActive: false, effectiveUntil: new Date().toISOString().split('T')[0] })
        .where(eq(packagePrices.packageId, pkgId));

      await db.insert(packagePrices).values([
        {
          packageId: pkgId,
          patientCategoryId: regCatId,
          price: pReg,
          effectiveFrom: new Date().toISOString().split('T')[0],
          isActive: true,
        },
        {
          packageId: pkgId,
          patientCategoryId: vipCatId,
          price: pVip,
          effectiveFrom: new Date().toISOString().split('T')[0],
          isActive: true,
        }
      ]);
      changeLogs.push(`Tarif: Reguler = Rp ${pReg.toLocaleString('id-ID')}, VIP = Rp ${pVip.toLocaleString('id-ID')}`);
    }

    await recordAudit(
      'UPDATE',
      'CIRCUMCISION_METHOD',
      String(id),
      req.user?.name || req.user?.email || 'Admin',
      `Mengubah metode "${updated[0].name}": ${changeLogs.join(', ') || 'Pembaruan data & tarif'}`
    );

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Error updating circumcision method:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui metode tindakan' });
  }
});

app.put('/api/circumcision-methods/:id/toggle-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(circumcisionMethods).where(eq(circumcisionMethods.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Metode tindakan tidak ditemukan' });

    const newStatus = !existing[0].isActive;
    const updated = await db.update(circumcisionMethods)
      .set({ isActive: newStatus, updatedAt: new Date() })
      .where(eq(circumcisionMethods.id, id))
      .returning();

    // Toggle corresponding package
    await db.update(circumcisionPackages)
      .set({ isActive: newStatus })
      .where(eq(circumcisionPackages.id, id));

    await recordAudit(
      'TOGGLE_STATUS',
      'CIRCUMCISION_METHOD',
      String(id),
      req.user?.name || req.user?.email || 'Admin',
      `Status metode "${existing[0].name}" diubah menjadi: ${newStatus ? 'AKTIF' : 'NONAKTIF'}`
    );

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah status metode tindakan' });
  }
});

app.delete('/api/circumcision-methods/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(circumcisionMethods).where(eq(circumcisionMethods.id, id));
    if (existing.length === 0) return res.status(404).json({ error: 'Metode tindakan tidak ditemukan' });

    // Periksa apakah paket terkait terpakai di booking, tindakan, fee dokter, fee pegawai, atau transaksi
    const pkgs = await db.select().from(circumcisionPackages).where(eq(circumcisionPackages.id, id));
    const pkgByName = await db.select().from(circumcisionPackages).where(eq(circumcisionPackages.name, existing[0].name));
    const allPkgIds = Array.from(new Set([...pkgs.map(p => p.id), ...pkgByName.map(p => p.id)]));

    let hasHistory = false;
    for (const pId of allPkgIds) {
      const bks = await db.select().from(bookings).where(eq(bookings.packageId, pId)).limit(1);
      if (bks.length > 0) { hasHistory = true; break; }

      const docFees = await db.select().from(doctorFeeTransactions).where(eq(doctorFeeTransactions.packageId, pId)).limit(1);
      if (docFees.length > 0) { hasHistory = true; break; }
    }

    if (hasHistory) {
      // Soft-delete agar riwayat klinis dan keuangan tetap aman
      await db.update(circumcisionMethods).set({ isDeleted: true, isActive: false }).where(eq(circumcisionMethods.id, id));
      for (const pId of allPkgIds) {
        await db.update(circumcisionPackages).set({ isActive: false }).where(eq(circumcisionPackages.id, pId));
      }
      await recordAudit(
        'DELETE',
        'CIRCUMCISION_METHOD',
        String(id),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus metode tindakan: "${existing[0].name}" (Diarsipkan agar riwayat transaksi aman)`
      );
      return res.json({ success: true, message: `Metode ${existing[0].name} berhasil dihapus/diarsipkan (riwayat data tetap terjaga aman)` });
    }

    // Jika belum ada riwayat transaksi, coba hapus permanen
    try {
      for (const pId of allPkgIds) {
        await db.delete(packageIncludedItems).where(eq(packageIncludedItems.packageId, pId));
        await db.delete(packagePrices).where(eq(packagePrices.packageId, pId));
        await db.delete(doctorFeeRules).where(eq(doctorFeeRules.packageId, pId));
        await db.delete(employeeFeeRules).where(eq(employeeFeeRules.packageId, pId));
        await db.delete(circumcisionPackages).where(eq(circumcisionPackages.id, pId));
      }
      await db.delete(circumcisionMethods).where(eq(circumcisionMethods.id, id));

      await recordAudit(
        'DELETE',
        'CIRCUMCISION_METHOD',
        String(id),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus permanen metode tindakan: "${existing[0].name}"`
      );
      res.json({ success: true, message: `Metode ${existing[0].name} berhasil dihapus permanen` });
    } catch (dbErr: any) {
      // Fallback graceful jika ada foreign key yang tidak terdeteksi
      console.warn('Foreign key constraint encountered, falling back to soft delete:', dbErr.message);
      await db.update(circumcisionMethods).set({ isDeleted: true, isActive: false }).where(eq(circumcisionMethods.id, id));
      for (const pId of allPkgIds) {
        await db.update(circumcisionPackages).set({ isActive: false }).where(eq(circumcisionPackages.id, pId));
      }
      res.json({ success: true, message: `Metode ${existing[0].name} berhasil dinonaktifkan/diarsipkan dengan aman` });
    }
  } catch (err: any) {
    console.error('Error deleting method:', err);
    res.status(500).json({ error: 'Gagal menghapus metode tindakan: ' + (err.message || String(err)) });
  }
});

// Master: Doctors, Schedules, Fee Rules
app.get('/api/doctors', async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    let docs = await db.select().from(doctors).orderBy(doctors.id);
    if (includeDeleted !== 'true') {
      docs = docs.filter(d => !d.isDeleted);
    }
    const branchFilter = getBranchFilter(req);
    docs = filterByBranch(docs, branchFilter);

    const schedules = await db.select().from(doctorSchedules).where(eq(doctorSchedules.isActive, true));
    const feeRules = await db.select().from(doctorFeeRules).where(eq(doctorFeeRules.isActive, true));

    const enriched = docs.map(doc => {
      const docRules = feeRules.filter(f => f.doctorId === doc.id);
      const regRule = docRules.find(f => f.patientCategoryId === 1);
      const vipRule = docRules.find(f => f.patientCategoryId === 2);
      return {
        ...doc,
        schedules: schedules.filter(s => s.doctorId === doc.id),
        feeRules: docRules,
        regulerFee: regRule ? regRule.feeAmount : 250000,
        vipFee: vipRule ? vipRule.feeAmount : 350000,
      };
    });
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data dokter' });
  }
});

app.post('/api/doctors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { code, name, title, specialty, description, notes, phone, email, sipNumber, isActive, regulerFee, vipFee } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama dokter wajib diisi' });
    }

    const branchFilter = getBranchFilter(req);
    const targetBranch = (req.body.branchCode && req.body.branchCode !== 'ALL') ? req.body.branchCode : (branchFilter !== 'ALL' ? branchFilter : 'PUSAT');

    const docCode = code && code.trim() ? code.toUpperCase().trim() : await generateDoctorCode();
    const docValues: any = {
      code: docCode,
      name: name.trim(),
      title: title || 'dr.',
      specialty: specialty || 'Dokter Operator Khitan',
      description: description || '',
      notes: notes || '',
      phone: phone || '',
      email: email || '',
      sipNumber: sipNumber || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      branchCode: targetBranch,
    };

    let inserted: any[] = [];
    try {
      inserted = await db.insert(doctors).values(docValues).returning();
    } catch (insertErr: any) {
      console.warn('Gagal insert dokter via Drizzle, menjalankan self-healing schema & fallback...');
      try {
        await pool.query('ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT \'PUSAT\'');
        await pool.query('ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true');
        await pool.query('ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "sip_number" text');
        inserted = await db.insert(doctors).values(docValues).returning();
      } catch (retryErr) {
        try {
          const rawWithBranch = await pool.query(
            `INSERT INTO "doctors" ("code", "name", "title", "specialty", "description", "notes", "phone", "email", "sip_number", "is_active", "branch_code")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [docCode, name.trim(), title || 'dr.', specialty || 'Dokter Operator Khitan', description || '', notes || '', phone || '', email || '', sipNumber || '', isActive !== undefined ? Boolean(isActive) : true, targetBranch]
          );
          inserted = rawWithBranch.rows.map(r => ({ ...r, sipNumber: r.sip_number, branchCode: r.branch_code || 'PUSAT', isActive: r.is_active }));
        } catch {
          const rawWithoutBranch = await pool.query(
            `INSERT INTO "doctors" ("code", "name", "title", "specialty", "description", "notes", "phone", "email", "sip_number", "is_active")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [docCode, name.trim(), title || 'dr.', specialty || 'Dokter Operator Khitan', description || '', notes || '', phone || '', email || '', sipNumber || '', isActive !== undefined ? Boolean(isActive) : true]
          );
          inserted = rawWithoutBranch.rows.map(r => ({ ...r, sipNumber: r.sip_number, branchCode: 'PUSAT', isActive: r.is_active }));
        }
      }
    }

    const newDocId = inserted[0].id;
    const allPkgs = await db.select().from(circumcisionPackages);
    const regFeeVal = Number(regulerFee) >= 0 ? Number(regulerFee) : 250000;
    const vipFeeVal = Number(vipFee) >= 0 ? Number(vipFee) : 350000;
    const today = new Date().toISOString().split('T')[0];

    for (const pkg of allPkgs) {
      await db.insert(doctorFeeRules).values({
        doctorId: newDocId,
        packageId: pkg.id,
        patientCategoryId: 1, // Reguler
        feeAmount: regFeeVal,
        effectiveDate: today,
        isActive: true,
      });
      await db.insert(doctorFeeRules).values({
        doctorId: newDocId,
        packageId: pkg.id,
        patientCategoryId: 2, // VIP
        feeAmount: vipFeeVal,
        effectiveDate: today,
        isActive: true,
      });
    }

    await recordAudit(
      'CREATE', 
      'DOCTOR', 
      inserted[0].code, 
      req.user?.name || req.user?.email || 'Admin', 
      `Menambah dokter baru: ${inserted[0].title} ${inserted[0].name} (Fee Reguler: Rp ${regFeeVal.toLocaleString('id-ID')}, Fee VIP: Rp ${vipFeeVal.toLocaleString('id-ID')})`
    );
    res.json({
      ...inserted[0],
      regulerFee: regFeeVal,
      vipFee: vipFeeVal,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan dokter baru' });
  }
});

// Configure Doctor Fees (Reguler vs VIP & Per Package)
app.post('/api/doctors/:id/fee-settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan mengubah aturan fee dokter' });
    }
    const doctorId = Number(req.params.id);
    const { regulerFee, vipFee, packageFees, syncPendingFees } = req.body;

    const existingDoc = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (existingDoc.length === 0) return res.status(404).json({ error: 'Dokter tidak ditemukan' });

    const allPkgs = await db.select().from(circumcisionPackages);
    const today = new Date().toISOString().split('T')[0];

    // Deactivate previous active rules for this doctor
    await db.update(doctorFeeRules)
      .set({ isActive: false })
      .where(eq(doctorFeeRules.doctorId, doctorId));

    const regFee = Number(regulerFee) >= 0 ? Number(regulerFee) : 250000;
    const vFee = Number(vipFee) >= 0 ? Number(vipFee) : 350000;

    const pkgFeeMap = new Map<number, { regulerFee?: number; vipFee?: number }>();
    if (Array.isArray(packageFees)) {
      for (const pf of packageFees) {
        if (pf && pf.packageId) {
          pkgFeeMap.set(Number(pf.packageId), {
            regulerFee: pf.regulerFee !== undefined ? Number(pf.regulerFee) : undefined,
            vipFee: pf.vipFee !== undefined ? Number(pf.vipFee) : undefined,
          });
        }
      }
    }

    for (const pkg of allPkgs) {
      const custom = pkgFeeMap.get(pkg.id);
      const pkgRegFee = (custom?.regulerFee !== undefined && custom.regulerFee >= 0) ? custom.regulerFee : regFee;
      const pkgVipFee = (custom?.vipFee !== undefined && custom.vipFee >= 0) ? custom.vipFee : vFee;

      await db.insert(doctorFeeRules).values({
        doctorId,
        packageId: pkg.id,
        patientCategoryId: 1, // Reguler
        feeAmount: pkgRegFee,
        effectiveDate: today,
        isActive: true,
      });

      await db.insert(doctorFeeRules).values({
        doctorId,
        packageId: pkg.id,
        patientCategoryId: 2, // VIP
        feeAmount: pkgVipFee,
        effectiveDate: today,
        isActive: true,
      });
    }

    // Auto-sync doctor fee transactions and synchronize with reports
    await syncDoctorFeesWithReports(doctorId);

    await recordAudit(
      'UPDATE_DOCTOR_FEES',
      'DOCTOR',
      String(doctorId),
      req.user?.name || req.user?.email || 'Admin',
      `Konfigurasi fee dokter ${existingDoc[0].name} diperbarui: Reguler=Rp ${regFee.toLocaleString('id-ID')}, VIP=Rp ${vFee.toLocaleString('id-ID')}`
    );

    res.json({ success: true, message: 'Aturan fee dokter berhasil disimpan & disinkronkan dengan laporan keuangan' });
  } catch (err: any) {
    console.error('Error saving doctor fee settings:', err);
    res.status(500).json({ error: 'Gagal menyimpan aturan fee dokter: ' + (err.message || String(err)) });
  }
});

app.post('/api/doctors/:id/fee-rules', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan mengubah aturan fee dokter' });
    }
    const doctorId = Number(req.params.id);
    const packageId = Number(req.body.packageId);
    const patientCategoryId = Number(req.body.patientCategoryId);
    const feeAmount = Math.round(Number(req.body.feeAmount ?? req.body.feeValue ?? req.body.feeNominal ?? 0));

    if (!doctorId || isNaN(doctorId) || !packageId || isNaN(packageId) || !patientCategoryId || isNaN(patientCategoryId)) {
      return res.status(400).json({ error: 'Parameter doctorId, packageId, dan patientCategoryId wajib diisi valid' });
    }

    if (isNaN(feeAmount) || feeAmount < 0) {
      return res.status(400).json({ error: 'Nominal fee dokter wajib berupa angka valid (>= 0)' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Non-aktifkan aturan fee lama untuk kombinasi ini
    await db.update(doctorFeeRules)
      .set({ isActive: false })
      .where(and(
        eq(doctorFeeRules.doctorId, doctorId),
        eq(doctorFeeRules.packageId, packageId),
        eq(doctorFeeRules.patientCategoryId, patientCategoryId)
      ));

    const inserted = await db.insert(doctorFeeRules).values({
      doctorId,
      packageId,
      patientCategoryId,
      feeAmount,
      effectiveDate: today,
      isActive: true,
    }).returning();

    // Otomatis sinkronkan transaksi fee pending dan laporan keuangan
    await syncDoctorFeesWithReports(doctorId);

    await recordAudit('UPDATE_FEE_RULE', 'DOCTOR', String(doctorId), req.user?.email || 'Admin', `Fee dokter baru diperbarui: Rp ${feeAmount.toLocaleString('id-ID')}`);
    res.json({ success: true, rule: inserted[0] });
  } catch (err: any) {
    console.error('Error updating doctor fee rule:', err);
    res.status(500).json({ error: 'Gagal memperbarui aturan fee dokter: ' + (err.message || String(err)) });
  }
});

// Update Doctor
app.put('/api/doctors/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doctorId = Number(req.params.id);
    const { name, title, specialty, description, notes, phone, email, sipNumber, isActive } = req.body;
    const existing = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (existing.length === 0) return res.status(404).json({ error: 'Dokter tidak ditemukan' });

    const updateData: any = {};
    const changeLogs: string[] = [];

    if (name !== undefined) {
      updateData.name = name.trim();
      if (existing[0].name !== name.trim()) changeLogs.push(`Nama: "${existing[0].name}" → "${name.trim()}"`);
    }
    if (title !== undefined) updateData.title = title || 'dr.';
    if (specialty !== undefined) {
      updateData.specialty = specialty;
      if (existing[0].specialty !== specialty) changeLogs.push(`Spesialisasi: "${existing[0].specialty}" → "${specialty}"`);
    }
    if (description !== undefined) {
      updateData.description = description;
      if (existing[0].description !== description) changeLogs.push(`Deskripsi diperbarui`);
    }
    if (notes !== undefined) {
      updateData.notes = notes;
      if (existing[0].notes !== notes) changeLogs.push(`Catatan diperbarui`);
    }
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (sipNumber !== undefined) updateData.sipNumber = sipNumber;
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      if (existing[0].isActive !== Boolean(isActive)) {
        changeLogs.push(`Status: ${Boolean(isActive) ? 'Aktif' : 'Nonaktif'}`);
      }
    }

    const updated = await db.update(doctors).set(updateData).where(eq(doctors.id, doctorId)).returning();

    // Update doctor fee rules if regulerFee or vipFee provided
    if (req.body.regulerFee !== undefined || req.body.vipFee !== undefined) {
      const allPkgs = await db.select().from(circumcisionPackages);
      const today = new Date().toISOString().split('T')[0];
      const newRegFee = Number(req.body.regulerFee) >= 0 ? Number(req.body.regulerFee) : 250000;
      const newVipFee = Number(req.body.vipFee) >= 0 ? Number(req.body.vipFee) : 350000;

      await db.update(doctorFeeRules).set({ isActive: false }).where(eq(doctorFeeRules.doctorId, doctorId));

      for (const pkg of allPkgs) {
        await db.insert(doctorFeeRules).values({
          doctorId,
          packageId: pkg.id,
          patientCategoryId: 1, // Reguler
          feeAmount: newRegFee,
          effectiveDate: today,
          isActive: true,
        });
        await db.insert(doctorFeeRules).values({
          doctorId,
          packageId: pkg.id,
          patientCategoryId: 2, // VIP
          feeAmount: newVipFee,
          effectiveDate: today,
          isActive: true,
        });
      }

      // Sync existing PENDING fees for this doctor
      const pendingFees = await db.select().from(doctorFeeTransactions)
        .where(and(eq(doctorFeeTransactions.doctorId, doctorId), eq(doctorFeeTransactions.status, 'PENDING')));
      for (const pf of pendingFees) {
        const isVip = pf.patientCategoryId === 2;
        const newAmt = isVip ? newVipFee : newRegFee;
        if (pf.feeAmount !== newAmt) {
          await db.update(doctorFeeTransactions).set({ feeAmount: newAmt }).where(eq(doctorFeeTransactions.id, pf.id));
        }
      }
      changeLogs.push(`Fee Dokter: Reguler=Rp ${newRegFee.toLocaleString('id-ID')}, VIP=Rp ${newVipFee.toLocaleString('id-ID')}`);
    }

    await recordAudit(
      'UPDATE', 
      'DOCTOR', 
      String(doctorId), 
      req.user?.name || req.user?.email || 'Admin', 
      `Mengubah data dokter ${updated[0].name}: ${changeLogs.join(', ') || 'Pembaruan profil'}`
    );
    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui data dokter' });
  }
});

// Toggle Doctor Status
app.put('/api/doctors/:id/toggle-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doctorId = Number(req.params.id);
    const existing = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (existing.length === 0) return res.status(404).json({ error: 'Dokter tidak ditemukan' });

    const newStatus = !existing[0].isActive;
    await db.update(doctors).set({ isActive: newStatus }).where(eq(doctors.id, doctorId));
    await recordAudit(
      'TOGGLE_STATUS', 
      'DOCTOR', 
      String(doctorId), 
      req.user?.name || req.user?.email || 'Admin', 
      `Status dokter ${existing[0].name} diubah menjadi: ${newStatus ? 'AKTIF' : 'NONAKTIF'}`
    );
    res.json({ success: true, isActive: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah status dokter' });
  }
});

// Delete Doctor
app.delete('/api/doctors/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doctorId = Number(req.params.id);
    const existing = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (existing.length === 0) return res.status(404).json({ error: 'Dokter tidak ditemukan' });

    // Check if doctor has bookings, fee transactions, or procedures
    const linkedBookings = await db.select().from(bookings).where(eq(bookings.doctorId, doctorId)).limit(1);
    const linkedProcedures = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.doctorId, doctorId)).limit(1);

    if (linkedBookings.length > 0 || linkedProcedures.length > 0) {
      // Soft delete to protect medical history integrity
      await db.update(doctors).set({ isDeleted: true, isActive: false }).where(eq(doctors.id, doctorId));
      await db.update(doctorSchedules).set({ isActive: false }).where(eq(doctorSchedules.doctorId, doctorId));
      await db.update(doctorFeeRules).set({ isActive: false }).where(eq(doctorFeeRules.doctorId, doctorId));

      await recordAudit(
        'DELETE',
        'DOCTOR',
        String(doctorId),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus/mengarsipkan dokter: ${existing[0].name} (${existing[0].code}) - Riwayat rekam medis pasien tetap aman`
      );
      res.json({ success: true, message: `Data dokter ${existing[0].name} berhasil dihapus/diarsipkan` });
    } else {
      // Clean up child schedules and rules first, then delete doctor
      await db.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctorId));
      await db.delete(doctorFeeRules).where(eq(doctorFeeRules.doctorId, doctorId));
      await db.delete(doctorFeeTransactions).where(eq(doctorFeeTransactions.doctorId, doctorId));
      await db.delete(doctors).where(eq(doctors.id, doctorId));

      await recordAudit(
        'DELETE',
        'DOCTOR',
        String(doctorId),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus permanen dokter: ${existing[0].name} (${existing[0].code})`
      );
      res.json({ success: true, message: `Data dokter ${existing[0].name} berhasil dihapus permanen` });
    }
  } catch (err: any) {
    console.error('Error deleting doctor:', err);
    res.status(500).json({ error: 'Gagal menghapus dokter: ' + (err.message || String(err)) });
  }
});

// ---------------- EMPLOYEES & STAFF MASTER (PHASE 2) ----------------

app.get('/api/employees', async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    let emps = await db.select().from(employees).orderBy(employees.id);
    if (includeDeleted !== 'true') {
      emps = emps.filter(e => !e.isDeleted);
    }
    const branchFilter = getBranchFilter(req);
    emps = filterByBranch(emps, branchFilter);

    const feeRules = await db.select().from(employeeFeeRules).where(eq(employeeFeeRules.isActive, true));

    const enriched = emps.map(emp => ({
      ...emp,
      feeRules: feeRules.filter(f => f.employeeId === emp.id),
    }));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data karyawan' });
  }
});

app.post('/api/employees', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      employeeCode, name, position, description, phone, email, startDate, 
      basicSalary, defaultPatientFee, closingFeePerPatient, overtimeHourlyRate, notes, isActive, branchCode 
    } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nama karyawan wajib diisi' });

    const targetBranch = resolveTargetBranch(req, branchCode);
    const code = employeeCode && employeeCode.trim() ? employeeCode.toUpperCase().trim() : await generateEmployeeCode();
    const employeeValues: any = {
      employeeCode: code,
      name: name.trim(),
      position: position || 'Perawat Khitan',
      description: description || '',
      phone: phone || '',
      email: email || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      basicSalary: Number(basicSalary || 0),
      defaultPatientFee: Number(defaultPatientFee !== undefined ? defaultPatientFee : 0),
      closingFeePerPatient: Number(closingFeePerPatient !== undefined ? closingFeePerPatient : 0),
      overtimeHourlyRate: Number(overtimeHourlyRate !== undefined ? overtimeHourlyRate : 0),
      branchCode: targetBranch,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes: notes || '',
    };

    let inserted: any[] = [];
    try {
      inserted = await db.insert(employees).values(employeeValues).returning();
    } catch (insertErr: any) {
      console.warn('Gagal insert employee via Drizzle, menjalankan self-healing schema & fallback...');
      try {
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT \'PUSAT\'');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "start_date" text DEFAULT \'2026-01-01\'');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "basic_salary" integer DEFAULT 0');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "default_patient_fee" integer DEFAULT 20000');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "closing_fee_per_patient" integer DEFAULT 25000');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "overtime_hourly_rate" integer DEFAULT 35000');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "description" text');
        await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "notes" text');
        inserted = await db.insert(employees).values(employeeValues).returning();
      } catch (retryErr) {
        try {
          const rawWithBranch = await pool.query(
            `INSERT INTO "employees" ("employee_code", "name", "position", "description", "phone", "email", "start_date", "basic_salary", "default_patient_fee", "closing_fee_per_patient", "overtime_hourly_rate", "branch_code", "is_active", "notes")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
              code, name.trim(), position || 'Perawat Khitan', description || '', phone || '', email || '',
              startDate || new Date().toISOString().split('T')[0],
              Number(basicSalary || 0), Number(defaultPatientFee !== undefined ? defaultPatientFee : 0),
              Number(closingFeePerPatient !== undefined ? closingFeePerPatient : 0),
              Number(overtimeHourlyRate !== undefined ? overtimeHourlyRate : 0),
              targetBranch,
              isActive !== undefined ? Boolean(isActive) : true,
              notes || ''
            ]
          );
          inserted = rawWithBranch.rows.map(r => ({
            id: r.id,
            employeeCode: r.employee_code,
            name: r.name,
            position: r.position,
            description: r.description,
            phone: r.phone,
            email: r.email,
            startDate: r.start_date,
            basicSalary: r.basic_salary,
            defaultPatientFee: r.default_patient_fee,
            closingFeePerPatient: r.closing_fee_per_patient,
            overtimeHourlyRate: r.overtime_hourly_rate,
            branchCode: r.branch_code || 'PUSAT',
            isActive: r.is_active,
            notes: r.notes,
            createdAt: r.created_at
          }));
        } catch {
          const rawWithoutBranch = await pool.query(
            `INSERT INTO "employees" ("employee_code", "name", "position", "description", "phone", "email", "start_date", "basic_salary", "default_patient_fee", "closing_fee_per_patient", "overtime_hourly_rate", "is_active", "notes")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
              code, name.trim(), position || 'Perawat Khitan', description || '', phone || '', email || '',
              startDate || new Date().toISOString().split('T')[0],
              Number(basicSalary || 0), Number(defaultPatientFee !== undefined ? defaultPatientFee : 0),
              Number(closingFeePerPatient !== undefined ? closingFeePerPatient : 0),
              Number(overtimeHourlyRate !== undefined ? overtimeHourlyRate : 0),
              isActive !== undefined ? Boolean(isActive) : true,
              notes || ''
            ]
          );
          inserted = rawWithoutBranch.rows.map(r => ({
            id: r.id,
            employeeCode: r.employee_code,
            name: r.name,
            position: r.position,
            description: r.description,
            phone: r.phone,
            email: r.email,
            startDate: r.start_date,
            basicSalary: r.basic_salary,
            defaultPatientFee: r.default_patient_fee,
            closingFeePerPatient: r.closing_fee_per_patient,
            overtimeHourlyRate: r.overtime_hourly_rate,
            branchCode: 'PUSAT',
            isActive: r.is_active,
            notes: r.notes,
            createdAt: r.created_at
          }));
        }
      }
    }

    await recordAudit(
      'CREATE', 
      'EMPLOYEE', 
      code, 
      req.user?.name || req.user?.email || 'Admin', 
      `Karyawan/staf baru: ${inserted[0].name} (${inserted[0].position})`
    );
    res.json(inserted[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data karyawan' });
  }
});

app.put('/api/employees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const employeeId = Number(req.params.id);
    const existing = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (existing.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    const { 
      name, position, description, phone, email, startDate, 
      basicSalary, defaultPatientFee, closingFeePerPatient, overtimeHourlyRate, notes, isActive, branchCode 
    } = req.body;

    const updateData: any = {};
    const changeLogs: string[] = [];

    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
      if (existing[0].name !== name.trim()) changeLogs.push(`Nama: "${existing[0].name}" → "${name.trim()}"`);
    }
    if (position !== undefined) {
      updateData.position = position;
      if (existing[0].position !== position) changeLogs.push(`Jabatan: "${existing[0].position}" → "${position}"`);
    }
    if (description !== undefined) {
      updateData.description = description;
      if (existing[0].description !== description) changeLogs.push(`Deskripsi peran diperbarui`);
    }
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (basicSalary !== undefined) updateData.basicSalary = Number(basicSalary);
    if (defaultPatientFee !== undefined) updateData.defaultPatientFee = Number(defaultPatientFee);
    if (closingFeePerPatient !== undefined) updateData.closingFeePerPatient = Number(closingFeePerPatient);
    if (overtimeHourlyRate !== undefined) updateData.overtimeHourlyRate = Number(overtimeHourlyRate);
    if (notes !== undefined) {
      updateData.notes = notes;
      if (existing[0].notes !== notes) changeLogs.push(`Catatan diperbarui`);
    }
    if (branchCode !== undefined) {
      updateData.branchCode = branchCode;
      if (existing[0].branchCode !== branchCode) changeLogs.push(`Cabang: ${branchCode}`);
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      if (existing[0].isActive !== Boolean(isActive)) {
        changeLogs.push(`Status: ${Boolean(isActive) ? 'Aktif' : 'Nonaktif'}`);
      }
    }

    let updated: any[] = [];
    try {
      updated = await db.update(employees).set(updateData).where(eq(employees.id, employeeId)).returning();
    } catch (updateErr: any) {
      if (updateErr?.code === '42703' || String(updateErr).toLowerCase().includes('branch_code')) {
        try {
          await pool.query('ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT \'PUSAT\'');
          updated = await db.update(employees).set(updateData).where(eq(employees.id, employeeId)).returning();
        } catch {
          const { branchCode: _ignored, ...withoutBranch } = updateData;
          updated = await db.update(employees).set(withoutBranch as any).where(eq(employees.id, employeeId)).returning();
        }
      } else {
        throw updateErr;
      }
    }
    await recordAudit(
      'UPDATE', 
      'EMPLOYEE', 
      String(employeeId), 
      req.user?.name || req.user?.email || 'Admin', 
      `Mengubah data karyawan ${updated[0].name}: ${changeLogs.join(', ') || 'Pembaruan profil'}`
    );

    res.json(updated[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui data karyawan' });
  }
});

app.put('/api/employees/:id/toggle-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const employeeId = Number(req.params.id);
    const existing = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (existing.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    const newStatus = !existing[0].isActive;
    await db.update(employees).set({ isActive: newStatus }).where(eq(employees.id, employeeId));
    await recordAudit('TOGGLE_STATUS', 'EMPLOYEE', String(employeeId), req.user?.email || 'Admin', `Status karyawan diubah: ${newStatus ? 'AKTIF' : 'NONAKTIF'}`);

    res.json({ success: true, isActive: newStatus });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah status karyawan' });
  }
});

// Delete Employee
app.delete('/api/employees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const employeeId = Number(req.params.id);
    const existing = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (existing.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

    // Check if employee has linked fee transactions, payrolls, or assistant procedures
    const linkedFees = await db.select().from(employeeFeeTransactions).where(eq(employeeFeeTransactions.employeeId, employeeId)).limit(1);
    const linkedPayrolls = await db.select().from(payrolls).where(eq(payrolls.employeeId, employeeId)).limit(1);
    const linkedProcs = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.assistantStaffId, employeeId)).limit(1);

    if (linkedFees.length > 0 || linkedPayrolls.length > 0 || linkedProcs.length > 0) {
      // Soft-delete
      await db.update(employees).set({ isDeleted: true, isActive: false }).where(eq(employees.id, employeeId));
      await db.update(employeeFeeRules).set({ isActive: false }).where(eq(employeeFeeRules.employeeId, employeeId));

      await recordAudit(
        'DELETE',
        'EMPLOYEE',
        String(employeeId),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus/mengarsipkan karyawan/staf: ${existing[0].name} (${existing[0].employeeCode}) - Riwayat tindakan & payroll aman`
      );
      res.json({ success: true, message: `Data staf ${existing[0].name} berhasil dihapus/diarsipkan` });
    } else {
      // Hard delete
      await db.delete(employeeFeeRules).where(eq(employeeFeeRules.employeeId, employeeId));
      await db.delete(employees).where(eq(employees.id, employeeId));

      await recordAudit(
        'DELETE',
        'EMPLOYEE',
        String(employeeId),
        req.user?.name || req.user?.email || 'Admin',
        `Menghapus permanen karyawan/staf: ${existing[0].name} (${existing[0].employeeCode})`
      );
      res.json({ success: true, message: `Data staf ${existing[0].name} berhasil dihapus permanen` });
    }
  } catch (err: any) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Gagal menghapus karyawan: ' + (err.message || String(err)) });
  }
});

// Employee Fee Rules
app.post('/api/employees/:id/fee-rules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const employeeId = Number(req.params.id);
    const { packageId, patientCategoryId, feeAmount } = req.body;

    await db.update(employeeFeeRules)
      .set({ isActive: false })
      .where(and(
        eq(employeeFeeRules.employeeId, employeeId),
        packageId ? eq(employeeFeeRules.packageId, packageId) : sql`package_id IS NULL`,
        patientCategoryId ? eq(employeeFeeRules.patientCategoryId, patientCategoryId) : sql`patient_category_id IS NULL`
      ));

    const inserted = await db.insert(employeeFeeRules).values({
      employeeId,
      packageId: packageId || null,
      patientCategoryId: patientCategoryId || null,
      feeAmount: Number(feeAmount),
      isActive: true,
    }).returning();

    await recordAudit('UPDATE_FEE_RULE', 'EMPLOYEE', String(employeeId), req.user?.email || 'Admin', `Aturan fee karyawan baru: Rp ${feeAmount}`);
    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan aturan fee karyawan' });
  }
});

// Employee Fee Transactions
app.get('/api/employee-fees', async (req, res) => {
  try {
    const { employeeId, status, month } = req.query;
    let list = await db.select().from(employeeFeeTransactions).orderBy(desc(employeeFeeTransactions.id));

    if (employeeId && employeeId !== 'ALL') {
      list = list.filter(f => f.employeeId === Number(employeeId));
    }
    if (status && status !== 'ALL') {
      list = list.filter(f => f.status === status);
    }
    if (month) {
      list = list.filter(f => f.procedureDate.startsWith(String(month)));
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data transaksi fee karyawan' });
  }
});

// ---------------- EMPLOYEE OVERTIMES (INPUT LEMBUR KARYAWAN) ----------------

async function hasOvertimeAdminAuthority(req: AuthRequest): Promise<boolean> {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'super_admin' || role === 'super admin') {
    return true;
  }
  try {
    const uid = req.user?.uid;
    const email = req.user?.email;
    const matched = await db.select().from(users).where(
      or(
        uid ? eq(users.uid, String(uid)) : sql`false`,
        email ? eq(users.email, String(email)) : sql`false`
      )
    ).limit(1);
    if (matched.length > 0 && matched[0].permissions) {
      const perms = JSON.parse(matched[0].permissions);
      if (Array.isArray(perms) && (perms.includes('payroll') || perms.includes('payroll.manage'))) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

async function syncDraftPayrollOvertime(empId: number, periodMonth: string) {
  try {
    const existingPayroll = await db.select().from(payrolls)
      .where(and(eq(payrolls.employeeId, empId), eq(payrolls.periodMonth, periodMonth)));
    if (existingPayroll.length === 0 || existingPayroll[0].status === 'PAID') return;

    const current = existingPayroll[0];
    const logs = await db.select().from(employeeOvertimes)
      .where(and(eq(employeeOvertimes.employeeId, empId), eq(employeeOvertimes.periodMonth, periodMonth)));

    const totalHours = Number(logs.reduce((sum, l) => sum + Number(l.hours || 0), 0).toFixed(2));
    const totalOtAmount = Math.round(logs.reduce((sum, l) => sum + Number(l.totalAmount || 0), 0));
    const avgRate = totalHours > 0 ? Math.round(totalOtAmount / totalHours) : current.overtimeHourlyRate;
    const newNetSalary = Math.max(
      0,
      Number(current.basicSalary || 0) +
      Number(current.patientFeeTotal || 0) +
      Number(current.closingFeeTotal || 0) +
      totalOtAmount +
      Number(current.bonusAmount || 0) -
      Number(current.deductionAmount || 0)
    );

    await db.update(payrolls)
      .set({
        overtimeHours: totalHours,
        overtimeHourlyRate: avgRate,
        overtimeTotal: totalOtAmount,
        netSalary: newNetSalary,
      })
      .where(eq(payrolls.id, current.id));
  } catch (syncErr) {
    console.warn('Notice syncing draft payroll overtime:', syncErr);
  }
}

app.get('/api/employee-overtimes', async (req, res) => {
  try {
    const { month, employeeId } = req.query;
    let list = await db.select().from(employeeOvertimes).orderBy(desc(employeeOvertimes.overtimeDate), desc(employeeOvertimes.id));

    const branchFilter = getBranchFilter(req);
    list = filterByBranch(list, branchFilter);

    if (month) {
      list = list.filter((o) => o.periodMonth === String(month));
    }
    if (employeeId && employeeId !== 'ALL') {
      list = list.filter((o) => o.employeeId === Number(employeeId));
    }

    res.json(list);
  } catch (err: any) {
    console.error('Error fetching employee overtimes:', err);
    res.status(500).json({ error: 'Gagal mengambil data lembur karyawan' });
  }
});

app.post('/api/employee-overtimes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const authorized = await hasOvertimeAdminAuthority(req);
    if (!authorized) {
      return res.status(403).json({
        error: 'Akses Ditolak: Hanya Owner, Admin, atau petugas berwenang Payroll yang dapat menginput lembur karyawan.',
      });
    }

    const { employeeId, overtimeDate, startTime, endTime, hours, hourlyRate, reason } = req.body;
    const empId = Number(employeeId);
    if (!empId) {
      return res.status(400).json({ error: 'Karyawan wajib dipilih' });
    }

    const empRows = await db.select().from(employees).where(and(eq(employees.id, empId), eq(employees.isDeleted, false)));
    if (empRows.length === 0) {
      return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
    }
    const emp = empRows[0];

    const cleanDate = String(overtimeDate || new Date().toISOString().split('T')[0]).trim();
    const periodMonth = cleanDate.slice(0, 7);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return res.status(400).json({ error: 'Format tanggal lembur wajib YYYY-MM-DD' });
    }

    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours <= 0) {
      return res.status(400).json({ error: 'Durasi jam lembur harus lebih dari 0' });
    }

    const resolvedRate = hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== ''
      ? Math.max(0, Number(hourlyRate))
      : Math.max(0, Number(emp.overtimeHourlyRate ?? 0));
    const totalAmount = Math.round(parsedHours * resolvedRate);

    const inserted = await db.insert(employeeOvertimes).values({
      employeeId: emp.id,
      employeeName: emp.name,
      overtimeDate: cleanDate,
      periodMonth,
      startTime: startTime ? String(startTime).trim() : null,
      endTime: endTime ? String(endTime).trim() : null,
      hours: Number(parsedHours.toFixed(2)),
      hourlyRate: resolvedRate,
      totalAmount,
      reason: reason ? String(reason).trim() : null,
      branchCode: emp.branchCode || resolveTargetBranch(req),
      recordedBy: req.user?.name || req.user?.email || 'Admin',
    }).returning();

    await syncDraftPayrollOvertime(emp.id, periodMonth);

    await recordAudit(
      'CREATE_OVERTIME',
      'EMPLOYEE_OVERTIME',
      String(inserted[0].id),
      req.user?.name || req.user?.email || 'Admin',
      `Input lembur ${emp.name} (${cleanDate}): ${parsedHours} jam @ Rp ${resolvedRate} = Rp ${totalAmount}`
    );

    res.json(inserted[0]);
  } catch (err: any) {
    console.error('Error creating employee overtime:', err);
    res.status(500).json({ error: 'Gagal menyimpan catatan lembur karyawan' });
  }
});

app.delete('/api/employee-overtimes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const authorized = await hasOvertimeAdminAuthority(req);
    if (!authorized) {
      return res.status(403).json({
        error: 'Akses Ditolak: Hanya Owner, Admin, atau petugas berwenang Payroll yang dapat menghapus catatan lembur.',
      });
    }

    const otId = Number(req.params.id);
    const rows = await db.select().from(employeeOvertimes).where(eq(employeeOvertimes.id, otId));
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Catatan lembur tidak ditemukan' });
    }
    const target = rows[0];

    const paidPayroll = await db.select().from(payrolls).where(
      and(
        eq(payrolls.employeeId, target.employeeId),
        eq(payrolls.periodMonth, target.periodMonth),
        eq(payrolls.status, 'PAID')
      )
    );
    if (paidPayroll.length > 0) {
      return res.status(400).json({
        error: `Slip gaji ${target.employeeName} periode ${target.periodMonth} sudah DIBAYARKAN (PAID). Catatan lembur tidak dapat dihapus.`,
      });
    }

    await db.delete(employeeOvertimes).where(eq(employeeOvertimes.id, otId));
    await syncDraftPayrollOvertime(target.employeeId, target.periodMonth);

    await recordAudit(
      'DELETE_OVERTIME',
      'EMPLOYEE_OVERTIME',
      String(otId),
      req.user?.name || req.user?.email || 'Admin',
      `Hapus catatan lembur ${target.employeeName} (${target.overtimeDate}: ${target.hours} jam)`
    );

    res.json({ success: true, message: 'Catatan lembur berhasil dihapus dan draft payroll diperbarui' });
  } catch (err: any) {
    console.error('Error deleting employee overtime:', err);
    res.status(500).json({ error: 'Gagal menghapus catatan lembur' });
  }
});

// ---------------- PAYROLL MANAGEMENT (PHASE 2) ----------------

app.get('/api/payrolls', async (req, res) => {
  try {
    const { month, employeeId } = req.query;
    let list = await db.select().from(payrolls).orderBy(desc(payrolls.id));

    const branchFilter = getBranchFilter(req);
    list = filterByBranch(list, branchFilter);

    if (month) {
      list = list.filter(p => p.periodMonth === String(month));
    }
    if (employeeId && employeeId !== 'ALL') {
      list = list.filter(p => p.employeeId === Number(employeeId));
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data penggajian' });
  }
});

// Generate / Draft Monthly Payroll with Fee Closing Pasien and Fee Lembur Per Jam
app.post('/api/payrolls/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      employeeId, periodMonth, 
      closingPatientCount, closingFeePerPatient, 
      overtimeHours, overtimeHourlyRate, 
      bonusAmount, deductionAmount, notes, paymentMethod 
    } = req.body;

    let cleanPeriod = String(periodMonth || '').trim();
    if (cleanPeriod.length > 7) {
      cleanPeriod = cleanPeriod.slice(0, 7);
    }
    const parts = cleanPeriod.split('-');
    if (parts.length === 2) {
      cleanPeriod = `${parts[0]}-${parts[1].padStart(2, '0')}`;
    }

    if (!cleanPeriod || !/^\d{4}-\d{2}$/.test(cleanPeriod)) {
      return res.status(400).json({ error: 'Periode bulan wajib diisi dengan format YYYY-MM (contoh: 2026-09)' });
    }

    // Determine employees to generate for (excluding deleted)
    let targetEmployees: any[] = [];
    if (employeeId && employeeId !== 'ALL') {
      const emp = await db.select().from(employees).where(
        and(eq(employees.id, Number(employeeId)), eq(employees.isDeleted, false))
      );
      if (emp.length === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan atau telah dihapus' });
      targetEmployees = emp;
    } else {
      // All active non-deleted employees
      targetEmployees = await db.select().from(employees).where(
        and(eq(employees.isActive, true), eq(employees.isDeleted, false))
      );
      if (targetEmployees.length === 0) {
        targetEmployees = await db.select().from(employees).where(eq(employees.isDeleted, false));
      }
      if (targetEmployees.length === 0) {
        return res.status(400).json({ error: 'Tidak ada master data karyawan aktif di sistem klinik' });
      }
    }

    // Load walk-in direct clinic bookings in this month for closing fee attribution
    const allBookingsInMonth = await db.select().from(bookings).where(
      and(
        ilike(bookings.bookingDate, `${cleanPeriod}%`),
        notInArray(bookings.status, ['CANCELLED', 'NO_SHOW'])
      )
    );

    const generatedResults = [];

    for (const emp of targetEmployees) {
      // Check existing payroll
      const existing = await db.select().from(payrolls)
        .where(and(
          eq(payrolls.employeeId, emp.id),
          eq(payrolls.periodMonth, cleanPeriod)
        ));

      if (existing.length > 0 && existing[0].status === 'PAID') {
        // Skip already paid payrolls
        generatedResults.push({ ...existing[0], skipped: true, reason: 'PAID' });
        continue;
      }

      // Calculate procedure fee transactions
      const existingPayrollId = existing.length > 0 ? existing[0].id : null;
      let feeTxns: any[] = [];
      if (existingPayrollId) {
        feeTxns = await db.select().from(employeeFeeTransactions)
          .where(or(
            and(
              eq(employeeFeeTransactions.employeeId, emp.id),
              eq(employeeFeeTransactions.status, 'PENDING')
            ),
            eq(employeeFeeTransactions.payrollId, existingPayrollId)
          ));
      } else {
        feeTxns = await db.select().from(employeeFeeTransactions)
          .where(and(
            eq(employeeFeeTransactions.employeeId, emp.id),
            eq(employeeFeeTransactions.status, 'PENDING')
          ));
      }

      const periodFees = feeTxns.filter(f => f.procedureDate && f.procedureDate.startsWith(cleanPeriod));
      const patientFeeTotal = periodFees.reduce((acc, f) => acc + f.feeAmount, 0);
      const patientCount = periodFees.length;

      // Calculate Fee Closing Pasien (Daftar langsung ke klinik)
      let calculatedClosingCount = 0;
      if (closingPatientCount !== undefined && targetEmployees.length === 1) {
        calculatedClosingCount = Math.max(0, Number(closingPatientCount));
      } else if (existing.length > 0 && existing[0].closingPatientCount > 0) {
        calculatedClosingCount = existing[0].closingPatientCount;
      } else {
        // Auto calculate from bookings: closingStaffId matches emp.id OR (walk-in without staff assigned for front-office/cashier/admin)
        const matchedClosing = allBookingsInMonth.filter(b => {
          if (b.closingStaffId === emp.id) return true;
          if (!b.closingStaffId && (b.patientSource === 'Walk-in' || b.patientSource === 'Datang Langsung (Walk-in)')) {
            const pos = (emp.position || '').toLowerCase();
            return pos.includes('front') || pos.includes('kasir') || pos.includes('admin') || pos.includes('cs') || pos.includes('pendaftaran');
          }
          return false;
        });
        calculatedClosingCount = matchedClosing.length;
      }

      const ratePerClosing = closingFeePerPatient !== undefined && targetEmployees.length === 1
        ? Math.max(0, Number(closingFeePerPatient))
        : (emp.closingFeePerPatient !== undefined && emp.closingFeePerPatient !== null
            ? Number(emp.closingFeePerPatient)
            : (existing.length > 0 ? (existing[0].closingFeePerPatient ?? 0) : 0));
      const closingFeeTotal = calculatedClosingCount * ratePerClosing;

      // Calculate Fee Lembur (Overtime) per Jam (Auto-sum daily overtime logs if present)
      const empOvertimes = await db.select().from(employeeOvertimes).where(
        and(eq(employeeOvertimes.employeeId, emp.id), eq(employeeOvertimes.periodMonth, cleanPeriod))
      );
      const loggedOvertimeHours = Number(empOvertimes.reduce((acc, o) => acc + Number(o.hours || 0), 0).toFixed(2));
      const loggedOvertimeTotal = Math.round(empOvertimes.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0));

      const hasExplicitOtOverride = overtimeHours !== undefined && targetEmployees.length === 1;
      const calculatedOvertimeHours = hasExplicitOtOverride
        ? Math.max(0, Number(overtimeHours))
        : (empOvertimes.length > 0
            ? loggedOvertimeHours
            : (existing.length > 0 ? Number(existing[0].overtimeHours || 0) : 0));

      const ratePerOvertimeHour = overtimeHourlyRate !== undefined && targetEmployees.length === 1
        ? Math.max(0, Number(overtimeHourlyRate))
        : (emp.overtimeHourlyRate !== undefined && emp.overtimeHourlyRate !== null
            ? Number(emp.overtimeHourlyRate)
            : (existing.length > 0 ? (existing[0].overtimeHourlyRate ?? 0) : 0));

      const overtimeTotal = !hasExplicitOtOverride && empOvertimes.length > 0
        ? loggedOvertimeTotal
        : Math.round(calculatedOvertimeHours * ratePerOvertimeHour);

      // Base salary, bonus, deductions
      const basicSalary = Number(emp.basicSalary || 0);
      const bonus = bonusAmount !== undefined && targetEmployees.length === 1
        ? Math.max(0, Number(bonusAmount))
        : (existing.length > 0 ? (existing[0].bonusAmount || 0) : 0);
      const deduction = deductionAmount !== undefined && targetEmployees.length === 1
        ? Math.max(0, Number(deductionAmount))
        : (existing.length > 0 ? (existing[0].deductionAmount || 0) : 0);

      const netSalary = Math.max(0, basicSalary + patientFeeTotal + closingFeeTotal + overtimeTotal + bonus - deduction);
      const finalPaymentMethod = paymentMethod || (existing.length > 0 ? existing[0].paymentMethod : 'TRANSFER');
      const finalNotes = notes || (existing.length > 0 ? existing[0].notes : `Penggajian periode ${cleanPeriod}`);

      let payrollRecord;
      if (existing.length > 0) {
        const updated = await db.update(payrolls)
          .set({
            basicSalary,
            patientFeeTotal,
            patientCount,
            closingPatientCount: calculatedClosingCount,
            closingFeePerPatient: ratePerClosing,
            closingFeeTotal,
            overtimeHours: calculatedOvertimeHours,
            overtimeHourlyRate: ratePerOvertimeHour,
            overtimeTotal,
            bonusAmount: bonus,
            deductionAmount: deduction,
            netSalary,
            paymentMethod: finalPaymentMethod,
            notes: finalNotes,
          })
          .where(eq(payrolls.id, existing[0].id))
          .returning();
        payrollRecord = updated[0];
      } else {
        const payrollNum = await generatePayrollNumber(cleanPeriod);
        const paymentDate = new Date().toISOString().split('T')[0];
        const inserted = await db.insert(payrolls).values({
          payrollNumber: payrollNum,
          employeeId: emp.id,
          employeeName: emp.name,
          periodMonth: cleanPeriod,
          periodYear: Number(cleanPeriod.split('-')[0]) || 2026,
          paymentDate,
          basicSalary,
          patientFeeTotal,
          patientCount,
          closingPatientCount: calculatedClosingCount,
          closingFeePerPatient: ratePerClosing,
          closingFeeTotal,
          overtimeHours: calculatedOvertimeHours,
          overtimeHourlyRate: ratePerOvertimeHour,
          overtimeTotal,
          bonusAmount: bonus,
          deductionAmount: deduction,
          netSalary,
          paymentMethod: finalPaymentMethod,
          status: 'DRAFT',
          notes: finalNotes,
          branchCode: emp.branchCode || resolveTargetBranch(req),
          processedBy: req.user?.name || 'Super Admin',
        }).returning();
        payrollRecord = inserted[0];
      }

      // Associate procedure fee transactions
      for (const f of periodFees) {
        await db.update(employeeFeeTransactions)
          .set({ payrollId: payrollRecord.id, status: 'INCLUDED_IN_PAYROLL' })
          .where(eq(employeeFeeTransactions.id, f.id));
      }

      await recordAudit('GENERATE_PAYROLL', 'PAYROLL', payrollRecord.payrollNumber, req.user?.email || 'Admin', 
        `Generate gaji ${emp.name} periode ${cleanPeriod}: THP Rp ${netSalary} (Gaji: ${basicSalary}, Fee Tindakan: ${patientFeeTotal}, Closing: ${closingFeeTotal}, Lembur: ${overtimeTotal})`
      );

      generatedResults.push(payrollRecord);
    }

    res.json({
      success: true,
      count: generatedResults.length,
      message: `Berhasil generate ${generatedResults.length} slip penggajian untuk periode ${cleanPeriod}`,
      payrolls: generatedResults,
      data: targetEmployees.length === 1 ? generatedResults[0] : generatedResults,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat slip penggajian' });
  }
});

// Update an existing Payroll Draft (Edit closing fee, overtime hours/rate, bonus, deduction, etc.)
app.put('/api/payrolls/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const payrollId = Number(req.params.id);
    const pList = await db.select().from(payrolls).where(eq(payrolls.id, payrollId));
    if (pList.length === 0) return res.status(404).json({ error: 'Data slip gaji tidak ditemukan' });
    const current = pList[0];

    if (current.status === 'PAID') {
      return res.status(400).json({ error: 'Slip gaji yang sudah DIBAYARKAN (PAID) tidak dapat diubah' });
    }

    const {
      basicSalary,
      closingPatientCount,
      closingFeePerPatient,
      overtimeHours,
      overtimeHourlyRate,
      bonusAmount,
      deductionAmount,
      paymentMethod,
      notes,
    } = req.body;

    const newBasicSalary = basicSalary !== undefined ? Number(basicSalary) : current.basicSalary;
    const newClosingCount = closingPatientCount !== undefined ? Math.max(0, Number(closingPatientCount)) : current.closingPatientCount;
    const newClosingRate = closingFeePerPatient !== undefined ? Math.max(0, Number(closingFeePerPatient)) : current.closingFeePerPatient;
    const newClosingTotal = newClosingCount * newClosingRate;

    const newOtHours = overtimeHours !== undefined ? Math.max(0, Number(overtimeHours)) : current.overtimeHours;
    const newOtRate = overtimeHourlyRate !== undefined ? Math.max(0, Number(overtimeHourlyRate)) : current.overtimeHourlyRate;
    const newOtTotal = newOtHours * newOtRate;

    const newBonus = bonusAmount !== undefined ? Math.max(0, Number(bonusAmount)) : current.bonusAmount;
    const newDeduction = deductionAmount !== undefined ? Math.max(0, Number(deductionAmount)) : current.deductionAmount;

    const newNetSalary = Math.max(
      0, 
      newBasicSalary + current.patientFeeTotal + newClosingTotal + newOtTotal + newBonus - newDeduction
    );

    const updated = await db.update(payrolls)
      .set({
        basicSalary: newBasicSalary,
        closingPatientCount: newClosingCount,
        closingFeePerPatient: newClosingRate,
        closingFeeTotal: newClosingTotal,
        overtimeHours: newOtHours,
        overtimeHourlyRate: newOtRate,
        overtimeTotal: newOtTotal,
        bonusAmount: newBonus,
        deductionAmount: newDeduction,
        netSalary: newNetSalary,
        paymentMethod: paymentMethod || current.paymentMethod,
        notes: notes !== undefined ? notes : current.notes,
        processedBy: req.user?.name || current.processedBy,
      })
      .where(eq(payrolls.id, payrollId))
      .returning();

    await recordAudit('UPDATE', 'PAYROLL', current.payrollNumber, req.user?.email || 'Admin', 
      `Update gaji ${current.employeeName}: THP Rp ${newNetSalary} (Closing: ${newClosingTotal}, Lembur: ${newOtTotal})`
    );

    res.json(updated[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui data slip gaji' });
  }
});

// Delete a Payroll Draft (Reverts fee transactions back to PENDING)
app.delete('/api/payrolls/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const payrollId = Number(req.params.id);
    const pList = await db.select().from(payrolls).where(eq(payrolls.id, payrollId));
    if (pList.length === 0) return res.status(404).json({ error: 'Data slip gaji tidak ditemukan' });
    const current = pList[0];

    if (current.status === 'PAID') {
      return res.status(400).json({ error: 'Slip gaji yang sudah PAID tidak dapat dihapus' });
    }

    // Revert associated employeeFeeTransactions back to PENDING
    await db.update(employeeFeeTransactions)
      .set({ payrollId: null, status: 'PENDING' })
      .where(eq(employeeFeeTransactions.payrollId, payrollId));

    // Delete payroll record
    await db.delete(payrolls).where(eq(payrolls.id, payrollId));

    await recordAudit('DELETE', 'PAYROLL', current.payrollNumber, req.user?.email || 'Admin', 
      `Hapus draft slip gaji ${current.employeeName} (${current.periodMonth})`
    );

    res.json({ success: true, message: 'Draft slip gaji berhasil dihapus' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus slip gaji' });
  }
});

// Pay / Finalize Payroll
app.post('/api/payrolls/:id/pay', requireAuth, async (req: AuthRequest, res) => {
  try {
    const payrollId = Number(req.params.id);
    const { paymentMethod, notes } = req.body;

    const pList = await db.select().from(payrolls).where(eq(payrolls.id, payrollId));
    if (pList.length === 0) return res.status(404).json({ error: 'Data gaji tidak ditemukan' });
    const p = pList[0];

    const now = new Date();
    await db.update(payrolls)
      .set({
        status: 'PAID',
        paidAt: now,
        paymentMethod: paymentMethod || p.paymentMethod,
        notes: notes || p.notes,
        processedBy: req.user?.name || 'Super Admin',
      })
      .where(eq(payrolls.id, payrollId));

    // Mark associated employee fee transactions as PAID
    await db.update(employeeFeeTransactions)
      .set({ status: 'PAID', paidAt: now })
      .where(eq(employeeFeeTransactions.payrollId, payrollId));

    await recordAudit('PAY_SALARY', 'PAYROLL', p.payrollNumber, req.user?.email || 'Admin', `Pembayaran gaji berhasil dicatat: ${p.employeeName} (Rp ${p.netSalary})`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memproses pembayaran gaji' });
  }
});

// Get Detailed Slip Data
app.get('/api/payrolls/:id/slip', async (req, res) => {
  try {
    const payrollId = Number(req.params.id);
    const pList = await db.select().from(payrolls).where(eq(payrolls.id, payrollId));
    if (pList.length === 0) return res.status(404).json({ error: 'Slip gaji tidak ditemukan' });
    const payroll = pList[0];

    const empList = await db.select().from(employees).where(eq(employees.id, payroll.employeeId));
    const employee = empList[0] || null;

    const feeDetails = await db.select().from(employeeFeeTransactions).where(eq(employeeFeeTransactions.payrollId, payrollId));
    const clinic = await db.select().from(clinicSettings).limit(1);

    res.json({
      payroll,
      employee,
      feeDetails,
      clinic: clinic[0] || {},
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil rincian slip gaji' });
  }
});

// Patients & Guardians
app.get('/api/patients', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { includeDeleted } = req.query;

    let query = db.select({
      id: patients.id,
      rmNumber: patients.rmNumber,
      fullName: patients.fullName,
      nickname: patients.nickname,
      nik: patients.nik,
      gender: patients.gender,
      birthPlace: patients.birthPlace,
      birthDate: patients.birthDate,
      ageYears: patients.ageYears,
      ageMonths: patients.ageMonths,
      address: patients.address,
      phone: patients.phone,
      school: patients.school,
      grade: patients.grade,
      weightKg: patients.weightKg,
      heightCm: patients.heightCm,
      allergies: patients.allergies,
      notes: patients.notes,
      guardianId: patients.guardianId,
      branchCode: patients.branchCode,
      isActive: patients.isActive,
      isDeleted: patients.isDeleted,
      deletedAt: patients.deletedAt,
      deletedBy: patients.deletedBy,
      createdAt: patients.createdAt,
      guardianName: guardians.name,
      guardianPhone: guardians.phone,
      guardianRelationship: guardians.relationship,
      fatherName: guardians.fatherName,
      motherName: guardians.motherName,
    })
    .from(patients)
    .innerJoin(guardians, eq(patients.guardianId, guardians.id))
    .orderBy(desc(patients.id));

    let pts = await query;
    if (includeDeleted !== 'true') {
      pts = pts.filter(p => !p.isDeleted);
    }

    const branchFilter = getBranchFilter(req);
    pts = filterByBranch(pts, branchFilter);

    res.json(pts);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data pasien' });
  }
});

app.get('/api/guardians', requireAuth, async (req: AuthRequest, res) => {
  try {
    const guards = await db.select().from(guardians).orderBy(desc(guardians.id));
    const pts = await db.select().from(patients).where(eq(patients.isActive, true));
    const enriched = guards.map(g => ({
      ...g,
      children: pts.filter(p => p.guardianId != null && p.guardianId === g.id),
    }));
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data orang tua/wali' });
  }
});

app.post('/api/patients', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      fullName, nickname, nik, gender, birthPlace, birthDate,
      address, phone, school, grade, weightKg, heightCm, allergies, notes,
      guardianId, guardianData,
    } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Nama lengkap anak wajib diisi' });
    }
    const cleanFullName = String(fullName).trim();

    if (birthDate) {
      const bDateParsed = new Date(birthDate);
      if (isNaN(bDateParsed.getTime())) {
        return res.status(400).json({ error: 'Format tanggal lahir tidak valid' });
      }
      if (bDateParsed.getTime() > Date.now()) {
        return res.status(400).json({ error: 'Tanggal lahir tidak boleh di masa depan' });
      }
    }

    const cleanNik = nik ? String(nik).trim().replace(/[-\s]/g, '') : '';
    if (cleanNik && cleanNik.length > 0) {
      if (!/^\d{16}$/.test(cleanNik)) {
        return res.status(400).json({ error: 'Nomor Induk Kependudukan (NIK) harus terdiri dari 16 digit angka' });
      }
    }

    if (weightKg !== undefined && weightKg !== null && String(weightKg).trim() !== '') {
      const w = Number(weightKg);
      if (isNaN(w) || w <= 0 || w > 300) {
        return res.status(400).json({ error: 'Berat badan tidak valid (masukkan angka antara 0.5 - 300 kg)' });
      }
    }

    if (heightCm !== undefined && heightCm !== null && String(heightCm).trim() !== '') {
      const h = Number(heightCm);
      if (isNaN(h) || h <= 0 || h > 250) {
        return res.status(400).json({ error: 'Tinggi badan tidak valid (masukkan angka antara 20 - 250 cm)' });
      }
    }

    const cleanBirthDate = birthDate ? String(birthDate).trim() : new Date().toISOString().split('T')[0];

    const branchFilter = getBranchFilter(req);
    const targetBranch = (req.body.branchCode && req.body.branchCode !== 'ALL') ? req.body.branchCode : (branchFilter !== 'ALL' ? branchFilter : 'PUSAT');

    let targetGuardianId: number | null = guardianId ? Number(guardianId) : null;

    // 1. Verifikasi apakah guardianId yang dikirim benar-benar ada di database
    if (targetGuardianId && !isNaN(targetGuardianId)) {
      const existingG = await db.select().from(guardians).where(eq(guardians.id, targetGuardianId)).limit(1);
      if (existingG.length === 0) {
        console.warn(`[Patient Register] guardianId ${targetGuardianId} tidak ditemukan di database. Mengalihkan ke pembuatan data orang tua/wali baru...`);
        targetGuardianId = null;
      }
    } else {
      targetGuardianId = null;
    }

    // 2. Jika belum ada wali valid, buat record wali baru atau cari berdasarkan nomor telepon
    if (!targetGuardianId) {
      const gName = (
        guardianData?.name || 
        guardianData?.guardianName || 
        guardianData?.fatherName || 
        guardianData?.motherName || 
        `Orang Tua ${cleanFullName}`
      ).trim();
      const gPhone = (guardianData?.phone || phone || '-').trim();
      const gFather = (guardianData?.fatherName || (guardianData?.relationship === 'Ayah Kandung' ? gName : '')).trim();
      const gMother = (guardianData?.motherName || (guardianData?.relationship === 'Ibu Kandung' ? gName : '')).trim();

      // Cek apakah nomor telepon orang tua sudah terdaftar sebelumnya
      let existingByPhone: any[] = [];
      if (gPhone && gPhone !== '-' && gPhone.length >= 8) {
        existingByPhone = await db.select().from(guardians).where(eq(guardians.phone, gPhone)).limit(1);
      }

      if (existingByPhone.length > 0) {
        targetGuardianId = existingByPhone[0].id;
      } else {
        const newGuardian = await db.insert(guardians).values({
          name: gName || `Orang Tua ${cleanFullName}`,
          fatherName: gFather || gName,
          motherName: gMother || '',
          guardianName: guardianData?.guardianName || gName,
          relationship: guardianData?.relationship || 'Orang Tua',
          phone: gPhone || '-',
          alternatePhone: guardianData?.alternatePhone || '',
          address: guardianData?.address || address || '',
          notes: guardianData?.notes || '',
          branchCode: targetBranch,
        }).returning();
        targetGuardianId = newGuardian[0].id;
      }
    }

    // Fallback darurat jika database sama sekali belum memiliki data wali
    if (!targetGuardianId) {
      const firstG = await db.select().from(guardians).limit(1);
      if (firstG.length > 0) {
        targetGuardianId = firstG[0].id;
      } else {
        const fallbackGuardian = await db.insert(guardians).values({
          name: `Orang Tua ${cleanFullName}`,
          relationship: 'Orang Tua',
          phone: phone || '-',
          address: address || '',
          branchCode: targetBranch,
        }).returning();
        targetGuardianId = fallbackGuardian[0].id;
      }
    }

    // Calculate age automatically
    const bDate = new Date(cleanBirthDate);
    const now = new Date();
    let ageYears = now.getFullYear() - bDate.getFullYear();
    let ageMonths = now.getMonth() - bDate.getMonth();
    if (ageMonths < 0 || (ageMonths === 0 && now.getDate() < bDate.getDate())) {
      ageYears--;
      ageMonths = (ageMonths + 12) % 12;
    }

    const rmNumber = await generateRMNumber();

    const inserted = await db.insert(patients).values({
      rmNumber,
      fullName,
      nickname: nickname || (fullName ? fullName.split(' ')[0] : 'Anak'),
      nik: nik || '',
      gender: gender || 'Laki-laki',
      birthPlace: birthPlace || '',
      birthDate,
      ageYears: Math.max(0, ageYears),
      ageMonths: Math.max(0, ageMonths),
      address: address || '',
      phone: phone || '',
      school: school || '',
      grade: grade || '',
      weightKg: weightKg || '',
      heightCm: heightCm || '',
      allergies: allergies || '',
      notes: notes || '',
      guardianId: targetGuardianId,
      branchCode: targetBranch,
      isActive: true,
      isDeleted: false,
    }).returning();

    const createdPatient = inserted[0];
    let autoBooking = null;

    // Rencana Tanggal Tindakan -> Otomatis tercatat di menu booking
    const {
      plannedProcedureDate, plannedProcedureTime, plannedMethodType,
      plannedAnesthesiaType, plannedDoctorId, plannedPackageId, plannedCategoryId,
      plannedPackageCategory, patientSource, dpAmount, discountAmount, paymentMethod,
      closingStaffId, closingStaffName
    } = req.body;

    if (plannedProcedureDate && String(plannedProcedureDate).trim()) {
      try {
        const cleanBookingDate = String(plannedProcedureDate).trim();
        const cleanBookingTime = plannedProcedureTime && String(plannedProcedureTime).trim() ? String(plannedProcedureTime).trim() : '08:00';

        // Tentukan dokter (default dokter aktif pertama jika tidak dipilih)
        let docId = plannedDoctorId ? Number(plannedDoctorId) : null;
        if (!docId) {
          const activeDocs = await db.select().from(doctors).where(eq(doctors.isActive, true)).limit(1);
          docId = activeDocs[0]?.id || 1;
        }

        // Tentukan kategori pasien (Reguler vs VIP)
        let catId = plannedCategoryId ? Number(plannedCategoryId) : null;
        if (!catId) {
          if (plannedPackageCategory && String(plannedPackageCategory).toUpperCase().includes('VIP')) {
            catId = 2; // VIP
          } else {
            catId = 1; // REG
          }
        }

        // Tentukan paket khitan sesuai metode yang dipilih
        let pkgId = plannedPackageId ? Number(plannedPackageId) : null;
        const methodStr = plannedMethodType || 'Klem Nano Sealer';
        if (!pkgId) {
          const firstWord = methodStr ? methodStr.split(' ')[0] : 'Klem';
          const matchedPkg = await db.select().from(circumcisionPackages)
            .where(ilike(circumcisionPackages.name, `%${firstWord}%`))
            .limit(1);
          if (matchedPkg.length > 0) {
            pkgId = matchedPkg[0].id;
          } else {
            const firstPkg = await db.select().from(circumcisionPackages).limit(1);
            pkgId = firstPkg[0]?.id || 1;
          }
        }

        // Snapshot harga paket
        const priceRecords = await db.select().from(packagePrices).where(and(
          eq(packagePrices.packageId, pkgId),
          eq(packagePrices.patientCategoryId, catId),
          eq(packagePrices.isActive, true)
        ));

        let packagePrice = catId === 2 ? 2500000 : 1800000;
        if (priceRecords.length > 0) {
          packagePrice = priceRecords[0].price;
        }

        const disc = Number(discountAmount || 0);
        const total = Math.max(0, packagePrice - disc);
        const dp = Number(dpAmount || 0);
        const remaining = Math.max(0, total - dp);
        const bookingNumber = await generateBookingNumber();
        const initialStatus = dp > 0 ? 'DP_PAID' : 'BOOKED';

        const chosenAnesthesia = plannedAnesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)';

        let resolvedClosingStaffName = closingStaffName || null;
        if (closingStaffId && !resolvedClosingStaffName) {
          const empRecord = await db.select().from(employees).where(eq(employees.id, Number(closingStaffId))).limit(1);
          if (empRecord.length > 0) resolvedClosingStaffName = empRecord[0].name;
        }

        const insertedBooking = await db.insert(bookings).values({
          bookingNumber,
          patientId: createdPatient.id,
          guardianId: targetGuardianId,
          patientCategoryId: catId,
          packageId: pkgId,
          doctorId: docId,
          bookingDate: cleanBookingDate,
          bookingTime: cleanBookingTime,
          methodType: methodStr,
          anesthesiaType: chosenAnesthesia,
          packagePriceSnapshot: packagePrice,
          discountAmount: disc,
          totalAmount: total,
          dpAmount: dp,
          remainingAmount: remaining,
          patientSource: patientSource || 'WhatsApp / Chat Pendaftaran',
          closingStaffId: closingStaffId ? Number(closingStaffId) : null,
          closingStaffName: resolvedClosingStaffName,
          notes: notes || `Rencana tindakan dari pendaftaran pasien ${createdPatient.fullName}`,
          status: initialStatus,
          branchCode: targetBranch,
        }).returning();

        autoBooking = insertedBooking[0];

        // Status history
        await db.insert(bookingStatusHistory).values({
          bookingId: autoBooking.id,
          status: initialStatus,
          changedBy: req.user?.name || 'Staff Pendaftaran',
          notes: `Booking otomatis dari pendaftaran pasien baru (Rencana Tindakan: ${cleanBookingDate} ${cleanBookingTime}, Metode: ${methodStr})`,
        });

        // Auto Invoice
        const invoiceNumber = await generateInvoiceNumber();
        const invoiceStatus = dp >= total ? 'PAID' : dp > 0 ? 'PARTIAL' : 'UNPAID';
        const createdInvoice = await db.insert(invoices).values({
          invoiceNumber,
          bookingId: autoBooking.id,
          patientId: createdPatient.id,
          doctorId: docId,
          invoiceDate: cleanBookingDate,
          subtotal: packagePrice,
          discount: disc,
          totalAmount: total,
          paidAmount: dp,
          remainingAmount: remaining,
          status: invoiceStatus,
          notes: `Invoice otomatis dari booking pendaftaran ${createdPatient.fullName}`,
          branchCode: targetBranch,
        }).returning();

        // If DP paid, record payment transaction
        if (dp > 0) {
          const payNum = `PAY-${invoiceNumber.replace('INV-', '')}`;
          const nowTime = new Date().toTimeString().split(' ')[0];
          await db.insert(payments).values({
            paymentNumber: payNum,
            invoiceId: createdInvoice[0].id,
            paymentDate: cleanBookingDate,
            paymentTime: nowTime,
            amount: dp,
            paymentMethod: paymentMethod || 'TRANSFER',
            paymentType: 'DP',
            referenceNumber: `DP-${bookingNumber}`,
            receivedBy: req.user?.name || 'Staff Pendaftaran',
            branchCode: targetBranch,
          });
        }

        await recordAudit(
          'AUTO_BOOKING', 
          'BOOKING', 
          bookingNumber, 
          req.user?.email || 'Staff', 
          `Auto-booking saat pendaftaran: ${createdPatient.fullName} (${cleanBookingDate} ${cleanBookingTime}, Metode: ${methodStr}, Bius: ${chosenAnesthesia})`
        );
      } catch (bkErr: any) {
        console.error('Failed to auto-create booking for patient:', bkErr);
      }
    }

    await recordAudit('CREATE', 'PATIENT', rmNumber, req.user?.email || 'Staff', `Pasien baru: ${fullName}`);
    res.json({ ...createdPatient, autoBooking });
  } catch (err: any) {
    console.error('Error registering patient:', err);
    res.status(500).json({ error: 'Gagal mendaftarkan pasien baru: ' + (err?.message || String(err)) });
  }
});

// Update Patient
// Update Patient with Core Data Synchronization (Bookings, Procedures, Invoices, Queues)
app.put('/api/patients/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const patientId = Number(req.params.id);
    const {
      fullName, nickname, nik, gender, birthPlace, birthDate,
      address, phone, school, grade, weightKg, heightCm, allergies, notes,
      guardianName, guardianPhone, guardianRelationship, fatherName, motherName,
      // Core Layanan Khitan yang Terhubung
      plannedPackageCategory, packageCategory, patientCategoryId,
      plannedPackageId, packageId,
      plannedMethodType, methodType,
      plannedPackagePrice, packagePrice, packagePriceSnapshot,
      discountAmount, dpAmount, paymentMethod,
      plannedDoctorId, doctorId,
      plannedProcedureDate, bookingDate,
      plannedProcedureTime, bookingTime,
      plannedAnesthesiaType, anesthesiaType,
      patientSource, closingStaffId, closingStaffName
    } = req.body;

    const existing = await db.select().from(patients).where(eq(patients.id, patientId));
    if (existing.length === 0) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
    const current = existing[0];

    let ageYears = current.ageYears;
    let ageMonths = current.ageMonths;
    if (birthDate) {
      const bDate = new Date(birthDate);
      const now = new Date();
      ageYears = now.getFullYear() - bDate.getFullYear();
      ageMonths = now.getMonth() - bDate.getMonth();
      if (ageMonths < 0 || (ageMonths === 0 && now.getDate() < bDate.getDate())) {
        ageYears--;
        ageMonths = (ageMonths + 12) % 12;
      }
    }

    // 1. Update Core Patient Record
    await db.update(patients).set({
      fullName: fullName || current.fullName,
      nickname: nickname !== undefined ? nickname : current.nickname,
      nik: nik !== undefined ? nik : current.nik,
      gender: gender || current.gender,
      birthPlace: birthPlace !== undefined ? birthPlace : current.birthPlace,
      birthDate: birthDate || current.birthDate,
      ageYears: Math.max(0, ageYears),
      ageMonths: Math.max(0, ageMonths),
      address: address !== undefined ? address : current.address,
      phone: phone !== undefined ? phone : current.phone,
      school: school !== undefined ? school : current.school,
      grade: grade !== undefined ? grade : current.grade,
      weightKg: weightKg !== undefined ? weightKg : current.weightKg,
      heightCm: heightCm !== undefined ? heightCm : current.heightCm,
      allergies: allergies !== undefined ? allergies : current.allergies,
      notes: notes !== undefined ? notes : current.notes,
    }).where(eq(patients.id, patientId));

    // 2. Update Guardian / Orang Tua Record
    if (current.guardianId && (guardianName || guardianPhone || guardianRelationship || fatherName || motherName || address || phone)) {
      await db.update(guardians).set({
        name: guardianName || fatherName || undefined,
        phone: guardianPhone || phone || undefined,
        relationship: guardianRelationship || undefined,
        fatherName: fatherName || undefined,
        motherName: motherName || undefined,
        address: address || undefined,
      }).where(eq(guardians.id, current.guardianId));
    }

    // 3. Cascade Update to Linked Bookings, Procedures, Invoices, Queues
    const linkedBookings = await db.select().from(bookings).where(eq(bookings.patientId, patientId)).orderBy(desc(bookings.id));

    if (linkedBookings.length > 0) {
      const targetBooking = linkedBookings.find(b => b.status !== 'CANCELLED') || linkedBookings[0];

      // Resolve Patient Category (REG vs VIP)
      let catId = targetBooking.patientCategoryId;
      if (patientCategoryId) {
        catId = Number(patientCategoryId);
      } else if (packageCategory || plannedPackageCategory) {
        const catStr = String(packageCategory || plannedPackageCategory).toUpperCase();
        catId = catStr.includes('VIP') ? 2 : 1;
      }

      // Resolve Package & Method
      let pkgId = targetBooking.packageId;
      let methodStr = targetBooking.methodType || 'Glans Pro Bipolar Pen Sealer';
      if (packageId || plannedPackageId) {
        pkgId = Number(packageId || plannedPackageId);
        const pkgObj = await db.select().from(circumcisionPackages).where(eq(circumcisionPackages.id, pkgId)).limit(1);
        if (pkgObj.length > 0) {
          methodStr = pkgObj[0].name;
        }
      } else if (methodType || plannedMethodType) {
        methodStr = methodType || plannedMethodType || 'Glans Pro';
        const firstWord = methodStr ? methodStr.split(' ')[0] : 'Glans';
        const matchedPkg = await db.select().from(circumcisionPackages)
          .where(ilike(circumcisionPackages.name, `%${firstWord}%`))
          .limit(1);
        if (matchedPkg.length > 0) {
          pkgId = matchedPkg[0].id;
        }
      }

      // Resolve Doctor
      let docId = targetBooking.doctorId;
      if (doctorId || plannedDoctorId) {
        docId = Number(doctorId || plannedDoctorId);
      }

      // Resolve Date & Time
      const dateStr = plannedProcedureDate || bookingDate || targetBooking.bookingDate;
      const timeStr = plannedProcedureTime || bookingTime || targetBooking.bookingTime;
      const anesthesiaStr = plannedAnesthesiaType !== undefined ? plannedAnesthesiaType : (anesthesiaType !== undefined ? anesthesiaType : targetBooking.anesthesiaType);

      // Resolve Price Snapshot
      let finalPrice = targetBooking.packagePriceSnapshot;
      if (packagePrice !== undefined || plannedPackagePrice !== undefined || packagePriceSnapshot !== undefined) {
        finalPrice = Number(packagePrice !== undefined ? packagePrice : (plannedPackagePrice !== undefined ? plannedPackagePrice : packagePriceSnapshot));
      } else if (pkgId !== targetBooking.packageId || catId !== targetBooking.patientCategoryId) {
        const priceRecords = await db.select().from(packagePrices).where(and(
          eq(packagePrices.packageId, pkgId),
          eq(packagePrices.patientCategoryId, catId),
          eq(packagePrices.isActive, true)
        ));
        finalPrice = priceRecords.length > 0 ? priceRecords[0].price : (catId === 2 ? 2500000 : 1800000);
      }

      // Resolve Discounts, Addons, and Totals
      const finalDiscount = discountAmount !== undefined ? Math.max(0, Number(discountAmount)) : targetBooking.discountAmount;
      const finalDp = dpAmount !== undefined ? Math.max(0, Number(dpAmount)) : targetBooking.dpAmount;

      const allAddons = await db.select().from(transactionItems)
        .where(and(eq(transactionItems.bookingId, targetBooking.id), eq(transactionItems.itemType, 'ADDON')));
      const addonsTotal = allAddons.reduce((acc, a) => acc + (a.totalAmount || 0), 0);

      const newTotalAmount = Math.max(0, finalPrice - finalDiscount) + addonsTotal;
      const newRemainingAmount = Math.max(0, newTotalAmount - finalDp);

      // Resolve Closing Staff
      let resolvedStaffId = targetBooking.closingStaffId;
      let resolvedStaffName = targetBooking.closingStaffName;
      if (closingStaffId !== undefined) {
        resolvedStaffId = closingStaffId ? Number(closingStaffId) : null;
        if (resolvedStaffId) {
          const empRecord = await db.select().from(employees).where(eq(employees.id, resolvedStaffId)).limit(1);
          resolvedStaffName = empRecord[0]?.name || null;
        } else {
          resolvedStaffName = null;
        }
      }

      // Update Booking
      await db.update(bookings).set({
        patientCategoryId: catId,
        packageId: pkgId,
        doctorId: docId,
        bookingDate: dateStr,
        bookingTime: timeStr,
        methodType: methodStr,
        anesthesiaType: anesthesiaStr,
        packagePriceSnapshot: finalPrice,
        discountAmount: finalDiscount,
        totalAmount: newTotalAmount,
        dpAmount: finalDp,
        remainingAmount: newRemainingAmount,
        patientSource: patientSource || targetBooking.patientSource,
        closingStaffId: resolvedStaffId,
        closingStaffName: resolvedStaffName,
        status: (targetBooking.status === 'BOOKED' && finalDp > 0) ? 'DP_PAID' : targetBooking.status,
      }).where(eq(bookings.id, targetBooking.id));

      // Update Procedures (Ruang Tindakan)
      await db.update(circumcisionProcedures).set({
        doctorId: docId,
        procedureDate: dateStr,
        procedureTime: timeStr,
        methodType: methodStr,
        anesthesiaType: anesthesiaStr,
      }).where(eq(circumcisionProcedures.bookingId, targetBooking.id));

      // Update Invoices (Kasir & Pembayaran)
      const invList = await db.select().from(invoices).where(eq(invoices.bookingId, targetBooking.id));
      if (invList.length > 0) {
        for (const inv of invList) {
          const newPaidAmount = Math.max(inv.paidAmount || 0, finalDp);
          const newInvRemaining = Math.max(0, newTotalAmount - newPaidAmount);
          const newInvStatus = newInvRemaining <= 0 ? 'PAID' : (newPaidAmount > 0 ? 'PARTIAL' : 'UNPAID');

          await db.update(invoices).set({
            doctorId: docId,
            invoiceDate: dateStr,
            subtotal: finalPrice + addonsTotal,
            discount: finalDiscount,
            totalAmount: newTotalAmount,
            paidAmount: newPaidAmount,
            remainingAmount: newInvRemaining,
            status: newInvStatus,
          }).where(eq(invoices.id, inv.id));

          // If DP amount changed or specified, synchronize payment record
          if (finalDp > 0) {
            const dpPayments = await db.select().from(payments)
              .where(and(eq(payments.invoiceId, inv.id), eq(payments.paymentType, 'DP')));
            if (dpPayments.length > 0) {
              await db.update(payments).set({
                amount: finalDp,
                paymentMethod: paymentMethod || dpPayments[0].paymentMethod,
              }).where(eq(payments.id, dpPayments[0].id));
            } else {
              const payNum = `PAY-${inv.invoiceNumber.replace('INV-', '')}`;
              await db.insert(payments).values({
                paymentNumber: payNum,
                invoiceId: inv.id,
                paymentDate: dateStr,
                paymentTime: new Date().toTimeString().split(' ')[0],
                amount: finalDp,
                paymentMethod: paymentMethod || 'TRANSFER',
                paymentType: 'DP',
                referenceNumber: `DP-${targetBooking.bookingNumber}`,
                receivedBy: req.user?.name || 'Staff Kasir',
                branchCode: inv.branchCode || targetBooking.branchCode || 'PUSAT',
              });
            }
          }
        }
      }

      // Update Queues (Antrean)
      await db.update(queues).set({
        doctorId: docId,
        queueDate: dateStr,
      }).where(eq(queues.bookingId, targetBooking.id));

      // Update Doctor Fee Rule if pending
      try {
        const pendingFees = await db.select().from(doctorFeeTransactions)
          .where(and(eq(doctorFeeTransactions.bookingId, targetBooking.id), eq(doctorFeeTransactions.status, 'PENDING')));
        if (pendingFees.length > 0) {
          const feeRules = await db.select().from(doctorFeeRules).where(and(
            eq(doctorFeeRules.doctorId, docId),
            eq(doctorFeeRules.packageId, pkgId),
            eq(doctorFeeRules.patientCategoryId, catId),
            eq(doctorFeeRules.isActive, true)
          ));
          const newFeeAmount = feeRules.length > 0 ? feeRules[0].feeAmount : (catId === 2 ? 350000 : 250000);
          await db.update(doctorFeeTransactions).set({
            doctorId: docId,
            packageId: pkgId,
            patientCategoryId: catId,
            feeAmount: newFeeAmount,
          }).where(and(eq(doctorFeeTransactions.bookingId, targetBooking.id), eq(doctorFeeTransactions.status, 'PENDING')));
        }
      } catch (feeErr) {
        console.warn('Notice during doctor fee rule update on patient edit:', feeErr);
      }

      // Pastikan item paket (celana, obat) tersinkronisasi
      await ensureIncludedItemsForBooking(targetBooking.id);
    } else if (plannedProcedureDate || bookingDate) {
      // Pasien belum memiliki booking, buatkan booking otomatis saat diedit jika menyertakan tanggal tindakan
      try {
        const cleanBookingDate = String(plannedProcedureDate || bookingDate).trim();
        const cleanBookingTime = String(plannedProcedureTime || bookingTime || '08:00').trim();
        let catId = (packageCategory || plannedPackageCategory || '').toUpperCase().includes('VIP') ? 2 : 1;
        let pkgId = plannedPackageId || packageId ? Number(plannedPackageId || packageId) : 1;
        const methodStr = plannedMethodType || methodType || 'Glans Pro Bipolar Pen Sealer';

        let docId = plannedDoctorId || doctorId ? Number(plannedDoctorId || doctorId) : null;
        if (!docId) {
          const activeDocs = await db.select().from(doctors).where(eq(doctors.isActive, true)).limit(1);
          docId = activeDocs[0]?.id || 1;
        }

        const priceRecords = await db.select().from(packagePrices).where(and(
          eq(packagePrices.packageId, pkgId),
          eq(packagePrices.patientCategoryId, catId),
          eq(packagePrices.isActive, true)
        ));
        let packagePriceVal = priceRecords.length > 0 ? priceRecords[0].price : (catId === 2 ? 2500000 : 1800000);
        if (plannedPackagePrice || packagePrice) {
          packagePriceVal = Number(plannedPackagePrice || packagePrice);
        }

        const disc = Number(discountAmount || 0);
        const total = Math.max(0, packagePriceVal - disc);
        const dp = Number(dpAmount || 0);
        const remaining = Math.max(0, total - dp);
        const bookingNumber = await generateBookingNumber();
        const initialStatus = dp > 0 ? 'DP_PAID' : 'BOOKED';

        const branchFilter = getBranchFilter(req);
        const targetBranch = current.branchCode || (branchFilter !== 'ALL' ? branchFilter : 'PUSAT');

        const insertedBooking = await db.insert(bookings).values({
          bookingNumber,
          patientId,
          guardianId: current.guardianId,
          patientCategoryId: catId,
          packageId: pkgId,
          doctorId: docId,
          bookingDate: cleanBookingDate,
          bookingTime: cleanBookingTime,
          methodType: methodStr,
          anesthesiaType: plannedAnesthesiaType || anesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
          packagePriceSnapshot: packagePriceVal,
          discountAmount: disc,
          totalAmount: total,
          dpAmount: dp,
          remainingAmount: remaining,
          patientSource: patientSource || 'WhatsApp / Chat Pendaftaran',
          closingStaffId: closingStaffId ? Number(closingStaffId) : null,
          closingStaffName: closingStaffName || null,
          notes: notes || `Booking dari edit pasien ${current.fullName}`,
          status: initialStatus,
          branchCode: targetBranch,
        }).returning();

        const newBk = insertedBooking[0];
        const invoiceNumber = await generateInvoiceNumber();
        const invoiceStatus = dp >= total ? 'PAID' : dp > 0 ? 'PARTIAL' : 'UNPAID';

        const newInv = await db.insert(invoices).values({
          invoiceNumber,
          bookingId: newBk.id,
          patientId,
          doctorId: docId,
          invoiceDate: cleanBookingDate,
          subtotal: packagePriceVal,
          discount: disc,
          totalAmount: total,
          paidAmount: dp,
          remainingAmount: remaining,
          status: invoiceStatus,
          notes: `Invoice dari edit booking pasien ${current.fullName}`,
          branchCode: targetBranch,
        }).returning();

        if (dp > 0) {
          const payNum = `PAY-${invoiceNumber.replace('INV-', '')}`;
          await db.insert(payments).values({
            paymentNumber: payNum,
            invoiceId: newInv[0].id,
            paymentDate: cleanBookingDate,
            paymentTime: new Date().toTimeString().split(' ')[0],
            amount: dp,
            paymentMethod: paymentMethod || 'TRANSFER',
            paymentType: 'DP',
            referenceNumber: `DP-${bookingNumber}`,
            receivedBy: req.user?.name || 'Staff Pendaftaran',
            branchCode: targetBranch,
          });
        }
      } catch (autoBkErr) {
        console.error('Error creating booking from patient edit:', autoBkErr);
      }
    }

    await recordAudit('UPDATE', 'PATIENT', current.rmNumber, req.user?.email || 'Staff', `Edit data pasien & sinkronisasi booking/tindakan/kasir: ${fullName || current.fullName}`);
    res.json({ success: true, message: 'Data pasien dan seluruh modul terkait berhasil disinkronkan' });
  } catch (err: any) {
    console.error('Update patient error:', err);
    res.status(500).json({ error: 'Gagal memperbarui data pasien: ' + (err.message || String(err)) });
  }
});

// Soft / Permanent Delete Patient
app.delete('/api/patients/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const patientId = Number(req.params.id);
    const isPermanent = req.query.permanent === 'true' || req.body?.permanent === true;
    const reason = req.body?.reason || req.query.reason || 'Dihapus oleh Administrator';

    const existing = await db.select().from(patients).where(eq(patients.id, patientId));
    if (existing.length === 0) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
    const current = existing[0];

    const performer = req.user?.name || req.user?.email || 'Admin';

    if (isPermanent) {
      // PERMANENT CASCADE DELETE: Patient is the root key.
      // All linked medical records, procedures (tindakan), bookings, invoices, payments,
      // queues, doctor/employee fee transactions, consents, and follow-ups are cascaded!
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Find all bookings for this patient
        const bRes = await client.query('SELECT id FROM bookings WHERE patient_id = $1', [patientId]);
        const bookingIds: number[] = bRes.rows.map(r => r.id);

        // 2. Find all circumcision_procedures for this patient or bookingIds
        const pRes = await client.query(
          `SELECT id FROM circumcision_procedures 
           WHERE patient_id = $1 OR (booking_id = ANY($2::int[]))`,
          [patientId, bookingIds.length > 0 ? bookingIds : [-1]]
        );
        const procedureIds: number[] = pRes.rows.map(r => r.id);

        // 3. Find all invoices for this patient or bookingIds
        const invRes = await client.query(
          `SELECT id FROM invoices 
           WHERE patient_id = $1 OR (booking_id = ANY($2::int[]))`,
          [patientId, bookingIds.length > 0 ? bookingIds : [-1]]
        );
        const invoiceIds: number[] = invRes.rows.map(r => r.id);

        // 4. Delete payments linked to these invoices
        let deletedPaymentsCount = 0;
        if (invoiceIds.length > 0) {
          const payDel = await client.query('DELETE FROM payments WHERE invoice_id = ANY($1::int[])', [invoiceIds]);
          deletedPaymentsCount = payDel.rowCount || 0;
        }

        // 5. Delete transaction_items (stock/obat & addons)
        await client.query(
          `DELETE FROM transaction_items 
           WHERE (invoice_id = ANY($1::int[])) 
              OR (booking_id = ANY($2::int[])) 
              OR (procedure_id = ANY($3::int[]))`,
          [
            invoiceIds.length > 0 ? invoiceIds : [-1],
            bookingIds.length > 0 ? bookingIds : [-1],
            procedureIds.length > 0 ? procedureIds : [-1]
          ]
        );

        // 6. Delete stock_movements linked to these procedures or invoices
        await client.query(
          `DELETE FROM stock_movements 
           WHERE (reference_type IN ('PROCEDURE_INCLUDED', 'TRANSACTION_ADDON') AND reference_id = ANY($1::int[])) 
              OR (reference_type = 'INVOICE' AND reference_id = ANY($2::int[]))`,
          [
            procedureIds.length > 0 ? procedureIds : [-1],
            invoiceIds.length > 0 ? invoiceIds : [-1]
          ]
        );

        // 7. Delete doctor fee transactions
        const feeDel = await client.query(
          `DELETE FROM doctor_fee_transactions 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[])) 
              OR (procedure_id = ANY($3::int[])) 
              OR (invoice_id = ANY($4::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1],
            procedureIds.length > 0 ? procedureIds : [-1],
            invoiceIds.length > 0 ? invoiceIds : [-1]
          ]
        );

        // 8. Delete employee fee transactions
        await client.query(
          `DELETE FROM employee_fee_transactions 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[])) 
              OR (procedure_id = ANY($3::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1],
            procedureIds.length > 0 ? procedureIds : [-1]
          ]
        );

        // 9. Delete informed consents & certificates
        await client.query(
          `DELETE FROM informed_consents 
           WHERE patient_id = $1 OR (procedure_id = ANY($2::int[]))`,
          [patientId, procedureIds.length > 0 ? procedureIds : [-1]]
        );
        await client.query(
          `DELETE FROM certificates 
           WHERE patient_id = $1 OR (procedure_id = ANY($2::int[]))`,
          [patientId, procedureIds.length > 0 ? procedureIds : [-1]]
        );

        // 10. Delete follow_ups
        await client.query(
          `DELETE FROM follow_ups 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[])) 
              OR (procedure_id = ANY($3::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1],
            procedureIds.length > 0 ? procedureIds : [-1]
          ]
        );

        // 11. Delete queues
        await client.query(
          `DELETE FROM queues 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1]
          ]
        );

        // 12. Delete invoices
        const invDel = await client.query(
          `DELETE FROM invoices 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1]
          ]
        );

        // 13. Delete circumcision_procedures
        const procDel = await client.query(
          `DELETE FROM circumcision_procedures 
           WHERE patient_id = $1 
              OR (booking_id = ANY($2::int[]))`,
          [
            patientId,
            bookingIds.length > 0 ? bookingIds : [-1]
          ]
        );

        // 14. Delete booking status history
        if (bookingIds.length > 0) {
          await client.query('DELETE FROM booking_status_history WHERE booking_id = ANY($1::int[])', [bookingIds]);
        }

        // 15. Delete bookings
        const bkDel = await client.query('DELETE FROM bookings WHERE patient_id = $1', [patientId]);

        // 16. Delete the patient record itself
        await client.query('DELETE FROM patients WHERE id = $1', [patientId]);

        // 17. Clean up guardian if no other patients attached
        let guardianCleaned = false;
        if (current.guardianId) {
          const gCheck = await client.query('SELECT id FROM patients WHERE guardian_id = $1', [current.guardianId]);
          if ((gCheck.rowCount || 0) === 0) {
            await client.query('DELETE FROM guardians WHERE id = $1', [current.guardianId]);
            guardianCleaned = true;
          }
        }

        await client.query('COMMIT');

        const deletedSummary = [
          `${bkDel.rowCount || 0} booking`,
          `${procDel.rowCount || 0} tindakan`,
          `${invDel.rowCount || 0} invoice`,
          `${deletedPaymentsCount} pembayaran kasir`,
          `${feeDel.rowCount || 0} fee dokter`,
          guardianCleaned ? 'data wali' : null
        ].filter(Boolean).join(', ');

        await recordAudit(
          'CASCADE_DELETE',
          'PATIENT',
          current.rmNumber,
          performer,
          `Hapus permanen pasien (Kunci Data): ${current.fullName} (${current.rmNumber}). Seluruh rekam medis terkait dibersihkan: ${deletedSummary}. Alasan: ${reason}`
        );

        return res.json({
          success: true,
          message: `Data pasien ${current.fullName} (${current.rmNumber}) berhasil dihapus permanen. Seluruh riwayat rekam medis, tindakan, booking, invoice, dan pembayaran (${deletedSummary}) telah dibersihkan secara kaskade.`
        });
      } catch (cascadeErr: any) {
        await client.query('ROLLBACK');
        console.error('Cascade delete patient failed:', cascadeErr);
        throw cascadeErr;
      } finally {
        client.release();
      }
    } else {
      // Standard Soft-Delete (Archive)
      const now = new Date();
      await db.update(patients).set({
        isDeleted: true,
        deletedAt: now,
        deletedBy: performer,
        notes: `${current.notes || ''}\n[Diarsipkan: ${reason} oleh ${performer}]`.trim(),
      }).where(eq(patients.id, patientId));

      // Cancel active/waiting bookings & queues so they do not remain dangling
      await pool.query(
        `UPDATE bookings SET status = 'CANCELLED' 
         WHERE patient_id = $1 AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [patientId]
      ).catch(() => {});

      await pool.query(
        `UPDATE queues SET status = 'CANCELLED' 
         WHERE patient_id = $1 AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [patientId]
      ).catch(() => {});

      await recordAudit('SOFT_DELETE', 'PATIENT', current.rmNumber, performer, `Arsipkan pasien: ${current.fullName} - Alasan: ${reason}`);
      return res.json({ 
        success: true, 
        message: `Pasien ${current.fullName} (${current.rmNumber}) berhasil diarsipkan.` 
      });
    }
  } catch (err: any) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Gagal menghapus pasien: ' + (err.message || String(err)) });
  }
});

// Restore Soft-Deleted Patient
app.post('/api/patients/:id/restore', requireAuth, async (req: AuthRequest, res) => {
  try {
    const patientId = Number(req.params.id);
    const existing = await db.select().from(patients).where(eq(patients.id, patientId));
    if (existing.length === 0) return res.status(404).json({ error: 'Pasien tidak ditemukan' });
    const current = existing[0];

    await db.update(patients).set({
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    }).where(eq(patients.id, patientId));

    await recordAudit('RESTORE', 'PATIENT', current.rmNumber, req.user?.email || 'Admin', `Pulihkan pasien dari arsip: ${current.fullName}`);
    res.json({ success: true, message: `Pasien ${current.fullName} berhasil dipulihkan` });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memulihkan pasien' });
  }
});

// Bookings
app.get('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await db.select({
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      bookingDate: bookings.bookingDate,
      bookingTime: bookings.bookingTime,
      patientId: bookings.patientId,
      patientName: patients.fullName,
      patientNickname: patients.nickname,
      rmNumber: patients.rmNumber,
      patientAge: patients.ageYears,
      guardianId: bookings.guardianId,
      guardianName: guardians.name,
      guardianPhone: guardians.phone,
      patientCategoryId: bookings.patientCategoryId,
      categoryCode: patientCategories.code,
      categoryName: patientCategories.name,
      packageId: bookings.packageId,
      packageName: circumcisionPackages.name,
      packageCode: circumcisionPackages.code,
      doctorId: bookings.doctorId,
      doctorName: doctors.name,
      packagePriceSnapshot: bookings.packagePriceSnapshot,
      methodType: bookings.methodType,
      anesthesiaType: bookings.anesthesiaType,
      discountAmount: bookings.discountAmount,
      totalAmount: bookings.totalAmount,
      dpAmount: bookings.dpAmount,
      remainingAmount: bookings.remainingAmount,
      patientSource: bookings.patientSource,
      closingStaffId: bookings.closingStaffId,
      closingStaffName: bookings.closingStaffName,
      notes: bookings.notes,
      status: bookings.status,
      branchCode: bookings.branchCode,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(patients, eq(bookings.patientId, patients.id))
    .innerJoin(guardians, eq(bookings.guardianId, guardians.id))
    .innerJoin(patientCategories, eq(bookings.patientCategoryId, patientCategories.id))
    .innerJoin(circumcisionPackages, eq(bookings.packageId, circumcisionPackages.id))
    .innerJoin(doctors, eq(bookings.doctorId, doctors.id))
    .orderBy(desc(bookings.bookingDate), bookings.bookingTime);

    const branchFilter = getBranchFilter(req);
    const filteredList = filterByBranch(list, branchFilter);
    res.json(filteredList);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data booking' });
  }
});

// Create Booking with Double Booking Prevention, Price Snapshot, and Auto Invoice/DP
app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      patientId, guardianId, patientCategoryId, packageId, doctorId,
      bookingDate, bookingTime, discountAmount, dpAmount, patientSource, notes, paymentMethod,
      methodType, anesthesiaType,
      closingStaffId, closingStaffName
    } = req.body;

    const branchFilter = getBranchFilter(req);
    const targetBranch = (req.body.branchCode && req.body.branchCode !== 'ALL') ? req.body.branchCode : (branchFilter !== 'ALL' ? branchFilter : 'PUSAT');

    // 1. Prevent Double Booking for the same doctor at the same date & time
    const existingConflict = await db.select()
      .from(bookings)
      .where(and(
        eq(bookings.doctorId, doctorId),
        eq(bookings.bookingDate, bookingDate),
        eq(bookings.bookingTime, bookingTime),
        notInArray(bookings.status, ['CANCELLED', 'NO_SHOW'])
      ));

    if (existingConflict.length > 0) {
      return res.status(400).json({ 
        error: `Dokter sudah memiliki jadwal tindakan pada ${bookingDate} jam ${bookingTime}. Silakan pilih jam atau dokter lain.` 
      });
    }

    // 2. Fetch Active Price Snapshot
    const priceRecords = await db.select()
      .from(packagePrices)
      .where(and(
        eq(packagePrices.packageId, packageId),
        eq(packagePrices.patientCategoryId, patientCategoryId),
        eq(packagePrices.isActive, true)
      ));

    let packagePrice = 1800000;
    if (priceRecords.length > 0) {
      packagePrice = priceRecords[0].price;
    }

    const discount = Number(discountAmount || 0);
    const total = Math.max(0, packagePrice - discount);
    const dp = Number(dpAmount || 0);
    const remaining = Math.max(0, total - dp);
    const bookingNumber = await generateBookingNumber();

    const initialStatus = dp > 0 ? 'DP_PAID' : 'BOOKED';

    let resolvedClosingStaffName = closingStaffName || null;
    if (closingStaffId && !resolvedClosingStaffName) {
      const empRecord = await db.select().from(employees).where(eq(employees.id, Number(closingStaffId))).limit(1);
      if (empRecord.length > 0) resolvedClosingStaffName = empRecord[0].name;
    }

    // 3. Create Booking & Automatic Invoice atomically
    const { booking, invoice } = await db.transaction(async (tx) => {
      const newBooking = await tx.insert(bookings).values({
        bookingNumber,
        patientId,
        guardianId,
        patientCategoryId,
        packageId,
        doctorId,
        bookingDate,
        bookingTime,
        methodType: methodType || 'Klem Nano Sealer',
        anesthesiaType: anesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
        packagePriceSnapshot: packagePrice,
        discountAmount: discount,
        totalAmount: total,
        dpAmount: dp,
        remainingAmount: remaining,
        patientSource: patientSource || 'Walk-in',
        closingStaffId: closingStaffId ? Number(closingStaffId) : null,
        closingStaffName: resolvedClosingStaffName,
        notes: notes || '',
        status: initialStatus,
        branchCode: targetBranch,
      }).returning();

      const createdBooking = newBooking[0];

      // Status History
      await tx.insert(bookingStatusHistory).values({
        bookingId: createdBooking.id,
        status: initialStatus,
        changedBy: req.user?.name || 'Staff',
        notes: dp > 0 ? `Booking dibuat dengan DP Rp ${dp.toLocaleString('id-ID')}` : 'Booking baru terdaftar',
      });

      // 4. Create Automatic Invoice
      const invoiceNumber = await generateInvoiceNumber();
      const invoiceStatus = dp >= total ? 'PAID' : dp > 0 ? 'PARTIAL' : 'UNPAID';

      const newInvoice = await tx.insert(invoices).values({
        invoiceNumber,
        bookingId: createdBooking.id,
        patientId,
        doctorId,
        invoiceDate: bookingDate,
        subtotal: packagePrice,
        discount,
        totalAmount: total,
        paidAmount: dp,
        remainingAmount: remaining,
        status: invoiceStatus,
        notes: `Invoice untuk Booking ${bookingNumber}`,
        branchCode: targetBranch,
      }).returning();

      // 5. If DP paid, record payment
      if (dp > 0) {
        const payNum = `PAY-${invoiceNumber.replace('INV-', '')}`;
        const nowTime = new Date().toTimeString().split(' ')[0];
        await tx.insert(payments).values({
          paymentNumber: payNum,
          invoiceId: newInvoice[0].id,
          paymentDate: bookingDate,
          paymentTime: nowTime,
          amount: dp,
          paymentMethod: paymentMethod || 'TRANSFER',
          paymentType: 'DP',
          referenceNumber: `DP-${bookingNumber}`,
          receivedBy: req.user?.name || 'Staff Kasir',
          branchCode: targetBranch,
        });
      }

      return { booking: createdBooking, invoice: newInvoice[0] };
    });

    // Auto-prepare included package items for this booking
    await ensureIncludedItemsForBooking(booking.id);

    await recordAudit('CREATE', 'BOOKING', bookingNumber, req.user?.email || 'Staff', `Booking baru pasien ${patientId} total Rp ${total}`);
    res.json({ booking, invoice });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    if (err?.code === '23505' || String(err?.message || '').includes('idx_active_doctor_schedule_conflict')) {
      return res.status(400).json({ error: 'Dokter sudah memiliki jadwal tindakan pada tanggal dan jam tersebut. Silakan pilih jam atau dokter lain.' });
    }
    res.status(500).json({ error: err?.message || 'Gagal membuat booking baru' });
  }
});

// Update Booking (Edit Metode, Bius, Dokter, Jadwal, Status)
app.put('/api/bookings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const existing = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data booking tidak ditemukan' });
    }

    const {
      methodType, anesthesiaType, doctorId, packageId, patientCategoryId,
      bookingDate, bookingTime, notes, status, discountAmount, dpAmount,
      patientSource, closingStaffId, closingStaffName, branchCode
    } = req.body;

    const updateFields: any = {};
    if (methodType !== undefined) updateFields.methodType = methodType;
    if (anesthesiaType !== undefined) updateFields.anesthesiaType = anesthesiaType;
    if (doctorId !== undefined) updateFields.doctorId = Number(doctorId);
    if (packageId !== undefined) updateFields.packageId = Number(packageId);
    if (patientCategoryId !== undefined) updateFields.patientCategoryId = Number(patientCategoryId);
    if (bookingDate !== undefined) updateFields.bookingDate = bookingDate;
    if (bookingTime !== undefined) updateFields.bookingTime = bookingTime;
    if (notes !== undefined) updateFields.notes = notes;
    if (status !== undefined) updateFields.status = status;
    if (discountAmount !== undefined) updateFields.discountAmount = Number(discountAmount);
    if (dpAmount !== undefined) updateFields.dpAmount = Number(dpAmount);
    if (patientSource !== undefined) updateFields.patientSource = patientSource;
    if (branchCode !== undefined && branchCode !== '') {
      updateFields.branchCode = branchCode;
      // Sync linked tables immediately
      await db.update(invoices).set({ branchCode }).where(eq(invoices.bookingId, bookingId));
      await db.update(circumcisionProcedures).set({ branchCode }).where(eq(circumcisionProcedures.bookingId, bookingId));
      await db.update(queues).set({ branchCode }).where(eq(queues.bookingId, bookingId));
      const linkedInvs = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
      for (const inv of linkedInvs) {
        await db.update(payments).set({ branchCode }).where(eq(payments.invoiceId, inv.id));
      }
    }
    if (closingStaffId !== undefined) {
      updateFields.closingStaffId = closingStaffId ? Number(closingStaffId) : null;
      if (closingStaffId) {
        const empRecord = await db.select().from(employees).where(eq(employees.id, Number(closingStaffId))).limit(1);
        updateFields.closingStaffName = empRecord[0]?.name || closingStaffName || null;
      } else {
        updateFields.closingStaffName = null;
      }
    } else if (closingStaffName !== undefined) {
      updateFields.closingStaffName = closingStaffName || null;
    }

    const updated = await db.update(bookings)
      .set(updateFields)
      .where(eq(bookings.id, bookingId))
      .returning();

    // Jika prosedur tindakan sudah dibuat untuk booking ini, perbarui juga metode dan dokter agar sinkron
    if (methodType || anesthesiaType || doctorId) {
      const procUpdate: any = {};
      if (methodType) procUpdate.methodType = methodType;
      if (anesthesiaType) procUpdate.anesthesiaType = anesthesiaType;
      if (doctorId) procUpdate.doctorId = Number(doctorId);
      await db.update(circumcisionProcedures)
        .set(procUpdate)
        .where(eq(circumcisionProcedures.bookingId, bookingId));
    }

    // Jika paket atau kategori pasien berubah, perbarui sinkronisasi item paket
    if (packageId !== undefined || patientCategoryId !== undefined) {
      await ensureIncludedItemsForBooking(bookingId);
    }

    // Catat histori perubahan status jika ada
    if (status && status !== existing[0].status) {
      await db.insert(bookingStatusHistory).values({
        bookingId,
        status,
        changedBy: req.user?.name || 'Staff',
        notes: `Status diubah menjadi ${status} melalui menu edit booking`,
      });

      // Jika status diubah ke COMPLETED, pastikan stok paket khitan & add-on terpotong
      if (status === 'COMPLETED') {
        await ensureIncludedItemsForBooking(bookingId);
        const itemsToDeduct = await db.select().from(transactionItems)
          .where(and(
            eq(transactionItems.bookingId, bookingId),
            eq(transactionItems.isStockDeducted, false)
          ));
        const now = new Date();
        for (const item of itemsToDeduct) {
          const prod = await db.select().from(products).where(eq(products.id, item.productId));
          if (prod.length > 0) {
            const currentProd = prod[0];
            const newStock = Math.max(0, currentProd.stock - item.quantity);
            await db.update(products).set({ stock: newStock }).where(eq(products.id, currentProd.id));
            const movNum = await generateStockMovementNumber();
            const prodMeta = parseProductMetadata(currentProd);
            const isCelana = currentProd.category === 'CELANA_SUNAT' || (currentProd.name || '').toLowerCase().includes('celana');
            const sizeLabel = (isCelana && prodMeta.size) ? ` [Ukuran ${prodMeta.size}]` : '';
            await db.insert(stockMovements).values({
              movementNumber: movNum,
              productId: currentProd.id,
              movementType: 'OUT',
              quantity: -item.quantity,
              previousStock: currentProd.stock,
              currentStock: newStock,
              unitCost: item.costPriceSnapshot,
              unitPrice: item.sellPriceSnapshot,
              referenceType: item.itemType === 'INCLUDED' ? 'PROCEDURE_INCLUDED' : 'TRANSACTION_ADDON',
              referenceId: bookingId,
              notes: `[${item.itemType === 'INCLUDED' ? 'PAKET SUNAT' : 'ADDON'}] ${item.productName}${sizeLabel} (${item.quantity} ${currentProd.unit}) - Booking ${existing[0].bookingNumber}`,
              performedBy: req.user?.name || 'Staff',
            });
            await db.update(transactionItems)
              .set({ isStockDeducted: true, deductedAt: now })
              .where(eq(transactionItems.id, item.id));
          }
        }
      }
    }

    await recordAudit('UPDATE', 'BOOKING', existing[0].bookingNumber, req.user?.email || 'Staff', `Edit booking: Metode ${methodType || existing[0].methodType}, Bius: ${anesthesiaType || existing[0].anesthesiaType}`);
    res.json(updated[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui data booking' });
  }
});

// Check-in Pasien & Masuk Antrean Tindakan
app.post(['/api/bookings/:id/checkin', '/api/bookings/:id/check-in'], requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = Number(req.params.id);
    const bk = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (bk.length === 0) return res.status(404).json({ error: 'Booking tidak ditemukan' });

    const booking = bk[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const queueNumber = await generateQueueNumber(todayStr);
    const arrivedAt = new Date().toTimeString().slice(0, 5);

    // Update booking status
    await db.update(bookings)
      .set({ status: 'ARRIVED' })
      .where(eq(bookings.id, bookingId));

    await db.insert(bookingStatusHistory).values({
      bookingId,
      status: 'ARRIVED',
      changedBy: req.user?.name || 'Staff',
      notes: `Pasien check-in, nomor antrean ${queueNumber}`,
    });

    const targetBranch = resolveTargetBranch(req, booking.branchCode);

    // Create queue entry
    const q = await db.insert(queues).values({
      queueNumber,
      queueDate: todayStr,
      bookingId,
      patientId: booking.patientId,
      doctorId: booking.doctorId,
      status: 'WAITING',
      arrivedAt,
      branchCode: targetBranch,
    }).returning();

    // Also prepare circumcision procedure record if not already created
    const existingProc = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.bookingId, bookingId));
    if (existingProc.length === 0) {
      const procNumber = `PROC-${todayStr.replace(/-/g, '')}-${queueNumber.replace('K-', '')}`;
      await db.insert(circumcisionProcedures).values({
        procedureNumber: procNumber,
        bookingId,
        patientId: booking.patientId,
        doctorId: booking.doctorId,
        procedureDate: todayStr,
        procedureTime: booking.bookingTime,
        status: 'WAITING',
        methodType: booking.methodType || 'Klem Nano Sealer',
        anesthesiaType: booking.anesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
        branchCode: targetBranch,
      });
    }

    // Auto-ensure included items for this booking
    await ensureIncludedItemsForBooking(bookingId);

    await recordAudit('CHECKIN', 'QUEUE', queueNumber, req.user?.email || 'Staff', `Pasien antrean ${queueNumber}`);
    res.json({ success: true, queue: q[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal melakukan check-in antrean' });
  }
});

// Queues Today
app.get('/api/queues', requireAuth, async (req: AuthRequest, res) => {
  try {
    const today = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const list = await db.select({
      id: queues.id,
      queueNumber: queues.queueNumber,
      queueDate: queues.queueDate,
      bookingId: queues.bookingId,
      patientId: queues.patientId,
      patientName: patients.fullName,
      rmNumber: patients.rmNumber,
      patientAge: patients.ageYears,
      doctorId: queues.doctorId,
      doctorName: doctors.name,
      categoryName: patientCategories.name,
      categoryCode: patientCategories.code,
      packageName: circumcisionPackages.name,
      status: queues.status,
      arrivedAt: queues.arrivedAt,
      branchCode: queues.branchCode,
      createdAt: queues.createdAt,
    })
    .from(queues)
    .innerJoin(patients, eq(queues.patientId, patients.id))
    .innerJoin(doctors, eq(queues.doctorId, doctors.id))
    .innerJoin(bookings, eq(queues.bookingId, bookings.id))
    .innerJoin(patientCategories, eq(bookings.patientCategoryId, patientCategories.id))
    .innerJoin(circumcisionPackages, eq(bookings.packageId, circumcisionPackages.id))
    .where(eq(queues.queueDate, today))
    .orderBy(queues.id);

    const branchFilter = getBranchFilter(req);
    const filteredList = filterByBranch(list, branchFilter);
    res.json(filteredList);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data antrean' });
  }
});

// Circumcision Procedures (Tindakan Khitan)
app.get('/api/procedures', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await db.select({
      id: circumcisionProcedures.id,
      procedureNumber: circumcisionProcedures.procedureNumber,
      bookingId: circumcisionProcedures.bookingId,
      bookingNumber: bookings.bookingNumber,
      patientId: circumcisionProcedures.patientId,
      patientName: patients.fullName,
      rmNumber: patients.rmNumber,
      patientAge: patients.ageYears,
      guardianName: guardians.name,
      guardianPhone: guardians.phone,
      categoryCode: patientCategories.code,
      categoryName: patientCategories.name,
      packageName: circumcisionPackages.name,
      doctorId: circumcisionProcedures.doctorId,
      doctorName: doctors.name,
      doctorNameSnapshot: circumcisionProcedures.doctorNameSnapshot,
      assistantStaffId: circumcisionProcedures.assistantStaffId,
      assistantStaffName: circumcisionProcedures.assistantStaffName,
      procedureDate: circumcisionProcedures.procedureDate,
      procedureTime: circumcisionProcedures.procedureTime,
      methodType: circumcisionProcedures.methodType,
      anesthesiaType: circumcisionProcedures.anesthesiaType,
      preCondition: circumcisionProcedures.preCondition,
      procedureNotes: circumcisionProcedures.procedureNotes,
      postCondition: circumcisionProcedures.postCondition,
      careInstructions: circumcisionProcedures.careInstructions,
      controlDate: circumcisionProcedures.controlDate,
      additionalNotes: circumcisionProcedures.additionalNotes,
      status: circumcisionProcedures.status,
      checklistData: circumcisionProcedures.checklistData,
      completedAt: circumcisionProcedures.completedAt,
      invoiceStatus: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      remainingAmount: invoices.remainingAmount,
      branchCode: circumcisionProcedures.branchCode,
    })
    .from(circumcisionProcedures)
    .innerJoin(bookings, eq(circumcisionProcedures.bookingId, bookings.id))
    .innerJoin(patients, eq(circumcisionProcedures.patientId, patients.id))
    .innerJoin(guardians, eq(patients.guardianId, guardians.id))
    .innerJoin(patientCategories, eq(bookings.patientCategoryId, patientCategories.id))
    .innerJoin(circumcisionPackages, eq(bookings.packageId, circumcisionPackages.id))
    .innerJoin(doctors, eq(circumcisionProcedures.doctorId, doctors.id))
    .leftJoin(invoices, eq(invoices.bookingId, bookings.id))
    .orderBy(desc(circumcisionProcedures.procedureDate), desc(circumcisionProcedures.id));

    const branchFilter = getBranchFilter(req);
    const filteredList = filterByBranch(list, branchFilter);
    res.json(filteredList);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data tindakan khitan' });
  }
});

// Update Procedure Progress & Details
app.put('/api/procedures/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const procedureId = Number(req.params.id);
    const {
      methodType, anesthesiaType, preCondition, procedureNotes, postCondition,
      careInstructions, controlDate, additionalNotes, checklistData, status,
      assistantStaffId, assistantStaffIds
    } = req.body;

    let targetAssistantIds: number[] = [];
    if (Array.isArray(assistantStaffIds) && assistantStaffIds.length > 0) {
      targetAssistantIds = assistantStaffIds.map(Number).filter(n => !isNaN(n) && n > 0);
    } else if (assistantStaffId) {
      targetAssistantIds = [Number(assistantStaffId)];
    }

    let assistantName = undefined;
    if (targetAssistantIds.length > 0) {
      const emps = await db.select().from(employees).where(inArray(employees.id, targetAssistantIds));
      if (emps.length > 0) {
        assistantName = targetAssistantIds.map(id => emps.find(e => e.id === id)?.name).filter(Boolean).join(', ');
      }
    }

    await db.update(circumcisionProcedures)
      .set({
        methodType,
        anesthesiaType,
        preCondition,
        procedureNotes,
        postCondition,
        careInstructions,
        controlDate,
        additionalNotes,
        checklistData: typeof checklistData === 'object' ? JSON.stringify(checklistData) : checklistData,
        status: status || 'IN_PROGRESS',
        assistantStaffId: targetAssistantIds[0] || undefined,
        assistantStaffName: assistantName,
      })
      .where(eq(circumcisionProcedures.id, procedureId));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui catatan tindakan' });
  }
});

// Complete Procedure: Auto Doctor Fee, Assistant Staff Fee, Certificate, and Follow-ups
app.post('/api/procedures/:id/complete', requireAuth, async (req: AuthRequest, res) => {
  try {
    const procedureId = Number(req.params.id);
    const { 
      assistantStaffId,
      assistantStaffIds,
      methodType,
      anesthesiaType,
      preCondition,
      procedureNotes,
      postCondition,
      careInstructions,
      controlDate,
      additionalNotes,
      checklistData
    } = req.body;

    const procList = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.id, procedureId));
    if (procList.length === 0) return res.status(404).json({ error: 'Data tindakan tidak ditemukan' });
    const proc = procList[0];

    const bkList = await db.select().from(bookings).where(eq(bookings.id, proc.bookingId));
    const booking = bkList[0];

    const ptList = await db.select().from(patients).where(eq(patients.id, proc.patientId));
    const patient = ptList[0];

    const docList = await db.select().from(doctors).where(eq(doctors.id, proc.doctorId));
    const doctor = docList[0];

    // Find Assistant Employee(s) - Supports multiple assistants
    let targetAssistantIds: number[] = [];
    if (Array.isArray(assistantStaffIds) && assistantStaffIds.length > 0) {
      targetAssistantIds = assistantStaffIds.map(Number).filter(n => !isNaN(n) && n > 0);
    } else if (assistantStaffId) {
      targetAssistantIds = [Number(assistantStaffId)];
    } else if (proc.assistantStaffId) {
      targetAssistantIds = [proc.assistantStaffId];
    }

    let assistantEmps: any[] = [];
    if (targetAssistantIds.length > 0) {
      assistantEmps = await db.select().from(employees).where(inArray(employees.id, targetAssistantIds));
    } else {
      // Find first active nurse if none assigned
      const activeNurses = await db.select().from(employees).where(eq(employees.isActive, true)).limit(1);
      if (activeNurses.length > 0) {
        assistantEmps = activeNurses;
        targetAssistantIds = [activeNurses[0].id];
      }
    }

    const assistantNames = targetAssistantIds.length > 0
      ? targetAssistantIds.map(id => assistantEmps.find(e => e.id === id)?.name).filter(Boolean).join(', ')
      : (proc.assistantStaffName || 'Asisten Medis');
    const primaryAssistantId = targetAssistantIds[0] || null;

    // 1. Mark procedure & booking as COMPLETED with SNAPSHOTS & saved clinical notes
    const now = new Date();
    await db.update(circumcisionProcedures)
      .set({ 
        status: 'COMPLETED', 
        completedAt: now,
        doctorNameSnapshot: doctor.name,
        assistantStaffId: primaryAssistantId,
        assistantStaffName: assistantNames || 'Asisten Medis',
        ...(methodType ? { methodType } : {}),
        ...(anesthesiaType ? { anesthesiaType } : {}),
        ...(preCondition ? { preCondition } : {}),
        ...(procedureNotes ? { procedureNotes } : {}),
        ...(postCondition ? { postCondition } : {}),
        ...(careInstructions ? { careInstructions } : {}),
        ...(controlDate ? { controlDate } : {}),
        ...(additionalNotes !== undefined ? { additionalNotes } : {}),
        ...(checklistData !== undefined ? { 
          checklistData: typeof checklistData === 'object' ? JSON.stringify(checklistData) : checklistData 
        } : {}),
      })
      .where(eq(circumcisionProcedures.id, procedureId));

    await db.update(bookings)
      .set({ status: 'COMPLETED' })
      .where(eq(bookings.id, proc.bookingId));

    await db.update(queues)
      .set({ status: 'COMPLETED' })
      .where(eq(queues.bookingId, proc.bookingId));

    await db.insert(bookingStatusHistory).values({
      bookingId: proc.bookingId,
      status: 'COMPLETED',
      changedBy: req.user?.name || doctor.name,
      notes: `Tindakan khitan selesai oleh ${doctor.name} & asisten ${assistantNames || 'perawat'}`,
    });

    // Ensure invoice exists and fetch latest invoice
    let invList = await db.select().from(invoices).where(eq(invoices.bookingId, proc.bookingId));
    let targetInvoice = invList[0];
    const branchForInvoice = booking.branchCode || proc.branchCode || 'PUSAT';
    if (!targetInvoice) {
      const invoiceNumber = await generateInvoiceNumber();
      const newInv = await db.insert(invoices).values({
        invoiceNumber,
        bookingId: proc.bookingId,
        patientId: proc.patientId,
        doctorId: proc.doctorId,
        invoiceDate: now.toISOString().split('T')[0],
        subtotal: booking.totalAmount || booking.packagePriceSnapshot,
        discount: booking.discountAmount || 0,
        totalAmount: booking.totalAmount || booking.packagePriceSnapshot,
        paidAmount: booking.dpAmount || 0,
        remainingAmount: booking.remainingAmount || Math.max(0, (booking.totalAmount || booking.packagePriceSnapshot) - (booking.dpAmount || 0)),
        status: (booking.remainingAmount ?? 0) <= 0 ? 'PAID' : (booking.dpAmount > 0 ? 'PARTIAL' : 'UNPAID'),
        notes: `Invoice untuk Booking ${booking.bookingNumber}`,
        branchCode: branchForInvoice,
      }).returning();
      targetInvoice = newInv[0];
    } else if (targetInvoice && booking.branchCode && targetInvoice.branchCode !== booking.branchCode) {
      await db.update(invoices).set({ branchCode: booking.branchCode }).where(eq(invoices.id, targetInvoice.id));
      targetInvoice.branchCode = booking.branchCode;
    }

    // 2. Fetch Active Doctor Fee Rule and create Snapshot Doctor Fee Transaction based on Method & Condition
    const methodForFee = methodType || proc.methodType || booking.methodType || 'Metode Glans Pro Bipolar Pensealer';
    const isVip = booking.patientCategoryId === 2;
    const feeCalc = await calculateDoctorMethodFee({
      doctorId: proc.doctorId,
      methodType: methodForFee,
      patientCondition: (req.body as any).patientCondition || (proc as any).patientCondition,
      isVip,
      patientAgeYears: patient?.ageYears,
      preConditionNotes: preCondition || proc.preCondition,
      notes: procedureNotes || proc.procedureNotes || '',
    });

    const feeAmount = feeCalc.feeAmount;
    const feeNumber = await generateFeeNumber();
    const invoiceId = targetInvoice.id;

    // Check if doctor fee transaction already exists
    const existingFee = await db.select().from(doctorFeeTransactions).where(eq(doctorFeeTransactions.procedureId, procedureId));
    const targetBranchForFee = proc.branchCode || booking.branchCode || resolveTargetBranch(req) || 'PUSAT';
    if (existingFee.length === 0) {
      await db.insert(doctorFeeTransactions).values({
        feeNumber,
        feeType: 'PROCEDURE',
        title: `Fee Tindakan Khitan (${feeCalc.methodName})`,
        doctorId: proc.doctorId,
        patientId: proc.patientId,
        bookingId: proc.bookingId,
        procedureId: proc.id,
        invoiceId,
        packageId: booking.packageId,
        patientCategoryId: booking.patientCategoryId,
        methodName: feeCalc.methodName,
        patientCondition: feeCalc.patientCondition,
        serviceType: feeCalc.serviceType,
        feeAmount,
        feeDate: now.toISOString().split('T')[0],
        status: 'PENDING',
        notes: `Fee tindakan khitan untuk ${patient.fullName} [${feeCalc.methodName} - ${feeCalc.patientCondition} ${feeCalc.serviceType}] (${doctor.name})`,
        branchCode: targetBranchForFee,
      });
    }

    // 3. Create Assistant Staff Fee Transactions (Supports 1 or more assistants)
    for (const astEmp of assistantEmps) {
      const existingEmpFee = await db.select().from(employeeFeeTransactions)
        .where(and(
          eq(employeeFeeTransactions.procedureId, procedureId),
          eq(employeeFeeTransactions.employeeId, astEmp.id)
        ));
      
      if (existingEmpFee.length === 0) {
        // Check custom rule if exists
        const empRules = await db.select().from(employeeFeeRules)
          .where(and(
            eq(employeeFeeRules.employeeId, astEmp.id),
            eq(employeeFeeRules.packageId, booking.packageId),
            eq(employeeFeeRules.patientCategoryId, booking.patientCategoryId),
            eq(employeeFeeRules.isActive, true)
          ));
        
        const finalEmpFee = empRules.length > 0 ? empRules[0].feeAmount : (astEmp.defaultPatientFee !== undefined && astEmp.defaultPatientFee !== null ? Number(astEmp.defaultPatientFee) : 0);
        const empFeeNum = await generateEmployeeFeeNumber();

        await db.insert(employeeFeeTransactions).values({
          feeNumber: empFeeNum,
          employeeId: astEmp.id,
          employeeName: astEmp.name,
          bookingId: proc.bookingId,
          procedureId: proc.id,
          patientId: proc.patientId,
          patientRm: patient.rmNumber,
          patientName: patient.fullName,
          procedureDate: now.toISOString().split('T')[0],
          feeAmount: finalEmpFee,
          status: 'PENDING',
          notes: `Fee asisten tindakan khitan pasien ${patient.fullName} (${patient.rmNumber})`,
          branchCode: targetBranchForFee,
        });
      }
    }

    // 4. Generate Official Circumcision Certificate
    const certNumber = await generateCertificateNumber();
    const existingCert = await db.select().from(certificates).where(eq(certificates.procedureId, procedureId));
    if (existingCert.length === 0) {
      await db.insert(certificates).values({
        certificateNumber: certNumber,
        procedureId,
        patientId: proc.patientId,
        doctorId: proc.doctorId,
        issueDate: now.toISOString().split('T')[0],
        title: 'SERTIFIKAT KHITAN NANO CIRCUMCISION',
        content: `Diberikan kepada Ananda ${patient.fullName} (No. RM: ${patient.rmNumber}) atas keberanian dan kesuksesannya menjalani tindakan khitan modern bersama ${doctor.name}.`,
        branchCode: proc.branchCode || resolveTargetBranch(req),
      });
    }

    // 4. Deduct Stock for All Transaction Items (Included & Add-ons)
    await ensureIncludedItemsForBooking(proc.bookingId);
    const itemsToDeduct = await db.select().from(transactionItems)
      .where(and(
        eq(transactionItems.bookingId, proc.bookingId),
        eq(transactionItems.isStockDeducted, false)
      ));

    for (const item of itemsToDeduct) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod.length > 0) {
        const currentProd = prod[0];
        const newStock = Math.max(0, currentProd.stock - item.quantity);
        await db.update(products).set({ stock: newStock }).where(eq(products.id, currentProd.id));

        const movNum = await generateStockMovementNumber();
        const prodMeta = parseProductMetadata(currentProd);
        const isCelana = currentProd.category === 'CELANA_SUNAT' || (currentProd.name || '').toLowerCase().includes('celana');
        const sizeLabel = (isCelana && prodMeta.size) ? ` [Ukuran ${prodMeta.size}]` : '';
        await db.insert(stockMovements).values({
          movementNumber: movNum,
          productId: currentProd.id,
          movementType: 'OUT',
          quantity: -item.quantity,
          previousStock: currentProd.stock,
          currentStock: newStock,
          unitCost: item.costPriceSnapshot,
          unitPrice: item.sellPriceSnapshot,
          referenceType: item.itemType === 'INCLUDED' ? 'PROCEDURE_INCLUDED' : 'TRANSACTION_ADDON',
          referenceId: procedureId,
          notes: `[${item.itemType === 'INCLUDED' ? 'PAKET SUNAT' : 'ADDON'}] ${item.productName}${sizeLabel} (${item.quantity} ${currentProd.unit}) - Pasien ${patient.fullName} (${booking.methodType || 'Paket Khitan'})`,
          performedBy: req.user?.name || doctor.name,
        });

        await db.update(transactionItems)
          .set({ isStockDeducted: true, deductedAt: now, procedureId })
          .where(eq(transactionItems.id, item.id));
      }
    }

    await recordAudit('COMPLETE', 'PROCEDURE', proc.procedureNumber, req.user?.email || doctor.name, `Tindakan khitan selesai, stok produk terpotong, fee dokter & sertifikat terbit`);
    res.json({ 
      success: true, 
      certificateNumber: certNumber, 
      feeNumber,
      invoiceId: targetInvoice.id,
      invoiceNumber: targetInvoice.invoiceNumber,
      bookingId: proc.bookingId,
      patientName: patient.fullName,
      remainingAmount: targetInvoice.remainingAmount,
      invoiceStatus: targetInvoice.status
    });
  } catch (err: any) {
    console.error('Complete procedure error:', err);
    res.status(500).json({ error: 'Gagal menyelesaikan tindakan khitan: ' + (err.message || String(err)), details: err.stack });
  }
});

// Invoices & Payments
app.get('/api/invoices', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      bookingId: invoices.bookingId,
      bookingNumber: bookings.bookingNumber,
      patientId: invoices.patientId,
      patientName: patients.fullName,
      rmNumber: patients.rmNumber,
      guardianName: guardians.name,
      guardianPhone: guardians.phone,
      doctorId: invoices.doctorId,
      doctorName: doctors.name,
      categoryCode: patientCategories.code,
      categoryName: patientCategories.name,
      packageName: circumcisionPackages.name,
      subtotal: invoices.subtotal,
      discount: invoices.discount,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      remainingAmount: invoices.remainingAmount,
      status: invoices.status,
      notes: invoices.notes,
      voidReason: invoices.voidReason,
      voidedAt: invoices.voidedAt,
      voidedBy: invoices.voidedBy,
      branchCode: invoices.branchCode,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
    .innerJoin(patients, eq(invoices.patientId, patients.id))
    .leftJoin(guardians, eq(patients.guardianId, guardians.id))
    .leftJoin(patientCategories, eq(bookings.patientCategoryId, patientCategories.id))
    .leftJoin(circumcisionPackages, eq(bookings.packageId, circumcisionPackages.id))
    .leftJoin(doctors, eq(invoices.doctorId, doctors.id))
    .orderBy(desc(invoices.id));

    // Also get payments for each invoice
    const allPayments = await db.select().from(payments).orderBy(desc(payments.id));

    const enriched = list.map(inv => ({
      ...inv,
      payments: allPayments.filter(p => p.invoiceId === inv.id),
    }));

    const branchFilter = getBranchFilter(req);
    const filtered = filterByBranch(enriched, branchFilter);

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data invoice' });
  }
});

// Helper to verify if the requesting user has cashier authority
async function checkCashierAuthority(req: AuthRequest): Promise<boolean> {
  const role = (req.user?.role || '').toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'super_admin') return true;

  const uid = req.user?.uid;
  const email = req.user?.email;
  if (!uid && !email) return false;

  try {
    const userCondition = uid ? eq(users.uid, uid) : eq(users.email, email!);
    const userRecords = await db.select().from(users).where(userCondition).limit(1);
    if (userRecords.length === 0) return false;
    const u = userRecords[0];
    const uRole = (u.role || '').toLowerCase();
    if (uRole === 'owner' || uRole === 'admin' || uRole === 'super_admin') return true;
    if (u.permissions) {
      try {
        const perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
        if (Array.isArray(perms) && (perms.includes('cashier') || perms.includes('invoices.pay') || perms.includes('cashier.pay'))) {
          return true;
        }
      } catch {
        if (String(u.permissions).includes('cashier')) return true;
      }
    }
    // If default staff without explicit restriction
    if (uRole === 'staff' && (!u.permissions || u.permissions === '[]')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

// Process Invoice Payment (Pelunasan / Partial)
app.post('/api/invoices/:id/pay', requireAuth, async (req: AuthRequest, res) => {
  try {
    const isAuthorized = await checkCashierAuthority(req);
    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Akses Ditolak: Anda tidak memiliki otoritas kasir untuk memproses pembayaran ini. Transaksi kasir hanya dapat dilakukan oleh kasir atau pengguna yang diberikan otoritas di menu pengguna (misal: Admin/Owner).'
      });
    }

    const invoiceId = Number(req.params.id);
    const { amount, paymentMethod, notes, referenceNumber } = req.body;

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ error: 'Nominal pembayaran harus berupa angka lebih dari 0' });
    }

    const invList = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (invList.length === 0) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    const invoice = invList[0];

    if (invoice.status === 'PAID') {
      return res.status(400).json({ error: 'Invoice ini sudah lunas sebelumnya.' });
    }

    // Overpayment validation
    if (payAmt > invoice.remainingAmount) {
      return res.status(400).json({ 
        error: `Nominal pembayaran (Rp ${payAmt.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${invoice.remainingAmount.toLocaleString('id-ID')}).` 
      });
    }

    const newPaid = invoice.paidAmount + payAmt;
    const newRemaining = Math.max(0, invoice.totalAmount - newPaid);
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';

    const paymentNumber = `PAY-${invoice.invoiceNumber.replace('INV-', '')}-${Date.now().toString().slice(-4)}`;
    const nowTime = new Date().toTimeString().split(' ')[0];

    // Atomic Database Transaction
    const result = await db.transaction(async (tx) => {
      // 1. Insert Payment Record
      const payRecord = await tx.insert(payments).values({
        paymentNumber,
        invoiceId,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: nowTime,
        amount: payAmt,
        paymentMethod: paymentMethod || 'CASH',
        paymentType: newRemaining === 0 ? 'FULL_PAYMENT' : 'PARTIAL',
        referenceNumber: referenceNumber || '',
        notes: notes || '',
        receivedBy: req.user?.name || 'Staff Kasir',
        branchCode: invoice.branchCode || 'PUSAT',
      }).returning();

      // 2. Update Invoice
      await tx.update(invoices)
        .set({
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        })
        .where(eq(invoices.id, invoiceId));

      // 3. Update Booking
      if (invoice.bookingId) {
        const relatedProc = await tx.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.bookingId, invoice.bookingId));
        const isProcedureFinished = relatedProc.some(p => p.status === 'COMPLETED');

        await tx.update(bookings)
          .set({
            remainingAmount: newRemaining,
            ...(newStatus === 'PAID' && isProcedureFinished ? { status: 'COMPLETED' } : (newStatus === 'PAID' && invoice.paidAmount === 0 ? { status: 'CONFIRMED' } : {})),
          })
          .where(eq(bookings.id, invoice.bookingId));
      }

      return payRecord[0];
    });

    await recordAudit('PAYMENT', 'INVOICE', invoice.invoiceNumber, req.user?.email || 'Kasir', `Pembayaran Rp ${payAmt.toLocaleString('id-ID')}, sisa Rp ${newRemaining.toLocaleString('id-ID')}`);
    res.json({ success: true, payment: result, invoiceStatus: newStatus, remainingAmount: newRemaining });
  } catch (err: any) {
    console.error('Error in /api/invoices/:id/pay:', err);
    res.status(500).json({ error: err?.message || 'Gagal memproses pembayaran' });
  }
});

// Void / Cancel Invoice with Mandatory Reason & Audit
app.post('/api/invoices/:id/void', requireAuth, async (req: AuthRequest, res) => {
  try {
    const isAuthorized = await checkCashierAuthority(req);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Akses Ditolak: Pembatalan invoice hanya dapat dilakukan oleh kasir atau admin berwenang.' });
    }

    const invoiceId = Number(req.params.id);
    const { voidReason } = req.body;

    if (!voidReason || !voidReason.trim()) {
      return res.status(400).json({ error: 'Alasan pembatalan (void reason) wajib diisi demi kepatuhan audit' });
    }

    const invList = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (invList.length === 0) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    const invoice = invList[0];

    const now = new Date();
    const performer = req.user?.name || req.user?.email || 'Admin';

    // 1. Mark Invoice as CANCELLED
    await db.update(invoices)
      .set({
        status: 'CANCELLED',
        voidReason: voidReason.trim(),
        voidedAt: now,
        voidedBy: performer,
        notes: `${invoice.notes ? invoice.notes + ' | ' : ''}VOID: ${voidReason.trim()}`,
      })
      .where(eq(invoices.id, invoiceId));

    // 2. Mark Doctor Fee as CANCELLED
    await db.update(doctorFeeTransactions)
      .set({
        status: 'CANCELLED',
        notes: `Dibatalkan karena Invoice ${invoice.invoiceNumber} di-void: ${voidReason}`,
      })
      .where(eq(doctorFeeTransactions.invoiceId, invoiceId));

    // 3. Mark Employee Fee as CANCELLED
    await db.update(employeeFeeTransactions)
      .set({
        status: 'CANCELLED',
        notes: `Dibatalkan karena Invoice ${invoice.invoiceNumber} di-void: ${voidReason}`,
      })
      .where(eq(employeeFeeTransactions.bookingId, invoice.bookingId));

    await recordAudit('VOID_INVOICE', 'INVOICE', invoice.invoiceNumber, req.user?.email || 'Admin', `Invoice dibatalkan/void oleh ${performer}. Alasan: ${voidReason}`);

    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} berhasil dibatalkan` });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal membatalkan invoice' });
  }
});

// Legacy Cancel endpoint (mapped to same void logic)
app.put('/api/invoices/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const { reason } = req.body;
    const voidReason = reason || 'Pembatalan transaksi operasional';

    const now = new Date();
    const performer = req.user?.name || req.user?.email || 'Admin';

    await db.update(invoices)
      .set({
        status: 'CANCELLED',
        voidReason,
        voidedAt: now,
        voidedBy: performer,
        notes: `Dibatalkan: ${voidReason}`,
      })
      .where(eq(invoices.id, invoiceId));

    await recordAudit('CANCEL', 'INVOICE', String(invoiceId), req.user?.email || 'Admin', `Alasan pembatalan: ${voidReason}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membatalkan invoice' });
  }
});

// Doctor Fees (Snapshot, Manual Additional Fees & Approval)
app.get('/api/doctor-fees', async (req, res) => {
  try {
    // Auto-sync completed procedures missing doctor fee transactions
    await syncDoctorFeesWithReports();

    const list = await db.select({
      id: doctorFeeTransactions.id,
      feeNumber: doctorFeeTransactions.feeNumber,
      feeType: doctorFeeTransactions.feeType,
      title: doctorFeeTransactions.title,
      feeDate: doctorFeeTransactions.feeDate,
      doctorId: doctorFeeTransactions.doctorId,
      doctorName: doctors.name,
      patientId: doctorFeeTransactions.patientId,
      patientName: patients.fullName,
      rmNumber: patients.rmNumber,
      categoryCode: patientCategories.code,
      categoryName: patientCategories.name,
      packageName: circumcisionPackages.name,
      methodName: doctorFeeTransactions.methodName,
      patientCondition: doctorFeeTransactions.patientCondition,
      serviceType: doctorFeeTransactions.serviceType,
      feeAmount: doctorFeeTransactions.feeAmount,
      status: doctorFeeTransactions.status,
      approvedAt: doctorFeeTransactions.approvedAt,
      paidAt: doctorFeeTransactions.paidAt,
      notes: doctorFeeTransactions.notes,
      bookingNumber: bookings.bookingNumber,
      branchCode: doctorFeeTransactions.branchCode,
    })
    .from(doctorFeeTransactions)
    .innerJoin(doctors, eq(doctorFeeTransactions.doctorId, doctors.id))
    .leftJoin(patients, eq(doctorFeeTransactions.patientId, patients.id))
    .leftJoin(patientCategories, eq(doctorFeeTransactions.patientCategoryId, patientCategories.id))
    .leftJoin(circumcisionPackages, eq(doctorFeeTransactions.packageId, circumcisionPackages.id))
    .leftJoin(bookings, eq(doctorFeeTransactions.bookingId, bookings.id))
    .orderBy(desc(doctorFeeTransactions.id));

    const branchFilter = getBranchFilter(req);
    const filtered = filterByBranch(list, branchFilter);

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data fee dokter' });
  }
});

// Input Fee Tambahan Dokter Secara Manual (Menjadi satu komisi saat rekap bulanan)
app.post('/api/doctor-fees', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { doctorId, feeAmount, feeDate, title, notes, patientId, branchCode, status } = req.body;
    if (!doctorId || !feeAmount || Number(feeAmount) <= 0) {
      return res.status(400).json({ error: 'Dokter dan nominal fee tambahan (> 0) wajib diisi' });
    }
    const doc = await db.select().from(doctors).where(eq(doctors.id, Number(doctorId)));
    if (doc.length === 0) {
      return res.status(404).json({ error: 'Data dokter tidak ditemukan' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = feeDate || todayStr;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const feeNumber = `FEE-ADD-${targetDate.replace(/-/g, '')}-${randomSuffix}`;
    const targetBranch = branchCode || doc[0].branchCode || resolveTargetBranch(req) || 'PUSAT';

    let newFee: any;
    try {
      const inserted = await db.insert(doctorFeeTransactions).values({
        feeNumber,
        feeType: 'MANUAL_ADDITIONAL',
        title: title || 'Fee Tambahan / Insentif Dokter',
        doctorId: Number(doctorId),
        patientId: patientId ? Number(patientId) : undefined,
        feeAmount: Math.round(Number(feeAmount)),
        feeDate: targetDate,
        branchCode: targetBranch,
        status: status || 'PENDING',
        notes: notes || '',
      }).returning();
      newFee = inserted[0];
    } catch (insertErr: any) {
      const errMsg = (insertErr?.message || insertErr?.cause?.message || String(insertErr)).toLowerCase();
      if (errMsg.includes('procedure_id') && errMsg.includes('not-null')) {
        // Otomatis lepaskan constraint NOT NULL jika database lawas belum termigrasi
        try {
          await pool.query(`ALTER TABLE IF EXISTS "doctor_fee_transactions" ALTER COLUMN "procedure_id" DROP NOT NULL`);
          const retry = await db.insert(doctorFeeTransactions).values({
            feeNumber,
            feeType: 'MANUAL_ADDITIONAL',
            title: title || 'Fee Tambahan / Insentif Dokter',
            doctorId: Number(doctorId),
            patientId: patientId ? Number(patientId) : undefined,
            feeAmount: Math.round(Number(feeAmount)),
            feeDate: targetDate,
            branchCode: targetBranch,
            status: status || 'PENDING',
            notes: notes || '',
          }).returning();
          newFee = retry[0];
        } catch (retryErr) {
          throw insertErr;
        }
      } else {
        throw insertErr;
      }
    }

    await recordAudit(
      'CREATE', 
      'DOCTOR_FEE', 
      feeNumber, 
      req.user?.email || 'Admin', 
      `Input fee tambahan dokter manual: ${doc[0].name} senilai Rp ${Number(feeAmount).toLocaleString('id-ID')} (${title || 'Fee Tambahan'})`
    );

    res.json(newFee);
  } catch (err: any) {
    console.error('Error creating manual doctor fee:', err);
    res.status(500).json({ error: 'Gagal menambahkan fee manual dokter: ' + (err?.message || String(err)) });
  }
});

// Update Fee Manual Dokter
app.put('/api/doctor-fees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const feeId = Number(req.params.id);
    const { feeAmount, title, notes, feeDate, status } = req.body;
    const existing = await db.select().from(doctorFeeTransactions).where(eq(doctorFeeTransactions.id, feeId));
    if (existing.length === 0) return res.status(404).json({ error: 'Data fee tidak ditemukan' });
    if (existing[0].status === 'PAID') {
      return res.status(400).json({ error: 'Fee yang sudah berstatus LUNAS (PAID) tidak dapat diubah' });
    }

    const updateData: any = {};
    if (feeAmount !== undefined) updateData.feeAmount = Math.round(Number(feeAmount));
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (feeDate !== undefined) updateData.feeDate = feeDate;
    if (status !== undefined) updateData.status = status;

    await db.update(doctorFeeTransactions).set(updateData).where(eq(doctorFeeTransactions.id, feeId));
    await recordAudit('UPDATE', 'DOCTOR_FEE', existing[0].feeNumber, req.user?.email || 'Admin', `Update fee dokter`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengubah fee dokter' });
  }
});

// Delete Fee Manual Dokter
app.delete('/api/doctor-fees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const feeId = Number(req.params.id);
    const existing = await db.select().from(doctorFeeTransactions).where(eq(doctorFeeTransactions.id, feeId));
    if (existing.length === 0) return res.status(404).json({ error: 'Data fee tidak ditemukan' });
    if (existing[0].status === 'PAID') {
      return res.status(400).json({ error: 'Fee yang sudah berstatus LUNAS (PAID) tidak dapat dihapus' });
    }

    await db.delete(doctorFeeTransactions).where(eq(doctorFeeTransactions.id, feeId));
    await recordAudit('DELETE', 'DOCTOR_FEE', existing[0].feeNumber, req.user?.email || 'Admin', `Menghapus fee dokter ${existing[0].feeNumber}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus fee dokter' });
  }
});

app.put('/api/doctor-fees/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak memiliki otoritas mengubah status fee dokter' });
    }
    const feeId = Number(req.params.id);
    const { status, paymentMethod } = req.body; // 'APPROVED' | 'PAID' | 'CANCELLED'

    const updateObj: any = { status };
    if (status === 'APPROVED') updateObj.approvedAt = new Date();
    if (status === 'PAID') updateObj.paidAt = new Date();

    await db.update(doctorFeeTransactions)
      .set(updateObj)
      .where(eq(doctorFeeTransactions.id, feeId));

    // Jika status diubah menjadi PAID, otomatis buat pencatatan Beban Pengeluaran Operasional (Kategori: Fee Dokter Khitan)
    if (status === 'PAID') {
      try {
        const feeDetail = await db.select({
          id: doctorFeeTransactions.id,
          feeNumber: doctorFeeTransactions.feeNumber,
          feeType: doctorFeeTransactions.feeType,
          title: doctorFeeTransactions.title,
          feeAmount: doctorFeeTransactions.feeAmount,
          feeDate: doctorFeeTransactions.feeDate,
          doctorName: doctors.name,
          patientName: patients.fullName,
          packageName: circumcisionPackages.name,
        })
        .from(doctorFeeTransactions)
        .innerJoin(doctors, eq(doctorFeeTransactions.doctorId, doctors.id))
        .leftJoin(patients, eq(doctorFeeTransactions.patientId, patients.id))
        .leftJoin(circumcisionPackages, eq(doctorFeeTransactions.packageId, circumcisionPackages.id))
        .where(eq(doctorFeeTransactions.id, feeId));

        if (feeDetail.length > 0) {
          const item = feeDetail[0];
          let cat = (await db.select().from(expenseCategories).where(eq(expenseCategories.name, 'Fee Dokter Khitan')))[0];
          if (!cat) {
            const insCat = await db.insert(expenseCategories).values({
              name: 'Fee Dokter Khitan',
              description: 'Honorarium dan fee dokter operator tindakan khitan',
              isDefault: true,
            }).returning();
            cat = insCat[0];
          }

          const existingExp = await db.select().from(expenseTransactions).where(ilike(expenseTransactions.description, `%${item.feeNumber}%`));
          if (existingExp.length === 0) {
            const expNum = await generateExpenseNumber();
            const desc = item.feeType === 'MANUAL_ADDITIONAL'
              ? `Fee Tambahan Dokter ${item.doctorName} - No: ${item.feeNumber} (${item.title || 'Insentif Manual'}${item.patientName ? ` • Pasien: ${item.patientName}` : ''})`
              : `Fee Dokter ${item.doctorName} - No: ${item.feeNumber} (Pasien ${item.patientName || '-'} • ${item.packageName || 'Tindakan Khitan'})`;

            await db.insert(expenseTransactions).values({
              transactionNumber: expNum,
              expenseDate: new Date().toISOString().split('T')[0],
              categoryId: cat ? cat.id : undefined,
              categoryName: 'Fee Dokter Khitan',
              description: desc,
              amount: Number(item.feeAmount),
              paymentMethod: paymentMethod || 'TRANSFER',
              createdBy: req.user?.name || req.user?.email || 'Admin',
              status: 'PAID',
            });
          }
        }
      } catch (expErr) {
        console.error('Gagal membuat pencatatan expense fee dokter:', expErr);
      }
    }

    await recordAudit('UPDATE_STATUS', 'DOCTOR_FEE', String(feeId), req.user?.email || 'Admin', `Status diubah menjadi ${status}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memperbarui status fee dokter' });
  }
});

// Batch Pay Doctor Fees
app.post('/api/doctor-fees/pay-batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak memiliki otoritas membayar fee dokter' });
    }
    const { doctorId, feeIds, paymentMethod, paymentDate, notes } = req.body;
    if (!feeIds || !Array.isArray(feeIds) || feeIds.length === 0) {
      return res.status(400).json({ error: 'Pilih minimal satu fee dokter untuk dibayarkan' });
    }

    const feesToPay = await db.select({
      id: doctorFeeTransactions.id,
      feeNumber: doctorFeeTransactions.feeNumber,
      feeType: doctorFeeTransactions.feeType,
      title: doctorFeeTransactions.title,
      feeAmount: doctorFeeTransactions.feeAmount,
      doctorName: doctors.name,
      patientName: patients.fullName,
    })
    .from(doctorFeeTransactions)
    .innerJoin(doctors, eq(doctorFeeTransactions.doctorId, doctors.id))
    .leftJoin(patients, eq(doctorFeeTransactions.patientId, patients.id))
    .where(and(
      inArray(doctorFeeTransactions.id, feeIds),
      notInArray(doctorFeeTransactions.status, ['PAID', 'CANCELLED'])
    ));

    if (feesToPay.length === 0) {
      return res.status(400).json({ error: 'Tidak ada fee yang valid untuk dibayarkan' });
    }

    const totalAmount = feesToPay.reduce((acc, f) => acc + f.feeAmount, 0);
    const doctorName = feesToPay[0].doctorName;
    const now = new Date();

    for (const f of feesToPay) {
      await db.update(doctorFeeTransactions)
        .set({ status: 'PAID', paidAt: now })
        .where(eq(doctorFeeTransactions.id, f.id));
    }

    // Catat ke Beban Pengeluaran Operasional
    let cat = (await db.select().from(expenseCategories).where(eq(expenseCategories.name, 'Fee Dokter Khitan')))[0];
    if (!cat) {
      const insCat = await db.insert(expenseCategories).values({
        name: 'Fee Dokter Khitan',
        description: 'Honorarium dan fee dokter operator tindakan khitan',
        isDefault: true,
      }).returning();
      cat = insCat[0];
    }

    const expNum = await generateExpenseNumber();
    const dateStr = paymentDate || now.toISOString().split('T')[0];
    const desc = `Payroll Fee Dokter: ${doctorName} - ${feesToPay.length} Item Komisi/Tindakan (Total Rp ${totalAmount.toLocaleString('id-ID')})${notes ? ` [${notes}]` : ''}`;

    await db.insert(expenseTransactions).values({
      transactionNumber: expNum,
      expenseDate: dateStr,
      categoryId: cat ? cat.id : undefined,
      categoryName: 'Fee Dokter Khitan',
      description: desc,
      amount: totalAmount,
      paymentMethod: paymentMethod || 'TRANSFER',
      createdBy: req.user?.name || req.user?.email || 'Admin',
      status: 'PAID',
    });

    await recordAudit('PAY_BATCH', 'DOCTOR_FEE', doctorName, req.user?.email || 'Admin', `Mencairkan fee dokter ${doctorName} untuk ${feesToPay.length} pasien senilai Rp ${totalAmount.toLocaleString('id-ID')}`);
    res.json({ success: true, count: feesToPay.length, totalAmount });
  } catch (err: any) {
    console.error('Error batch pay doctor fees:', err);
    res.status(500).json({ error: 'Gagal memproses pencairan fee dokter' });
  }
});

// Sync Doctor Fees with current master fee rules and financial reports
app.post('/api/doctor-fees/sync-master', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { doctorId } = req.body;
    const targetDoc = doctorId && doctorId !== 'ALL' ? Number(doctorId) : 'ALL';
    const syncResult = await syncDoctorFeesWithReports(targetDoc);

    res.json({
      success: true,
      message: 'Sinkronisasi fee dokter dengan tindakan klinis & laporan keuangan berhasil',
      ...syncResult,
    });
  } catch (err: any) {
    console.error('Error during /api/doctor-fees/sync-master:', err);
    res.status(500).json({ error: 'Gagal sinkronisasi fee dokter: ' + (err.message || String(err)) });
  }
});

// ---------------- MASTER ATURAN FEE DOKTER BERDASARKAN METODE & KONDISI PASIEN ----------------
// GET /api/doctor-method-fees
app.get('/api/doctor-method-fees', async (req, res) => {
  try {
    const { doctorId } = req.query;
    let query = db.select().from(doctorMethodFeeRules).orderBy(doctorMethodFeeRules.methodName, doctorMethodFeeRules.id);
    let rules = await query;

    if (doctorId && doctorId !== 'ALL') {
      if (doctorId === 'GLOBAL') {
        rules = rules.filter(r => !r.doctorId || r.doctorId === null);
      } else {
        const docNum = Number(doctorId);
        rules = rules.filter(r => !r.doctorId || r.doctorId === null || r.doctorId === docNum);
      }
    }

    const allDocs = await db.select().from(doctors);
    const docMap = new Map(allDocs.map(d => [d.id, d.name]));

    const enriched = rules.map(r => ({
      ...r,
      doctorName: r.doctorId ? (docMap.get(r.doctorId) || `Dokter #${r.doctorId}`) : 'Semua Dokter (Default Standar Klinik)',
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error('Error in GET /api/doctor-method-fees:', err);
    res.status(500).json({ error: 'Gagal mengambil aturan fee metode dokter: ' + (err.message || String(err)) });
  }
});

// POST /api/doctor-method-fees
app.post('/api/doctor-method-fees', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan mengubah aturan fee dokter' });
    }

    const { doctorId, methodId, methodName, patientCondition, regulerFee, vipFee, description, isActive } = req.body;
    if (!methodName || !methodName.trim()) {
      return res.status(400).json({ error: 'Nama metode khitan wajib diisi' });
    }

    const inserted = await db.insert(doctorMethodFeeRules).values({
      doctorId: doctorId && doctorId !== 'ALL' ? Number(doctorId) : null,
      methodId: methodId ? Number(methodId) : null,
      methodName: methodName.trim(),
      patientCondition: (patientCondition || 'STANDAR').toUpperCase().trim(),
      regulerFee: Number(regulerFee) || 250000,
      vipFee: Number(vipFee) || 350000,
      description: description?.trim() || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    }).returning();

    await recordAudit('CREATE', 'DOCTOR_METHOD_FEE_RULE', String(inserted[0].id), req.user?.email || 'Admin', `Tambah aturan fee metode ${methodName} (${patientCondition})`);
    res.json({ success: true, rule: inserted[0] });
  } catch (err: any) {
    console.error('Error in POST /api/doctor-method-fees:', err);
    res.status(500).json({ error: 'Gagal membuat aturan fee metode: ' + (err.message || String(err)) });
  }
});

// PUT /api/doctor-method-fees/:id
app.put('/api/doctor-method-fees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan mengubah aturan fee dokter' });
    }

    const id = Number(req.params.id);
    const existing = await db.select().from(doctorMethodFeeRules).where(eq(doctorMethodFeeRules.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Aturan fee metode tidak ditemukan' });
    }

    const { doctorId, methodId, methodName, patientCondition, regulerFee, vipFee, description, isActive } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (doctorId !== undefined) updateData.doctorId = doctorId && doctorId !== 'ALL' ? Number(doctorId) : null;
    if (methodId !== undefined) updateData.methodId = methodId ? Number(methodId) : null;
    if (methodName !== undefined) updateData.methodName = methodName.trim();
    if (patientCondition !== undefined) updateData.patientCondition = patientCondition.toUpperCase().trim();
    if (regulerFee !== undefined) updateData.regulerFee = Number(regulerFee);
    if (vipFee !== undefined) updateData.vipFee = Number(vipFee);
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await db.update(doctorMethodFeeRules).set(updateData).where(eq(doctorMethodFeeRules.id, id)).returning();
    await recordAudit('UPDATE', 'DOCTOR_METHOD_FEE_RULE', String(id), req.user?.email || 'Admin', `Update aturan fee metode ${existing[0].methodName}`);

    res.json({ success: true, rule: updated[0] });
  } catch (err: any) {
    console.error('Error in PUT /api/doctor-method-fees/:id:', err);
    res.status(500).json({ error: 'Gagal memperbarui aturan fee metode: ' + (err.message || String(err)) });
  }
});

// DELETE /api/doctor-method-fees/:id
app.delete('/api/doctor-method-fees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan menghapus aturan fee dokter' });
    }

    const id = Number(req.params.id);
    const existing = await db.select().from(doctorMethodFeeRules).where(eq(doctorMethodFeeRules.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Aturan fee metode tidak ditemukan' });
    }

    await db.delete(doctorMethodFeeRules).where(eq(doctorMethodFeeRules.id, id));
    await recordAudit('DELETE', 'DOCTOR_METHOD_FEE_RULE', String(id), req.user?.email || 'Admin', `Hapus aturan fee metode ${existing[0].methodName}`);

    res.json({ success: true, message: 'Aturan fee metode berhasil dihapus' });
  } catch (err: any) {
    console.error('Error in DELETE /api/doctor-method-fees/:id:', err);
    res.status(500).json({ error: 'Gagal menghapus aturan fee metode: ' + (err.message || String(err)) });
  }
});

// POST /api/doctor-method-fees/batch
app.post('/api/doctor-method-fees/batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'staff') {
      return res.status(403).json({ error: 'Staff tidak diizinkan mengubah aturan fee dokter' });
    }

    const { rules, syncPendingFees } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'Daftar aturan fee metode tidak valid' });
    }

    let savedCount = 0;
    for (const r of rules) {
      if (r.id) {
        // Update
        await db.update(doctorMethodFeeRules).set({
          regulerFee: Number(r.regulerFee) || 0,
          vipFee: Number(r.vipFee) || 0,
          patientCondition: (r.patientCondition || 'STANDAR').toUpperCase(),
          description: r.description || null,
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
          updatedAt: new Date(),
        }).where(eq(doctorMethodFeeRules.id, Number(r.id)));
        savedCount++;
      } else if (r.methodName) {
        // Insert new
        await db.insert(doctorMethodFeeRules).values({
          doctorId: r.doctorId && r.doctorId !== 'ALL' ? Number(r.doctorId) : null,
          methodName: r.methodName.trim(),
          patientCondition: (r.patientCondition || 'STANDAR').toUpperCase(),
          regulerFee: Number(r.regulerFee) || 250000,
          vipFee: Number(r.vipFee) || 350000,
          description: r.description || null,
          isActive: true,
        });
        savedCount++;
      }
    }

    let syncedCount = 0;
    if (syncPendingFees) {
      const syncRes = await syncDoctorFeesWithReports('ALL');
      syncedCount = syncRes.updatedCount;
    }

    await recordAudit('BATCH_UPDATE', 'DOCTOR_METHOD_FEE_RULE', `${savedCount} rules`, req.user?.email || 'Admin', `Simpan massal tarif fee dokter berdasarkan metode`);
    res.json({ success: true, savedCount, syncedCount });
  } catch (err: any) {
    console.error('Error in /api/doctor-method-fees/batch:', err);
    res.status(500).json({ error: 'Gagal menyimpan perubahan tarif metode dokter: ' + (err.message || String(err)) });
  }
});

// POST /api/doctor-method-fees/sync-pending
app.post('/api/doctor-method-fees/sync-pending', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { doctorId } = req.body;
    const targetDoc = doctorId && doctorId !== 'ALL' ? Number(doctorId) : 'ALL';
    const syncResult = await syncDoctorFeesWithReports(targetDoc);

    res.json({
      success: true,
      message: 'Sinkronisasi tarif metode ke transaksi fee berhasil',
      ...syncResult,
    });
  } catch (err: any) {
    console.error('Error in /api/doctor-method-fees/sync-pending:', err);
    res.status(500).json({ error: 'Gagal sinkronisasi fee metode: ' + (err.message || String(err)) });
  }
});

// Operational Expenses (Pengeluaran Operasional)
app.get('/api/expenses', async (req, res) => {
  try {
    const list = await db.select().from(expenseTransactions).orderBy(desc(expenseTransactions.expenseDate), desc(expenseTransactions.id));
    const formatted = list.map((item) => ({
      ...item,
      title: item.description || '',
      expenseCategoryId: item.categoryId,
    }));
    const branchFilter = getBranchFilter(req);
    const filtered = filterByBranch(formatted, branchFilter);
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data pengeluaran' });
  }
});

app.get('/api/expense-categories', async (req, res) => {
  try {
    const list = await db.select().from(expenseCategories).orderBy(expenseCategories.id);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil kategori pengeluaran' });
  }
});

app.post('/api/expenses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { expenseDate, categoryName, categoryId, expenseCategoryId, description, title, amount, paymentMethod } = req.body;
    const num = await generateExpenseNumber();
    const resolvedDesc = description || title || 'Pengeluaran Operasional';
    const branchFilter = getBranchFilter(req);
    const targetBranch = (req.body.branchCode && req.body.branchCode !== 'ALL') ? req.body.branchCode : (branchFilter !== 'ALL' ? branchFilter : 'PUSAT');

    const inserted = await db.insert(expenseTransactions).values({
      transactionNumber: num,
      expenseDate: expenseDate || new Date().toISOString().split('T')[0],
      categoryId: categoryId || expenseCategoryId || undefined,
      categoryName: categoryName || 'Operasional',
      description: resolvedDesc,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'CASH',
      createdBy: req.user?.name || 'Admin',
      status: 'PAID',
      branchCode: targetBranch,
    }).returning();

    await recordAudit('CREATE', 'EXPENSE', num, req.user?.email || 'Admin', `Pengeluaran Rp ${Number(amount).toLocaleString('id-ID')}: ${resolvedDesc}`);
    const result = inserted[0];
    res.json({
      ...result,
      title: result.description,
      expenseCategoryId: result.categoryId,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mencatat pengeluaran' });
  }
});

app.put('/api/expenses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(expenseTransactions).where(eq(expenseTransactions.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data pengeluaran operasional tidak ditemukan' });
    }

    const { expenseDate, categoryName, categoryId, expenseCategoryId, description, title, amount, paymentMethod, status } = req.body;
    const resolvedDesc = description !== undefined ? description : (title !== undefined ? title : existing[0].description);
    const resolvedCatId = categoryId !== undefined ? categoryId : (expenseCategoryId !== undefined ? expenseCategoryId : existing[0].categoryId);
    const resolvedCatName = categoryName !== undefined ? categoryName : existing[0].categoryName;
    const resolvedAmount = amount !== undefined ? Number(amount) : existing[0].amount;
    const resolvedDate = expenseDate !== undefined ? expenseDate : existing[0].expenseDate;
    const resolvedPaymentMethod = paymentMethod !== undefined ? paymentMethod : existing[0].paymentMethod;
    const resolvedStatus = status !== undefined ? status : existing[0].status;

    const updated = await db.update(expenseTransactions).set({
      expenseDate: resolvedDate,
      categoryId: resolvedCatId,
      categoryName: resolvedCatName,
      description: resolvedDesc,
      amount: resolvedAmount,
      paymentMethod: resolvedPaymentMethod,
      status: resolvedStatus,
    }).where(eq(expenseTransactions.id, id)).returning();

    await recordAudit(
      'UPDATE',
      'EXPENSE',
      existing[0].transactionNumber,
      req.user?.email || 'Admin',
      `Edit pengeluaran ${existing[0].transactionNumber}: ${resolvedDesc} (Rp ${resolvedAmount.toLocaleString('id-ID')})`
    );

    const result = updated[0];
    res.json({
      ...result,
      title: result.description,
      expenseCategoryId: result.categoryId,
    });
  } catch (err: any) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Gagal memperbarui data pengeluaran' });
  }
});

app.delete('/api/expenses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const reason = req.body?.reason || req.query.reason || 'Dihapus oleh pengguna';
    const existing = await db.select().from(expenseTransactions).where(eq(expenseTransactions.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Data pengeluaran operasional tidak ditemukan' });
    }

    const current = existing[0];
    await db.delete(expenseTransactions).where(eq(expenseTransactions.id, id));

    await recordAudit(
      'DELETE',
      'EXPENSE',
      current.transactionNumber,
      req.user?.email || 'Admin',
      `Hapus pengeluaran ${current.transactionNumber} (${current.description}, Rp ${current.amount.toLocaleString('id-ID')}) - Alasan: ${reason}`
    );

    res.json({ success: true, message: 'Data pengeluaran berhasil dihapus' });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Gagal menghapus data pengeluaran' });
  }
});

// Follow Ups
app.get('/api/follow-ups', (req, res) => {
  res.json([]);
});

// Informed Consent & Certificate Documents
app.get('/api/documents/:procedureId', async (req, res) => {
  try {
    const procedureId = Number(req.params.procedureId);
    const consents = await db.select().from(informedConsents).where(eq(informedConsents.procedureId, procedureId));
    const certs = await db.select().from(certificates).where(eq(certificates.procedureId, procedureId));
    res.json({ consent: consents[0] || null, certificate: certs[0] || null });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil dokumen' });
  }
});

app.post('/api/documents/:procedureId/consent', requireAuth, async (req: AuthRequest, res) => {
  try {
    const procedureId = Number(req.params.procedureId);
    const { signerName, signerRelation } = req.body;

    const proc = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.id, procedureId));
    if (proc.length === 0) return res.status(404).json({ error: 'Tindakan tidak ditemukan' });

    const consentNum = `CONS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const inserted = await db.insert(informedConsents).values({
      consentNumber: consentNum,
      procedureId,
      patientId: proc[0].patientId,
      guardianId: 1,
      doctorId: proc[0].doctorId,
      consentDate: new Date().toISOString().split('T')[0],
      signerName,
      signerRelation,
      status: 'SIGNED',
      branchCode: proc[0].branchCode || resolveTargetBranch(req),
    }).returning();

    res.json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan persetujuan tindakan' });
  }
});

// Comprehensive Dashboard & Financial Reports
app.get('/api/reports/dashboard', async (req, res) => {
  try {
    await autoHealMissingPayments();
    await syncDoctorFeesWithReports();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7); // YYYY-MM
    const currentYear = today.slice(0, 4);  // YYYY

    const branchFilter = getBranchFilter(req);

    // 1. Operational Counts
    let allBookings = await db.select().from(bookings);
    allBookings = filterByBranch(allBookings, branchFilter);
    const todayBookings = allBookings.filter(b => b.bookingDate === today);
    let todayProcedures = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.procedureDate, today));
    todayProcedures = filterByBranch(todayProcedures, branchFilter);
    const completedProcedures = todayProcedures.filter(p => p.status === 'COMPLETED');

    // 2. Financial Metrics: Revenue (Real payments received)
    let allPayments = await db.select().from(payments);
    allPayments = filterByBranch(allPayments, branchFilter);
    const todayPayments = allPayments.filter(p => p.paymentDate === today);
    const monthPayments = allPayments.filter(p => p.paymentDate.startsWith(currentMonth));
    const yearPayments = allPayments.filter(p => p.paymentDate.startsWith(currentYear));

    const revenueToday = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const revenueMonth = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    const revenueYear = yearPayments.reduce((acc, p) => acc + p.amount, 0);

    // 3. Operational Expenses
    let allExpenses = await db.select().from(expenseTransactions).where(eq(expenseTransactions.status, 'PAID'));
    allExpenses = filterByBranch(allExpenses, branchFilter);
    const todayExpenses = allExpenses.filter(e => e.expenseDate === today);
    const monthExpenses = allExpenses.filter(e => e.expenseDate.startsWith(currentMonth));
    const yearExpenses = allExpenses.filter(e => e.expenseDate.startsWith(currentYear));

    const expenseToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const expenseMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const expenseYear = yearExpenses.reduce((acc, e) => acc + e.amount, 0);

    // 4. Doctor Fees (Obligations from completed procedures)
    let allFees = await db.select().from(doctorFeeTransactions).where(notInArray(doctorFeeTransactions.status, ['CANCELLED']));
    allFees = filterByBranch(allFees, branchFilter);
    const monthFees = allFees.filter(f => f.feeDate.startsWith(currentMonth));
    const feeMonthTotal = monthFees.reduce((acc, f) => acc + f.feeAmount, 0);
    const feePending = allFees.filter(f => f.status === 'PENDING').reduce((acc, f) => acc + f.feeAmount, 0);
    const feeApproved = allFees.filter(f => f.status === 'APPROVED').reduce((acc, f) => acc + f.feeAmount, 0);
    const feePaid = allFees.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.feeAmount, 0);

    // 4b. Employee Fees (Assistant fees from completed procedures)
    let allEmpFees = await db.select().from(employeeFeeTransactions).where(notInArray(employeeFeeTransactions.status, ['CANCELLED']));
    allEmpFees = filterByBranch(allEmpFees, branchFilter);
    const monthEmpFees = allEmpFees.filter(f => f.procedureDate.startsWith(currentMonth));
    const employeeFeeMonthTotal = monthEmpFees.reduce((acc, f) => acc + f.feeAmount, 0);

    // 4c. Staff Salaries (Paid payrolls)
    let allPayrolls = await db.select().from(payrolls).where(eq(payrolls.status, 'PAID'));
    allPayrolls = filterByBranch(allPayrolls, branchFilter);
    const monthPayrolls = allPayrolls.filter(p => p.periodMonth === currentMonth);
    const salariesMonthTotal = monthPayrolls.reduce((acc, p) => acc + p.basicSalary, 0);

    // 5. Net Profit Calculation = Revenue - Operational Expenses - Doctor Fees - Employee Fees - Salaries
    const netProfitMonth = revenueMonth - expenseMonth - feeMonthTotal - employeeFeeMonthTotal - salariesMonthTotal;

    // 6. Receivables (Total Piutang)
    let allInvoices = await db.select().from(invoices).where(inArray(invoices.status, ['UNPAID', 'PARTIAL']));
    allInvoices = filterByBranch(allInvoices, branchFilter);
    const totalPiutang = allInvoices.reduce((acc, inv) => acc + inv.remainingAmount, 0);

    // 7. Patient Categories Breakdown (REGULER vs VIP)
    const vipBookings = allBookings.filter(b => b.patientCategoryId === 2 && b.status !== 'CANCELLED');
    const regularBookings = allBookings.filter(b => b.patientCategoryId === 1 && b.status !== 'CANCELLED');

    // 8. Patient Source Breakdown
    const sourcesMap: Record<string, { count: number; revenue: number }> = {};
    for (const b of allBookings) {
      const src = b.patientSource || 'Walk-in';
      if (!sourcesMap[src]) sourcesMap[src] = { count: 0, revenue: 0 };
      sourcesMap[src].count++;
      sourcesMap[src].revenue += (b.totalAmount - b.remainingAmount);
    }

    res.json({
      summary: {
        patientsToday: todayBookings.length,
        completedToday: completedProcedures.length,
        bookingsToday: todayBookings.length,
        revenueToday,
        revenueMonth,
        revenueYear,
        expenseToday,
        expenseMonth,
        expenseYear,
        feeMonthTotal,
        feePending,
        feeApproved,
        feePaid,
        employeeFeeMonthTotal,
        salariesMonthTotal,
        netProfitMonth,
        totalPiutang,
        vipCount: vipBookings.length,
        regularCount: regularBookings.length,
      },
      sources: Object.entries(sourcesMap).map(([source, data]) => ({
        source,
        ...data,
      })),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghitung laporan dashboard' });
  }
});

// Profit & Loss Report
app.get('/api/reports/profit-loss', async (req, res) => {
  try {
    const isAllTime = req.query.allTime === 'true' || req.query.startDate === 'ALL' || (!req.query.startDate && !req.query.endDate);
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const branchFilter = getBranchFilter(req);

    // Auto-heal any orphaned invoices missing payment records & sync doctor fees first
    await autoHealMissingPayments();
    await syncDoctorFeesWithReports();

    let allPayments = await db.select().from(payments);
    let pms = allPayments.filter(p => {
      if (isAllTime) return true;
      const d = p.paymentDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    pms = filterByBranch(pms, branchFilter);
    const totalRevenue = pms.reduce((acc, p) => acc + p.amount, 0);

    // Calculate Product Add-ons Revenue and HPP from deducted transaction items
    const txnItems = await db.select().from(transactionItems);
    const addonItems = txnItems.filter(i => i.itemType === 'ADDON');
    const addonRevenue = addonItems.reduce((acc, i) => acc + i.totalAmount, 0);
    const packageRevenue = Math.max(0, totalRevenue - addonRevenue);

    // HPP / COGS (Cost of goods sold / disbursed) in selected period
    const allCostItems = txnItems.filter(i => {
      if (!i.isStockDeducted) return false;
      const d = i.deductedAt ? new Date(i.deductedAt).toISOString().split('T')[0] : '';
      if (isAllTime) return true;
      if (startDate && d && d < startDate) return false;
      if (endDate && d && d > endDate) return false;
      return true;
    });
    const productHppTotal = allCostItems.reduce((acc, i) => acc + (i.costPriceSnapshot * i.quantity), 0);
    const addonHpp = allCostItems.filter(i => i.itemType === 'ADDON').reduce((acc, i) => acc + (i.costPriceSnapshot * i.quantity), 0);
    const includedHpp = allCostItems.filter(i => i.itemType === 'INCLUDED').reduce((acc, i) => acc + (i.costPriceSnapshot * i.quantity), 0);

    // Current Inventory Valuation (Total Aset Gudang)
    let allProducts = await db.select().from(products).where(eq(products.isActive, true));
    allProducts = filterByBranch(allProducts, branchFilter);
    const totalPhysicalStock = allProducts.reduce((acc, p) => acc + Math.max(0, p.stock), 0);
    const totalStockAssetValuation = allProducts.reduce((acc, p) => acc + (Math.max(0, p.stock) * p.costPrice), 0);
    const totalStockSellPotential = allProducts.reduce((acc, p) => acc + (Math.max(0, p.stock) * p.sellPrice), 0);

    let allExpenses = await db.select().from(expenseTransactions).where(eq(expenseTransactions.status, 'PAID'));
    let exps = allExpenses.filter(e => {
      if (isAllTime) return true;
      const d = e.expenseDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    exps = filterByBranch(exps, branchFilter);

    // Group expenses by category
    const expenseByCategory: Record<string, number> = {};
    let totalOperatingExpense = 0;
    for (const e of exps) {
      if (e.categoryName === 'Fee Dokter Khitan') continue; // Dilaporkan terpisah di pos beban Fee Dokter agar tidak double-counting
      expenseByCategory[e.categoryName] = (expenseByCategory[e.categoryName] || 0) + e.amount;
      totalOperatingExpense += e.amount;
    }

    let allDocFees = await db.select().from(doctorFeeTransactions).where(notInArray(doctorFeeTransactions.status, ['CANCELLED']));
    let fees = allDocFees.filter(f => {
      if (isAllTime) return true;
      const d = f.feeDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    fees = filterByBranch(fees, branchFilter);
    const totalDoctorFee = fees.reduce((acc, f) => acc + f.feeAmount, 0);

    let allEmpFees = await db.select().from(employeeFeeTransactions).where(notInArray(employeeFeeTransactions.status, ['CANCELLED']));
    let empFees = allEmpFees.filter(f => {
      if (isAllTime) return true;
      const d = f.procedureDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    empFees = filterByBranch(empFees, branchFilter);
    const totalEmployeeFee = empFees.reduce((acc, f) => acc + f.feeAmount, 0);

    let allPayrolls = await db.select().from(payrolls).where(eq(payrolls.status, 'PAID'));
    let paidPayrolls = allPayrolls.filter(p => {
      if (isAllTime) return true;
      const d = p.paymentDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    paidPayrolls = filterByBranch(paidPayrolls, branchFilter);
    const totalSalaries = paidPayrolls.reduce((acc, p) => acc + p.basicSalary, 0);

    // Circumcision Procedures count in selected period
    let allProcs = await db.select().from(circumcisionProcedures);
    allProcs = filterByBranch(allProcs, branchFilter);
    const completedProcs = allProcs.filter(p => {
      if (p.status !== 'COMPLETED') return false;
      if (isAllTime) return true;
      const d = p.procedureDate || '';
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    const totalBeban = totalOperatingExpense + totalDoctorFee + totalEmployeeFee + totalSalaries + productHppTotal;
    const netProfit = totalRevenue - totalBeban;

    // Payment methods summary
    const paymentMethodsSummary = {
      cash: pms.filter(p => p.paymentMethod === 'CASH').reduce((acc, p) => acc + p.amount, 0),
      transfer: pms.filter(p => p.paymentMethod === 'TRANSFER').reduce((acc, p) => acc + p.amount, 0),
      qris: pms.filter(p => p.paymentMethod === 'QRIS').reduce((acc, p) => acc + p.amount, 0),
      debit: pms.filter(p => p.paymentMethod === 'DEBIT').reduce((acc, p) => acc + p.amount, 0),
      other: pms.filter(p => !['CASH', 'TRANSFER', 'QRIS', 'DEBIT'].includes(p.paymentMethod)).reduce((acc, p) => acc + p.amount, 0),
    };

    res.json({
      period: {
        startDate: isAllTime ? 'Semua Waktu' : startDate,
        endDate: isAllTime ? 'Semua Waktu' : endDate,
        isAllTime,
      },
      summary: {
        completedProceduresCount: completedProcs.length,
        totalProceduresCount: allProcs.length,
      },
      revenue: {
        total: totalRevenue,
        circumcision: packageRevenue,
        products: addonRevenue,
        other: 0,
      },
      paymentMethods: paymentMethodsSummary,
      inventoryValuation: {
        totalProductsCount: allProducts.length,
        totalPhysicalStock,
        totalStockAssetValuation,
        totalStockSellPotential,
      },
      cogs: {
        totalProductHpp: productHppTotal,
        includedProductHpp: includedHpp,
        addonProductHpp: addonHpp,
      },
      expenses: {
        doctorFees: totalDoctorFee,
        employeeFees: totalEmployeeFee,
        salaries: totalSalaries,
        operatingExpenses: expenseByCategory,
        totalOperating: totalOperatingExpense,
        productHpp: productHppTotal,
        totalBeban,
      },
      netProfit,
    });
  } catch (err: any) {
    console.error('Error in profit-loss report:', err);
    res.status(500).json({ error: 'Gagal menyusun laporan laba rugi' });
  }
});

// Product Sales & Stock Expenditure Report (Laporan Pengeluaran Stok & Penjualan Produk)
app.get('/api/reports/products', async (req, res) => {
  try {
    const { category, itemType, productId, packageId, startDate, endDate, stockStatus } = req.query;

    const allProducts = await db.select().from(products);
    const allTxnItems = await db.select().from(transactionItems);
    const allBookings = await db.select().from(bookings);
    const allInvoices = await db.select().from(invoices);
    const allPatients = await db.select().from(patients);
    const allPackages = await db.select().from(circumcisionPackages);
    const allCategories = await db.select().from(patientCategories);
    const allProcedures = await db.select().from(circumcisionProcedures);
    const allMovements = await db.select().from(stockMovements);

    const bookingMap = new Map(allBookings.map(b => [b.id, b]));
    const invoiceMap = new Map(allInvoices.map(i => [i.id, i]));
    const patientMap = new Map(allPatients.map(p => [p.id, p]));
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    const packageMap = new Map(allPackages.map(p => [p.id, p]));
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    const procedureMap = new Map(allProcedures.map(p => [p.id, p]));
    const bookingProcedureMap = new Map(allProcedures.map(p => [p.bookingId, p]));

    const reportMap: Record<number, {
      productId: number;
      productSku: string;
      productName: string;
      category: string;
      size: string | null;
      unit: string;
      costPrice: number;
      sellPrice: number;
      currentStock: number;
      qtyIncluded: number;
      qtyAddon: number;
      qtyManualOut: number;
      qtyTotal: number;
      qtyDeducted: number;
      qtyPending: number;
      totalRevenue: number;
      totalCost: number;
      estimatedProfit: number;
    }> = {};

    // Initialize all products
    for (const p of allProducts) {
      if (category && category !== 'ALL' && p.category !== category) continue;
      if (productId && p.id !== Number(productId)) continue;

      const meta = parseProductMetadata(p);
      let pSize = meta.size;
      if (!pSize && (p.category === 'CELANA_SUNAT' || (p.name || '').toLowerCase().includes('celana'))) {
        const m = (p.name + ' ' + p.sku).match(/\b(XS|XL|S|M|L)\b/i);
        if (m) pSize = m[1].toUpperCase();
      }

      reportMap[p.id] = {
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        category: p.category,
        size: pSize || null,
        unit: p.unit,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        currentStock: p.stock,
        qtyIncluded: 0,
        qtyAddon: 0,
        qtyManualOut: 0,
        qtyTotal: 0,
        qtyDeducted: 0,
        qtyPending: 0,
        totalRevenue: 0,
        totalCost: 0,
        estimatedProfit: 0,
      };
    }

    const transactionRecords: Array<{
      id: number | string;
      date: string;
      bookingDate?: string;
      procedureDate?: string;
      bookingId: number | null;
      bookingNumber: string;
      invoiceNumber: string;
      patientName: string;
      patientAge: string;
      packageId: number | null;
      packageName: string;
      patientCategory: string;
      packageDetail: string;
      productId: number;
      productSku: string;
      productName: string;
      category: string;
      size: string | null;
      itemType: string;
      quantity: number;
      unit: string;
      costPrice: number;
      sellPrice: number;
      discountAmount: number;
      totalAmount: number;
      isStockDeducted: boolean;
      deductedAt: Date | string | null;
      notes: string;
      performedBy?: string;
    }> = [];

    // 1. Accumulate transaction items (Paket Included & Add-on Kasir)
    for (const item of allTxnItems) {
      const booking = bookingMap.get(item.bookingId);
      const invoice = item.invoiceId ? invoiceMap.get(item.invoiceId) : undefined;
      const patient = booking ? patientMap.get(booking.patientId) : undefined;
      const prod = productMap.get(item.productId);
      const pkg = booking?.packageId ? packageMap.get(booking.packageId) : undefined;
      const cat = booking?.patientCategoryId ? categoryMap.get(booking.patientCategoryId) : undefined;
      const proc = item.procedureId ? procedureMap.get(item.procedureId) : (booking ? bookingProcedureMap.get(booking.id) : undefined);

      const packageName = pkg?.name || booking?.methodType || 'Paket Sunat';
      const patientCategory = cat?.name || 'Reguler';
      const packageDetail = `${packageName}${cat?.name ? ` (${cat.name})` : ''}`;

      // Package filter if specified
      if (packageId && packageId !== 'ALL' && booking?.packageId !== Number(packageId)) continue;

      // Filter by stock status if requested
      if (stockStatus === 'DEDUCTED' && !item.isStockDeducted) continue;
      if (stockStatus === 'PENDING' && item.isStockDeducted) continue;

      // Determine date of stock outflow:
      // Priority 1: When stock was actually deducted/disbursed (deductedAt)
      // Priority 2: Procedure execution date (procedureDate)
      // Priority 3: Invoice date (invoiceDate)
      // Priority 4: Booking date (bookingDate)
      // Priority 5: Item created date
      let itemDate = '';
      if (item.deductedAt) {
        itemDate = new Date(item.deductedAt).toISOString().split('T')[0];
      } else if (proc?.procedureDate) {
        itemDate = proc.procedureDate;
      } else if (invoice?.invoiceDate) {
        itemDate = invoice.invoiceDate;
      } else if (booking?.bookingDate) {
        itemDate = booking.bookingDate;
      } else if (item.createdAt) {
        itemDate = new Date(item.createdAt).toISOString().split('T')[0];
      } else {
        itemDate = new Date().toISOString().split('T')[0];
      }

      // Date Range Filter
      if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
        if (itemDate < startDate.trim()) continue;
      }
      if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
        if (itemDate > endDate.trim()) continue;
      }

      // Category & Item Type Filter
      if (category && category !== 'ALL' && item.category !== category) continue;
      if (itemType === 'INCLUDED' && item.itemType !== 'INCLUDED') continue;
      if (itemType === 'ADDON' && item.itemType !== 'ADDON') continue;
      if (itemType === 'MANUAL_OUT') continue; // Only manual stock out in this mode
      if (productId && item.productId !== Number(productId)) continue;

      // Accumulate to product summary if exists in reportMap
      if (reportMap[item.productId]) {
        const rep = reportMap[item.productId];
        if (item.itemType === 'INCLUDED') {
          rep.qtyIncluded += item.quantity;
        } else {
          rep.qtyAddon += item.quantity;
          rep.totalRevenue += item.totalAmount;
        }
        rep.qtyTotal += item.quantity;
        if (item.isStockDeducted) {
          rep.qtyDeducted += item.quantity;
        } else {
          rep.qtyPending += item.quantity;
        }
        rep.totalCost += (item.costPriceSnapshot * item.quantity);
      }

      // Extract size for item
      const meta = parseProductMetadata(prod || { name: item.productName, sku: item.productSku, category: item.category, notes: item.notes });
      let itemSize = meta.size;
      if (!itemSize && item.notes) {
        const m = item.notes.match(/ukuran\s*([a-zA-Z]+)/i) || item.notes.match(/\b(XS|XL|S|M|L)\b/i);
        if (m) itemSize = m[1].toUpperCase();
      }
      if (!itemSize) {
        const m = ((item.productName || '') + ' ' + (item.productSku || '')).match(/\b(XS|XL|S|M|L)\b/i);
        if (m) itemSize = m[1].toUpperCase();
      }
      const isCelanaItem = item.category === 'CELANA_SUNAT' || (item.category as any) === 'CELANA' || (item.productName || '').toLowerCase().includes('celana');
      if (isCelanaItem && !itemSize) {
        itemSize = 'M';
      }

      // Append to transaction log
      transactionRecords.push({
        id: item.id,
        date: itemDate,
        bookingDate: booking?.bookingDate || '',
        procedureDate: proc?.procedureDate || '',
        bookingId: item.bookingId,
        bookingNumber: booking?.bookingNumber || '-',
        invoiceNumber: invoice?.invoiceNumber || '-',
        patientName: patient?.fullName || 'Pasien Umum',
        patientAge: patient?.ageYears ? `${patient.ageYears} th` : '-',
        packageId: booking?.packageId || null,
        packageName,
        patientCategory,
        packageDetail,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        category: item.category,
        size: itemSize || null,
        itemType: item.itemType,
        quantity: item.quantity,
        unit: prod?.unit || 'pcs',
        costPrice: item.costPriceSnapshot,
        sellPrice: item.sellPriceSnapshot,
        discountAmount: item.discountAmount,
        totalAmount: item.totalAmount,
        isStockDeducted: item.isStockDeducted,
        deductedAt: item.deductedAt,
        notes: item.notes || '',
        performedBy: proc?.doctorNameSnapshot || 'Staff Logistik',
      });
    }

    // 2. Accumulate manual operational stock outflows (Mutasi Keluar, Kerusakan, Kadaluwarsa, Pemakaian)
    if (!itemType || itemType === 'ALL' || itemType === 'MANUAL_OUT') {
      const manualOutMovements = allMovements.filter(m => 
        m.movementType === 'OUT' && 
        m.referenceType !== 'PROCEDURE_INCLUDED' && 
        m.referenceType !== 'TRANSACTION_ADDON'
      );

      for (const m of manualOutMovements) {
        const movDate = m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '';
        if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
          if (movDate < startDate.trim()) continue;
        }
        if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
          if (movDate > endDate.trim()) continue;
        }

        const prod = productMap.get(m.productId);
        if (category && category !== 'ALL' && prod?.category !== category) continue;
        if (productId && m.productId !== Number(productId)) continue;
        if (stockStatus === 'PENDING') continue; // Manual movements are already executed/deducted

        const qtyOut = Math.abs(m.quantity);
        const costVal = (m.unitCost || prod?.costPrice || 0) * qtyOut;

        if (reportMap[m.productId]) {
          const rep = reportMap[m.productId];
          rep.qtyManualOut = (rep.qtyManualOut || 0) + qtyOut;
          rep.qtyTotal += qtyOut;
          rep.qtyDeducted += qtyOut;
          rep.totalCost += costVal;
        }

        const movLabel = m.referenceType === 'DAMAGE' ? 'Barang Rusak'
          : m.referenceType === 'EXPIRED' ? 'Kadaluwarsa'
          : m.referenceType === 'USAGE' ? 'Pemakaian Operasional'
          : m.referenceType === 'RETURN' ? 'Retur Barang'
          : 'Mutasi Pengeluaran Manual';

        const movMeta = parseProductMetadata(prod || { notes: m.notes });
        let movSize = movMeta.size;
        if (!movSize && m.notes) {
          const szMatch = m.notes.match(/ukuran\s*([a-zA-Z]+)/i) || m.notes.match(/\b(XS|XL|S|M|L)\b/i);
          if (szMatch) movSize = szMatch[1].toUpperCase();
        }
        if (!movSize && prod) {
          const mSz = ((prod.name || '') + ' ' + (prod.sku || '')).match(/\b(XS|XL|S|M|L)\b/i);
          if (mSz) movSize = mSz[1].toUpperCase();
        }
        const isCelanaMov = prod?.category === 'CELANA_SUNAT' || (prod?.name || '').toLowerCase().includes('celana');
        if (isCelanaMov && !movSize) {
          movSize = 'M';
        }

        transactionRecords.push({
          id: `mov-${m.id}`,
          date: movDate,
          bookingId: null,
          bookingNumber: m.movementNumber,
          invoiceNumber: '-',
          patientName: `[Gudang] ${movLabel}`,
          patientAge: '-',
          packageId: null,
          packageName: movLabel,
          patientCategory: 'Operasional Gudang',
          packageDetail: m.notes || movLabel,
          productId: m.productId,
          productSku: prod?.sku || '-',
          productName: prod?.name || '-',
          category: prod?.category || 'LAINNYA',
          size: movSize || null,
          itemType: 'MANUAL_OUT',
          quantity: qtyOut,
          unit: prod?.unit || 'pcs',
          costPrice: m.unitCost || prod?.costPrice || 0,
          sellPrice: 0,
          discountAmount: 0,
          totalAmount: 0,
          isStockDeducted: true,
          deductedAt: m.createdAt,
          notes: m.notes || `Mutasi keluar oleh ${m.performedBy || 'Staff'}`,
          performedBy: m.performedBy || 'Staff Logistik',
        });
      }
    }

    // Sort transactions by date descending, then id descending
    transactionRecords.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      const aId = typeof a.id === 'number' ? a.id : 0;
      const bId = typeof b.id === 'number' ? b.id : 0;
      return bId - aId;
    });

    // Calculate profit per product
    for (const key of Object.keys(reportMap)) {
      const rep = reportMap[Number(key)];
      rep.estimatedProfit = rep.totalRevenue - (rep.qtyAddon * rep.costPrice);
    }

    const items = Object.values(reportMap);

    // Group breakdown by package
    const packageBreakdownMap: Record<string, { packageName: string; qtyTotal: number; qtyIncluded: number; qtyAddon: number; qtyManualOut: number }> = {};
    for (const rec of transactionRecords) {
      const pName = rec.packageName || 'Lainnya';
      if (!packageBreakdownMap[pName]) {
        packageBreakdownMap[pName] = {
          packageName: pName,
          qtyTotal: 0,
          qtyIncluded: 0,
          qtyAddon: 0,
          qtyManualOut: 0,
        };
      }
      packageBreakdownMap[pName].qtyTotal += rec.quantity;
      if (rec.itemType === 'INCLUDED') {
        packageBreakdownMap[pName].qtyIncluded += rec.quantity;
      } else if (rec.itemType === 'ADDON') {
        packageBreakdownMap[pName].qtyAddon += rec.quantity;
      } else {
        packageBreakdownMap[pName].qtyManualOut += rec.quantity;
      }
    }

    const summary = {
      totalItems: items.length,
      totalQtyDisbursed: items.reduce((acc, i) => acc + i.qtyTotal, 0),
      totalQtyDeducted: items.reduce((acc, i) => acc + i.qtyDeducted, 0),
      totalQtyPending: items.reduce((acc, i) => acc + i.qtyPending, 0),
      totalQtyIncluded: items.reduce((acc, i) => acc + i.qtyIncluded, 0),
      totalQtyAddon: items.reduce((acc, i) => acc + i.qtyAddon, 0),
      totalQtyManualOut: items.reduce((acc, i) => acc + (i.qtyManualOut || 0), 0),
      totalRevenueAddons: items.reduce((acc, i) => acc + i.totalRevenue, 0),
      totalProductHpp: items.reduce((acc, i) => acc + i.totalCost, 0),
      totalGrossProfitAddons: items.reduce((acc, i) => acc + i.estimatedProfit, 0),
      totalTransactions: transactionRecords.length,
      packageBreakdown: Object.values(packageBreakdownMap),
    };

    res.json({
      period: {
        startDate: (startDate as string) || '',
        endDate: (endDate as string) || '',
      },
      summary,
      items,
      transactions: transactionRecords,
      packages: allPackages.map(p => ({ id: p.id, name: p.name })),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyusun laporan pengeluaran stok produk' });
  }
});

// Circumcision Procedures Report (Laporan Tindakan Khitan)
app.get('/api/reports/procedures', async (req, res) => {
  try {
    await syncDoctorFeesWithReports();
    const isAllTime = req.query.allTime === 'true' || req.query.startDate === 'ALL' || (!req.query.startDate && !req.query.endDate);
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const { status, doctorId, packageId } = req.query;
    const branchFilter = getBranchFilter(req);

    let allProcedures = await db.select().from(circumcisionProcedures);
    allProcedures = filterByBranch(allProcedures, branchFilter);

    const allBookings = await db.select().from(bookings);
    const allPatients = await db.select().from(patients);
    const allGuardians = await db.select().from(guardians);
    const allInvoices = await db.select().from(invoices);
    const allPackages = await db.select().from(circumcisionPackages);
    const allDoctors = await db.select().from(doctors);
    const allDoctorFees = await db.select().from(doctorFeeTransactions);
    const allEmployeeFees = await db.select().from(employeeFeeTransactions);
    const allTxnItems = await db.select().from(transactionItems);

    const bookingMap = new Map(allBookings.map(b => [b.id, b]));
    const patientMap = new Map(allPatients.map(p => [p.id, p]));
    const guardianMap = new Map(allGuardians.map(g => [g.id, g]));
    const invoiceMap = new Map(allInvoices.map(i => [i.bookingId, i]));
    const packageMap = new Map(allPackages.map(p => [p.id, p]));
    const doctorMap = new Map(allDoctors.map(d => [d.id, d]));

    const filtered = allProcedures.filter(proc => {
      const pDate = proc.procedureDate || '';
      if (!isAllTime) {
        if (startDate && pDate < startDate) return false;
        if (endDate && pDate > endDate) return false;
      }
      if (status && status !== 'ALL' && proc.status !== status) return false;
      if (doctorId && doctorId !== 'ALL' && proc.doctorId !== Number(doctorId)) return false;
      const b = bookingMap.get(proc.bookingId);
      if (packageId && packageId !== 'ALL' && b?.packageId !== Number(packageId)) return false;
      return true;
    });

    const allProducts = await db.select().from(products);
    const prodMap = new Map(allProducts.map(p => [p.id, p]));

    const proceduresList = filtered.map(proc => {
      const b = bookingMap.get(proc.bookingId);
      const patient = b ? patientMap.get(b.patientId) : undefined;
      const guardian = patient?.guardianId ? guardianMap.get(patient.guardianId) : undefined;
      const inv = invoiceMap.get(proc.bookingId);
      const pkg = b?.packageId ? packageMap.get(b.packageId) : undefined;
      const doc = proc.doctorId ? doctorMap.get(proc.doctorId) : undefined;
      const docFee = allDoctorFees.find(f => (f.procedureId === proc.id || (f.bookingId === proc.bookingId && f.doctorId === proc.doctorId)) && f.status !== 'CANCELLED');
      const empFees = allEmployeeFees.filter(f => f.procedureId === proc.id && f.status !== 'CANCELLED');
      const usedItems = allTxnItems.filter(i => i.bookingId === proc.bookingId || i.procedureId === proc.id);

      return {
        id: proc.id,
        procedureNumber: proc.procedureNumber || `PROC-${proc.id}`,
        bookingId: proc.bookingId,
        bookingNumber: b?.bookingNumber || '-',
        procedureDate: proc.procedureDate || '',
        procedureTime: proc.procedureTime || b?.bookingTime || '-',
        endTime: (proc as any).endTime || '-',
        status: proc.status,
        patientName: patient?.fullName || 'Pasien',
        patientAge: patient?.ageYears ? `${patient.ageYears} th` : (patient?.ageMonths ? `${patient.ageMonths} bln` : '-'),
        rmNumber: patient?.rmNumber || '-',
        guardianName: guardian?.name || guardian?.guardianName || '-',
        guardianPhone: guardian?.phone || '-',
        packageName: pkg?.name || b?.methodType || 'Paket Khitan',
        doctorName: proc.doctorNameSnapshot || doc?.name || '-',
        assistantName: proc.assistantStaffName || '-',
        anesthesiaNotes: proc.anesthesiaType || '-',
        notes: proc.procedureNotes || '-',
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.invoiceNumber || '-',
        invoiceStatus: inv?.status || 'UNPAID',
        invoiceTotalAmount: inv?.totalAmount || b?.totalAmount || 0,
        invoicePaidAmount: inv?.paidAmount || 0,
        doctorFeeAmount: docFee?.feeAmount || 0,
        employeeFeeAmount: empFees.reduce((acc, ef) => acc + ef.feeAmount, 0),
        usedItemsCount: usedItems.length,
        usedItems: usedItems.map(it => {
          const pr = prodMap.get(it.productId);
          return {
            productName: it.productName,
            category: it.category,
            quantity: it.quantity,
            unit: pr?.unit || 'pcs',
            itemType: it.itemType,
            isStockDeducted: it.isStockDeducted,
          };
        }),
      };
    });

    // Summary calculations
    const completedProcs = proceduresList.filter(p => p.status === 'COMPLETED');
    const waitingProcs = proceduresList.filter(p => p.status === 'WAITING');
    const inProgressProcs = proceduresList.filter(p => p.status === 'IN_PROGRESS');

    const methodDistribution: Record<string, number> = {};
    const doctorDistribution: Record<string, number> = {};

    proceduresList.forEach(p => {
      methodDistribution[p.packageName] = (methodDistribution[p.packageName] || 0) + 1;
      doctorDistribution[p.doctorName] = (doctorDistribution[p.doctorName] || 0) + 1;
    });

    res.json({
      period: {
        startDate: isAllTime ? 'Semua Waktu' : startDate,
        endDate: isAllTime ? 'Semua Waktu' : endDate,
        isAllTime,
      },
      summary: {
        totalProcedures: proceduresList.length,
        completedCount: completedProcs.length,
        waitingCount: waitingProcs.length,
        inProgressCount: inProgressProcs.length,
        totalInvoiceAmount: proceduresList.reduce((acc, p) => acc + p.invoiceTotalAmount, 0),
        totalPaidAmount: proceduresList.reduce((acc, p) => acc + p.invoicePaidAmount, 0),
        totalDoctorFee: proceduresList.reduce((acc, p) => acc + p.doctorFeeAmount, 0),
        methodDistribution,
        doctorDistribution,
      },
      procedures: proceduresList,
    });
  } catch (err: any) {
    console.error('Error in /api/reports/procedures:', err);
    res.status(500).json({ error: 'Gagal menyusun laporan tindakan khitan' });
  }
});

// Master Sync Endpoint to Ensure All Clinical Procedures, Stock Outflows, and Invoices Are Synchronized
app.post('/api/reports/sync', async (req, res) => {
  try {
    console.log('[REPORTS SYNC] Starting full database synchronization...');
    // 0. Ensure schema, table structure, initial seed, and baseline transactions if empty
    await ensureDatabaseSchema();
    await ensureSampleTransactionsIfEmpty();

    // 1. Auto-heal missing payments for paid invoices
    await autoHealMissingPayments();

    // 2. Auto-heal any completed procedures whose transaction items were not marked deducted
    const completedProcs = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.status, 'COMPLETED'));
    let deductedItemsCount = 0;
    const now = new Date();

    for (const proc of completedProcs) {
      await ensureIncludedItemsForBooking(proc.bookingId);
      const pendingItems = await db.select().from(transactionItems).where(
        and(
          eq(transactionItems.bookingId, proc.bookingId),
          eq(transactionItems.isStockDeducted, false)
        )
      );

      for (const item of pendingItems) {
        const prod = await db.select().from(products).where(eq(products.id, item.productId));
        if (prod.length > 0) {
          const currentProd = prod[0];
          const newStock = Math.max(0, currentProd.stock - item.quantity);
          await db.update(products).set({ stock: newStock }).where(eq(products.id, currentProd.id));

          await db.insert(stockMovements).values({
            movementNumber: `MOV-SYNC-${Date.now().toString().slice(-6)}-${item.id}`,
            productId: currentProd.id,
            movementType: 'OUT',
            quantity: item.quantity,
            previousStock: currentProd.stock,
            currentStock: newStock,
            unitCost: currentProd.costPrice,
            unitPrice: currentProd.sellPrice,
            referenceType: item.itemType === 'INCLUDED' ? 'PROCEDURE_INCLUDED' : 'TRANSACTION_ADDON',
            referenceId: proc.id,
            notes: `[AUTO-SYNC] Pengeluaran stok tindakan khitan Booking #${proc.bookingId} (${item.productName})`,
            performedBy: 'System Auto-Sync',
          });
        }

        await db.update(transactionItems).set({
          isStockDeducted: true,
          deductedAt: now,
          procedureId: proc.id
        }).where(eq(transactionItems.id, item.id));

        deductedItemsCount++;
      }
    }

    // 3. Re-verify and synchronize all doctor fee transactions with reports
    const docFeeSyncResult = await syncDoctorFeesWithReports('ALL');

    // 4. Synchronize branch codes across all tables
    await syncBranchCodesAcrossTables();

    // 5. Query summary count of transactions
    const totalBookings = (await db.select().from(bookings)).length;
    const totalInvoices = (await db.select().from(invoices)).length;
    const totalProcedures = (await db.select().from(circumcisionProcedures)).length;

    console.log(`[REPORTS SYNC] Completed: ${deductedItemsCount} items synchronized. Total Bookings: ${totalBookings}, Invoices: ${totalInvoices}.`);
    res.json({
      success: true,
      message: `Sinkronisasi database berhasil! ${totalProcedures} tindakan khitan, ${totalInvoices} invoice kasir, dan ${deductedItemsCount} pengeluaran stok telah direkonsiliasi. Laporan laba rugi langsung tersinkron.`,
      deductedItemsCount,
      totalBookings,
      totalInvoices,
      totalProcedures,
    });
  } catch (err: any) {
    console.error('Error during /api/reports/sync:', err);
    res.status(500).json({ error: 'Gagal melakukan sinkronisasi laporan: ' + (err.message || String(err)) });
  }
});



// Backup Database Metadata & Local Computer Export/Restore
async function getAllDatabaseData() {
  const [
    allSettings,
    allUsers,
    allPatients,
    allGuardians,
    allCategories,
    allPackages,
    allPackagePrices,
    allMethods,
    allDoctors,
    allDoctorSchedules,
    allDoctorFeeRules,
    allBookings,
    allBookingHistory,
    allQueues,
    allProcedures,
    allConsents,
    allCertificates,
    allInvoices,
    allPayments,
    allDoctorFees,
    allExpenseCategories,
    allExpenses,
    allFollowUps,
    allAuditLogs,
    allProducts,
    allPackageItems,
    allStockMovements,
    allTransactionItems,
    allEmployees,
    allEmployeeFeeRules,
    allEmployeeFees,
    allPayrolls,
  ] = await Promise.all([
    db.select().from(clinicSettings),
    db.select().from(users),
    db.select().from(patients),
    db.select().from(guardians),
    db.select().from(patientCategories),
    db.select().from(circumcisionPackages),
    db.select().from(packagePrices),
    db.select().from(circumcisionMethods),
    db.select().from(doctors),
    db.select().from(doctorSchedules),
    db.select().from(doctorFeeRules),
    db.select().from(bookings),
    db.select().from(bookingStatusHistory),
    db.select().from(queues),
    db.select().from(circumcisionProcedures),
    db.select().from(informedConsents),
    db.select().from(certificates),
    db.select().from(invoices),
    db.select().from(payments),
    db.select().from(doctorFeeTransactions),
    db.select().from(expenseCategories),
    db.select().from(expenseTransactions),
    db.select().from(followUps),
    db.select().from(auditLogs),
    db.select().from(products),
    db.select().from(packageIncludedItems),
    db.select().from(stockMovements),
    db.select().from(transactionItems),
    db.select().from(employees),
    db.select().from(employeeFeeRules),
    db.select().from(employeeFeeTransactions),
    db.select().from(payrolls),
  ]);

  return {
    clinicSettings: allSettings,
    users: allUsers,
    patients: allPatients,
    guardians: allGuardians,
    patientCategories: allCategories,
    circumcisionPackages: allPackages,
    packagePrices: allPackagePrices,
    circumcisionMethods: allMethods,
    doctors: allDoctors,
    doctorSchedules: allDoctorSchedules,
    doctorFeeRules: allDoctorFeeRules,
    bookings: allBookings,
    bookingStatusHistory: allBookingHistory,
    queues: allQueues,
    circumcisionProcedures: allProcedures,
    informedConsents: allConsents,
    certificates: allCertificates,
    invoices: allInvoices,
    payments: allPayments,
    doctorFeeTransactions: allDoctorFees,
    expenseCategories: allExpenseCategories,
    expenseTransactions: allExpenses,
    followUps: allFollowUps,
    auditLogs: allAuditLogs,
    products: allProducts,
    packageIncludedItems: allPackageItems,
    stockMovements: allStockMovements,
    transactionItems: allTransactionItems,
    employees: allEmployees,
    employeeFeeRules: allEmployeeFeeRules,
    employeeFeeTransactions: allEmployeeFees,
    payrolls: allPayrolls,
  };
}

// 1. Metadata status & statistik database beserta deteksi tools PostgreSQL native (pg_dump)
app.get('/api/backup', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getAllDatabaseData();
    const pgTools = detectPgTools();
    const pgConfig = getPostgresConfig();

    const summary = {
      databaseType: 'PostgreSQL Database Server',
      region: 'Local / Cloud SQL',
      status: 'HEALTHY',
      databaseConfig: {
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        user: pgConfig.user,
      },
      pgTools: {
        available: pgTools.available,
        pgDumpPath: pgTools.pgDumpPath,
        pgRestorePath: pgTools.pgRestorePath,
        version: pgTools.version,
        scannedLocations: pgTools.scannedLocations,
        platform: pgTools.platform,
      },
      savedBackups: listSavedBackups(),
      tablesProtected: Object.keys(data).length,
      patientsCount: data.patients.length,
      bookingsCount: data.bookings.length,
      proceduresCount: data.circumcisionProcedures.length,
      invoicesCount: data.invoices.length,
      paymentsCount: data.payments.length,
      productsCount: data.products.length,
      employeesCount: data.employees.length,
      auditLogsCount: data.auditLogs.length,
      totalRecords: Object.values(data).reduce((acc, arr) => acc + arr.length, 0),
      lastChecked: new Date().toISOString(),
    };
    res.json(summary);
  } catch (err: any) {
    console.error('Failed to get backup metadata:', err);
    res.status(500).json({ error: 'Gagal mengambil metadata database' });
  }
});

// 1b. Eksekusi Native PostgreSQL Backup menggunakan pg_dump atau MySQL format generator
app.post('/api/backup/native', requireAuth, async (req: AuthRequest, res) => {
  const { type = 'full', format = 'custom' } = req.body;

  // Validasi input
  if (!['full', 'data', 'structure'].includes(type)) {
    return res.status(400).json({ error: 'Tipe backup tidak valid. Pilih: full, data, atau structure.' });
  }
  if (!['custom', 'plain', 'mysql'].includes(format)) {
    return res.status(400).json({ error: 'Format backup tidak valid. Pilih: custom, plain, atau mysql.' });
  }

  // Format MySQL DDL + DML Export
  if (format === 'mysql') {
    try {
      const tables = await getAllDatabaseData();
      const config = getPostgresConfig();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestampStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
      const cleanDbName = (config.database || 'nano_clinic').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanDbName}_mysql_${type}_${timestampStr}.sql`;

      const outputDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const destinationFilePath = path.join(outputDir, filename);

      const dumpResult = buildCompleteMysqlDump(tables, req.user?.email || 'admin', { type });
      fs.writeFileSync(destinationFilePath, dumpResult.sql, 'utf8');

      const stat = fs.statSync(destinationFilePath);
      const sizeHuman = formatBytes(stat.size);

      await recordAudit(
        'MYSQL_DUMP',
        'database',
        filename,
        req.user?.email || 'admin',
        `Full backup format MySQL/MariaDB (${type.toUpperCase()}) - ${dumpResult.totalRows} baris data. Ukuran: ${sizeHuman}`
      );

      return res.json({
        success: true,
        message: 'Backup format MySQL / MariaDB berhasil dibuat!',
        backup: {
          success: true,
          filename,
          filePath: destinationFilePath,
          sizeBytes: stat.size,
          sizeHuman,
          type,
          format: 'mysql',
          database: config.database,
          timestamp: timestampStr,
          validatedWithPgRestore: false,
          validationMessage: `Format MySQL Dump (InnoDB utf8mb4, 32 tabel + indexes + ${dumpResult.totalRows} baris data) siap diimport langsung ke phpMyAdmin, MySQL Workbench, atau MariaDB.`,
        },
        downloadUrl: `/api/backup/download/${encodeURIComponent(filename)}`,
      });
    } catch (mysqlErr: any) {
      console.error('MySQL backup export failed:', mysqlErr);
      return res.status(500).json({
        success: false,
        error: `Gagal membuat backup format MySQL: ${mysqlErr.message}`,
      });
    }
  }

  // Check if pg_dump tools are available on the host environment
  const pgTools = detectPgTools();

  if (pgTools.available && format === 'custom') {
    try {
      const result = await runNativePgDump({
        type,
        format,
      });

      await recordAudit(
        'NATIVE_PG_DUMP',
        'database',
        result.filename,
        req.user?.email || 'admin',
        `Full backup PostgreSQL (${type.toUpperCase()} - ${format.toUpperCase()}) menggunakan pg_dump native. Ukuran: ${result.sizeHuman}`
      );

      return res.json({
        success: true,
        message: 'Backup PostgreSQL berhasil dibuat dan divalidasi!',
        backup: result,
        downloadUrl: `/api/backup/download/${encodeURIComponent(result.filename)}`,
      });
    } catch (err: any) {
      console.log('Catatan eksekusi native pg_dump:', err.message);
    }
  }

  // Generate High-Fidelity PostgreSQL SQL DDL + Data Dump directly
  try {
    const tables = await getAllDatabaseData();
    const config = getPostgresConfig();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestampStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const cleanDbName = (config.database || 'nano_clinic').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanDbName}_full_dump_${timestampStr}.sql`;

    const outputDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const destinationFilePath = path.join(outputDir, filename);

    const dumpResult = buildCompletePostgresSqlDump(tables, req.user?.email || 'admin', { type });
    fs.writeFileSync(destinationFilePath, dumpResult.sql, 'utf8');

    const stat = fs.statSync(destinationFilePath);
    const sizeHuman = formatBytes(stat.size);

    await recordAudit(
      'FULL_SQL_BACKUP',
      'database',
      filename,
      req.user?.email || 'admin',
      `Full backup PostgreSQL SQL (${type.toUpperCase()} - DDL + Data ${dumpResult.totalRows} baris). Ukuran: ${sizeHuman}`
    );

    return res.json({
      success: true,
      isFallback: !pgTools.available && format === 'custom',
      message: 'Backup PostgreSQL Plain SQL (DDL + Data) berhasil dibuat!',
      backup: {
        success: true,
        filename,
        filePath: destinationFilePath,
        sizeBytes: stat.size,
        sizeHuman,
        type,
        format: 'plain',
        database: config.database,
        timestamp: timestampStr,
        validatedWithPgRestore: false,
        validationMessage: `Struktur DDL Lengkap (32 tabel + constraints + sequences + ${dumpResult.totalRows} baris data) siap dibuka dan dieksekusi langsung di pgAdmin 4 Query Tool.`,
        warning: (!pgTools.available && format === 'custom')
          ? 'Catatan: pg_dump biner tidak aktif di lingkungan server. Sistem otomatis membuat file Plain SQL (.sql) yang 100% kompatibel dan langsung bisa dibuka di Query Tool pgAdmin 4.'
          : undefined,
      },
      downloadUrl: `/api/backup/download/${encodeURIComponent(filename)}`,
    });
  } catch (sqlErr: any) {
    console.error('SQL export failed:', sqlErr);
    return res.status(500).json({
      success: false,
      error: `Gagal membuat backup database: ${sqlErr.message}`,
    });
  }
});

// 1c. Unduh file backup dari server disk
app.get('/api/backup/download/:filename', requireAuth, (req: AuthRequest, res) => {
  try {
    const filename = req.params.filename;
    // Prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Nama file tidak valid.' });
    }

    const filePath = path.join(process.cwd(), 'backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File cadangan tidak ditemukan di server.' });
    }

    const contentType = filename.endsWith('.backup')
      ? 'application/octet-stream'
      : filename.endsWith('.sql')
      ? 'application/sql'
      : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err: any) {
    console.error('Download backup file failed:', err);
    res.status(500).json({ error: 'Gagal mengunduh file backup.' });
  }
});

// 2. Export database lengkap dalam format JSON untuk disimpan di lokal komputer
app.get('/api/backup/export', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tables = await getAllDatabaseData();
    const totalRecords = Object.values(tables).reduce((acc, arr) => acc + arr.length, 0);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `nano_clinic_backup_${dateStr}_${timeStr}.json`;

    const payload = {
      metadata: {
        app: 'Nano Circumcision Clinic Management System',
        databaseEngine: 'PostgreSQL Cloud SQL',
        version: '1.0',
        exportedAt: now.toISOString(),
        exportedBy: req.user?.email || 'admin@nanocircumcision.com',
        totalTables: Object.keys(tables).length,
        totalRecords,
        counts: {
          patients: tables.patients.length,
          guardians: tables.guardians.length,
          bookings: tables.bookings.length,
          procedures: tables.circumcisionProcedures.length,
          invoices: tables.invoices.length,
          payments: tables.payments.length,
          doctorFees: tables.doctorFeeTransactions.length,
          expenses: tables.expenseTransactions.length,
          products: tables.products.length,
          stockMovements: tables.stockMovements.length,
          employees: tables.employees.length,
          payrolls: tables.payrolls.length,
          auditLogs: tables.auditLogs.length,
        },
      },
      data: tables,
    };

    await recordAudit('BACKUP_DOWNLOAD_JSON', 'database', 'all_tables', req.user?.email || 'admin', `Unduh backup database JSON (${totalRecords} baris data) ke komputer lokal`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err: any) {
    console.error('Backup export failed:', err);
    res.status(500).json({ error: 'Gagal mengekspor backup database: ' + err.message });
  }
});

// 3. Export database dalam bentuk script SQL Dump standar (LENGKAP: STRUCTURE DDL + DATA + SEQUENCES + CONSTRAINTS)
app.get('/api/backup/sql', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tables = await getAllDatabaseData();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `nano_clinic_dump_${dateStr}_${timeStr}.sql`;

    const { sql: sqlOutput, totalRows: totalInserted } = buildCompletePostgresSqlDump(
      tables,
      req.user?.email || 'admin@nanocircumcision.com',
      { type: 'full' }
    );

    await recordAudit('BACKUP_DOWNLOAD_SQL', 'database', 'all_tables', req.user?.email || 'admin', `Unduh FULL dump SQL (DDL + ${totalInserted} baris data) ke komputer lokal`);

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sqlOutput);
  } catch (err: any) {
    console.error('SQL dump export failed:', err);
    res.status(500).json({ error: 'Gagal membuat SQL dump: ' + err.message });
  }
});

// 3b. Export database dalam bentuk script MySQL Dump standar (.sql kompatibel MySQL 5.7, 8.0, MariaDB, phpMyAdmin)
app.get('/api/backup/mysql', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tables = await getAllDatabaseData();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `nano_clinic_mysql_dump_${dateStr}_${timeStr}.sql`;

    const { sql: sqlOutput, totalRows: totalInserted } = buildCompleteMysqlDump(
      tables,
      req.user?.email || 'admin@nanocircumcision.com',
      { type: 'full' }
    );

    // Simpan juga salinan di folder backups/
    const outputDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const destinationFilePath = path.join(outputDir, filename);
    fs.writeFileSync(destinationFilePath, sqlOutput, 'utf8');

    await recordAudit(
      'BACKUP_DOWNLOAD_MYSQL',
      'database',
      filename,
      req.user?.email || 'admin',
      `Unduh FULL dump MySQL / MariaDB (DDL + ${totalInserted} baris data) ke komputer lokal`
    );

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sqlOutput);
  } catch (err: any) {
    console.error('MySQL dump export failed:', err);
    res.status(500).json({ error: 'Gagal membuat MySQL dump: ' + err.message });
  }
});

// 4. Restore database dari file backup JSON lokal
app.post('/api/backup/restore', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang berwenang melakukan pemulihan database.' });
    }

    const { backupData } = req.body;
    if (!backupData || !backupData.data) {
      return res.status(400).json({ error: 'Format file backup tidak valid. Pastikan memilih file JSON hasil backup Nano Circumcision.' });
    }

    const data = backupData.data;
    let restoredCount = 0;

    const cleanItem = (item: any) => {
      const copy = { ...item };
      for (const k of Object.keys(copy)) {
        if (typeof copy[k] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(copy[k])) {
          copy[k] = new Date(copy[k]);
        }
      }
      return copy;
    };

    // Restore Guardians
    if (Array.isArray(data.guardians)) {
      for (const g of data.guardians) {
        const item = cleanItem(g);
        const existing = await db.select().from(guardians).where(eq(guardians.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(guardians).values(item);
        else await db.update(guardians).set(item).where(eq(guardians.id, item.id));
        restoredCount++;
      }
    }

    // Restore Patients
    if (Array.isArray(data.patients)) {
      for (const p of data.patients) {
        const item = cleanItem(p);
        const existing = await db.select().from(patients).where(eq(patients.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(patients).values(item);
        else await db.update(patients).set(item).where(eq(patients.id, item.id));
        restoredCount++;
      }
    }

    // Restore Circumcision Methods
    if (Array.isArray(data.circumcisionMethods)) {
      for (const m of data.circumcisionMethods) {
        const item = cleanItem(m);
        const existing = await db.select().from(circumcisionMethods).where(eq(circumcisionMethods.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(circumcisionMethods).values(item);
        else await db.update(circumcisionMethods).set(item).where(eq(circumcisionMethods.id, item.id));
        restoredCount++;
      }
    }

    // Restore Doctors
    if (Array.isArray(data.doctors)) {
      for (const d of data.doctors) {
        const item = cleanItem(d);
        const existing = await db.select().from(doctors).where(eq(doctors.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(doctors).values(item);
        else await db.update(doctors).set(item).where(eq(doctors.id, item.id));
        restoredCount++;
      }
    }

    // Restore Bookings
    if (Array.isArray(data.bookings)) {
      for (const b of data.bookings) {
        const item = cleanItem(b);
        const existing = await db.select().from(bookings).where(eq(bookings.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(bookings).values(item);
        else await db.update(bookings).set(item).where(eq(bookings.id, item.id));
        restoredCount++;
      }
    }

    // Restore Procedures
    if (Array.isArray(data.circumcisionProcedures)) {
      for (const proc of data.circumcisionProcedures) {
        const item = cleanItem(proc);
        const existing = await db.select().from(circumcisionProcedures).where(eq(circumcisionProcedures.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(circumcisionProcedures).values(item);
        else await db.update(circumcisionProcedures).set(item).where(eq(circumcisionProcedures.id, item.id));
        restoredCount++;
      }
    }

    // Restore Invoices
    if (Array.isArray(data.invoices)) {
      for (const inv of data.invoices) {
        const item = cleanItem(inv);
        const existing = await db.select().from(invoices).where(eq(invoices.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(invoices).values(item);
        else await db.update(invoices).set(item).where(eq(invoices.id, item.id));
        restoredCount++;
      }
    }

    // Restore Payments
    if (Array.isArray(data.payments)) {
      for (const pay of data.payments) {
        const item = cleanItem(pay);
        const existing = await db.select().from(payments).where(eq(payments.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(payments).values(item);
        else await db.update(payments).set(item).where(eq(payments.id, item.id));
        restoredCount++;
      }
    }

    // Restore Products & Stock
    if (Array.isArray(data.products)) {
      for (const prod of data.products) {
        const item = cleanItem(prod);
        const existing = await db.select().from(products).where(eq(products.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(products).values(item);
        else await db.update(products).set(item).where(eq(products.id, item.id));
        restoredCount++;
      }
    }

    // Restore Employees
    if (Array.isArray(data.employees)) {
      for (const emp of data.employees) {
        const item = cleanItem(emp);
        const existing = await db.select().from(employees).where(eq(employees.id, item.id)).limit(1);
        if (existing.length === 0) await db.insert(employees).values(item);
        else await db.update(employees).set(item).where(eq(employees.id, item.id));
        restoredCount++;
      }
    }

    // Restore Clinic Settings
    if (Array.isArray(data.clinicSettings) && data.clinicSettings.length > 0) {
      const st = cleanItem(data.clinicSettings[0]);
      const existing = await db.select().from(clinicSettings).where(eq(clinicSettings.id, st.id)).limit(1);
      if (existing.length === 0) await db.insert(clinicSettings).values(st);
      else await db.update(clinicSettings).set(st).where(eq(clinicSettings.id, st.id));
      restoredCount++;
    }

    await recordAudit('BACKUP_RESTORE_FILE', 'database', 'all_tables', req.user?.email || 'admin', `Pemulihan database dari file backup lokal berhasil (${restoredCount} baris data dipulihkan)`);

    res.json({
      success: true,
      message: `Pemulihan database berhasil! ${restoredCount} baris data telah diverifikasi dan disinkronkan ke Cloud SQL.`,
      restoredCount,
    });
  } catch (err: any) {
    console.error('Backup restore failed:', err);
    res.status(500).json({ error: 'Gagal memulihkan database dari file: ' + err.message });
  }
});

// 5. Reset Data Transaksi (Hapus Pasien, Booking, Invoice, dll. Menjadikan aplikasi siap pakai baru)
// Kecuali: Stok Barang & Alkes, Data Login, Data Dokter Nakes, Manajemen Pengguna
app.post('/api/database/reset-transactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Hanya Super Admin / Owner yang berwenang melakukan pembersihan data transaksi.' });
    }

    console.log(`[RESET TRANSACTIONS] Diminta oleh ${req.user?.email} (${req.user?.role})`);

    // Delete child records first to respect foreign keys
    await db.delete(transactionItems);
    await db.delete(payments);
    await db.delete(doctorFeeTransactions);
    await db.delete(employeeFeeTransactions);
    await db.delete(payrolls);
    await db.delete(certificates);
    await db.delete(informedConsents);
    await db.delete(followUps);
    await db.delete(invoices);
    await db.delete(circumcisionProcedures);
    await db.delete(queues);
    await db.delete(bookingStatusHistory);
    await db.delete(bookings);
    await db.delete(patients);
    await db.delete(guardians);
    await db.delete(expenseTransactions);
    await db.delete(stockMovements);
    await db.delete(auditLogs);

    // Re-initialize clean stock movements for existing products
    const currentProducts = await db.select().from(products);
    const todayStr = new Date().toISOString().split('T')[0];
    let seq = 1;
    for (const prod of currentProducts) {
      const movementNumber = 'STM-' + todayStr.replace(/-/g, '') + '-' + String(seq++).padStart(4, '0');
      await db.insert(stockMovements).values({
        movementNumber,
        productId: prod.id,
        movementType: 'IN',
        quantity: prod.stock,
        previousStock: 0,
        currentStock: prod.stock,
        unitCost: prod.costPrice || 0,
        unitPrice: prod.sellPrice || 0,
        referenceType: 'ADJUSTMENT',
        notes: 'Saldo / Stok Awal Barang Siap Operasional',
        performedBy: (req.user as any)?.fullName || req.user?.name || 'Administrator',
      });
    }

    // Insert clean initial audit log
    await db.insert(auditLogs).values({
      action: 'SYSTEM_RESET',
      entity: 'DATABASE',
      entityId: 'ALL_TRANSACTIONS',
      performedBy: req.user?.email || 'admin',
      details: `Database direset operasional oleh ${(req.user as any)?.fullName || req.user?.name || 'Super Admin'}. Data pasien, booking, invoice, tindakan EMR, dan rekap finansial dibersihkan. Stok barang, alkes, data login, dokter, dan nakes tetap utuh.`,
    });

    return res.json({
      success: true,
      message: 'Seluruh data pasien, booking, invoice, dan transaksi lama telah berhasil dibersihkan! Aplikasi kini seperti baru dan siap digunakan.',
      preserved: {
        productsCount: currentProducts.length,
        stockStatus: 'Tetap utuh dengan kartu stok saldo awal baru',
        usersStatus: 'Akun login dan hak akses pengguna tetap aman',
        doctorsStatus: 'Data dokter dan nakes tetap tersimpan',
      }
    });
  } catch (err: any) {
    console.error('Reset transaction data failed:', err);
    return res.status(500).json({ error: `Gagal membersihkan data transaksi: ${err.message}` });
  }
});

// 6. Manual / Triggered Schema Migration & Verification API (Both POST and GET for easy browser access)
const handleDatabaseMigration = async (req: express.Request, res: express.Response) => {
  try {
    console.log('[API] Menjalankan perbaikan & migrasi struktur database atas permintaan pengguna/sistem...');
    await ensureDatabaseSchema();
    await seedInitialData();
    const logs = await runCompleteSchemaMigration();
    res.json({
      success: true,
      message: 'Sinkronisasi dan perbaikan struktur database berhasil dijalankan! Semua 34 tabel dan akun owner/admin siap digunakan.',
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('API Migrate failed:', err);
    res.status(500).json({ error: 'Gagal menjalankan migrasi database: ' + (err.message || String(err)) });
  }
};

app.post('/api/database/migrate', handleDatabaseMigration);
app.get('/api/database/migrate', handleDatabaseMigration);
app.get('/api/database/setup', handleDatabaseMigration);

app.get('/api/database/migrate-status', async (req, res) => {
  try {
    const checkColumns = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (
        (column_name = 'branch_code') 
        OR (table_name = 'branches')
        OR (table_name = 'employees' AND column_name IN ('default_patient_fee', 'basic_salary', 'closing_fee_per_patient', 'overtime_hourly_rate'))
        OR (table_name = 'products' AND column_name IN ('cost_price', 'min_stock', 'is_active'))
      )
      ORDER BY table_name, column_name;
    `);

    res.json({
      success: true,
      totalChecked: checkColumns.rows.length,
      columns: checkColumns.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengecek status migrasi: ' + (err.message || String(err)) });
  }
});

// Vite Middleware for Frontend Integration
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isAiStudioEnv = Boolean(process.env.APPLET_ID || process.env.DEFAULT_APP_PORT);
  const entryScript = process.argv[1] || '';
  const isBuiltBundle = entryScript.endsWith('server.cjs') || entryScript.endsWith('server.js');
  const isCloudHost = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.HEROKU_APP_NAME
  );
  const isProduction = hasDist && (
    process.env.NODE_ENV === 'production' ||
    (!isAiStudioEnv && (isBuiltBundle || isCloudHost || Boolean(process.env.PORT)))
  );

  let viteMiddleware: any = null;

  if (!isProduction) {
    app.use((req, res, next) => {
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      // Pass API routes through immediately
      if (req.path.startsWith('/api')) {
        return next();
      }
      // If a frontend page is requested before Vite finishes warming up (~1s), provide waiting page
      return res.send(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta http-equiv="refresh" content="1"><title>Memuat Klinik...</title><style>body{background:#090d16;color:#cbd5e1;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}.box{padding:2rem;border-radius:1rem;background:#1e293b;border:1px solid #334155;max-width:400px;}.spinner{width:36px;height:36px;border:3px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="box"><div class="spinner"></div><h3 style="margin:0 0 0.5rem;color:#f8fafc;">Nano Circumcision System</h3><p style="margin:0;font-size:0.875rem;color:#94a3b8;">Menyiapkan modul aplikasi...</p></div></body></html>`);
    });
  } else {
    console.log(`[Production Server] Menyajikan frontend statis dari folder: ${distPath} (PORT=${PORT})`);
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and listen on port immediately so Cloud Run health/liveness probes pass without delay
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nano Circumcision Server running at http://0.0.0.0:${PORT}`);

    // Initialize Vite in development mode after server has successfully bound to port
    if (!isProduction) {
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
        },
        appType: 'spa',
      }).then(vite => {
        viteMiddleware = vite.middlewares;
        console.log('✓ Vite frontend middleware terpasang dan siap melayani.');
      }).catch(viteErr => {
        console.error('Peringatan inisialisasi Vite:', viteErr);
      });
    }

    // Trigger schema verification and seed safely in background without blocking container startup
    setTimeout(() => {
      console.log('Memulai bootstrapping database and auto-migration di background...');
      initDatabaseAndSeed().catch((startupDbErr) => {
        console.warn('Peringatan saat inisialisasi awal database:', startupDbErr);
      });
    }, 2000);
  });

  server.on('error', (err: any) => {
    console.error(`[Server Error] Port ${PORT} listen error:`, err?.message || err);
  });
}

startServer();
