import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Building2, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, 
  MapPin, Phone, UserCheck, ShieldCheck, AlertTriangle, ArrowRightLeft,
  Filter, Building, Power, Copy, Check, Info, Sparkles
} from 'lucide-react';
import { Branch } from '../../types';

export const BranchManagementView: React.FC = () => {
  const { 
    branches, 
    activeBranchCode, 
    setActiveBranchCode, 
    createBranch, 
    updateBranch, 
    deleteBranch, 
    toggleBranchStatus, 
    currentUser,
    patients,
    bookings,
    invoices,
    usersList,
    showToast 
  } = useClinic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    managerName: '',
    isActive: true,
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const isSuperUser = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  // Count operational records linked to a branch
  const getBranchStats = (branchCode: string) => {
    const codeUpper = (branchCode || '').toUpperCase();
    const totalPatients = patients.filter(p => (p.branchCode || 'PUSAT').toUpperCase() === codeUpper).length;
    const totalBookings = bookings.filter(b => (b.branchCode || 'PUSAT').toUpperCase() === codeUpper).length;
    const totalInvoices = invoices.filter(i => (i.branchCode || 'PUSAT').toUpperCase() === codeUpper).length;
    const totalUsers = usersList.filter(u => (u.branchCode || 'PUSAT').toUpperCase() === codeUpper).length;
    return { totalPatients, totalBookings, totalInvoices, totalUsers };
  };

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && b.isActive) ||
        (statusFilter === 'INACTIVE' && !b.isActive);

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.managerName && b.managerName.toLowerCase().includes(q)) ||
        (b.phone && b.phone.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [branches, statusFilter, searchTerm]);

  // Summary counts
  const totalCount = branches.length;
  const activeCount = branches.filter(b => b.isActive).length;
  const inactiveCount = totalCount - activeCount;

  // Handlers
  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      code: `CABANG-0${totalCount}`,
      name: '',
      address: '',
      phone: '',
      managerName: '',
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setFormData({
      code: b.code,
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      managerName: b.managerName || '',
      isActive: b.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Kode cabang dan nama cabang wajib diisi', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBranch) {
        const payload: Partial<Branch> = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          managerName: formData.managerName.trim(),
          isActive: formData.isActive,
        };
        // Only update code if not PUSAT
        if (editingBranch.code.toUpperCase() !== 'PUSAT') {
          payload.code = formData.code.trim().toUpperCase();
        }

        const res = await updateBranch(editingBranch.id, payload);
        if (res.success) {
          setIsFormModalOpen(false);
        }
      } else {
        const res = await createBranch({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim(),
          managerName: formData.managerName.trim(),
          isActive: formData.isActive,
        });
        if (res.success) {
          setIsFormModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (b: Branch) => {
    if (b.code.toUpperCase() === 'PUSAT' && b.isActive) {
      showToast('Cabang Utama (PUSAT) tidak dapat dinonaktifkan demi stabilitas sistem klinik.', 'error');
      return;
    }
    await toggleBranchStatus(b.id);
  };

  const handleOpenDelete = (b: Branch) => {
    if (b.code.toUpperCase() === 'PUSAT') {
      showToast('Cabang Utama (PUSAT) adalah referensi inti dan tidak boleh dihapus.', 'error');
      return;
    }
    setBranchToDelete(b);
    setDeleteConfirmationText('');
    setForceDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteBranch(branchToDelete.id, forceDelete);
      if (res.success) {
        setBranchToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyPhone = (phoneStr: string, id: number) => {
    if (!phoneStr) return;
    navigator.clipboard.writeText(phoneStr);
    setCopiedId(id);
    showToast('Nomor telepon disalin ke clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSwitchActiveBranch = (b: Branch) => {
    if (!b.isActive) {
      showToast(`Cabang ${b.name} sedang berstatus non-aktif. Aktifkan terlebih dahulu untuk mengakses operasionalnya.`, 'error');
      return;
    }
    setActiveBranchCode(b.code);
    showToast(`Beralih aktif ke ${b.name} (${b.code})`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Pengaturan & Master Cabang Klinik
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Multi-Branch
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola daftar cabang klinik Nano Circumcision, nomor kontak, penanggung jawab, serta isolasi data pasien dan kasir per cabang.
            </p>
          </div>
        </div>

        {isSuperUser && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Cabang Baru</span>
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Cabang</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh unit kerja</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Cabang Aktif</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
            <p className="text-[11px] text-emerald-500 mt-0.5">Melayani pasien</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Non-Aktif / Tutup</p>
            <p className="text-2xl font-black text-slate-500 mt-1">{inactiveCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Arsip riwayat tetap ada</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Cabang Anda Saat Ini</p>
            <p className="text-base font-black text-indigo-950 mt-1 truncate max-w-[150px]">
              {branches.find(b => b.code.toUpperCase() === (activeBranchCode || 'PUSAT').toUpperCase())?.name.replace('Klinik Khitan ', '') || activeBranchCode}
            </p>
            <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-black bg-indigo-600 text-white font-mono">
              {activeBranchCode || 'PUSAT'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode cabang, nama, alamat, manajer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-emerald-700'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-white text-slate-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Non-Aktif ({inactiveCount})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Tampilan Kartu"
            >
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <span className="bg-current rounded-2xs" />
                <span className="bg-current rounded-2xs" />
                <span className="bg-current rounded-2xs" />
                <span className="bg-current rounded-2xs" />
              </div>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Tampilan Tabel"
            >
              <div className="flex flex-col justify-between w-3.5 h-3.5">
                <span className="h-0.5 bg-current rounded-full" />
                <span className="h-0.5 bg-current rounded-full" />
                <span className="h-0.5 bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Card Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 font-medium">
              Tidak ada data cabang yang sesuai dengan pencarian atau filter.
            </div>
          ) : (
            filteredBranches.map((b) => {
              const isPusat = b.code.toUpperCase() === 'PUSAT';
              const isCurrentSession = (activeBranchCode || 'PUSAT').toUpperCase() === b.code.toUpperCase();
              const stats = getBranchStats(b.code);

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    isCurrentSession 
                      ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm' 
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header Strip */}
                  <div className={`p-4 border-b ${
                    isPusat 
                      ? 'bg-gradient-to-r from-sky-50/90 to-indigo-50/60 border-sky-100' 
                      : isCurrentSession 
                      ? 'bg-indigo-50/40 border-indigo-100' 
                      : 'bg-slate-50/60 border-slate-100'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          isPusat 
                            ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white' 
                            : b.isActive 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-300 text-slate-600'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                              {b.code}
                            </span>
                            {isPusat && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs">
                                KANTOR PUSAT
                              </span>
                            )}
                            {isCurrentSession && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                                Sesi Aktif Anda
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug mt-1">
                            {b.name}
                          </h3>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <button
                        onClick={() => handleToggle(b)}
                        disabled={!isSuperUser}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                          b.isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Klik untuk mengubah status aktif/non-aktif cabang"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{b.isActive ? 'AKTIF' : 'NON-AKTIF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-4 space-y-3 flex-1 text-xs">
                    {/* Manager / Kepala Cabang */}
                    <div className="flex items-start gap-2 text-slate-600">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kepala Cabang / Manajer</span>
                        <span className="font-bold text-slate-800">
                          {b.managerName || '- Belum ditentukan -'}
                        </span>
                      </div>
                    </div>

                    {/* Alamat */}
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Unit</span>
                        <span className="text-slate-700 font-medium line-clamp-2 leading-relaxed">
                          {b.address || '- Belum ada data alamat -'}
                        </span>
                      </div>
                    </div>

                    {/* Kontak Telepon */}
                    <div className="flex items-center justify-between gap-2 text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontak Telepon</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {b.phone || '-'}
                          </span>
                        </div>
                      </div>
                      {b.phone && (
                        <button
                          onClick={() => handleCopyPhone(b.phone || '', b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Salin Nomor Telepon"
                        >
                          {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Integrated Operational Stats Pill */}
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-4 gap-1 text-center bg-slate-50/70 p-2 rounded-xl">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Pasien</span>
                        <span className="font-black text-slate-800 text-xs">{stats.totalPatients}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Booking</span>
                        <span className="font-black text-slate-800 text-xs">{stats.totalBookings}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Invoice</span>
                        <span className="font-black text-slate-800 text-xs">{stats.totalInvoices}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">User</span>
                        <span className="font-black text-slate-800 text-xs">{stats.totalUsers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
                    {/* Quick Switch Button */}
                    <button
                      onClick={() => handleSwitchActiveBranch(b)}
                      disabled={isCurrentSession || !b.isActive}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrentSession 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default' 
                          : b.isActive 
                          ? 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 shadow-2xs' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      {isCurrentSession ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cabang Aktif</span>
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                          <span>Beralih ke Sini</span>
                        </>
                      )}
                    </button>

                    {/* Edit & Delete Action Buttons */}
                    {isSuperUser && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-200 transition-all cursor-pointer shadow-2xs"
                          title="Edit Data Cabang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenDelete(b)}
                          disabled={isPusat}
                          className={`p-1.5 rounded-xl border transition-all ${
                            isPusat 
                              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                              : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs'
                          }`}
                          title={isPusat ? 'Cabang Utama (PUSAT) tidak dapat dihapus' : 'Hapus Cabang'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table Detail View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Cabang</th>
                  <th className="py-3 px-4">Kepala Cabang</th>
                  <th className="py-3 px-4">Kontak & Alamat</th>
                  <th className="py-3 px-4 text-center">Data Terkait</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada cabang yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((b) => {
                    const isPusat = b.code.toUpperCase() === 'PUSAT';
                    const isCurrentSession = (activeBranchCode || 'PUSAT').toUpperCase() === b.code.toUpperCase();
                    const stats = getBranchStats(b.code);

                    return (
                      <tr 
                        key={b.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCurrentSession ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {b.code}
                            </span>
                            {isPusat && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                                PUSAT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{b.name}</div>
                          {isCurrentSession && (
                            <span className="text-[10px] font-bold text-indigo-600 block mt-0.5">
                              ✓ Sesi Aktif Saat Ini
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{b.managerName || '-'}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-800 font-mono text-[11px]">{b.phone || '-'}</div>
                          <div className="text-slate-500 text-[11px] truncate">{b.address || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono">
                            {stats.totalPatients} Pasien • {stats.totalBookings} Booking
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggle(b)}
                            disabled={!isSuperUser}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                              b.isActive 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {b.isActive ? 'AKTIF' : 'NON-AKTIF'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSwitchActiveBranch(b)}
                              disabled={isCurrentSession || !b.isActive}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isCurrentSession 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default' 
                                  : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 shadow-2xs'
                              }`}
                              title={isCurrentSession ? 'Sedang aktif' : 'Beralih ke cabang ini'}
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {isSuperUser && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(b)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-200 shadow-2xs cursor-pointer"
                                  title="Edit Cabang"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(b)}
                                  disabled={isPusat}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isPusat 
                                      ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                                      : 'bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200 shadow-2xs cursor-pointer'
                                  }`}
                                  title={isPusat ? 'PUSAT tidak dapat dihapus' : 'Hapus Cabang'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Cabang */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBranch ? 'Edit Data Cabang Klinik' : 'Tambah Cabang Klinik Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingBranch ? `Memperbarui data cabang ${editingBranch.code}` : 'Masukkan data unit cabang operasional baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Cabang */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kode Cabang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingBranch?.code.toUpperCase() === 'PUSAT'}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    placeholder="Contoh: CABANG-03"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 uppercase disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {editingBranch?.code.toUpperCase() === 'PUSAT' && (
                    <span className="text-[10px] text-amber-600 font-medium mt-1 block">
                      Kode cabang PUSAT adalah identitas paten sistem dan tidak dapat diubah.
                    </span>
                  )}
                </div>

                {/* Status Aktif */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Operasional
                  </label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    disabled={editingBranch?.code.toUpperCase() === 'PUSAT'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                  >
                    <option value="true">Aktif (Buka & Melayani)</option>
                    <option value="false">Non-Aktif (Tutup / Arsip)</option>
                  </select>
                </div>
              </div>

              {/* Nama Cabang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Klinik Khitan Cabang Malang"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
                />
              </div>

              {/* Kepala Cabang / Manajer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kepala Cabang / Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="Contoh: dr. Muhammad Ali Gufron / Ns. Hendra"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
                />
              </div>

              {/* No. Telepon / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Telepon / WhatsApp Cabang
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 0811-3001-003"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
                />
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap Unit Cabang
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Contoh: Jl. Ijen No. 88, Oro-oro Dowo, Kec. Klojen, Kota Malang, Jawa Timur"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-medium"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Cabang */}
      {branchToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Cabang {branchToDelete.name}?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Kode Cabang: <span className="font-mono font-bold text-slate-800">{branchToDelete.code}</span>
                </p>
              </div>

              {/* Warning if linked data exists */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Saran Keamanan Data:</span>
                </div>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  Jika cabang ini pernah melayani pendaftaran pasien, tindakan khitan, atau kasir, menghapus cabang akan memutus relasi historis. 
                  Anda sangat disarankan untuk memilih <strong>Non-Aktifkan Cabang</strong> agar data rekam medis tetap tersimpan aman.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleBranchStatus(branchToDelete.id);
                    setBranchToDelete(null);
                  }}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Nonaktifkan Cabang Saja (Lebih Aman)
                </button>
              </div>

              {/* Force Delete Confirmation */}
              <div className="pt-2 text-left space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span>Saya mengerti konsekuensinya dan ingin tetap menghapus permanen</span>
                </label>

                {forceDelete && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Ketik kode cabang <strong className="text-rose-600">{branchToDelete.code}</strong> untuk konfirmasi:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                      placeholder={`Ketik ${branchToDelete.code}`}
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-rose-500 uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBranchToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting || (forceDelete && deleteConfirmationText !== branchToDelete.code)}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus Cabang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
