import { db } from '../db/index.ts';
import { 
  patients, bookings, invoices, certificates, doctorFeeTransactions, 
  expenseTransactions, queues, employees, employeeFeeTransactions, payrolls,
  doctors
} from '../db/schema.ts';
import { sql } from 'drizzle-orm';

const pad = (num: number, size: number): string => {
  let s = num + '';
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

export async function generateRMNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.select({ rmNumber: patients.rmNumber }).from(patients);
  let maxNum = 0;
  const prefix = `RM-${year}-`;
  for (const item of existing) {
    if (item.rmNumber && item.rmNumber.startsWith(prefix)) {
      const numPart = parseInt(item.rmNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let nextVal = maxNum + 1;
  let rm = `RM-${year}-${pad(nextVal, 6)}`;
  while (existing.some(e => e.rmNumber === rm)) {
    nextVal++;
    rm = `RM-${year}-${pad(nextVal, 6)}`;
  }
  return rm;
}

export async function generateBookingNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const existing = await db.select({ bookingNumber: bookings.bookingNumber }).from(bookings);
  let maxNum = 0;
  const prefix = `BOOK-${dateStr}-`;
  for (const item of existing) {
    if (item.bookingNumber && item.bookingNumber.startsWith(prefix)) {
      const numPart = parseInt(item.bookingNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let nextVal = maxNum + 1;
  let num = `BOOK-${dateStr}-${pad(nextVal, 4)}`;
  while (existing.some(e => e.bookingNumber === num)) {
    nextVal++;
    num = `BOOK-${dateStr}-${pad(nextVal, 4)}`;
  }
  return num;
}

export async function generateInvoiceNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const existing = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices);
  let maxNum = 0;
  const prefix = `INV-${dateStr}-`;
  for (const item of existing) {
    if (item.invoiceNumber && item.invoiceNumber.startsWith(prefix)) {
      const numPart = parseInt(item.invoiceNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let nextVal = maxNum + 1;
  let num = `INV-${dateStr}-${pad(nextVal, 4)}`;
  while (existing.some(e => e.invoiceNumber === num)) {
    nextVal++;
    num = `INV-${dateStr}-${pad(nextVal, 4)}`;
  }
  return num;
}

export async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.select({ certificateNumber: certificates.certificateNumber }).from(certificates);
  let maxNum = 0;
  const prefix = `CERT-${year}-`;
  for (const item of existing) {
    if (item.certificateNumber && item.certificateNumber.startsWith(prefix)) {
      const numPart = parseInt(item.certificateNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let nextVal = maxNum + 1;
  let num = `CERT-${year}-${pad(nextVal, 6)}`;
  while (existing.some(e => e.certificateNumber === num)) {
    nextVal++;
    num = `CERT-${year}-${pad(nextVal, 6)}`;
  }
  return num;
}

export async function generateFeeNumber(): Promise<string> {
  const dateStr = getTodayDateStr();
  const existing = await db.select({ feeNumber: doctorFeeTransactions.feeNumber }).from(doctorFeeTransactions);
  let maxNum = 0;
  const prefix = `FEE-${dateStr}-`;
  for (const item of existing) {
    if (item.feeNumber && item.feeNumber.startsWith(prefix)) {
      const numPart = parseInt(item.feeNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  let nextVal = maxNum + 1;
  let num = `FEE-${dateStr}-${pad(nextVal, 4)}`;
  while (existing.some(e => e.feeNumber === num)) {
    nextVal++;
    num = `FEE-${dateStr}-${pad(nextVal, 4)}`;
  }
  return num;
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
  const existing = await db.select({ feeNumber: employeeFeeTransactions.feeNumber }).from(employeeFeeTransactions);
  let maxNum = 0;
  const prefix = `EFEE-${dateStr}-`;
  for (const item of existing) {
    if (item.feeNumber && item.feeNumber.startsWith(prefix)) {
      const numPart = parseInt(item.feeNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextVal = maxNum + 1;
  return `EFEE-${dateStr}-${pad(nextVal, 4)}`;
}

export async function generatePayrollNumber(monthStr?: string): Promise<string> {
  const d = new Date();
  const period = monthStr ? monthStr.replace('-', '') : `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}`;
  const existing = await db.select({ payrollNumber: payrolls.payrollNumber }).from(payrolls);
  let maxNum = 0;
  const prefix = `PAYROLL-${period}-`;
  for (const item of existing) {
    if (item.payrollNumber && item.payrollNumber.startsWith(prefix)) {
      const numPart = parseInt(item.payrollNumber.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextVal = maxNum + 1;
  return `PAYROLL-${period}-${pad(nextVal, 3)}`;
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

