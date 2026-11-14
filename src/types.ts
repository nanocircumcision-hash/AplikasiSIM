export type UserRole = 'owner' | 'super_admin' | 'admin' | 'staff' | 'doctor';

export type AppPermission =
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit'
  | 'patients.delete'
  | 'bookings.view'
  | 'bookings.create'
  | 'bookings.edit'
  | 'procedures.view'
  | 'procedures.create'
  | 'procedures.edit'
  | 'procedures.delete'
  | 'doctors.view'
  | 'doctors.edit'
  | 'doctor_fee.view'
  | 'doctor_fee.edit'
  | 'employees.view'
  | 'employees.edit'
  | 'payroll.view'
  | 'payroll.create'
  | 'payroll.edit'
  | 'finance.view'
  | 'finance.edit'
  | 'reports.view'
  | 'settings.manage'
  | 'products.view'
  | 'products.edit';

export interface Branch {
  id: number;
  code: string; // e.g. 'PUSAT', 'CABANG-01', 'CABANG-02'
  name: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface User {
  id: string | number;
  uid?: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  permissions?: string[];
  lastLogin?: string;
  branchCode?: string; // 'PUSAT' | 'CABANG-01' | 'CABANG-02' | 'ALL'
  activeBranch?: string; // currently active branch for this session
}

export interface PatientCategory {
  id: number;
  code: 'REGULER' | 'VIP' | string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PackagePrice {
  id?: number;
  packageId: number;
  patientCategoryId: number;
  price: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
}

export interface CircumcisionPackage {
  id: number;
  code: string;
  name: string;
  description: string;
  durationMinutes: number;
  isActive: boolean;
  prices?: PackagePrice[];
}

export interface DoctorFeeRule {
  id?: number;
  doctorId: number;
  packageId: number;
  patientCategoryId: number;
  feeAmount: number;
  effectiveDate: string;
  isActive: boolean;
}

export type PatientConditionType = 'STANDAR' | 'GEMUK' | 'ABK' | 'DEWASA' | string;

export interface DoctorMethodFeeRule {
  id: number;
  doctorId?: number | null; // null = aturan standar semua dokter
  doctorName?: string | null;
  methodId?: number | null;
  methodName: string; // e.g. "Glans Pro Bipolar Pensealer", "Metode Tindakan Nano Klemp"
  patientCondition: PatientConditionType; // 'STANDAR' | 'GEMUK' | 'ABK' | 'DEWASA'
  regulerFee: number; // Fee kelas Reguler (Rp)
  vipFee: number; // Fee kelas VIP (Rp)
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorSchedule {
  id?: number;
  doctorId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
}

export interface Doctor {
  id: number;
  code: string;
  name: string;
  title: string;
  specialty: string;
  specialization?: string;
  description?: string;
  notes?: string;
  phone: string;
  email?: string;
  sipNumber: string;
  branchCode?: string;
  isActive: boolean;
  regulerFee?: number;
  vipFee?: number;
  packageFees?: { packageId: number; regulerFee?: number; vipFee?: number }[];
  schedules?: DoctorSchedule[];
  feeRules?: DoctorFeeRule[];
  methodFeeRules?: DoctorMethodFeeRule[];
}

export interface CircumcisionMethod {
  id: number;
  packageId?: number;
  code?: string;
  name: string;
  description?: string;
  notes?: string;
  durationMinutes?: number;
  priceReguler?: number;
  priceVip?: number;
  prices?: {
    id?: number;
    packageId?: number;
    patientCategoryId?: number;
    patientCategoryCode?: string;
    patientCategoryName?: string;
    price: number;
    isActive?: boolean;
  }[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guardian {
  id: number;
  name: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  notes?: string;
  children?: CircumcisionPatient[];
}

export interface CircumcisionPatient {
  id: number;
  rmNumber: string;
  fullName: string;
  nickname: string;
  nik?: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthPlace?: string;
  birthDate: string;
  ageYears: number;
  ageMonths: number;
  address: string;
  phone: string;
  school?: string;
  grade?: string;
  weightKg?: string;
  heightCm?: string;
  allergies?: string;
  notes?: string;
  guardianId: number;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  fatherName?: string;
  motherName?: string;
  branchCode?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
}

export type BookingStatus =
  | 'BOOKED'
  | 'DP_PAID'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export interface CircumcisionBooking {
  id: number;
  bookingNumber: string;
  patientId: number;
  patientName: string;
  patientNickname?: string;
  rmNumber: string;
  patientAge: number;
  guardianId: number;
  guardianName: string;
  guardianPhone: string;
  patientCategoryId: number;
  categoryCode: string;
  categoryName: string;
  packageId: number;
  packageCode: string;
  packageName: string;
  doctorId: number;
  doctorName: string;
  bookingDate: string;
  bookingTime: string;
  methodType?: string;
  anesthesiaType?: string;
  packagePriceSnapshot: number;
  discountAmount: number;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  patientSource?: string;
  branchCode?: string;
  closingStaffId?: number;
  closingStaffName?: string;
  notes?: string;
  status: BookingStatus;
  createdAt?: string;
}

export interface QueueItem {
  id: number;
  queueNumber: string;
  queueDate: string;
  bookingId: number;
  patientId: number;
  patientName: string;
  rmNumber: string;
  patientAge: number;
  doctorId: number;
  doctorName: string;
  categoryName: string;
  categoryCode: string;
  packageName: string;
  status: 'WAITING' | 'PREPARATION' | 'IN_PROCEDURE' | 'COMPLETED' | 'CANCELLED';
  arrivedAt?: string;
}

export interface ProcedureChecklist {
  identityVerified: boolean;
  siteVerified?: boolean;
  allergyStatusVerified?: boolean;
  guardianVerified: boolean;
  packageConfirmed: boolean;
  consentSigned: boolean;
  equipmentSterileVerified?: boolean;
  procedureDone: boolean;
  notesFilled: boolean;
  careGiven: boolean;
  controlScheduled: boolean;
  assistantStaffIds?: number[];
}

export interface CircumcisionProcedure {
  id: number;
  procedureNumber: string;
  bookingId: number;
  bookingNumber: string;
  patientId: number;
  patientName: string;
  rmNumber: string;
  patientAge: number;
  guardianName: string;
  guardianPhone: string;
  categoryCode: string;
  categoryName: string;
  packageName: string;
  doctorId: number;
  doctorName: string;
  procedureDate: string;
  procedureTime: string;
  methodType: string;
  anesthesiaType?: string;
  preCondition?: string;
  procedureNotes?: string;
  postCondition?: string;
  careInstructions?: string;
  controlDate?: string;
  additionalNotes?: string;
  status: 'WAITING' | 'PREPARATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checklistData?: string | ProcedureChecklist;
  completedAt?: string;
  doctorNameSnapshot?: string;
  assistantStaffId?: number;
  assistantStaffName?: string;
  assistantStaffIds?: number[];
  invoiceStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
}

export interface PaymentTransaction {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS' | 'DEBIT';
  paymentType: 'DP' | 'PARTIAL' | 'FULL_PAYMENT';
  referenceNumber?: string;
  notes?: string;
  receivedBy: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  bookingId: number;
  bookingNumber: string;
  patientId: number;
  patientName: string;
  rmNumber: string;
  guardianName: string;
  guardianPhone: string;
  doctorId: number;
  doctorName: string;
  categoryCode: string;
  categoryName: string;
  packageName: string;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  branchCode?: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  notes?: string;
  payments?: PaymentTransaction[];
  createdAt?: string;
}

export interface Employee {
  id: number;
  employeeCode: string; // EMP-001
  name: string;
  position: string;
  phone?: string;
  email?: string;
  startDate: string;
  basicSalary: number;
  defaultPatientFee: number;
  closingFeePerPatient?: number;
  overtimeHourlyRate?: number;
  branchCode?: string;
  isActive: boolean;
  description?: string;
  notes?: string;
  createdAt?: string;
}

export interface EmployeeFeeRule {
  id?: number;
  employeeId: number;
  packageId?: number;
  patientCategoryId?: number;
  feeAmount: number;
  isActive: boolean;
}

export interface EmployeeFeeTransaction {
  id: number;
  feeNumber: string; // EFEE-20260903-0001
  employeeId: number;
  employeeName: string;
  patientId: number;
  patientRm: string;
  patientName: string;
  bookingId: number;
  procedureId: number;
  procedureDate: string;
  feeAmount: number;
  status: 'PENDING' | 'INCLUDED_IN_PAYROLL' | 'PAID' | 'CANCELLED';
  payrollId?: number;
  paidAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface PayrollItem {
  id: number;
  payrollNumber: string; // PAYROLL-202609-001
  employeeId: number;
  employeeName: string;
  periodMonth: string; // "2026-09"
  periodYear: number;
  paymentDate: string;
  basicSalary: number;
  patientFeeTotal: number;
  patientCount: number;
  closingPatientCount?: number;
  closingFeePerPatient?: number;
  closingFeeTotal?: number;
  overtimeHours?: number;
  overtimeHourlyRate?: number;
  overtimeTotal?: number;
  bonusAmount: number;
  deductionAmount: number;
  netSalary: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED';
  notes?: string;
  paidAt?: string;
  processedBy?: string;
  createdAt?: string;
  feeDetails?: EmployeeFeeTransaction[];
}

export interface EmployeeOvertime {
  id: number;
  employeeId: number;
  employeeName: string;
  overtimeDate: string; // YYYY-MM-DD
  periodMonth: string; // YYYY-MM
  startTime?: string | null;
  endTime?: string | null;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  reason?: string | null;
  branchCode?: string;
  recordedBy: string;
  createdAt?: string;
}

export interface DoctorFeeTransaction {
  id: number;
  feeNumber: string;
  feeType?: 'PROCEDURE' | 'MANUAL_ADDITIONAL';
  title?: string;
  feeDate: string;
  doctorId: number;
  doctorName: string;
  patientId?: number;
  patientName?: string;
  rmNumber?: string;
  categoryCode?: string;
  categoryName?: string;
  packageName?: string;
  methodName?: string;
  patientCondition?: string;
  serviceType?: 'REGULER' | 'VIP' | string;
  feeAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  approvedAt?: string;
  paidAt?: string;
  branchCode?: string;
  notes?: string;
  bookingNumber?: string;
}

export interface ExpenseTransaction {
  id: number;
  transactionNumber: string;
  expenseDate: string;
  expenseCategoryId?: number;
  categoryName: string;
  title?: string;
  description?: string;
  amount: number;
  paymentMethod: string;
  branchCode?: string;
  vendor?: string;
  notes?: string;
  createdBy?: string;
  status?: string;
}

export interface DashboardReportData {
  summary: {
    patientsToday: number;
    completedToday: number;
    bookingsToday: number;
    revenueToday: number;
    revenueMonth: number;
    revenueYear: number;
    expenseToday: number;
    expenseMonth: number;
    expenseYear: number;
    feeMonthTotal: number;
    feePending: number;
    feeApproved: number;
    feePaid: number;
    employeeFeeMonthTotal?: number;
    salariesMonthTotal?: number;
    netProfitMonth: number;
    totalPiutang: number;
    vipCount: number;
    regularCount: number;
  };
  sources: {
    source: string;
    count: number;
    revenue: number;
  }[];
}

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  details?: string;
  createdAt: string;
}

export interface ClinicSettings {
  id?: number;
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string | null;
  invoiceHeader: string;
  invoiceFooter: string;
}

export type ProductCategory =
  | 'OBAT'
  | 'OBAT_TETES'
  | 'CELANA_SUNAT'
  | 'AKSESORIS'
  | 'MAINAN'
  | 'LAINNYA';

export type CelanaSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type DrugType = 'Sirup' | 'Pil / Kapsul' | 'Tetes' | 'Salep' | 'Lainnya';
export type DrugClassification = 'ANTI_NYERI' | 'ANTI_BENGKAK' | 'ANTI_BIOTIK' | 'LAINNYA';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  sellPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  branchCode?: string;
  isActive: boolean;
  description?: string;
  size?: CelanaSize | string;
  brand?: string;
  drugType?: DrugType | string;
  drugClassification?: DrugClassification | string;
  createdAt?: string;
  inventoryValue?: number; // stock * costPrice
}

export interface PackageIncludedItem {
  id: number;
  packageId: number;
  packageName?: string;
  patientCategoryId?: number | null;
  categoryCode?: string;
  categoryName?: string;
  productId: number;
  productSku?: string;
  productName?: string;
  productCategory?: ProductCategory;
  quantity: number;
  isIncluded: boolean;
  notes?: string;
}

export interface StockMovement {
  id: number;
  movementNumber: string;
  productId: number;
  productName?: string;
  productSku?: string;
  category?: ProductCategory;
  size?: string | null;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  currentStock: number;
  unitCost: number;
  unitPrice: number;
  referenceType: 'RESTOCK' | 'PROCEDURE_INCLUDED' | 'TRANSACTION_ADDON' | 'ADJUSTMENT' | 'RETURN';
  referenceId?: number;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface TransactionItem {
  id: number;
  bookingId: number;
  procedureId?: number;
  invoiceId?: number;
  productId: number;
  productSku: string;
  productName: string;
  category: ProductCategory;
  size?: string | null;
  itemType: 'INCLUDED' | 'ADDON';
  quantity: number;
  costPriceSnapshot: number;
  sellPriceSnapshot: number;
  discountAmount: number;
  totalAmount: number;
  isStockDeducted: boolean;
  deductedAt?: string;
  notes?: string;
  selectedSize?: string;
  selectedBrand?: string;
  selectedDrugType?: string;
  selectedDrugClassification?: string;
  createdAt?: string;
}

export interface ProductSalesReportItem {
  productId: number;
  productSku: string;
  productName: string;
  category: ProductCategory;
  size?: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  qtyIncluded: number;
  qtyAddon: number;
  qtyTotal: number;
  totalRevenue: number; // Qty Addon * Sell Price
  totalCost: number; // Qty Total * Cost Price
  estimatedProfit: number; // totalRevenue - (qtyAddon * costPrice)
}

export interface InventorySummary {
  totalProducts: number;
  totalStockQuantity: number;
  totalInventoryCost: number; // Nilai persediaan
  lowStockCount: number;
}

