import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Stethoscope, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Search, History, X, AlertCircle, Sparkles, Tag, Clock,
  DollarSign, Crown, Shield, ArrowRight
} from 'lucide-react';
import { CircumcisionMethod, AuditLog } from '../../types';

export const CircumcisionMethodsTab: React.FC = () => {
  const { 
    circumcisionMethods, 
    createCircumcisionMethod, 
    updateCircumcisionMethod, 
    toggleCircumcisionMethodStatus, 
    deleteCircumcisionMethod,
    fetchAuditLogs,
    currentUser,
    showToast
  } = useClinic();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<CircumcisionMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<CircumcisionMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditList, setAuditList] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const isAdmin = !currentUser || currentUser.role === 'admin' || currentUser.role === 'owner';

  // Form inputs (Metode Tindakan bersatu dengan Tarif Paket Reguler & VIP)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    durationMinutes: 45,
    priceReguler: 1800000,
    priceVip: 2500000,
    isActive: true,
  });

  const formatRupiah = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredMethods = circumcisionMethods.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && m.isActive) ||
      (statusFilter === 'INACTIVE' && !m.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = circumcisionMethods.filter(m => m.isActive).length;
  const inactiveCount = circumcisionMethods.filter(m => !m.isActive).length;

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      description: '',
      notes: '',
      durationMinutes: 45,
      priceReguler: 1800000,
      priceVip: 2500000,
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (m: CircumcisionMethod) => {
    setEditingMethod(m);
    setFormData({
      name: m.name,
      description: m.description || '',
      notes: m.notes || '',
      durationMinutes: m.durationMinutes || 45,
      priceReguler: m.priceReguler || 1800000,
      priceVip: m.priceVip || 2500000,
      isActive: m.isActive,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama metode tindakan khitan wajib diisi', 'error');
      return;
    }

    if (editingMethod) {
      await updateCircumcisionMethod(editingMethod.id, formData);
    } else {
      await createCircumcisionMethod(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleToggleStatus = async (m: CircumcisionMethod) => {
    await toggleCircumcisionMethodStatus(m.id);
  };

  const handleDelete = (m: CircumcisionMethod) => {
    setMethodToDelete(m);
  };

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return;
    try {
      setIsDeleting(true);
      await deleteCircumcisionMethod(methodToDelete.id);
      setMethodToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAudit = async () => {
    setIsLoadingAudit(true);
    setIsAuditModalOpen(true);
    const logs = await fetchAuditLogs('circumcision_method');
    setAuditList(logs);
    setIsLoadingAudit(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </span>
            Metode Tindakan & Tarif Khitan (VIP & Reguler)
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Satu Master Terpadu: Kelola metode tindakan khitan lengkap dengan tarif Paket Reguler dan Paket VIP tanpa hard-code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAudit}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Lihat Riwayat Perubahan Audit Log"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Riwayat Perubahan</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Metode & Tarif</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Metode Khitan
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {circumcisionMethods.length}
            </span>
            <span className="text-[11px] text-slate-500">Tersedia di master sistem</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Metode Aktif
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">Bisa dipilih saat booking & tindakan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Struktur Paket
            </span>
            <span className="text-sm font-black text-slate-900 mt-1 block flex items-center gap-1">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs border border-blue-200">Reguler</span>
              <span className="text-slate-300">&amp;</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs border border-amber-200">VIP</span>
            </span>
            <span className="text-[11px] text-slate-500">Otomatis terhubung ke kasir</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama metode, deskripsi, kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto self-start sm:self-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'Semua Status' : s === 'ACTIVE' ? 'Aktif Saja' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Methods Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMethods.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Tidak ditemukan metode tindakan</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Coba sesuaikan kata kunci pencarian Anda' : 'Klik "Tambah Metode & Tarif" untuk membuat metode tindakan baru'}
            </p>
          </div>
        ) : (
          filteredMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                method.isActive 
                  ? 'border-slate-200 hover:border-orange-300 hover:shadow-md' 
                  : 'border-slate-200/60 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="space-y-3.5">
                {/* Badge code, duration & status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                      {method.code || `MTH-00${method.id}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {method.durationMinutes || 45} mnt
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(method)}
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                      method.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Klik untuk mengaktifkan / nonaktifkan metode ini"
                  >
                    {method.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                    <span>{method.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>
                </div>

                {/* Name */}
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {method.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed line-clamp-2">
                    {method.description || 'Tidak ada deskripsi rinci.'}
                  </p>
                </div>

                {/* Unified Tarif Section: Paket Reguler & Paket VIP */}
                <div className="p-3 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Struktur Tarif Paket Layanan:</span>
                    <span className="text-[9px] text-orange-600 font-bold">1 Master Terpadu</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Paket Reguler */}
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Paket Reguler
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {formatRupiah(method.priceReguler || 1800000)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Standar Kamar Tindakan
                      </div>
                    </div>

                    {/* Paket VIP */}
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-2xs space-y-0.5 bg-gradient-to-b from-amber-50/30 to-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-600" /> Paket VIP
                        </span>
                      </div>
                      <div className="text-sm font-black text-amber-900">
                        {formatRupiah(method.priceVip || 2500000)}
                      </div>
                      <div className="text-[9px] text-amber-700/80">
                        Private Room &amp; Prioritas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes box if available */}
                {method.notes && (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                    <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider">
                      Catatan Klinik:
                    </span>
                    <p className="italic text-slate-700 leading-snug text-[10px] line-clamp-2">{method.notes}</p>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(method)}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Edit Nama, Deskripsi, Catatan & Tarif VIP / Reguler"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Ubah Tarif &amp; Data</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(method)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Metode Tindakan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal (Tambah / Edit Metode & Tarif) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingMethod ? 'Ubah Metode & Tarif Khitan' : 'Tambah Metode & Tarif Khitan'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Satu master untuk Metode Tindakan, Tarif Paket Reguler &amp; Paket VIP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Nama & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Nama Metode Tindakan <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Metode glans pro Bipolar pensealer / Metode Tindakan Nano Klemp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Durasi (Menit):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Box Tarif: Paket Reguler & Paket VIP */}
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    Konfigurasi Tarif Paket Layanan
                  </span>
                  <span className="text-[10px] text-orange-700 font-bold">VIP vs Reguler</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tarif Reguler */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                    <label className="block text-[10px] font-black text-blue-700 uppercase flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Tarif Paket Reguler (Rp):
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={10000}
                      value={formData.priceReguler}
                      onChange={(e) => setFormData({ ...formData, priceReguler: Number(e.target.value) })}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-blue-600 block">
                      Preview: {formatRupiah(formData.priceReguler)}
                    </span>
                  </div>

                  {/* Tarif VIP */}
                  <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs space-y-1.5">
                    <label className="block text-[10px] font-black text-amber-700 uppercase flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-600" /> Tarif Paket VIP (Rp):
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={10000}
                      value={formData.priceVip}
                      onChange={(e) => setFormData({ ...formData, priceVip: Number(e.target.value) })}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] font-bold text-amber-600 block">
                      Preview: {formatRupiah(formData.priceVip)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Deskripsi / Spesifikasi Klinis:
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi cara kerja, indikasi, atau keunggulan metode ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Catatan Tambahan Klinik:
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan SOP, peralatan khusus, atau instruksi pasca tindakan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Status Aktif Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Status Pelayanan Aktif</span>
                  <span className="text-[10px] text-slate-500 block">
                    {formData.isActive ? 'Metode dapat dipilih di booking, kasir, dan ruang tindakan' : 'Metode dinonaktifkan sementara'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    formData.isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  {editingMethod ? 'Simpan Perubahan' : 'Tambah Metode & Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Riwayat Perubahan (Audit Log) Metode &amp; Tarif
                  </h3>
                  <p className="text-xs text-slate-400">
                    Jejak rekam aktivitas admin terhadap konfigurasi master data metode khitan dan tarif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {isLoadingAudit ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  Memuat riwayat audit...
                </div>
              ) : auditList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada catatan aktivitas perubahan untuk metode tindakan khitan.
                </div>
              ) : (
                auditList.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'TOGGLE_STATUS' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{log.userName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {log.details || 'Aktivitas perubahan master metode tindakan'}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Metode Tindakan */}
      {methodToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Hapus Metode Tindakan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Konfirmasi penghapusan master metode &amp; tarif
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama Metode:</span>
                  <span className="font-bold text-slate-900">{methodToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kode:</span>
                  <span className="font-mono font-bold text-orange-700">{methodToDelete.code || `MTH-00${methodToDelete.id}`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tarif Reguler:</span>
                  <span className="font-bold text-emerald-700">{formatRupiah(methodToDelete.priceReguler)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tarif VIP:</span>
                  <span className="font-bold text-amber-700">{formatRupiah(methodToDelete.priceVip)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <strong>Catatan Keamanan Data:</strong> Jika metode ini pernah digunakan dalam pendaftaran atau riwayat tindakan khitan sebelumnya, sistem akan mengarsipkan metode ini secara aman tanpa merusak riwayat transaksi medis &amp; keuangan klinik.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMethodToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Metode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
