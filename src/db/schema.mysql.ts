import { sql, relations } from 'drizzle-orm';
import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  datetime,
} from 'drizzle-orm/mysql-core';

// 1. Users Table (Owner, Admin, Staff, Doctor)
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  uid: varchar('uid', { length: 191 }).notNull().unique(),
  email: varchar('email', { length: 191 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('staff'), // 'owner' | 'admin' | 'staff' | 'doctor'
  phone: varchar('phone', { length: 50 }),
  passwordHash: text('password_hash'),
  permissions: text('permissions'), // JSON array string e.g. ["patients.view", ...]
  lastLogin: datetime('last_login'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 2. Guardians / Orang Tua / Wali Table
export const guardians = mysqlTable('guardians', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fatherName: varchar('father_name', { length: 255 }),
  motherName: varchar('mother_name', { length: 255 }),
  guardianName: varchar('guardian_name', { length: 255 }),
  relationship: varchar('relationship', { length: 100 }).notNull().default('Orang Tua'),
  phone: varchar('phone', { length: 50 }).notNull(),
  alternatePhone: varchar('alternate_phone', { length: 50 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 3. Circumcision Patients / Pasien Khitan Table
export const patients = mysqlTable('patients', {
  id: int('id').autoincrement().primaryKey(),
  rmNumber: varchar('rm_number', { length: 100 }).notNull().unique(), // e.g. RM-2026-000001
  fullName: varchar('full_name', { length: 255 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  nik: varchar('nik', { length: 50 }),
  gender: varchar('gender', { length: 20 }).notNull().default('Laki-laki'),
  birthPlace: varchar('birth_place', { length: 150 }),
  birthDate: varchar('birth_date', { length: 50 }).notNull(),
  ageYears: int('age_years').notNull().default(0),
  ageMonths: int('age_months').notNull().default(0),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  school: varchar('school', { length: 255 }),
  grade: varchar('grade', { length: 50 }),
  weightKg: varchar('weight_kg', { length: 20 }),
  heightCm: varchar('height_cm', { length: 20 }),
  allergies: text('allergies'),
  notes: text('notes'),
  guardianId: int('guardian_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: datetime('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 4. Patient Categories Table (REGULER, VIP, etc.)
export const patientCategories = mysqlTable('patient_categories', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // 'REGULER' | 'VIP'
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
});

// 5. Circumcision Packages Table (Paket Khitan)
export const circumcisionPackages = mysqlTable('circumcision_packages', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: int('duration_minutes').notNull().default(45),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 6. Package Prices Table (Harga per Kategori)
export const packagePrices = mysqlTable('package_prices', {
  id: int('id').autoincrement().primaryKey(),
  packageId: int('package_id').notNull(),
  patientCategoryId: int('patient_category_id').notNull(),
  price: int('price').notNull(),
  effectiveFrom: varchar('effective_from', { length: 50 }).notNull(),
  effectiveUntil: varchar('effective_until', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
});

// 6b. Circumcision Methods Table (Master Data Metode Tindakan Khitan)
export const circumcisionMethods = mysqlTable('circumcision_methods', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 7. Doctors Table
export const doctors = mysqlTable('doctors', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 50 }).notNull().default('dr.'),
  specialty: varchar('specialty', { length: 150 }).notNull().default('Dokter Operator Khitan'),
  description: text('description'),
  notes: text('notes'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 191 }),
  sipNumber: varchar('sip_number', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 8. Doctor Schedules Table
export const doctorSchedules = mysqlTable('doctor_schedules', {
  id: int('id').autoincrement().primaryKey(),
  doctorId: int('doctor_id').notNull(),
  dayOfWeek: varchar('day_of_week', { length: 50 }).notNull(),
  startTime: varchar('start_time', { length: 20 }).notNull(),
  endTime: varchar('end_time', { length: 20 }).notNull(),
  maxCapacity: int('max_capacity').notNull().default(10),
  isActive: boolean('is_active').notNull().default(true),
});

// 9. Doctor Fee Rules Table
export const doctorFeeRules = mysqlTable('doctor_fee_rules', {
  id: int('id').autoincrement().primaryKey(),
  doctorId: int('doctor_id').notNull(),
  packageId: int('package_id').notNull(),
  patientCategoryId: int('patient_category_id').notNull(),
  feeAmount: int('fee_amount').notNull(),
  effectiveDate: varchar('effective_date', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 10. Bookings Table (Form Booking Khitan)
export const bookings = mysqlTable('bookings', {
  id: int('id').autoincrement().primaryKey(),
  bookingNumber: varchar('booking_number', { length: 100 }).notNull().unique(),
  patientId: int('patient_id').notNull(),
  guardianId: int('guardian_id').notNull(),
  patientCategoryId: int('patient_category_id').notNull(),
  packageId: int('package_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  bookingDate: varchar('booking_date', { length: 50 }).notNull(),
  bookingTime: varchar('booking_time', { length: 20 }).notNull(),
  methodType: varchar('method_type', { length: 150 }).default('Klem Nano Sealer'),
  anesthesiaType: varchar('anesthesia_type', { length: 150 }).default('Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'),
  packagePriceSnapshot: int('package_price_snapshot').notNull(),
  discountAmount: int('discount_amount').notNull().default(0),
  totalAmount: int('total_amount').notNull(),
  dpAmount: int('dp_amount').notNull().default(0),
  remainingAmount: int('remaining_amount').notNull().default(0),
  patientSource: varchar('patient_source', { length: 100 }).notNull().default('Walk-in'),
  closingStaffId: int('closing_staff_id'),
  closingStaffName: varchar('closing_staff_name', { length: 255 }),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).notNull().default('BOOKED'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 11. Booking Status History
export const bookingStatusHistory = mysqlTable('booking_status_history', {
  id: int('id').autoincrement().primaryKey(),
  bookingId: int('booking_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  changedBy: varchar('changed_by', { length: 150 }).notNull().default('Staff'),
  notes: text('notes'),
  timestamp: datetime('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// 12. Queues Table (Check-in Antrean Tindakan)
export const queues = mysqlTable('queues', {
  id: int('id').autoincrement().primaryKey(),
  queueNumber: varchar('queue_number', { length: 50 }).notNull(),
  queueDate: varchar('queue_date', { length: 50 }).notNull(),
  bookingId: int('booking_id').notNull(),
  patientId: int('patient_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('WAITING'),
  arrivedAt: varchar('arrived_at', { length: 20 }).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 13. Circumcision Procedures Table (Pelaksanaan Tindakan Khitan)
export const circumcisionProcedures = mysqlTable('circumcision_procedures', {
  id: int('id').autoincrement().primaryKey(),
  procedureNumber: varchar('procedure_number', { length: 100 }).notNull().unique(),
  bookingId: int('booking_id').notNull(),
  patientId: int('patient_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  doctorNameSnapshot: varchar('doctor_name_snapshot', { length: 255 }),
  assistantStaffId: int('assistant_staff_id'),
  assistantStaffName: varchar('assistant_staff_name', { length: 255 }),
  procedureDate: varchar('procedure_date', { length: 50 }).notNull(),
  procedureTime: varchar('procedure_time', { length: 20 }).notNull(),
  methodType: varchar('method_type', { length: 150 }).notNull().default('Klem Nano Sealer'),
  anesthesiaType: varchar('anesthesia_type', { length: 150 }).default('Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'),
  preCondition: text('pre_condition'),
  procedureNotes: text('procedure_notes'),
  postCondition: text('post_condition'),
  careInstructions: text('care_instructions'),
  controlDate: varchar('control_date', { length: 50 }),
  additionalNotes: text('additional_notes'),
  status: varchar('status', { length: 50 }).notNull().default('WAITING'),
  checklistData: text('checklist_data'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  completedAt: datetime('completed_at'),
});

// 14. Informed Consents Table
export const informedConsents = mysqlTable('informed_consents', {
  id: int('id').autoincrement().primaryKey(),
  consentNumber: varchar('consent_number', { length: 100 }).notNull().unique(),
  procedureId: int('procedure_id').notNull(),
  patientId: int('patient_id').notNull(),
  guardianId: int('guardian_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  consentDate: varchar('consent_date', { length: 50 }).notNull(),
  signerName: varchar('signer_name', { length: 255 }).notNull(),
  signerRelation: varchar('signer_relation', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('SIGNED'),
  signedAt: datetime('signed_at').default(sql`CURRENT_TIMESTAMP`),
});

// 15. Circumcision Certificates Table
export const certificates = mysqlTable('certificates', {
  id: int('id').autoincrement().primaryKey(),
  certificateNumber: varchar('certificate_number', { length: 100 }).notNull().unique(),
  procedureId: int('procedure_id').notNull(),
  patientId: int('patient_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  issueDate: varchar('issue_date', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull().default('SERTIFIKAT KHITAN NANO CIRCUMCISION'),
  content: text('content'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 16. Invoices Table
export const invoices = mysqlTable('invoices', {
  id: int('id').autoincrement().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  bookingId: int('booking_id').notNull(),
  patientId: int('patient_id').notNull(),
  doctorId: int('doctor_id').notNull(),
  invoiceDate: varchar('invoice_date', { length: 50 }).notNull(),
  subtotal: int('subtotal').notNull(),
  discount: int('discount').notNull().default(0),
  totalAmount: int('total_amount').notNull(),
  paidAmount: int('paid_amount').notNull().default(0),
  remainingAmount: int('remaining_amount').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('UNPAID'),
  voidReason: text('void_reason'),
  voidedAt: datetime('voided_at'),
  voidedBy: varchar('voided_by', { length: 255 }),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 17. Payments Table (DP, Pelunasan, dll)
export const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  paymentNumber: varchar('payment_number', { length: 100 }).notNull().unique(),
  invoiceId: int('invoice_id').notNull(),
  paymentDate: varchar('payment_date', { length: 50 }).notNull(),
  amount: int('amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'),
  paymentType: varchar('payment_type', { length: 50 }).notNull().default('DP'),
  referenceNumber: varchar('reference_number', { length: 100 }),
  notes: text('notes'),
  receivedBy: varchar('received_by', { length: 150 }).notNull().default('Staff Kasir'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 18. Doctor Fee Transactions Table
export const doctorFeeTransactions = mysqlTable('doctor_fee_transactions', {
  id: int('id').autoincrement().primaryKey(),
  feeNumber: varchar('fee_number', { length: 100 }).notNull().unique(),
  doctorId: int('doctor_id').notNull(),
  patientId: int('patient_id').notNull(),
  bookingId: int('booking_id').notNull(),
  procedureId: int('procedure_id').notNull(),
  invoiceId: int('invoice_id').notNull(),
  packageId: int('package_id').notNull(),
  patientCategoryId: int('patient_category_id').notNull(),
  feeAmount: int('fee_amount').notNull(),
  feeDate: varchar('fee_date', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  approvedAt: datetime('approved_at'),
  paidAt: datetime('paid_at'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 19. Expense Categories Table
export const expenseCategories = mysqlTable('expense_categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
});

// 20. Expense Transactions Table
export const expenseTransactions = mysqlTable('expense_transactions', {
  id: int('id').autoincrement().primaryKey(),
  transactionNumber: varchar('transaction_number', { length: 100 }).notNull().unique(),
  expenseDate: varchar('expense_date', { length: 50 }).notNull(),
  categoryId: int('category_id'),
  categoryName: varchar('category_name', { length: 150 }).notNull(),
  description: text('description').notNull(),
  amount: int('amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'),
  receiptUrl: text('receipt_url'),
  createdBy: varchar('created_by', { length: 150 }).notNull().default('Admin'),
  status: varchar('status', { length: 50 }).notNull().default('PAID'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 21. Follow Ups Table
export const followUps = mysqlTable('follow_ups', {
  id: int('id').autoincrement().primaryKey(),
  bookingId: int('booking_id').notNull(),
  procedureId: int('procedure_id').notNull(),
  patientId: int('patient_id').notNull(),
  followUpType: varchar('follow_up_type', { length: 50 }).notNull(),
  scheduledDate: varchar('scheduled_date', { length: 50 }).notNull(),
  contactDate: varchar('contact_date', { length: 50 }),
  staffName: varchar('staff_name', { length: 150 }),
  patientCondition: text('patient_condition'),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 22. Audit Logs Table
export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }).notNull(),
  performedBy: varchar('performed_by', { length: 150 }).notNull(),
  details: text('details'),
  timestamp: datetime('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// 23. Clinic Settings Table
export const clinicSettings = mysqlTable('clinic_settings', {
  id: int('id').autoincrement().primaryKey(),
  clinicName: varchar('clinic_name', { length: 255 }).notNull().default('NANO CIRCUMCISION CLINIC'),
  tagline: text('tagline'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }).default('0812-8888-9999'),
  email: varchar('email', { length: 191 }).default('info@nanocircumcision.com'),
  website: varchar('website', { length: 255 }).default('www.nanocircumcision.com'),
  logoUrl: text('logo_url'),
  invoiceHeader: text('invoice_header'),
  invoiceFooter: text('invoice_footer'),
  invoicePaperDefault: varchar('invoice_paper_default', { length: 20 }).default('A4'),
  defaultDoctorFeeType: varchar('default_doctor_fee_type', { length: 50 }).default('FIXED'),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 24. Products Table
export const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull().default('pcs'),
  sellPrice: int('sell_price').notNull().default(0),
  costPrice: int('cost_price').notNull().default(0),
  stock: int('stock').notNull().default(0),
  minStock: int('min_stock').notNull().default(5),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 25. Package Included Items Table
export const packageIncludedItems = mysqlTable('package_included_items', {
  id: int('id').autoincrement().primaryKey(),
  packageId: int('package_id').notNull(),
  patientCategoryId: int('patient_category_id'),
  productId: int('product_id').notNull(),
  quantity: int('quantity').notNull().default(1),
  isIncluded: boolean('is_included').notNull().default(true),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 26. Stock Movements Table
export const stockMovements = mysqlTable('stock_movements', {
  id: int('id').autoincrement().primaryKey(),
  movementNumber: varchar('movement_number', { length: 100 }).notNull().unique(),
  productId: int('product_id').notNull(),
  movementType: varchar('movement_type', { length: 50 }).notNull(),
  quantity: int('quantity').notNull(),
  previousStock: int('previous_stock').notNull(),
  currentStock: int('current_stock').notNull(),
  unitCost: int('unit_cost').notNull().default(0),
  unitPrice: int('unit_price').notNull().default(0),
  referenceType: varchar('reference_type', { length: 50 }).notNull(),
  referenceId: int('reference_id'),
  notes: text('notes'),
  performedBy: varchar('performed_by', { length: 150 }).notNull().default('Staff'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 27. Transaction Items Table
export const transactionItems = mysqlTable('transaction_items', {
  id: int('id').autoincrement().primaryKey(),
  bookingId: int('booking_id').notNull(),
  procedureId: int('procedure_id'),
  invoiceId: int('invoice_id'),
  productId: int('product_id').notNull(),
  productSku: varchar('product_sku', { length: 100 }).notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  itemType: varchar('item_type', { length: 50 }).notNull().default('ADDON'),
  quantity: int('quantity').notNull().default(1),
  costPriceSnapshot: int('cost_price_snapshot').notNull().default(0),
  sellPriceSnapshot: int('sell_price_snapshot').notNull().default(0),
  discountAmount: int('discount_amount').notNull().default(0),
  totalAmount: int('total_amount').notNull().default(0),
  isStockDeducted: boolean('is_stock_deducted').notNull().default(false),
  deductedAt: datetime('deducted_at'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 28. Employees Table
export const employees = mysqlTable('employees', {
  id: int('id').autoincrement().primaryKey(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 100 }).notNull().default('Perawat Khitan'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 191 }),
  startDate: varchar('start_date', { length: 50 }).notNull(),
  basicSalary: int('basic_salary').notNull().default(0),
  defaultPatientFee: int('default_patient_fee').notNull().default(20000),
  closingFeePerPatient: int('closing_fee_per_patient').notNull().default(25000),
  overtimeHourlyRate: int('overtime_hourly_rate').notNull().default(35000),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  description: text('description'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 29. Employee Fee Rules Table
export const employeeFeeRules = mysqlTable('employee_fee_rules', {
  id: int('id').autoincrement().primaryKey(),
  employeeId: int('employee_id').notNull(),
  packageId: int('package_id'),
  patientCategoryId: int('patient_category_id'),
  feeAmount: int('fee_amount').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 30. Employee Fee Transactions Table
export const employeeFeeTransactions = mysqlTable('employee_fee_transactions', {
  id: int('id').autoincrement().primaryKey(),
  feeNumber: varchar('fee_number', { length: 100 }).notNull().unique(),
  employeeId: int('employee_id').notNull(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  patientId: int('patient_id').notNull(),
  patientRm: varchar('patient_rm', { length: 100 }).notNull(),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  bookingId: int('booking_id').notNull(),
  procedureId: int('procedure_id').notNull(),
  procedureDate: varchar('procedure_date', { length: 50 }).notNull(),
  feeAmount: int('fee_amount').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('PENDING'),
  payrollId: int('payroll_id'),
  paidAt: datetime('paid_at'),
  notes: text('notes'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// 31. Payrolls Table
export const payrolls = mysqlTable('payrolls', {
  id: int('id').autoincrement().primaryKey(),
  payrollNumber: varchar('payroll_number', { length: 100 }).notNull().unique(),
  employeeId: int('employee_id').notNull(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  periodMonth: varchar('period_month', { length: 50 }).notNull(),
  periodYear: int('period_year').notNull().default(2026),
  paymentDate: varchar('payment_date', { length: 50 }).notNull(),
  basicSalary: int('basic_salary').notNull().default(0),
  patientFeeTotal: int('patient_fee_total').notNull().default(0),
  patientCount: int('patient_count').notNull().default(0),
  closingPatientCount: int('closing_patient_count').notNull().default(0),
  closingFeePerPatient: int('closing_fee_per_patient').notNull().default(0),
  closingFeeTotal: int('closing_fee_total').notNull().default(0),
  overtimeHours: int('overtime_hours').notNull().default(0),
  overtimeHourlyRate: int('overtime_hourly_rate').notNull().default(0),
  overtimeTotal: int('overtime_total').notNull().default(0),
  bonusAmount: int('bonus_amount').notNull().default(0),
  deductionAmount: int('deduction_amount').notNull().default(0),
  netSalary: int('net_salary').notNull().default(0),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('TRANSFER'),
  status: varchar('status', { length: 50 }).notNull().default('DRAFT'),
  notes: text('notes'),
  paidAt: datetime('paid_at'),
  processedBy: varchar('processed_by', { length: 150 }).notNull().default('Super Admin'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table Relations
export const guardiansRelations = relations(guardians, ({ many }) => ({
  patients: many(patients),
  bookings: many(bookings),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  guardian: one(guardians, {
    fields: [patients.guardianId],
    references: [guardians.id],
  }),
  bookings: many(bookings),
  procedures: many(circumcisionProcedures),
}));

export const circumcisionPackagesRelations = relations(circumcisionPackages, ({ many }) => ({
  prices: many(packagePrices),
  bookings: many(bookings),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  schedules: many(doctorSchedules),
  feeRules: many(doctorFeeRules),
  bookings: many(bookings),
  procedures: many(circumcisionProcedures),
  feeTransactions: many(doctorFeeTransactions),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  patient: one(patients, {
    fields: [bookings.patientId],
    references: [patients.id],
  }),
  guardian: one(guardians, {
    fields: [bookings.guardianId],
    references: [guardians.id],
  }),
  category: one(patientCategories, {
    fields: [bookings.patientCategoryId],
    references: [patientCategories.id],
  }),
  package: one(circumcisionPackages, {
    fields: [bookings.packageId],
    references: [circumcisionPackages.id],
  }),
  doctor: one(doctors, {
    fields: [bookings.doctorId],
    references: [doctors.id],
  }),
  invoices: many(invoices),
  procedures: many(circumcisionProcedures),
  statusHistory: many(bookingStatusHistory),
}));

export const circumcisionProceduresRelations = relations(circumcisionProcedures, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [circumcisionProcedures.bookingId],
    references: [bookings.id],
  }),
  patient: one(patients, {
    fields: [circumcisionProcedures.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [circumcisionProcedures.doctorId],
    references: [doctors.id],
  }),
  consents: many(informedConsents),
  certificates: many(certificates),
  feeTransactions: many(doctorFeeTransactions),
  followUps: many(followUps),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [invoices.doctorId],
    references: [doctors.id],
  }),
  payments: many(payments),
  feeTransactions: many(doctorFeeTransactions),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  includedInPackages: many(packageIncludedItems),
  stockMovements: many(stockMovements),
  transactionItems: many(transactionItems),
}));

export const packageIncludedItemsRelations = relations(packageIncludedItems, ({ one }) => ({
  package: one(circumcisionPackages, {
    fields: [packageIncludedItems.packageId],
    references: [circumcisionPackages.id],
  }),
  category: one(patientCategories, {
    fields: [packageIncludedItems.patientCategoryId],
    references: [patientCategories.id],
  }),
  product: one(products, {
    fields: [packageIncludedItems.productId],
    references: [products.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [transactionItems.bookingId],
    references: [bookings.id],
  }),
  procedure: one(circumcisionProcedures, {
    fields: [transactionItems.procedureId],
    references: [circumcisionProcedures.id],
  }),
  invoice: one(invoices, {
    fields: [transactionItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  feeRules: many(employeeFeeRules),
  feeTransactions: many(employeeFeeTransactions),
  payrolls: many(payrolls),
}));

export const employeeFeeTransactionsRelations = relations(employeeFeeTransactions, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeFeeTransactions.employeeId],
    references: [employees.id],
  }),
  patient: one(patients, {
    fields: [employeeFeeTransactions.patientId],
    references: [patients.id],
  }),
  booking: one(bookings, {
    fields: [employeeFeeTransactions.bookingId],
    references: [bookings.id],
  }),
  procedure: one(circumcisionProcedures, {
    fields: [employeeFeeTransactions.procedureId],
    references: [circumcisionProcedures.id],
  }),
  payroll: one(payrolls, {
    fields: [employeeFeeTransactions.payrollId],
    references: [payrolls.id],
  }),
}));

export const payrollsRelations = relations(payrolls, ({ one, many }) => ({
  employee: one(employees, {
    fields: [payrolls.employeeId],
    references: [employees.id],
  }),
  feeDetails: many(employeeFeeTransactions),
}));
