import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Database, Tag, Award, Stethoscope, DollarSign, 
  Calendar, CheckCircle2, Edit2, Plus, X, Package,
  Briefcase, Users, Sparkles
} from 'lucide-react';
import { PackageIncludedItemsTab } from './PackageIncludedItemsTab';
import { CircumcisionMethodsTab } from './CircumcisionMethodsTab';
import { DoctorsAndStaffTab } from './DoctorsAndStaffTab';

interface CircumcisionMasterViewProps {
  initialTab?: 'methods' | 'staff' | 'packages' | 'doctors' | 'categories' | 'package-items';
}

export const CircumcisionMasterView: React.FC<CircumcisionMasterViewProps> = ({ initialTab = 'methods' }) => {
  const { categories, packages, doctors, updateDoctorFeeRule, saveDoctorFeeSettings, syncDoctorFeesWithMaster, currentUser, showToast } = useClinic();
  const effectiveInitialTab = initialTab === 'packages' ? 'methods' : initialTab;
  const [activeTab, setActiveTab] = useState<'methods' | 'staff' | 'packages' | 'doctors' | 'categories' | 'package-items'>(effectiveInitialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab === 'packages' ? 'methods' : initialTab);
    }
  }, [initialTab]);

  const [editingDoctorId, setEditingDoctorId] = useState<number | null>(null);
  const [feePackageId, setFeePackageId] = useState<number>(packages[0]?.id || 1);
  const [feeCategoryId, setFeeCategoryId] = useState<number>(categories[0]?.id || 1);
  const [feeNominal, setFeeNominal] = useState<number>(300000);
  const [applyToAllPackages, setApplyToAllPackages] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Auto-fill existing fee when selecting doctor, package, or category
  useEffect(() => {
    if (!editingDoctorId) return;
    const doc = doctors.find(d => d.id === editingDoctorId);
    if (!doc) return;

    const existingRule = doc.feeRules?.find(
      (r: any) => r.packageId === feePackageId && r.patientCategoryId === feeCategoryId && r.isActive
    );

    if (existingRule && typeof existingRule.feeAmount === 'number') {
      setFeeNominal(existingRule.feeAmount);
    } else {
      setFeeNominal(feeCategoryId === 2 ? (doc.vipFee || 350000) : (doc.regulerFee || 250000));
    }
  }, [editingDoctorId, feePackageId, feeCategoryId, doctors]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleSaveFeeRule = async () => {
    if (!editingDoctorId) return;
    if (isNaN(feeNominal) || feeNominal < 0) {
      showToast('Nominal fee dokter harus berupa angka valid (>= 0)', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const doc = doctors.find(d => d.id === editingDoctorId);

      if (applyToAllPackages && doc) {
        // Terapkan ke semua paket khitan dokter ini
        const isVip = feeCategoryId === 2;
        const regVal = isVip ? (doc.regulerFee || 250000) : feeNominal;
        const vipVal = isVip ? feeNominal : (doc.vipFee || 350000);

        const res = await saveDoctorFeeSettings(editingDoctorId, {
          regulerFee: regVal,
          vipFee: vipVal,
          syncPendingFees: true,
        });

        if (res.success) {
          showToast(`Aturan fee dokter berhasil diterapkan ke seluruh paket & disinkronkan ke laporan keuangan`, 'success');
          setEditingDoctorId(null);
        }
      } else {
        const res = await updateDoctorFeeRule(editingDoctorId, {
          packageId: feePackageId,
          patientCategoryId: feeCategoryId,
          feeAmount: Math.round(feeNominal),
          feeValue: Math.round(feeNominal),
        });

        if (res.success) {
          showToast('Aturan fee dokter berhasil disimpan & disinkronkan ke laporan keuangan', 'success');
          setEditingDoctorId(null);
        }
      }
    } catch (err: any) {
      showToast('Gagal menyimpan aturan fee: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSyncAllFees = async () => {
    try {
      setIsSyncing(true);
      const res = await syncDoctorFeesWithMaster('ALL');
      if (res.success) {
        showToast('Sinkronisasi data fee dokter dengan laporan keuangan & tindakan klinik berhasil!', 'success');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-600 to-purple-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-500/20">
              <Database className="w-5 h-5" />
            </span>
            Master Data & Konfigurasi Klinik
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Kelola master metode tindakan khitan &amp; tarif (VIP &amp; Reguler), dokter &amp; karyawan, aturan fee, dan kelengkapan paket secara terpusat.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('methods')}
          className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'methods' || activeTab === 'packages'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-orange-600" />
          Metode &amp; Tarif Khitan (VIP &amp; Reguler)
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'staff'
              ? 'border-purple-600 text-purple-600 bg-purple-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          Dokter &amp; Karyawan
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'doctors'
              ? 'border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-orange-600" />
          Aturan Fee Dokter
        </button>

        <button
          onClick={() => setActiveTab('package-items')}
          className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'package-items'
              ? 'border-purple-600 text-purple-600 bg-purple-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-purple-600" />
          Isi Paket (Celana &amp; Obat)
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-slate-800 text-slate-900 bg-slate-50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Kategori Pasien
        </button>
      </div>

      {/* Tab 1: Metode Tindakan Khitan & Tarif (VIP & Reguler) */}
      {(activeTab === 'methods' || activeTab === 'packages') && <CircumcisionMethodsTab />}

      {/* Tab 2: Dokter & Karyawan / Staf */}
      {activeTab === 'staff' && <DoctorsAndStaffTab />}

      {/* Tab 4: Aturan Fee Dokter */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-purple-50 p-4 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-orange-600" />
                Manajemen Fee Dokter &amp; Sinkronisasi Laporan Keuangan
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Tarif honorarium dokter per tindakan khitan (Reguler vs VIP) terhubung langsung ke Buku Kas, Laba Rugi, dan Laporan Payroll.
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualSyncAllFees}
              disabled={isSyncing}
              className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-300 text-orange-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-orange-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyingkronkan...' : 'Singkronkan ke Laporan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{doc.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{doc.specialization || 'Dokter Operator Khitan'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-bold text-slate-500">Fee Reguler:</span>
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {formatRupiah(doc.regulerFee ?? 250000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-bold text-slate-500">Fee VIP:</span>
                      <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {formatRupiah(doc.vipFee ?? 350000)}
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] text-slate-500 flex justify-between">
                      <span>SIP: <strong className="font-mono text-slate-700">{doc.sipNumber || '-'}</strong></span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{doc.branchCode || 'PUSAT'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setEditingDoctorId(doc.id);
                      setFeePackageId(packages[0]?.id || 1);
                      setFeeCategoryId(categories[0]?.id || 1);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Atur Aturan Fee
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Kategori Pasien */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {c.code}
                </span>
                <span className="text-xs font-bold text-emerald-600">Aktif</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Package Included Items */}
      {activeTab === 'package-items' && <PackageIncludedItemsTab />}

      {/* Modal Atur Fee Dokter */}
      {editingDoctorId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Atur Aturan Fee Dokter
                </h3>
                <p className="text-xs font-bold text-orange-600">
                  {doctors.find(d => d.id === editingDoctorId)?.name || 'Dokter'}
                </p>
              </div>
              <button 
                onClick={() => setEditingDoctorId(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Pilih Paket Khitan:
                </label>
                <select
                  value={feePackageId}
                  onChange={(e) => setFeePackageId(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Kategori Pasien:
                </label>
                <select
                  value={feeCategoryId}
                  onChange={(e) => setFeeCategoryId(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-slate-600 uppercase">
                    Besaran Fee Dokter Per Tindakan (Rp):
                  </label>
                  <span className="text-xs font-mono font-black text-emerald-600">
                    {formatRupiah(feeNominal)}
                  </span>
                </div>
                <input
                  type="number"
                  step={5000}
                  min={0}
                  value={feeNominal}
                  onChange={(e) => setFeeNominal(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={applyToAllPackages}
                    onChange={(e) => setApplyToAllPackages(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                  />
                  <span>Terapkan nominal ini ke semua paket khitan untuk dokter ini</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingDoctorId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveFeeRule}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Aturan Fee'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
