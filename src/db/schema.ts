import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 0. Branches / Unit Kerja Cabang Table
export const branches = pgTable('branches', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'PUSAT', 'CABANG-01', 'CABANG-02'
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  managerName: text('manager_name'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 1. Users Table (Owner, Admin, Staff, Doctor)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('staff'), // 'owner' | 'admin' | 'staff' | 'doctor'
  phone: text('phone'),
  passwordHash: text('password_hash'),
  permissions: text('permissions'), // JSON array string e.g. ["patients.view", ...]
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02' | 'ALL'
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Guardians / Orang Tua / Wali Table
// One guardian can have multiple circumcision patients (e.g. siblings)
export const guardians = pgTable('guardians', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  guardianName: text('guardian_name'),
  relationship: text('relationship').notNull().default('Orang Tua'),
  phone: text('phone').notNull(),
  alternatePhone: text('alternate_phone'),
  address: text('address'),
  notes: text('notes'),
  branchCode: text('branch_code').default('PUSAT'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Circumcision Patients / Pasien Khitan Table
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  rmNumber: text('rm_number').notNull().unique(), // e.g. RM-2026-000001
  fullName: text('full_name').notNull(),
  nickname: text('nickname'),
  nik: text('nik'),
  gender: text('gender').notNull().default('Laki-laki'),
  birthPlace: text('birth_place'),
  birthDate: text('birth_date').notNull(),
  ageYears: integer('age_years').notNull().default(0),
  ageMonths: integer('age_months').notNull().default(0),
  address: text('address'),
  phone: text('phone'),
  school: text('school'),
  grade: text('grade'),
  weightKg: text('weight_kg'),
  heightCm: text('height_cm'),
  allergies: text('allergies'),
  notes: text('notes'),
  guardianId: integer('guardian_id').references(() => guardians.id).notNull(),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Patient Categories Table (REGULER, VIP, etc.)
export const patientCategories = pgTable('patient_categories', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // 'REGULER' | 'VIP'
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
});

// 5. Circumcision Packages Table (Paket Khitan)
export const circumcisionPackages = pgTable('circumcision_packages', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Package Prices Table (Harga per Kategori)
export const packagePrices = pgTable('package_prices', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => circumcisionPackages.id).notNull(),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id).notNull(),
  price: integer('price').notNull(),
  effectiveFrom: text('effective_from').notNull(),
  effectiveUntil: text('effective_until'),
  isActive: boolean('is_active').notNull().default(true),
});

// 6b. Circumcision Methods Table (Master Data Metode Tindakan Khitan)
export const circumcisionMethods = pgTable('circumcision_methods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Doctors Table
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  title: text('title').notNull().default('dr.'),
  specialty: text('specialty').notNull().default('Dokter Operator Khitan'),
  description: text('description'),
  notes: text('notes'),
  phone: text('phone'),
  email: text('email'),
  sipNumber: text('sip_number'),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. Doctor Schedules Table
export const doctorSchedules = pgTable('doctor_schedules', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  dayOfWeek: text('day_of_week').notNull(), // 'Senin', 'Selasa', ...
  startTime: text('start_time').notNull(), // '08:00'
  endTime: text('end_time').notNull(), // '14:00'
  maxCapacity: integer('max_capacity').notNull().default(10),
  isActive: boolean('is_active').notNull().default(true),
});

// 9. Doctor Fee Rules Table (Master Fee Dokter per Paket & Kategori Pasien)
export const doctorFeeRules = pgTable('doctor_fee_rules', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  packageId: integer('package_id').references(() => circumcisionPackages.id).notNull(),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id).notNull(),
  feeAmount: integer('fee_amount').notNull(),
  effectiveDate: text('effective_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 9b. Doctor Method Fee Rules Table (Master Tarif Fee Dokter Berdasarkan Metode Khitan & Kondisi Pasien: Gemuk, ABK, Dewasa, Standar)
export const doctorMethodFeeRules = pgTable('doctor_method_fee_rules', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').references(() => doctors.id), // Nullable: null = aturan default berlaku untuk semua dokter
  methodId: integer('method_id'), // Nullable
  methodName: text('method_name').notNull(), // e.g. 'Glans Pro Bipolar Pensealer', 'Nano Klemp', 'Laser CO2 / Cauter', etc.
  patientCondition: text('patient_condition').notNull().default('STANDAR'), // 'STANDAR' | 'GEMUK' | 'ABK' | 'DEWASA'
  regulerFee: integer('reguler_fee').notNull().default(250000), // Fee untuk pasien kelas Reguler
  vipFee: integer('vip_fee').notNull().default(350000), // Fee untuk pasien kelas VIP
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Bookings Table (Form Booking Khitan)
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingNumber: text('booking_number').notNull().unique(), // e.g. BOOK-20260903-0001
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  guardianId: integer('guardian_id').references(() => guardians.id).notNull(),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id).notNull(),
  packageId: integer('package_id').references(() => circumcisionPackages.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  bookingDate: text('booking_date').notNull(), // YYYY-MM-DD
  bookingTime: text('booking_time').notNull(), // HH:mm
  methodType: text('method_type').default('Klem Nano Sealer'),
  anesthesiaType: text('anesthesia_type').default('Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'),
  packagePriceSnapshot: integer('package_price_snapshot').notNull(),
  discountAmount: integer('discount_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull(),
  dpAmount: integer('dp_amount').notNull().default(0),
  remainingAmount: integer('remaining_amount').notNull().default(0),
  patientSource: text('patient_source').notNull().default('Walk-in'), // Instagram, TikTok, WhatsApp, Google, Referral, Walk-in, etc.
  closingStaffId: integer('closing_staff_id'), // Petugas/staf closing pendaftaran langsung
  closingStaffName: text('closing_staff_name'),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  notes: text('notes'),
  status: text('status').notNull().default('BOOKED'), // BOOKED | DP_PAID | CONFIRMED | ARRIVED | IN_PROGRESS | COMPLETED | RESCHEDULED | CANCELLED | NO_SHOW
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Booking Status History
export const bookingStatusHistory = pgTable('booking_status_history', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  status: text('status').notNull(),
  changedBy: text('changed_by').notNull().default('Staff'),
  notes: text('notes'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 12. Queues Table (Check-in Antrean Tindakan: K-001, K-002 ...)
export const queues = pgTable('queues', {
  id: serial('id').primaryKey(),
  queueNumber: text('queue_number').notNull(), // K-001
  queueDate: text('queue_date').notNull(), // YYYY-MM-DD
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  status: text('status').notNull().default('WAITING'), // WAITING | PREPARATION | IN_PROGRESS | COMPLETED | CANCELLED
  arrivedAt: text('arrived_at').notNull(), // HH:mm
  branchCode: text('branch_code').default('PUSAT'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. Circumcision Procedures Table (Pelaksanaan Tindakan Khitan)
export const circumcisionProcedures = pgTable('circumcision_procedures', {
  id: serial('id').primaryKey(),
  procedureNumber: text('procedure_number').notNull().unique(), // PROC-20260903-0001
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  doctorNameSnapshot: text('doctor_name_snapshot'),
  assistantStaffId: integer('assistant_staff_id'),
  assistantStaffName: text('assistant_staff_name'),
  procedureDate: text('procedure_date').notNull(),
  procedureTime: text('procedure_time').notNull(),
  methodType: text('method_type').notNull().default('Klem Nano Sealer'), // e.g. Klem, Laser CO2, Sealer, Super Ring, Konvensional
  anesthesiaType: text('anesthesia_type').default('Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)'), // FNI | Kombinasi | dll
  preCondition: text('pre_condition'),
  procedureNotes: text('procedure_notes'),
  postCondition: text('post_condition'),
  careInstructions: text('care_instructions'),
  controlDate: text('control_date'),
  additionalNotes: text('additional_notes'),
  status: text('status').notNull().default('WAITING'), // WAITING | PREPARATION | IN_PROGRESS | COMPLETED | CANCELLED
  checklistData: text('checklist_data'), // JSON string of 8 checklist items
  branchCode: text('branch_code').default('PUSAT'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// 14. Informed Consents Table
export const informedConsents = pgTable('informed_consents', {
  id: serial('id').primaryKey(),
  consentNumber: text('consent_number').notNull().unique(), // CONS-2026-000001
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  guardianId: integer('guardian_id').references(() => guardians.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  consentDate: text('consent_date').notNull(),
  signerName: text('signer_name').notNull(),
  signerRelation: text('signer_relation').notNull(),
  status: text('status').notNull().default('SIGNED'), // DRAFT | SIGNED | CANCELLED
  branchCode: text('branch_code').default('PUSAT'),
  signedAt: timestamp('signed_at').defaultNow(),
});

// 15. Circumcision Certificates Table (Sertifikat Khitan: CERT-2026-000001)
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  certificateNumber: text('certificate_number').notNull().unique(), // CERT-2026-000001
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  issueDate: text('issue_date').notNull(),
  title: text('title').notNull().default('SERTIFIKAT KHITAN NANO CIRCUMCISION'),
  content: text('content'),
  branchCode: text('branch_code').default('PUSAT'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. Invoices Table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // INV-20260903-0001
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  invoiceDate: text('invoice_date').notNull(),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  totalAmount: integer('total_amount').notNull(),
  paidAmount: integer('paid_amount').notNull().default(0),
  remainingAmount: integer('remaining_amount').notNull().default(0),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  status: text('status').notNull().default('UNPAID'), // DRAFT | UNPAID | PARTIAL | PAID | CANCELLED | REFUNDED
  voidReason: text('void_reason'),
  voidedAt: timestamp('voided_at'),
  voidedBy: text('voided_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. Payments Table (DP, Pelunasan, dll)
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentNumber: text('payment_number').notNull().unique(), // PAY-20260903-0001
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentTime: text('payment_time'),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('CASH'), // CASH | TRANSFER | QRIS | DEBIT | E-WALLET | OTHER
  paymentType: text('payment_type').notNull().default('DP'), // DP | PARTIAL | FULL_PAYMENT
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  receivedBy: text('received_by').notNull().default('Staff Kasir'),
  branchCode: text('branch_code').default('PUSAT'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. Doctor Fee Transactions Table (Snapshot Fee Dokter)
export const doctorFeeTransactions = pgTable('doctor_fee_transactions', {
  id: serial('id').primaryKey(),
  feeNumber: text('fee_number').notNull().unique(), // FEE-20260903-0001
  feeType: text('fee_type').notNull().default('PROCEDURE'), // 'PROCEDURE' | 'MANUAL_ADDITIONAL'
  title: text('title'), // e.g. "Fee Tindakan Khusus Penyulit", "Bonus Khusus Lembur"
  doctorId: integer('doctor_id').references(() => doctors.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id),
  bookingId: integer('booking_id').references(() => bookings.id),
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  packageId: integer('package_id').references(() => circumcisionPackages.id),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id),
  methodName: text('method_name'), // e.g. "Glans Pro Bipolar Pensealer", "Nano Klemp"
  patientCondition: text('patient_condition'), // e.g. "GEMUK", "ABK", "DEWASA", "STANDAR"
  serviceType: text('service_type'), // "REGULER" | "VIP"
  feeAmount: integer('fee_amount').notNull(),
  feeDate: text('fee_date').notNull(),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  status: text('status').notNull().default('PENDING'), // PENDING | APPROVED | PAID | CANCELLED
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. Expense Categories Table
export const expenseCategories = pgTable('expense_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
});

// 20. Expense Transactions Table (Pengeluaran Operasional)
export const expenseTransactions = pgTable('expense_transactions', {
  id: serial('id').primaryKey(),
  transactionNumber: text('transaction_number').notNull().unique(), // EXP-20260903-0001
  expenseDate: text('expense_date').notNull(),
  categoryId: integer('category_id').references(() => expenseCategories.id),
  categoryName: text('category_name').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('CASH'),
  receiptUrl: text('receipt_url'),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  createdBy: text('created_by').notNull().default('Admin'),
  status: text('status').notNull().default('PAID'), // DRAFT | APPROVED | PAID | CANCELLED
  createdAt: timestamp('created_at').defaultNow(),
});

// 21. Follow Ups Table (H+1, H+3, H+7)
export const followUps = pgTable('follow_ups', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id).notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  followUpType: text('follow_up_type').notNull(), // 'H+1' | 'H+3' | 'H+7'
  scheduledDate: text('scheduled_date').notNull(),
  contactDate: text('contact_date'),
  staffName: text('staff_name'),
  patientCondition: text('patient_condition'),
  notes: text('notes'),
  status: text('status').notNull().default('PENDING'), // PENDING | CONTACTED | COMPLETED
  createdAt: timestamp('created_at').defaultNow(),
});

// 22. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  performedBy: text('performed_by').notNull(),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// 23. Clinic Settings Table
export const clinicSettings = pgTable('clinic_settings', {
  id: serial('id').primaryKey(),
  clinicName: text('clinic_name').notNull().default('NANO CIRCUMCISION CLINIC'),
  tagline: text('tagline').default('Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit'),
  address: text('address').default('Jl. Kesehatan No. 88, Jakarta Selatan'),
  phone: text('phone').default('0812-8888-9999'),
  email: text('email').default('info@nanocircumcision.com'),
  website: text('website').default('www.nanocircumcision.com'),
  logoUrl: text('logo_url'),
  invoiceHeader: text('invoice_header').default('Terima kasih atas kepercayaan Anda pada Nano Circumcision.'),
  invoiceFooter: text('invoice_footer').default('Kwitansi & Invoice ini sah dan telah diproses secara digital.'),
  invoicePaperDefault: text('invoice_paper_default').default('A4'),
  defaultDoctorFeeType: text('default_doctor_fee_type').default('FIXED'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 24. Products Table (Obat, Obat Tetes, Celana Sunat, Aksesoris, Mainan, Produk Lainnya)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull().unique(), // e.g. PRD-OBT-001, PRD-TTS-001, PRD-CLN-001
  name: text('name').notNull(),
  category: text('category').notNull(), // 'OBAT' | 'OBAT_TETES' | 'CELANA_SUNAT' | 'AKSESORIS' | 'MAINAN' | 'LAINNYA'
  unit: text('unit').notNull().default('pcs'), // pcs, botol, tube, strip, box
  sellPrice: integer('sell_price').notNull().default(0),
  costPrice: integer('cost_price').notNull().default(0),
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(5),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 25. Package Included Items Table (Configurable Master Isi Paket Khitan: Celana Sunat 2 pcs for VIP, 1 pcs for Reguler, dll)
export const packageIncludedItems = pgTable('package_included_items', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => circumcisionPackages.id).notNull(),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id), // Nullable: null applies to all categories, or specific (1 for Reguler, 2 for VIP)
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  isIncluded: boolean('is_included').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 26. Stock Movements Table (Riwayat Mutasi Stok: Barang Masuk, Keluar, Penyesuaian)
export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  movementNumber: text('movement_number').notNull().unique(), // e.g. STK-20260903-0001
  productId: integer('product_id').references(() => products.id).notNull(),
  movementType: text('movement_type').notNull(), // 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: integer('quantity').notNull(), // Amount changed (+ / -)
  previousStock: integer('previous_stock').notNull(),
  currentStock: integer('current_stock').notNull(),
  unitCost: integer('unit_cost').notNull().default(0),
  unitPrice: integer('unit_price').notNull().default(0),
  referenceType: text('reference_type').notNull(), // 'RESTOCK' | 'PROCEDURE_INCLUDED' | 'TRANSACTION_ADDON' | 'ADJUSTMENT' | 'RETURN'
  referenceId: integer('reference_id'), // procedureId / invoiceId
  notes: text('notes'),
  performedBy: text('performed_by').notNull().default('Staff'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 27. Transaction / Procedure Items Table (Item Produk Paket Included & Add-on pada Transaksi Pasien)
export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  productId: integer('product_id').references(() => products.id).notNull(),
  productSku: text('product_sku').notNull(),
  productName: text('product_name').notNull(),
  category: text('category').notNull(),
  itemType: text('item_type').notNull().default('ADDON'), // 'INCLUDED' | 'ADDON'
  quantity: integer('quantity').notNull().default(1),
  costPriceSnapshot: integer('cost_price_snapshot').notNull().default(0),
  sellPriceSnapshot: integer('sell_price_snapshot').notNull().default(0), // 0 for INCLUDED, positive for ADDON
  discountAmount: integer('discount_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull().default(0), // (quantity * sellPriceSnapshot) - discountAmount (0 if INCLUDED)
  isStockDeducted: boolean('is_stock_deducted').notNull().default(false),
  deductedAt: timestamp('deducted_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 28. Employees Table (Master Karyawan & Staf Khitan)
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  employeeCode: text('employee_code').notNull().unique(), // EMP-001
  name: text('name').notNull(),
  position: text('position').notNull().default('Perawat Khitan'), // Perawat Khitan | Asisten Medis | Kasir | Front Office | Admin
  phone: text('phone'),
  email: text('email'),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  basicSalary: integer('basic_salary').notNull().default(0),
  defaultPatientFee: integer('default_patient_fee').notNull().default(20000), // Fee per pasien default
  closingFeePerPatient: integer('closing_fee_per_patient').notNull().default(25000), // Fee closing pasien daftar langsung ke klinik
  overtimeHourlyRate: integer('overtime_hourly_rate').notNull().default(35000), // Fee lembur per jam
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  isActive: boolean('is_active').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  description: text('description'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 29. Employee Fee Rules Table (Master Aturan Fee Karyawan per Paket / Kategori)
export const employeeFeeRules = pgTable('employee_fee_rules', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  packageId: integer('package_id').references(() => circumcisionPackages.id),
  patientCategoryId: integer('patient_category_id').references(() => patientCategories.id),
  feeAmount: integer('fee_amount').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 30. Employee Fee Transactions Table (Transaksi Fee Karyawan per Pasien)
export const employeeFeeTransactions = pgTable('employee_fee_transactions', {
  id: serial('id').primaryKey(),
  feeNumber: text('fee_number').notNull().unique(), // EFEE-20260903-0001
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  employeeName: text('employee_name').notNull(),
  patientId: integer('patient_id').references(() => patients.id).notNull(),
  patientRm: text('patient_rm').notNull(),
  patientName: text('patient_name').notNull(),
  bookingId: integer('booking_id').references(() => bookings.id).notNull(),
  procedureId: integer('procedure_id').references(() => circumcisionProcedures.id).notNull(),
  procedureDate: text('procedure_date').notNull(),
  feeAmount: integer('fee_amount').notNull(),
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  status: text('status').notNull().default('PENDING'), // PENDING | INCLUDED_IN_PAYROLL | PAID | CANCELLED
  payrollId: integer('payroll_id'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 31. Payrolls Table (Penggajian Bulanan Karyawan)
export const payrolls = pgTable('payrolls', {
  id: serial('id').primaryKey(),
  payrollNumber: text('payroll_number').notNull().unique(), // PAYROLL-202609-001
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  employeeName: text('employee_name').notNull(),
  periodMonth: text('period_month').notNull(), // "2026-09"
  periodYear: integer('period_year').notNull().default(2026),
  paymentDate: text('payment_date').notNull(), // YYYY-MM-DD
  basicSalary: integer('basic_salary').notNull().default(0),
  patientFeeTotal: integer('patient_fee_total').notNull().default(0),
  patientCount: integer('patient_count').notNull().default(0),
  closingPatientCount: integer('closing_patient_count').notNull().default(0), // Jumlah closing pasien daftar langsung klinik
  closingFeePerPatient: integer('closing_fee_per_patient').notNull().default(0), // Fee per closing pasien
  closingFeeTotal: integer('closing_fee_total').notNull().default(0), // Total fee closing
  overtimeHours: integer('overtime_hours').notNull().default(0), // Jam lembur
  overtimeHourlyRate: integer('overtime_hourly_rate').notNull().default(0), // Tarif lembur per jam
  overtimeTotal: integer('overtime_total').notNull().default(0), // Total fee lembur
  bonusAmount: integer('bonus_amount').notNull().default(0),
  deductionAmount: integer('deduction_amount').notNull().default(0),
  netSalary: integer('net_salary').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('TRANSFER'), // TRANSFER | CASH
  branchCode: text('branch_code').default('PUSAT'), // 'PUSAT' | 'CABANG-01' | 'CABANG-02'
  status: text('status').notNull().default('DRAFT'), // DRAFT | PENDING | PAID | CANCELLED
  notes: text('notes'),
  paidAt: timestamp('paid_at'),
  processedBy: text('processed_by').notNull().default('Super Admin'),
  createdAt: timestamp('created_at').defaultNow(),
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
  methodFeeRules: many(doctorMethodFeeRules),
  bookings: many(bookings),
  procedures: many(circumcisionProcedures),
  feeTransactions: many(doctorFeeTransactions),
}));

export const doctorMethodFeeRulesRelations = relations(doctorMethodFeeRules, ({ one }) => ({
  doctor: one(doctors, {
    fields: [doctorMethodFeeRules.doctorId],
    references: [doctors.id],
  }),
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


