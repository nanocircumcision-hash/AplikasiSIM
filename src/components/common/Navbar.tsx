import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  LogOut,
  Calendar,
  Stethoscope,
  Menu,
  Plus,
  UserPlus,
  Search,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Database,
  Building2,
  Lock,
  Settings,
} from 'lucide-react';
import { UserRole } from '../../types';
import { NanoAppIcon } from './PrintIcons';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate: (menu: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const { 
    currentUser, 
    logout, 
    settings, 
    patients,
    branches,
    activeBranchCode,
    setActiveBranchCode,
    showToast
  } = useClinic();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const isSuperUser = currentUser?.role === 'owner' || currentUser?.role === 'admin' || (currentUser as any)?.branchCode === 'ALL';

  const availableBranches = branches && branches.length > 0 ? branches : [
    { id: 1, code: 'PUSAT', name: 'Klinik Khitan Pusat', isActive: true },
    { id: 2, code: 'CABANG-01', name: 'Klinik Khitan Cabang Surabaya', isActive: true },
    { id: 3, code: 'CABANG-02', name: 'Klinik Khitan Cabang Sidoarjo', isActive: true },
  ];

  const currentBranch = availableBranches.find(b => b.code.toUpperCase() === (activeBranchCode || 'PUSAT').toUpperCase()) || {
    id: 0,
    code: activeBranchCode || 'PUSAT',
    name: activeBranchCode === 'PUSAT' ? 'Klinik Khitan Pusat' : (activeBranchCode || 'PUSAT'),
    isActive: true
  };
  const [systemStatus, setSystemStatus] = useState<{
    status?: string;
    isTotalOffline?: boolean;
    host?: string;
    database?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/system-status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(() => {
        setSystemStatus({
          status: 'connected',
          isTotalOffline: true,
          host: 'localhost',
          database: 'nano_clinic',
          message: 'Aplikasi berjalan 100% OFFLINE di komputer lokal Anda.',
        });
      });
  }, []);

  const roleLabels: Record<UserRole, { label: string; roleSubtitle: string }> = {
    super_admin: { label: 'Super Admin', roleSubtitle: 'Super Administrator • Full Access' },
    admin: { label: 'Administrator', roleSubtitle: 'Admin Operasional' },
    owner: { label: 'Direktur Utama', roleSubtitle: 'Clinic Owner & Director' },
    doctor: { label: 'Dokter Operator', roleSubtitle: 'Medical Doctor Specialist' },
    staff: { label: 'Staff / Pegawai', roleSubtitle: 'Front Office & Clinical Care' },
  };

  const isOffline = systemStatus?.isTotalOffline ?? (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  // Quick filtered patients for global search
  const filteredPatients = searchQuery.trim() ? patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.rmNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between no-print shrink-0">
      {/* Left: Mobile Menu & Clinic Brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center">
            <NanoAppIcon size={28} className="shrink-0" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
              {settings.clinicName || 'Nano Circumcision'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {isOffline ? 'Offline Local PostgreSQL' : 'Sistem Manajemen Khitan'}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Search Bar */}
      <div className="relative hidden md:block w-72 lg:w-96">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border transition-all ${
          isSearchFocused ? 'bg-white border-orange-500 ring-2 ring-orange-100' : 'border-slate-200/80 hover:border-slate-300'
        }`}>
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari nama pasien, No. RM, atau wali..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {!searchQuery && (
            <kbd className="hidden lg:inline-block text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded">
              /
            </kbd>
          )}
        </div>

        {/* Live Search Quick Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50">
            <div className="text-[10px] font-semibold uppercase text-slate-400 px-3 py-1 tracking-wider">Hasil Pencarian Pasien</div>
            {filteredPatients.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium">Pasien tidak ditemukan</div>
            ) : (
              filteredPatients.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => {
                    onNavigate('patients');
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-orange-50/60 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">{pt.fullName}</div>
                    <div className="text-[10px] text-slate-400">{pt.rmNumber}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Buka Pasien →
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Branch Selector, Actions, Messages, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Branch Selector & Indicator */}
        <div className="relative">
          {isSuperUser ? (
            <div>
              <button
                onClick={() => setShowBranchMenu(!showBranchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-800 transition-all cursor-pointer shadow-2xs"
                title="Pilih cabang operasional"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="text-left hidden sm:block">
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Cabang</div>
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentBranch.name.replace('Klinik Khitan ', '')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showBranchMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowBranchMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Wilayah Cabang Klinik
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Data pasien, jadwal antrean, dan kasir terisolasi per cabang.
                      </p>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {availableBranches.map((b) => {
                        const isSelected = b.code.toUpperCase() === (activeBranchCode || 'PUSAT').toUpperCase();
                        return (
                          <button
                            key={b.code}
                            onClick={() => {
                              setActiveBranchCode(b.code);
                              setShowBranchMenu(false);
                              showToast(`Beralih ke cabang: ${b.name} (${b.code})`, 'info');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                              isSelected 
                                ? 'bg-sky-50 text-sky-950 font-bold border border-sky-100' 
                                : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                              <div>
                                <div className="text-xs font-bold leading-snug">{b.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{b.code}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-1.5 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => {
                          setShowBranchMenu(false);
                          onNavigate('branches');
                        }}
                        className="w-full text-center py-2 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-sky-700 hover:text-sky-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Kelola & Pengaturan Cabang →</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"
              title="Akses akun terikat pada cabang ini"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="text-left hidden sm:block">
                <div className="text-[9px] font-semibold text-slate-400 uppercase leading-none">Cabang</div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentBranch.name.replace('Klinik Khitan ', '')}
                </div>
              </div>
            </div>
          )}
        </div>

        {currentUser?.role !== 'doctor' && (
          <button
            onClick={() => onNavigate('register-patient')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 hover:from-orange-600 hover:via-rose-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shadow-orange-500/20 active:scale-95"
            title="Daftarkan Pasien Khitan Baru ke Sistem"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Daftar Pasien Baru</span>
          </button>
        )}

        {/* User Profile Chip (Harmonious Role Colors: Purple for Admin, Rose/Red for Doctor, Amber for Staff) */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
              currentUser?.role === 'owner' || currentUser?.role === 'admin'
                ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white ring-2 ring-purple-100'
                : currentUser?.role === 'doctor'
                ? 'bg-gradient-to-tr from-rose-600 to-red-600 text-white ring-2 ring-rose-100'
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white ring-2 ring-amber-100'
            }`}>
              {currentUser?.fullName
                ?.split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'NC'}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-1 max-w-[130px] lg:max-w-[170px]">
                {currentUser?.fullName || 'Pengguna'}
              </p>
              <div className="mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                  currentUser?.role === 'owner' || currentUser?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : currentUser?.role === 'doctor'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {roleLabels[currentUser?.role || 'admin']?.label || 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center ml-0.5"
            title="Keluar dari Akun (Logout)"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

