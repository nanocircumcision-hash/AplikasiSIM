import { db } from '../db/index.ts';
import { 
  patients, bookings, invoices, certificates, doctorFeeTransactions, 
  expenseTransactions, queues, employees, employeeFeeTransactions, payrolls,
  doctors
} from '../db/schema.ts';
import { desc, like, sql } from 'drizzle-orm';

const pad = (num: number, size: number): string => {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
};

const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1, 2);
  const day = pad(d.getDate(), 2);
  return `${year}${month}${day}`;
};

/**
 * High-performance, DRY generator for sequential numbers.
 * Queries only the latest 20 matching records instead of loading the whole table into memory.
 */
async function getNextSequentialNumber(
  fetchLatest: (prefix: string) => Promise<{ val: string | null }[]>,
  prefix: string,
  padSize: number
): Promise<string> {
  const records = await fetchLatest(prefix);
  let maxNum = 0;
  for (const item of records) {
    if (item.val && item.val.startsWith(prefix)) {
      const numPart = parseInt(item.val.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  return `${prefix}${pad(maxNum + 1, padSize)}`;
}

export async function generateRMNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RM-${year}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: patients.rmNumber })
      .from(patients)
      .where(like(patients.rmNumber, `${p}%`))
      .orderBy(desc(patients.rmNumber))
      .limit(20),
    prefix,
    6
  );
}

export async function generateBookingNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const prefix = `BOOK-${dateStr}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: bookings.bookingNumber })
      .from(bookings)
      .where(like(bookings.bookingNumber, `${p}%`))
      .orderBy(desc(bookings.bookingNumber))
      .limit(20),
    prefix,
    4
  );
}

export async function generateInvoiceNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const prefix = `INV-${dateStr}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: invoices.invoiceNumber })
      .from(invoices)
      .where(like(invoices.invoiceNumber, `${p}%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(20),
    prefix,
    4
  );
}

export async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: certificates.certificateNumber })
      .from(certificates)
      .where(like(certificates.certificateNumber, `${p}%`))
      .orderBy(desc(certificates.certificateNumber))
      .limit(20),
    prefix,
    6
  );
}

export async function generateFeeNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const prefix = `FEE-${dateStr}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: doctorFeeTransactions.feeNumber })
      .from(doctorFeeTransactions)
      .where(like(doctorFeeTransactions.feeNumber, `${p}%`))
      .orderBy(desc(doctorFeeTransactions.feeNumber))
      .limit(20),
    prefix,
    4
  );
}

export async function generateDoctorCode(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(doctors);
  const nextVal = Number(result[0]?.count || 0) + 1;
  return `DOC-${pad(nextVal, 3)}`;
}

export async function generateEmployeeCode(): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(employees);
  const nextVal = Number(result[0]?.count || 0) + 1;
  return `EMP-${pad(nextVal, 3)}`;
}

export async function generateEmployeeFeeNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const prefix = `EFEE-${dateStr}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: employeeFeeTransactions.feeNumber })
      .from(employeeFeeTransactions)
      .where(like(employeeFeeTransactions.feeNumber, `${p}%`))
      .orderBy(desc(employeeFeeTransactions.feeNumber))
      .limit(20),
    prefix,
    4
  );
}

export async function generatePayrollNumber(monthStr?: string): Promise<string> {
  const d = new Date();
  const period = monthStr ? monthStr.replace('-', '') : `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}`;
  const prefix = `PAYROLL-${period}-`;
  return getNextSequentialNumber(
    (p) => db.select({ val: payrolls.payrollNumber })
      .from(payrolls)
      .where(like(payrolls.payrollNumber, `${p}%`))
      .orderBy(desc(payrolls.payrollNumber))
      .limit(20),
    prefix,
    3
  );
}

export async function generateExpenseNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const result = await db.select({ count: sql<number>`count(*)` }).from(expenseTransactions);
  const nextVal = Number(result[0]?.count || 0) + 1;
  return `EXP-${dateStr}-${pad(nextVal, 4)}`;
}

export async function generateQueueNumber(date: string): Promise<string> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(queues)
    .where(sql`queue_date = ${date}`);
  const nextVal = Number(result[0]?.count || 0) + 1;
  return `K-${pad(nextVal, 3)}`;
}

export async function generateStockMovementNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `STK-${dateStr}-${randomSuffix}`;
}

export async function generateProductSKU(category: string): Promise<string> {
  const prefixMap: Record<string, string> = {
    'OBAT': 'OBT',
    'OBAT_TETES': 'TTS',
    'CELANA_SUNAT': 'CLN',
    'AKSESORIS': 'AKS',
    'MAINAN': 'MNN',
    'LAINNYA': 'OTH',
  };
  const prefix = prefixMap[category] || 'PRD';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `PRD-${prefix}-${randomSuffix}`;
}
