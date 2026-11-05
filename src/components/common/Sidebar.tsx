import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  DollarSign,
  TrendingDown,
  FileBarChart,
  Database,
  Settings,
  ChevronRight,
  Sparkles,
  Award,
  Package,
  ShoppingBag,
  Briefcase,
  CreditCard,
  UserCog,
  History,
  ShieldCheck,
  LogOut,
  Building2,
} from 'lucide-react';
import { UserRole } from '../../types';
import { NanoAppIcon } from './PrintIcons';
import { hasMenuPermission } from '../../utils/permissionUtils';

interface SidebarProps {
  activeMenu: string;
  onSelectMenu: (menuId: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badgeCountKey?: 'procedures' | 'unpaid';
  category: 'Utama' | 'Pelayanan Khitan' | 'Keuangan' | 'SDM' | 'Pengaturan & Audit';
}

const categoryThemes = {
  Utama: {
    label: 'MENU UTAMA',
    badgeClass: 'text-orange-950 bg-orange-100/80 border-orange-200',
    dotClass: 'bg-orange-500',
    inactiveIconBg: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700',
    inactiveHover: 'hover:bg-orange-50/70 text-slate-700 hover:text-orange-950',
    activeContainer: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold shadow-xs shadow-orange-500/25 border-l-4 border-orange-700',
    activeIconBg: 'bg-white/20 text-white',
  },
  'Pelayanan Khitan': {
    label: 'PELAYANAN KHITAN',
    badgeClass: 'text-purple-950 bg-purple-100/80 border-purple-200',
    dotClass: 'bg-purple-600',
    inactiveIconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700',
    inactiveHover: 'hover:bg-purple-50/70 text-slate-700 hover:text-purple-950',
    activeContainer: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-bold shadow-xs shadow-purple-600/25 border-l-4 border-purple-800',
    activeIconBg: 'bg-white/20 text-white',
  },
  Keuangan: {
    label: 'KEUANGAN & KASIR',
    badgeClass: 'text-amber-950 bg-amber-100/80 border-amber-200',
    dotClass: 'bg-amber-500',
    inactiveIconBg: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100 group-hover:text-amber-800',
    inactiveHover: 'hover:bg-amber-50/70 text-slate-700 hover:text-amber-950',
    activeContainer: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold shadow-xs shadow-amber-500/25 border-l-4 border-amber-700',
    activeIconBg: 'bg-white/20 text-white',
  },
  SDM: {
    label: 'SDM & PAYROLL',
    badgeClass: 'text-rose-950 bg-rose-100/80 border-rose-200',
    dotClass: 'bg-rose-500',
    inactiveIconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100 group-hover:text-rose-700',
    inactiveHover: 'hover:bg-rose-50/70 text-slate-700 hover:text-rose-950',
    activeContainer: 'bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-bold shadow-xs shadow-rose-500/25 border-l-4 border-rose-700',
    activeIconBg: 'bg-white/20 text-white',
  },
  'Pengaturan & Audit': {
    label: 'PENGATURAN & AUDIT',
    badgeClass: 'text-indigo-950 bg-indigo-100/80 border-indigo-200',
    dotClass: 'bg-indigo-600',
    inactiveIconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700',
    inactiveHover: 'hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-950',
    activeContainer: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-bold shadow-xs shadow-indigo-600/25 border-l-4 border-indigo-800',
    activeIconBg: 'bg-white/20 text-white',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpen,
  onCloseMobile,
}) => {
  const { currentUser, logout, procedures, invoices, activeBranchCode, branches } = useClinic();
  const role = currentUser?.role || 'admin';

  // Dynamic badges
  const pendingProcedures = procedures.filter(p => p.status !== 'COMPLETED').length;
  const unpaidInvoices = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').length;

  const menuItems: MenuItem[] = [
    // 1. Utama
    {
      id: 'dashboard',
      label: 'Dashboard Khitan',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'owner', 'staff', 'doctor'],
      category: 'Utama',
    },

    // 2. Pelayanan Khitan (Data Pasien, Booking Jadwal, dan Tindakan)
    {
      id: 'patients',
      label: 'Data Pasien',
      icon: Users,
      allowedRoles: ['admin', 'owner', 'staff', 'doctor'],
      category: 'Pelayanan Khitan',
    },
    {
      id: 'bookings',
      label: 'Booking Jadwal',
      icon: Calendar,
      allowedRoles: ['admin', 'owner', 'staff', 'doctor'],
      category: 'Pelayanan Khitan',
    },
    {
      id: 'procedures',
      label: 'Ruang Tindakan',
      icon: Stethoscope,
      allowedRoles: ['admin', 'owner', 'doctor', 'staff'],
      badgeCountKey: 'procedures',
      category: 'Pelayanan Khitan',
    },

    // 3. Keuangan (Kasir, invoice, fee dokter, laporan produk, laba rugi, stok barang, beban operasional, laporan keuangan)
    {
      id: 'cashier',
      label: 'Kasir & Invoice',
      icon: Receipt,
      allowedRoles: ['admin', 'owner', 'staff'],
      badgeCountKey: 'unpaid',
      category: 'Keuangan',
    },
    {
      id: 'doctor-fees',
      label: 'Fee Dokter',
      icon: DollarSign,
      allowedRoles: ['admin', 'owner', 'doctor'],
      category: 'Keuangan',
    },
    {
      id: 'expenses',
      label: 'Beban Operasional',
      icon: TrendingDown,
      allowedRoles: ['admin', 'owner'],
      category: 'Keuangan',
    },
    {
      id: 'products',
      label: 'Stok Barang & Alkes',
      icon: Package,
      allowedRoles: ['admin', 'owner', 'staff'],
      category: 'Keuangan',
    },
    {
      id: 'product-reports',
      label: 'Laporan Pengeluaran Stok',
      icon: ShoppingBag,
      allowedRoles: ['admin', 'owner', 'staff'],
      category: 'Keuangan',
    },
    {
      id: 'reports',
      label: 'Laba Rugi & Laporan Keuangan',
      icon: FileBarChart,
      allowedRoles: ['admin', 'owner'],
      category: 'Keuangan',
    },

    // 4. SDM (Data karyawan, dokter karyawan, payroll)
    {
      id: 'employees',
      label: 'Data Karyawan',
      icon: Briefcase,
      allowedRoles: ['admin', 'owner'],
      category: 'SDM',
    },
    {
      id: 'master-staff',
      label: 'Dokter & Karyawan',
      icon: Users,
      allowedRoles: ['admin', 'owner'],
      category: 'SDM',
    },
    {
      id: 'payroll',
      label: 'Penggajian & Komisi',
      icon: CreditCard,
      allowedRoles: ['admin', 'owner'],
      category: 'SDM',
    },

    // 5. Pengaturan dan Audit (Sisanya masukkan pada pengaturan dan audit)
    {
      id: 'master-methods',
      label: 'Metode & Tarif Khitan',
      icon: Stethoscope,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
    {
      id: 'master',
      label: 'Master Konfigurasi',
      icon: Database,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      icon: UserCog,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
    {
      id: 'audit-log',
      label: 'Audit Trail & Log',
      icon: History,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
    {
      id: 'settings',
      label: 'Pengaturan Klinik & DB',
      icon: Settings,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
    {
      id: 'branches',
      label: 'Pengaturan Cabang',
      icon: Building2,
      allowedRoles: ['admin', 'owner'],
      category: 'Pengaturan & Audit',
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => hasMenuPermission(currentUser, item.id));

  const categories = ['Utama', 'Pelayanan Khitan', 'Keuangan', 'SDM', 'Pengaturan & Audit'] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Modern, Clean & Elegant Sidebar */}
      <aside
        className={`fixed top-0 lg:top-16 bottom-0 left-0 z-40 lg:z-20 w-64 bg-white border-r border-slate-200/80 text-slate-700 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print shadow-sm overflow-hidden`}
      >
        {/* Top Gradient Accent Strip (Orange, Ungu, Merah, Kuning) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-purple-600 via-rose-500 to-amber-400 shrink-0" />

        {/* Mobile Header */}
        <div className="h-16 lg:hidden flex items-center px-4 border-b border-slate-100 shrink-0 justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <NanoAppIcon size={30} className="shrink-0" />
            <div>
              <span className="font-bold tracking-tight text-slate-900 text-xs block leading-none">
                NANO CIRCUMCISION
              </span>
              <span className="text-[10px] text-orange-700 font-bold tracking-wider mt-0.5 block">
                KLINIK KHITAN
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Active Branch Context Banner */}
        <div className="mx-3 mt-3 mb-1.5 p-3 rounded-2xl bg-gradient-to-br from-orange-50/90 via-purple-50/40 to-amber-50/70 border border-orange-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] font-black text-orange-950 uppercase tracking-wider leading-none">Cabang Aktif</div>
              <div className="text-xs font-black text-slate-800 truncate leading-tight mt-0.5">
                {branches?.find(b => b.code.toUpperCase() === (activeBranchCode || 'PUSAT').toUpperCase())?.name.replace('Klinik Khitan ', '') || (activeBranchCode === 'PUSAT' ? 'Klinik Pusat' : activeBranchCode)}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-2xs shrink-0 font-mono">
            {activeBranchCode || 'PUSAT'}
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2 space-y-4">
          {categories.map((cat) => {
            const itemsInCat = visibleMenuItems.filter((m) => m.category === cat);
            if (itemsInCat.length === 0) return null;
            const theme = categoryThemes[cat];

            return (
              <div key={cat} className="space-y-1">
                {/* Category Header with distinct color pill */}
                <div className="px-2 pb-1 pt-1 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dotClass}`} />
                  <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md border ${theme.badgeClass}`}>
                    {theme.label}
                  </span>
                </div>

                {itemsInCat.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;

                  let badgeCount = 0;
                  if (item.badgeCountKey === 'procedures') badgeCount = pendingProcedures;
                  if (item.badgeCountKey === 'unpaid') badgeCount = unpaidInvoices;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMenu(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? theme.activeContainer
                          : `${theme.inactiveHover} font-semibold`
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          isActive ? theme.activeIconBg : theme.inactiveIconBg
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className={`truncate text-xs ${isActive ? 'text-white font-bold' : ''}`}>
                          {item.label}
                        </span>
                      </div>

                      {badgeCount > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            isActive
                              ? 'bg-white text-rose-700 shadow-2xs'
                              : item.badgeCountKey === 'procedures'
                              ? 'bg-rose-500 text-white shadow-2xs'
                              : 'bg-amber-500 text-white shadow-2xs'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-200/80 shrink-0 bg-gradient-to-r from-orange-50/40 via-purple-50/30 to-amber-50/40">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ring-2 ring-white">
                {currentUser?.fullName?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.fullName || currentUser?.name || 'User'}
                </div>
                <div className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-purple-600 uppercase tracking-wider">
                  {currentUser?.role || 'Staff'}
                </div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" title="Online" />
          </div>

          <button
            onClick={() => {
              logout();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
};
