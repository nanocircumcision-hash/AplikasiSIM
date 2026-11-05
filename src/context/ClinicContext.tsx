import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  PatientCategory,
  CircumcisionPackage,
  Doctor,
  Guardian,
  CircumcisionPatient,
  CircumcisionBooking,
  QueueItem,
  CircumcisionProcedure,
  Invoice,
  DoctorFeeTransaction,
  ExpenseTransaction,
  DashboardReportData,
  ClinicSettings,
  Product,
  PackageIncludedItem,
  StockMovement,
  TransactionItem,
  InventorySummary,
  Employee,
  EmployeeFeeTransaction,
  PayrollItem,
  AuditLog,
  CircumcisionMethod,
  DoctorMethodFeeRule,
  Branch,
} from '../types';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ClinicContextType {
  currentUser: User | null;
  switchRoleQuick: (role: UserRole) => void;
  login: (username: string, password?: string, branchCode?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Multi-Branch State
  branches: Branch[];
  activeBranchCode: string;
  setActiveBranchCode: (code: string) => void;

  // Data
  patients: CircumcisionPatient[];
  guardians: Guardian[];
  categories: PatientCategory[];
  packages: CircumcisionPackage[];
  circumcisionMethods: CircumcisionMethod[];
  doctors: Doctor[];
  bookings: CircumcisionBooking[];
  queues: QueueItem[];
  procedures: CircumcisionProcedure[];
  invoices: Invoice[];
  doctorFees: DoctorFeeTransaction[];
  doctorMethodFees: DoctorMethodFeeRule[];
  expenses: ExpenseTransaction[];
  expenseCategories: { id: number; name: string }[];
  dashboardData: DashboardReportData | null;
  settings: ClinicSettings;
  products: Product[];
  packageItems: PackageIncludedItem[];
  inventorySummary: InventorySummary | null;
  employees: Employee[];
  employeeFees: EmployeeFeeTransaction[];
  payrolls: PayrollItem[];
  usersList: User[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  
  // Actions
  refreshAllData: (branchOverride?: string) => Promise<void>;
  getHeaders: (branchOverride?: string) => Record<string, string>;
  registerPatient: (data: any) => Promise<{ success: boolean; error?: string; patient?: CircumcisionPatient }>;
  updatePatient: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deletePatient: (id: number, reason?: string, permanent?: boolean) => Promise<{ success: boolean; error?: string; message?: string }>;
  restorePatient: (id: number) => Promise<{ success: boolean; error?: string }>;
  createBooking: (data: any) => Promise<{ success: boolean; error?: string; booking?: CircumcisionBooking }>;
  updateBooking: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  checkInBooking: (bookingId: number) => Promise<{ success: boolean; error?: string; queue?: QueueItem }>;
  updateProcedure: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  completeProcedure: (id: number, payloadOrAssistantStaffId?: number | { assistantStaffId?: number; [key: string]: any }) => Promise<{ 
    success: boolean; 
    error?: string; 
    invoiceId?: number; 
    invoiceNumber?: string;
    bookingId?: number;
    patientName?: string;
    remainingAmount?: number;
    invoiceStatus?: string;
  }>;
  payInvoice: (invoiceId: number, data: any) => Promise<{ success: boolean; error?: string }>;
  cancelInvoice: (invoiceId: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  voidInvoice: (invoiceId: number, voidReason: string) => Promise<{ success: boolean; error?: string }>;
  createDoctorFee: (data: { doctorId: number; feeAmount: number; feeDate?: string; title?: string; notes?: string; patientId?: number; status?: 'PENDING' | 'APPROVED' }) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateDoctorFee: (feeId: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteDoctorFee: (feeId: number) => Promise<{ success: boolean; error?: string }>;
  updateDoctorFeeStatus: (feeId: number, status: 'APPROVED' | 'PAID' | 'CANCELLED', options?: { paymentMethod?: string }) => Promise<{ success: boolean; error?: string }>;
  payDoctorFeesBatch: (data: { doctorId?: number; feeIds: number[]; paymentMethod?: string; paymentDate?: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  syncDoctorFeesWithMaster: (doctorId?: number | 'ALL') => Promise<{ success: boolean; error?: string; updatedCount?: number }>;
  saveDoctorFeeSettings: (doctorId: number, data: { regulerFee: number; vipFee: number; packageFees?: any[]; syncPendingFees?: boolean }) => Promise<{ success: boolean; error?: string }>;
  fetchDoctorMethodFees: (doctorId?: number | 'ALL') => Promise<DoctorMethodFeeRule[]>;
  saveDoctorMethodFeesBatch: (rules: Partial<DoctorMethodFeeRule>[], syncPendingFees?: boolean) => Promise<{ success: boolean; error?: string; savedCount?: number; syncedCount?: number }>;
  createDoctorMethodFeeRule: (data: Partial<DoctorMethodFeeRule>) => Promise<{ success: boolean; error?: string; rule?: DoctorMethodFeeRule }>;
  updateDoctorMethodFeeRule: (id: number, data: Partial<DoctorMethodFeeRule>) => Promise<{ success: boolean; error?: string; rule?: DoctorMethodFeeRule }>;
  deleteDoctorMethodFeeRule: (id: number) => Promise<{ success: boolean; error?: string }>;
  syncDoctorMethodFeesWithPending: (doctorId?: number | 'ALL') => Promise<{ success: boolean; error?: string; updatedCount?: number }>;
  addExpense: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateExpense: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: number, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updatePackagePrices: (packageId: number, prices: any[]) => Promise<{ success: boolean; error?: string }>;
  updateDoctorFeeRule: (doctorId: number, rule: any) => Promise<{ success: boolean; error?: string }>;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => Promise<{ success: boolean; error?: string }>;
  createProduct: (data: any) => Promise<{ success: boolean; error?: string; product?: Product }>;
  updateProduct: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  adjustStock: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  savePackageItem: (data: any) => Promise<{ success: boolean; error?: string }>;
  deletePackageItem: (id: number) => Promise<{ success: boolean; error?: string }>;
  getTransactionItems: (bookingId: number) => Promise<TransactionItem[]>;
  addTransactionItem: (bookingId: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteTransactionItem: (bookingId: number, itemId: number) => Promise<{ success: boolean; error?: string }>;
  updatePackageSelections: (bookingId: number, data: { celanaProductIds?: number[]; obatProductId?: number; obatProductIds?: number[]; obatSelection?: { antiNyeriId?: number; antiBengkakId?: number; antiBiotikId?: number } }) => Promise<{ success: boolean; error?: string; items?: TransactionItem[] }>;
  batchSetCelanaSizes: (sizes: { size: string; stock: number; minStock?: number; costPrice?: number; sellPrice?: number; notes?: string }[] | Record<string, number>) => Promise<{ success: boolean; error?: string }>;

  // Master Data Actions: Circumcision Methods
  createCircumcisionMethod: (data: any) => Promise<{ success: boolean; error?: string; method?: CircumcisionMethod }>;
  updateCircumcisionMethod: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  toggleCircumcisionMethodStatus: (id: number) => Promise<{ success: boolean; error?: string; isActive?: boolean }>;
  deleteCircumcisionMethod: (id: number) => Promise<{ success: boolean; error?: string; message?: string }>;

  // Master Data Actions: Doctors
  createDoctor: (data: any) => Promise<{ success: boolean; error?: string; doctor?: Doctor }>;
  updateDoctor: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  toggleDoctorStatus: (id: number) => Promise<{ success: boolean; error?: string; isActive?: boolean }>;
  deleteDoctor: (id: number) => Promise<{ success: boolean; error?: string; message?: string }>;

  // Employee & Payroll Actions
  createEmployee: (data: any) => Promise<{ success: boolean; error?: string; employee?: Employee }>;
  updateEmployee: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  toggleEmployeeStatus: (id: number) => Promise<{ success: boolean; error?: string; isActive?: boolean }>;
  deleteEmployee: (id: number) => Promise<{ success: boolean; error?: string; message?: string }>;
  generatePayroll: (param: string | { periodMonth: string; employeeId?: number | string; closingPatientCount?: number; closingFeePerPatient?: number; overtimeHours?: number; overtimeHourlyRate?: number; bonusAmount?: number; deductionAmount?: number; notes?: string; paymentMethod?: string }) => Promise<{ success: boolean; error?: string; count?: number; payroll?: any }>;
  updatePayroll: (id: number, data: any) => Promise<{ success: boolean; error?: string; payroll?: any }>;
  deletePayroll: (id: number) => Promise<{ success: boolean; error?: string }>;
  payPayroll: (id: number, data?: any) => Promise<{ success: boolean; error?: string }>;

  // User Management Actions
  createUser: (data: any) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: number) => Promise<{ success: boolean; error?: string }>;

  // Branch Management Actions
  createBranch: (data: Partial<Branch>) => Promise<{ success: boolean; error?: string; branch?: Branch }>;
  updateBranch: (id: number, data: Partial<Branch>) => Promise<{ success: boolean; error?: string; branch?: Branch }>;
  deleteBranch: (id: number, force?: boolean) => Promise<{ success: boolean; error?: string; hasLinkedData?: boolean }>;
  toggleBranchStatus: (id: number) => Promise<{ success: boolean; error?: string; isActive?: boolean }>;

  // Audit
  fetchAuditLogs: (entity?: string) => Promise<AuditLog[]>;
  
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('clinic_user_session');
        if (saved) return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [patients, setPatients] = useState<CircumcisionPatient[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [categories, setCategories] = useState<PatientCategory[]>([]);
  const [packages, setPackages] = useState<CircumcisionPackage[]>([]);
  const [circumcisionMethods, setCircumcisionMethods] = useState<CircumcisionMethod[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<CircumcisionBooking[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [procedures, setProcedures] = useState<CircumcisionProcedure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctorFees, setDoctorFees] = useState<DoctorFeeTransaction[]>([]);
  const [doctorMethodFees, setDoctorMethodFees] = useState<DoctorMethodFeeRule[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<{ id: number; name: string }[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardReportData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [packageItems, setPackageItems] = useState<PackageIncludedItem[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeFees, setEmployeeFees] = useState<EmployeeFeeTransaction[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Multi-Branch State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchCode, setActiveBranchCodeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_active_branch') || 'PUSAT';
    }
    return 'PUSAT';
  });

  const setActiveBranchCode = useCallback((code: string) => {
    const clean = (code || 'PUSAT').toUpperCase();
    setActiveBranchCodeState(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clinic_active_branch', clean);
    }
  }, []);

  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: 'NANO CIRCUMCISION CLINIC',
    tagline: 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit',
    address: 'Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan',
    phone: '0812-8888-9999',
    email: 'info@nanocircumcision.com',
    website: 'www.nanocircumcision.com',
    logoUrl: typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : null,
    invoiceHeader: 'Terima kasih telah mempercayakan tindakan khitan putra tercinta kepada tim medis Nano Circumcision.',
    invoiceFooter: 'Dokumen ini sah dan diterbitkan secara digital oleh Nano Circumcision Management System.',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getHeaders = useCallback((branchOverride?: string) => {
    const effectiveBranch = 
      branchOverride || 
      activeBranchCode || 
      (typeof window !== 'undefined' ? localStorage.getItem('clinic_active_branch') : null) || 
      (currentUser as any)?.activeBranch || 
      currentUser?.branchCode || 
      'PUSAT';
    return {
      'Content-Type': 'application/json',
      'x-clinic-role': currentUser?.role || 'admin',
      'x-clinic-user': String(currentUser?.username || currentUser?.id || 'admin'),
      'x-branch-code': effectiveBranch,
    };
  }, [currentUser, activeBranchCode]);

  const refreshAllData = useCallback(async (branchOverride?: string) => {
    try {
      setIsLoading(true);
      const headers = getHeaders(branchOverride);

      const [
        ptsRes, guardsRes, catsRes, pkgsRes, methodsRes, docsRes, bksRes,
        qsRes, procsRes, invsRes, feesRes, docMethodFeesRes, expsRes, expCatsRes,
        dashRes, setRes, prodsRes, pkgItemsRes, invSumRes,
        empRes, empFeesRes, payRes, usersRes, auditRes, branchesRes
      ] = await Promise.all([
        fetch('/api/patients?includeDeleted=true', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/guardians', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/categories', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/packages', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/circumcision-methods', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/doctors', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/bookings', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/queues', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/procedures', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/invoices', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/doctor-fees', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/doctor-method-fees', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/expenses', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/expense-categories', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/reports/dashboard', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/settings', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/products', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/package-items', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/inventory/summary', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/employees', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/employee-fees', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/payrolls', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/users', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/audit-logs', { headers }).then(r => r.json()).catch(() => []),
        fetch('/api/branches?includeInactive=true', { headers }).then(r => r.json()).catch(() => []),
      ]);

      if (Array.isArray(ptsRes)) setPatients(ptsRes);
      if (Array.isArray(guardsRes)) setGuardians(guardsRes);
      if (Array.isArray(catsRes)) setCategories(catsRes);
      if (Array.isArray(pkgsRes)) setPackages(pkgsRes);
      if (Array.isArray(methodsRes)) setCircumcisionMethods(methodsRes);
      if (Array.isArray(docsRes)) setDoctors(docsRes);
      if (Array.isArray(bksRes)) setBookings(bksRes);
      if (Array.isArray(qsRes)) setQueues(qsRes);
      if (Array.isArray(procsRes)) setProcedures(procsRes);
      if (Array.isArray(invsRes)) setInvoices(invsRes);
      if (Array.isArray(feesRes)) setDoctorFees(feesRes);
      if (Array.isArray(docMethodFeesRes)) setDoctorMethodFees(docMethodFeesRes);
      if (Array.isArray(expsRes)) setExpenses(expsRes);
      if (Array.isArray(expCatsRes)) setExpenseCategories(expCatsRes);
      if (dashRes && dashRes.summary) setDashboardData(dashRes);
      if (setRes && setRes.clinicName) {
        const localSavedLogo = typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : null;
        const mergedLogo = setRes.logoUrl || localSavedLogo || null;
        setSettings({
          ...setRes,
          logoUrl: mergedLogo,
        });
        if (mergedLogo && typeof window !== 'undefined') {
          localStorage.setItem('clinic_logo_url', mergedLogo);
        }
      }
      if (Array.isArray(prodsRes)) setProducts(prodsRes);
      if (Array.isArray(pkgItemsRes)) setPackageItems(pkgItemsRes);
      if (invSumRes && typeof invSumRes.totalProducts === 'number') setInventorySummary(invSumRes);
      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(empFeesRes)) setEmployeeFees(empFeesRes);
      if (Array.isArray(payRes)) setPayrolls(payRes);
      if (Array.isArray(usersRes)) setUsersList(usersRes);
      if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      if (Array.isArray(branchesRes)) setBranches(branchesRes);
    } catch (error) {
      console.error('Error fetching clinic data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // Re-fetch when activeBranchCode changes
  useEffect(() => {
    refreshAllData();
  }, [activeBranchCode]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const switchRoleQuick = (role: UserRole) => {
    if (role === 'admin' || role === 'owner') {
      setCurrentUser({
        id: 'user-admin',
        username: 'admin',
        fullName: 'H. Rian Gunawan, S.E. (Super Admin)',
        role: 'admin',
        email: 'admin@nanocircumcision.com',
      });
      showToast('Beralih ke Peran Super Admin (Akses Penuh Seluruh Modul)', 'info');
    } else if (role === 'doctor') {
      setCurrentUser({
        id: 'user-doctor',
        username: 'dokter',
        fullName: 'dr. Bambang Irawan, Sp.B (Dokter Operator)',
        role: 'doctor',
        email: 'dokter@nanocircumcision.com',
      });
      showToast('Beralih ke Peran Dokter (Jadwal, Pasien, Tindakan Medis & Fee)', 'info');
    } else {
      setCurrentUser({
        id: 'user-staff',
        username: 'staff',
        fullName: 'Dina Safitri (Staff Front Office & Kasir)',
        role: 'staff',
        email: 'staff@nanocircumcision.com',
      });
      showToast('Beralih ke Peran Staff (Pendaftaran, Booking, Kasir & Stok)', 'info');
    }
  };

  const login = async (username: string, password = 'password123', branchCode?: string, role?: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, branchCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Login gagal', 'error');
        return { success: false, error: data.error };
      }
      const rawUser = data.user || data;
      const userObj: User = {
        ...rawUser,
        username: rawUser.username || rawUser.email?.split('@')[0] || username,
        role: rawUser.role || (role || 'staff'),
        permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : [],
      };
      setCurrentUser(userObj);

      // Handle active branch with immediate data refresh for the target branch
      const targetBranch = rawUser.activeBranch || branchCode || (rawUser.branchCode && rawUser.branchCode !== 'ALL' ? rawUser.branchCode : 'PUSAT');
      setActiveBranchCodeState(targetBranch);
      if (typeof window !== 'undefined') {
        localStorage.setItem('clinic_active_branch', targetBranch);
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('clinic_user_session', JSON.stringify(userObj));
        } catch {
          // ignore
        }
      }
      showToast(`Selamat datang kembali, ${userObj.fullName}!`, 'success');
      await refreshAllData(targetBranch);
      return { success: true };
    } catch (err: any) {
      // Fallback
      if (role) {
        switchRoleQuick(role);
        return { success: true };
      }
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() }).catch(() => {});
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('clinic_user_session');
      } catch {
        // ignore
      }
    }
    showToast('Berhasil keluar dari sistem', 'info');
  };

  // Register Patient
  const registerPatient = async (data: any) => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mendaftar pasien', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Pasien berhasil didaftarkan: No. RM ${result.rmNumber}`, 'success');
      await refreshAllData();
      return { success: true, patient: result };
    } catch (err: any) {
      showToast('Terjadi kesalahan koneksi server', 'error');
      return { success: false, error: err.message };
    }
  };

  const updatePatient = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah data pasien', 'error');
        return { success: false, error: result.error };
      }
      showToast('Data pasien berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deletePatient = async (id: number, reason?: string, permanent?: boolean) => {
    try {
      const url = `/api/patients/${id}${permanent ? '?permanent=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ reason, permanent }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus pasien', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || (permanent ? 'Data pasien berhasil dihapus permanen' : 'Pasien berhasil diarsipkan'), 'success');
      await refreshAllData();
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const restorePatient = async (id: number) => {
    try {
      const res = await fetch(`/api/patients/${id}/restore`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memulihkan pasien', 'error');
        return { success: false, error: result.error };
      }
      showToast('Pasien berhasil dipulihkan kembali aktif', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Create Booking
  const createBooking = async (data: any) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal membuat booking', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Booking ${result.booking?.bookingNumber} berhasil dijadwalkan!`, 'success');
      await refreshAllData();
      return { success: true, booking: result.booking };
    } catch (err: any) {
      showToast('Terjadi kesalahan jaringan', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateBooking = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah data booking', 'error');
        return { success: false, error: result.error };
      }
      showToast('Perubahan metode khitan & jadwal booking berhasil disimpan!', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Terjadi kesalahan jaringan', 'error');
      return { success: false, error: err.message };
    }
  };

  // Check In Booking
  const checkInBooking = async (bookingId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal check-in', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Pasien berhasil check-in! Antrean: ${result.queue?.queueNumber}`, 'success');
      await refreshAllData();
      return { success: true, queue: result.queue };
    } catch (err: any) {
      showToast('Gagal check-in antrean', 'error');
      return { success: false, error: err.message };
    }
  };

  // Update Procedure
  const updateProcedure = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/procedures/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal update tindakan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Catatan tindakan berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Complete Procedure
  const completeProcedure = async (id: number, payloadOrAssistantStaffId?: number | { assistantStaffId?: number; [key: string]: any }) => {
    try {
      const payload = typeof payloadOrAssistantStaffId === 'object' && payloadOrAssistantStaffId !== null
        ? payloadOrAssistantStaffId
        : { assistantStaffId: payloadOrAssistantStaffId };

      const res = await fetch(`/api/procedures/${id}/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menyelesaikan tindakan', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Tindakan selesai & tersimpan! Dialihkan ke kasir pembayaran...`, 'success');
      await refreshAllData();
      return { 
        success: true,
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        bookingId: result.bookingId,
        patientName: result.patientName,
        remainingAmount: result.remainingAmount,
        invoiceStatus: result.invoiceStatus,
      };
    } catch (err: any) {
      showToast('Gagal menyelesaikan tindakan', 'error');
      return { success: false, error: err.message };
    }
  };

  // Pay Invoice
  const payInvoice = async (invoiceId: number, data: any) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memproses pembayaran', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Pembayaran Rp ${Number(data.amount).toLocaleString('id-ID')} berhasil dicatat!`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Gagal mencatat pembayaran', 'error');
      return { success: false, error: err.message };
    }
  };

  // Cancel Invoice
  const cancelInvoice = async (invoiceId: number, reason: string) => {
    return voidInvoice(invoiceId, reason);
  };

  // Void Invoice with mandatory reason & audit
  const voidInvoice = async (invoiceId: number, voidReason: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/void`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ voidReason }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal membatalkan invoice', 'error');
        return { success: false, error: result.error };
      }
      showToast('Invoice berhasil dibatalkan (VOID) beserta audit trail', 'info');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Manual Doctor Fee Operations
  const createDoctorFee = async (data: { doctorId: number; feeAmount: number; feeDate?: string; title?: string; notes?: string; patientId?: number; status?: 'PENDING' | 'APPROVED' }) => {
    try {
      const res = await fetch('/api/doctor-fees', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: activeBranchCode || 'PUSAT' }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan fee manual dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast('Fee tambahan manual dokter berhasil disimpan dan akan otomatis dihitung saat rekap bulanan!', 'success');
      await refreshAllData();
      return { success: true, data: result };
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const updateDoctorFee = async (feeId: number, data: any) => {
    try {
      const res = await fetch(`/api/doctor-fees/${feeId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah fee manual dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast('Fee dokter berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteDoctorFee = async (feeId: number) => {
    try {
      const res = await fetch(`/api/doctor-fees/${feeId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus fee dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast('Fee tambahan manual dokter berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Doctor Fee Status
  const updateDoctorFeeStatus = async (feeId: number, status: 'APPROVED' | 'PAID' | 'CANCELLED', options?: { paymentMethod?: string }) => {
    try {
      const res = await fetch(`/api/doctor-fees/${feeId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, paymentMethod: options?.paymentMethod }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah status fee', 'error');
        return { success: false, error: result.error };
      }
      showToast(status === 'PAID' ? 'Fee dokter berhasil dicairkan & masuk ke pengeluaran operasional' : `Status fee dokter diperbarui menjadi ${status}`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const payDoctorFeesBatch = async (data: { doctorId?: number; feeIds: number[]; paymentMethod?: string; paymentDate?: string; notes?: string }) => {
    try {
      const res = await fetch('/api/doctor-fees/pay-batch', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memproses pencairan fee dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Berhasil mencairkan fee untuk ${result.count} pasien! Otomatis dicatat ke beban pengeluaran operasional.`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Sync Doctor Fees With Master Rules
  const syncDoctorFeesWithMaster = async (doctorId?: number | 'ALL') => {
    try {
      const res = await fetch('/api/doctor-fees/sync-master', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ doctorId: doctorId === 'ALL' ? undefined : doctorId }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal sinkronisasi fee dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Sinkronisasi fee dokter berhasil! ${result.updatedCount ?? 0} fee diperbarui sesuai data master.`, 'success');
      await refreshAllData();
      return { success: true, updatedCount: result.updatedCount };
    } catch (err: any) {
      showToast('Gagal sinkronisasi fee dokter: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Save Doctor Fee Settings (VIP, Reguler & Packages)
  const saveDoctorFeeSettings = async (doctorId: number, data: { regulerFee: number; vipFee: number; packageFees?: any[]; syncPendingFees?: boolean }) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/fee-settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menyimpan aturan fee dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast('Tarif fee dokter (VIP & Reguler) berhasil diperbarui dan disinkronkan', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Gagal menyimpan aturan fee dokter: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Fetch Doctor Method Fees
  const fetchDoctorMethodFees = async (doctorId?: number | 'ALL') => {
    try {
      const url = doctorId && doctorId !== 'ALL' 
        ? `/api/doctor-method-fees?doctorId=${doctorId}` 
        : '/api/doctor-method-fees';
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDoctorMethodFees(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching doctor method fees:', err);
      return [];
    }
  };

  // Batch Save Doctor Method Fee Rules
  const saveDoctorMethodFeesBatch = async (rules: Partial<DoctorMethodFeeRule>[], syncPendingFees: boolean = true) => {
    try {
      const res = await fetch('/api/doctor-method-fees/batch', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rules, syncPendingFees }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menyimpan perubahan tarif metode dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Tarif fee metode berhasil disimpan! (${result.savedCount} aturan diperbarui${result.syncedCount ? `, ${result.syncedCount} transaksi fee disinkronkan` : ''})`, 'success');
      await refreshAllData();
      return { success: true, savedCount: result.savedCount, syncedCount: result.syncedCount };
    } catch (err: any) {
      showToast('Gagal menyimpan aturan tarif metode: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Create Doctor Method Fee Rule
  const createDoctorMethodFeeRule = async (data: Partial<DoctorMethodFeeRule>) => {
    try {
      const res = await fetch('/api/doctor-method-fees', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan aturan fee metode', 'error');
        return { success: false, error: result.error };
      }
      showToast('Aturan fee metode berhasil ditambahkan', 'success');
      await refreshAllData();
      return { success: true, rule: result.rule };
    } catch (err: any) {
      showToast('Gagal menambahkan aturan: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Update Doctor Method Fee Rule
  const updateDoctorMethodFeeRule = async (id: number, data: Partial<DoctorMethodFeeRule>) => {
    try {
      const res = await fetch(`/api/doctor-method-fees/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah aturan fee metode', 'error');
        return { success: false, error: result.error };
      }
      showToast('Aturan fee metode berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true, rule: result.rule };
    } catch (err: any) {
      showToast('Gagal mengubah aturan: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Delete Doctor Method Fee Rule
  const deleteDoctorMethodFeeRule = async (id: number) => {
    try {
      const res = await fetch(`/api/doctor-method-fees/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus aturan fee metode', 'error');
        return { success: false, error: result.error };
      }
      showToast('Aturan fee metode berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Gagal menghapus aturan: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Sync Method Fees With Pending Procedure Fees
  const syncDoctorMethodFeesWithPending = async (doctorId?: number | 'ALL') => {
    try {
      const res = await fetch('/api/doctor-method-fees/sync-pending', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ doctorId: doctorId === 'ALL' ? undefined : doctorId }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal sinkronisasi fee metode', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Sinkronisasi tarif metode berhasil! ${result.updatedCount ?? 0} fee tindakan diperbarui.`, 'success');
      await refreshAllData();
      return { success: true, updatedCount: result.updatedCount };
    } catch (err: any) {
      showToast('Gagal sinkronisasi fee: ' + (err.message || String(err)), 'error');
      return { success: false, error: err.message };
    }
  };

  // Add Expense
  const addExpense = async (data: any) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mencatat pengeluaran', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Pengeluaran ${result.transactionNumber} berhasil disimpan`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Update Expense
  const updateExpense = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui pengeluaran', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Pengeluaran ${result.transactionNumber || ''} berhasil diperbarui`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Delete Expense
  const deleteExpense = async (id: number, reason?: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus pengeluaran', 'error');
        return { success: false, error: result.error };
      }
      showToast('Data pengeluaran operasional berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Update Package Prices
  const updatePackagePrices = async (packageId: number, prices: any[]) => {
    try {
      const res = await fetch(`/api/packages/${packageId}/prices`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ prices }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah tarif paket', 'error');
        return { success: false, error: result.error };
      }
      showToast('Tarif paket khitan berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Update Doctor Fee Rule
  const updateDoctorFeeRule = async (doctorId: number, rule: any) => {
    try {
      const res = await fetch(`/api/doctors/${doctorId}/fee-rules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rule),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah aturan fee', 'error');
        return { success: false, error: result.error };
      }
      showToast('Aturan fee dokter berhasil disimpan', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Master Data: Circumcision Methods
  const createCircumcisionMethod = async (data: any) => {
    try {
      const res = await fetch('/api/circumcision-methods', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan metode tindakan', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Metode "${result.name}" berhasil ditambahkan`, 'success');
      await refreshAllData();
      return { success: true, method: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateCircumcisionMethod = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/circumcision-methods/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui metode tindakan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Metode tindakan berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleCircumcisionMethodStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/circumcision-methods/${id}/toggle-status`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah status metode', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Status metode diubah: ${result.isActive ? 'Aktif' : 'Nonaktif'}`, 'info');
      await refreshAllData();
      return { success: true, isActive: result.isActive };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteCircumcisionMethod = async (id: number) => {
    try {
      const res = await fetch(`/api/circumcision-methods/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus metode tindakan', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || 'Metode tindakan berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Master Data: Doctors
  const createDoctor = async (data: any) => {
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Dokter ${result.title} ${result.name} (${result.code}) berhasil didaftarkan`, 'success');
      await refreshAllData();
      return { success: true, doctor: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateDoctor = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui data dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast('Data dokter berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleDoctorStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/doctors/${id}/toggle-status`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah status dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Status dokter diubah: ${result.isActive ? 'Aktif' : 'Nonaktif'}`, 'info');
      await refreshAllData();
      return { success: true, isActive: result.isActive };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDoctor = async (id: number) => {
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus data dokter', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || 'Data dokter berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Update Clinic Settings
  const updateClinicSettings = async (newSettings: Partial<ClinicSettings>) => {
    try {
      if (newSettings.logoUrl !== undefined && typeof window !== 'undefined') {
        if (newSettings.logoUrl) {
          localStorage.setItem('clinic_logo_url', newSettings.logoUrl);
        } else {
          localStorage.removeItem('clinic_logo_url');
        }
      }
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(newSettings),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui pengaturan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Pengaturan klinik berhasil disimpan', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Product & Stock Actions
  const createProduct = async (data: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan produk baru', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Produk ${result.name} (${result.sku}) berhasil didaftarkan`, 'success');
      await refreshAllData();
      return { success: true, product: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateProduct = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: data.branchCode || activeBranchCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui data produk', 'error');
        return { success: false, error: result.error };
      }
      showToast('Data master produk berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const adjustStock = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/products/${id}/adjust-stock`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, branchCode: activeBranchCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal melakukan mutasi stok', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Mutasi stok berhasil. Stok sekarang: ${result.newStock}`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const savePackageItem = async (data: any) => {
    try {
      const res = await fetch('/api/package-items', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengatur isi paket khitan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Konfigurasi isi paket khitan berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deletePackageItem = async (id: number) => {
    try {
      setPackageItems((prev) => prev.filter((i) => i.id !== id));
      const res = await fetch(`/api/package-items/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus aturan isi paket', 'error');
        await refreshAllData();
        return { success: false, error: result.error };
      }
      showToast('Aturan isi paket khitan berhasil dihapus', 'info');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      await refreshAllData();
      return { success: false, error: err.message };
    }
  };

  const getTransactionItems = async (bookingId: number): Promise<TransactionItem[]> => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items`, { headers: getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const addTransactionItem = async (bookingId: number, data: any) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan produk ke transaksi', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Produk ditambahkan. Total tagihan baru: Rp ${result.newBookingTotal?.toLocaleString('id-ID')}`, 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteTransactionItem = async (bookingId: number, itemId: number) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/items/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus produk dari transaksi', 'error');
        return { success: false, error: result.error };
      }
      showToast('Item berhasil dihapus dari transaksi', 'info');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePackageSelections = async (bookingId: number, data: { celanaProductIds?: number[]; obatProductId?: number; obatProductIds?: number[]; obatSelection?: { antiNyeriId?: number; antiBengkakId?: number; antiBiotikId?: number } }) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/package-selection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah pilihan paket khitan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Pilihan celana sunat & obat paket berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true, items: result.items };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const batchSetCelanaSizes = async (
    sizesInput:
      | { size: string; stock: number; minStock?: number; costPrice?: number; sellPrice?: number; notes?: string }[]
      | Record<string, number>
  ) => {
    try {
      let sizes: any[] = [];
      if (Array.isArray(sizesInput)) {
        sizes = sizesInput;
      } else if (typeof sizesInput === 'object' && sizesInput !== null) {
        sizes = Object.entries(sizesInput).map(([sz, stock]) => ({
          size: sz,
          stock: Number(stock) || 0,
        }));
      }

      const res = await fetch('/api/products/batch-celana-sizes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sizes, branchCode: activeBranchCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui stok ukuran celana', 'error');
        return { success: false, error: result.error };
      }
      showToast('Stok seluruh ukuran celana sunat (XS - XL) berhasil disimpan', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Employee Actions
  const createEmployee = async (data: any) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambah karyawan', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Karyawan ${result.name} (${result.employeeCode}) berhasil didaftarkan`, 'success');
      await refreshAllData();
      return { success: true, employee: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateEmployee = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengupdate data karyawan', 'error');
        return { success: false, error: result.error };
      }
      showToast('Data karyawan berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus karyawan/staf', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || 'Data staf/karyawan berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true, message: result.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleEmployeeStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/employees/${id}/toggle-status`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal mengubah status karyawan', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Status karyawan diubah: ${result.isActive ? 'Aktif' : 'Nonaktif'}`, 'info');
      await refreshAllData();
      return { success: true, isActive: result.isActive };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Payroll Actions
  const generatePayroll = async (param: string | { periodMonth: string; employeeId?: number | string; closingPatientCount?: number; closingFeePerPatient?: number; overtimeHours?: number; overtimeHourlyRate?: number; bonusAmount?: number; deductionAmount?: number; notes?: string; paymentMethod?: string }) => {
    try {
      const payload = typeof param === 'string' ? { periodMonth: param } : param;
      const res = await fetch('/api/payrolls/generate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghasilkan payroll', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || `Payroll periode ${payload.periodMonth} berhasil di-generate`, 'success');
      await refreshAllData();
      return { success: true, count: result.count, payroll: result.payrolls || result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePayroll = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/payrolls/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui slip gaji', 'error');
        return { success: false, error: result.error };
      }
      showToast('Slip gaji berhasil diperbarui!', 'success');
      await refreshAllData();
      return { success: true, payroll: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deletePayroll = async (id: number) => {
    try {
      const res = await fetch(`/api/payrolls/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus slip gaji', 'error');
        return { success: false, error: result.error };
      }
      showToast('Draft slip gaji berhasil dihapus', 'info');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const payPayroll = async (id: number, data?: any) => {
    try {
      const res = await fetch(`/api/payrolls/${id}/pay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data || {}),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menyelesaikan pembayaran gaji', 'error');
        return { success: false, error: result.error };
      }
      showToast('Gaji karyawan berhasil dibayarkan!', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // User Actions
  const createUser = async (data: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal membuat pengguna baru', 'error');
        return { success: false, error: result.error };
      }
      showToast(`User ${result.fullName || result.username || result.email} (${result.role}) berhasil ditambahkan`, 'success');
      await refreshAllData();
      return { success: true, user: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (id: number, data: any) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui pengguna', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || 'Data akun pengguna berhasil diperbarui', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus akun pengguna', 'error');
        return { success: false, error: result.error };
      }
      showToast(result.message || 'Akun pengguna berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const fetchAuditLogs = async (entity?: string): Promise<AuditLog[]> => {
    try {
      const url = entity ? `/api/audit-logs?entity=${encodeURIComponent(entity)}` : '/api/audit-logs';
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) return [];
      const logs = await res.json();
      if (Array.isArray(logs)) setAuditLogs(logs);
      return logs;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Branch Management Actions
  const createBranch = async (data: Partial<Branch>) => {
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menambahkan cabang', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Cabang ${result.name} (${result.code}) berhasil ditambahkan`, 'success');
      await refreshAllData();
      return { success: true, branch: result };
    } catch (err: any) {
      showToast('Terjadi kesalahan koneksi server', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateBranch = async (id: number, data: Partial<Branch>) => {
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal memperbarui data cabang', 'error');
        return { success: false, error: result.error };
      }
      showToast(`Data cabang ${result.name} berhasil diperbarui`, 'success');
      await refreshAllData();
      return { success: true, branch: result };
    } catch (err: any) {
      showToast('Terjadi kesalahan koneksi server', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteBranch = async (id: number, force: boolean = false) => {
    try {
      const url = `/api/branches/${id}${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ force }),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || 'Gagal menghapus cabang', 'error');
        return { success: false, error: result.error, hasLinkedData: result.hasLinkedData };
      }
      showToast(result.message || 'Cabang berhasil dihapus', 'success');
      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      showToast('Terjadi kesalahan koneksi server', 'error');
      return { success: false, error: err.message };
    }
  };

  const toggleBranchStatus = async (id: number) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return { success: false, error: 'Cabang tidak ditemukan' };
    const nextStatus = !branch.isActive;
    return updateBranch(id, { isActive: nextStatus });
  };

  return (
    <ClinicContext.Provider
      value={{
        currentUser,
        switchRoleQuick,
        login,
        logout,
        branches,
        activeBranchCode,
        setActiveBranchCode,
        patients,
        guardians,
        categories,
        packages,
        circumcisionMethods,
        doctors,
        bookings,
        queues,
        procedures,
        invoices,
        doctorFees,
        doctorMethodFees,
        expenses,
        expenseCategories,
        dashboardData,
        settings,
        products,
        packageItems,
        inventorySummary,
        employees,
        employeeFees,
        payrolls,
        usersList,
        auditLogs,
        isLoading,
        refreshAllData,
        getHeaders,
        registerPatient,
        updatePatient,
        deletePatient,
        restorePatient,
        createBooking,
        updateBooking,
        checkInBooking,
        updateProcedure,
        completeProcedure,
        payInvoice,
        cancelInvoice,
        voidInvoice,
        createDoctorFee,
        updateDoctorFee,
        deleteDoctorFee,
        updateDoctorFeeStatus,
        payDoctorFeesBatch,
        syncDoctorFeesWithMaster,
        saveDoctorFeeSettings,
        fetchDoctorMethodFees,
        saveDoctorMethodFeesBatch,
        createDoctorMethodFeeRule,
        updateDoctorMethodFeeRule,
        deleteDoctorMethodFeeRule,
        syncDoctorMethodFeesWithPending,
        addExpense,
        updateExpense,
        deleteExpense,
        updatePackagePrices,
        updateDoctorFeeRule,
        updateClinicSettings,
        createProduct,
        updateProduct,
        adjustStock,
        savePackageItem,
        deletePackageItem,
        getTransactionItems,
        addTransactionItem,
        deleteTransactionItem,
        updatePackageSelections,
        batchSetCelanaSizes,
        createCircumcisionMethod,
        updateCircumcisionMethod,
        toggleCircumcisionMethodStatus,
        deleteCircumcisionMethod,
        createDoctor,
        updateDoctor,
        toggleDoctorStatus,
        deleteDoctor,
        createEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        deleteEmployee,
        generatePayroll,
        updatePayroll,
        deletePayroll,
        payPayroll,
        createUser,
        updateUser,
        deleteUser,
        createBranch,
        updateBranch,
        deleteBranch,
        toggleBranchStatus,
        fetchAuditLogs,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
