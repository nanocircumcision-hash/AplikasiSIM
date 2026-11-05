import React, { useState, useEffect } from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';
import { CircumcisionDashboard } from './components/dashboard/CircumcisionDashboard';
import { CircumcisionPatientList } from './components/patients/CircumcisionPatientList';
import { CircumcisionBookingView } from './components/bookings/CircumcisionBookingView';
import { CircumcisionProcedureView } from './components/procedures/CircumcisionProcedureView';
import { CircumcisionCashierView } from './components/cashier/CircumcisionCashierView';
import { DoctorFeeView } from './components/doctor-fees/DoctorFeeView';
import { ExpenseListView } from './components/expenses/ExpenseListView';
import { FinancialReportView } from './components/reports/FinancialReportView';
import { CircumcisionMasterView } from './components/master/CircumcisionMasterView';
import { ClinicSettingsView } from './components/settings/ClinicSettingsView';
import { ProductStockView } from './components/products/ProductStockView';
import { ProductReportView } from './components/products/ProductReportView';
import { EmployeeListView } from './components/employees/EmployeeListView';
import { PayrollView } from './components/payroll/PayrollView';
import { UserManagementView } from './components/users/UserManagementView';
import { AuditLogView } from './components/audit/AuditLogView';
import { BranchManagementView } from './components/branches/BranchManagementView';
import { hasMenuPermission, getUserEffectivePermissions } from './utils/permissionUtils';

const MainLayout: React.FC = () => {
  const { currentUser, isLoading } = useClinic();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [cashierTargetInvoiceId, setCashierTargetInvoiceId] = useState<number | null>(null);
  const [cashierAutoOpenPayment, setCashierAutoOpenPayment] = useState<boolean>(false);
  const [autoOpenPatientRegister, setAutoOpenPatientRegister] = useState<boolean>(false);

  // Pastikan tampilan aktif sesuai dengan hak akses peran dan izin pengguna
  useEffect(() => {
    if (!currentUser) return;
    
    // Check if activeView is permitted
    if (!hasMenuPermission(currentUser, activeView)) {
      const allowed = getUserEffectivePermissions(currentUser);
      const fallback = allowed.includes('dashboard') ? 'dashboard' : (allowed[0] || 'dashboard');
      setActiveView(fallback);
    }
  }, [currentUser, activeView]);

  // Tampilan pertama saat buka aplikasi adalah halaman login
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const handleNavigate = (menu: string) => {
    if (menu === 'register-patient' || menu === 'patients-register') {
      setActiveView('patients');
      setAutoOpenPatientRegister(true);
      return;
    }
    setActiveView(menu);
  };

  const handleNavigateToCashier = (invoiceId?: number, autoOpenPayment: boolean = true) => {
    setCashierTargetInvoiceId(invoiceId || null);
    setCashierAutoOpenPayment(autoOpenPayment);
    setActiveView('cashier');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <CircumcisionDashboard onNavigate={handleNavigate} />;
      case 'patients':
        return (
          <CircumcisionPatientList
            initialOpenRegisterModal={autoOpenPatientRegister}
            onClearInitialRegisterModal={() => setAutoOpenPatientRegister(false)}
          />
        );
      case 'bookings':
        return <CircumcisionBookingView />;
      case 'procedures':
        return <CircumcisionProcedureView onNavigateToCashier={handleNavigateToCashier} />;
      case 'cashier':
        return (
          <CircumcisionCashierView
            initialInvoiceId={cashierTargetInvoiceId}
            autoOpenPayment={cashierAutoOpenPayment}
            onClearInitial={() => {
              setCashierTargetInvoiceId(null);
              setCashierAutoOpenPayment(false);
            }}
          />
        );
      case 'doctor-fees':
        return <DoctorFeeView />;
      case 'expenses':
        return <ExpenseListView />;
      case 'reports':
        return <FinancialReportView />;
      case 'products':
        return <ProductStockView onNavigate={(v) => handleNavigate(v)} />;
      case 'product-reports':
      case 'product_reports':
        return <ProductReportView onNavigate={(v) => handleNavigate(v)} />;
      case 'employees':
        return <EmployeeListView />;
      case 'payroll':
        return <PayrollView />;
      case 'users':
        return <UserManagementView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'master-methods':
        return <CircumcisionMasterView initialTab="methods" />;
      case 'master-staff':
        return <CircumcisionMasterView initialTab="staff" />;
      case 'master':
        return <CircumcisionMasterView initialTab="packages" />;
      case 'settings':
        return <ClinicSettingsView />;
      case 'branches':
        return <BranchManagementView />;
      default:
        return <CircumcisionDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop & Mobile */}
        <Sidebar
          activeMenu={activeView}
          onSelectMenu={handleNavigate}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
          {isLoading && (
            <div className="h-0.5 w-full bg-sky-100 overflow-hidden shrink-0">
              <div className="h-full bg-sky-600 animate-pulse w-2/3" />
            </div>
          )}
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-6 w-full max-w-[1600px] mx-auto">
            {renderActiveView()}
          </main>

          {/* Theme Signature Status Footer */}
          <footer className="h-8 bg-white border-t border-slate-200/80 px-6 sm:px-8 flex items-center justify-between no-print shrink-0 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span>Database:</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                PostgreSQL Connected
              </span>
            </div>
            <div className="font-medium text-slate-400 hidden sm:block">
              Nano Circumcision • Clinic Management System
            </div>
          </footer>
        </div>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <MainLayout />
    </ClinicProvider>
  );
}
