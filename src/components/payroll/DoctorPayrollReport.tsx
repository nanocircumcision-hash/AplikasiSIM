import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Stethoscope, Calendar, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Printer, ChevronDown, ChevronUp, ArrowRight, 
  CreditCard, Check, ShieldCheck, Sparkles, Filter, FileText,
  User, Building, X, ExternalLink, RefreshCw, Award, Download,
  Trash2
} from 'lucide-react';
import { DoctorFeeTransaction } from '../../types';
import { NanoMasterLogo, PrintDocumentIcon } from '../common/PrintIcons';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';
import { downloadElementAsPdf } from '../../utils/pdfHelper';

interface DoctorPayrollReportProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const DoctorPayrollReport: React.FC<DoctorPayrollReportProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const { 
    doctorFees, 
    doctors, 
    updateDoctorFeeStatus, 
    payDoctorFeesBatch,
    syncDoctorFeesWithMaster,
    createDoctorFee,
    deleteDoctorFee,
    currentUser, 
    settings,
    showToast 
  } = useClinic();

  // Selected doctor filter
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  // Selected patient category filter (ALL, VIP, REGULER)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | 'VIP' | 'REGULER'>('ALL');
  // Expanded doctors accordion state
  const [expandedDoctors, setExpandedDoctors] = useState<Record<number, boolean>>({});
  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Manual Fee Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [selectedDoctorForManual, setSelectedDoctorForManual] = useState<any>(null);
  const [manualForm, setManualForm] = useState({
    feeAmount: 150000,
    feeDate: new Date().toISOString().slice(0, 10),
    title: 'Fee Tindakan Khusus / Kasus Penyulit',
    notes: '',
    status: 'APPROVED' as 'PENDING' | 'APPROVED',
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  // Payment Modal state for paying doctor fees
  const [payingDoctor, setPayingDoctor] = useState<{
    doctor: any;
    fees: DoctorFeeTransaction[];
  } | null>(null);
  const [payMethod, setPayMethod] = useState<'TRANSFER' | 'CASH' | 'QRIS'>('TRANSFER');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);

  // Print Slip Modal state
  const [slipDoctor, setSlipDoctor] = useState<{
    doctor: any;
    fees: DoctorFeeTransaction[];
    regulerCount: number;
    regulerTotal: number;
    regulerRate: number;
    vipCount: number;
    vipTotal: number;
    vipRate: number;
    manualCount?: number;
    manualTotal?: number;
    manualFees?: DoctorFeeTransaction[];
  } | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const toggleDoctorExpand = (doctorId: number) => {
    setExpandedDoctors(prev => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  // Helper to determine if fee is VIP
  const isFeeVip = (f: DoctorFeeTransaction) => {
    const code = (f.categoryCode || '').toUpperCase();
    const name = (f.categoryName || '').toUpperCase();
    const pkg = (f.packageName || '').toUpperCase();
    return code.includes('VIP') || name.includes('VIP') || pkg.includes('VIP');
  };

  // Download PDF handler
  const handleDownloadDoctorPdf = async () => {
    if (!slipDoctor) return;
    try {
      setIsDownloadingPdf(true);
      showToast('Menyiapkan berkas PDF Slip Honorarium Dokter...', 'info');
      const cleanDocName = slipDoctor.doctor.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Slip_Honorarium_${cleanDocName}_${selectedPeriod || 'Semua'}.pdf`;
      const res = await downloadElementAsPdf('doctor-fee-slip-print', {
        filename,
        margin: [8, 8, 8, 8],
        format: 'a4',
        orientation: 'portrait',
      });
      if (res.success) {
        showToast('Slip honorarium dokter berhasil diunduh dalam format PDF!', 'success');
      } else {
        showToast('Gagal mengunduh PDF: ' + (res.error || 'Terjadi kesalahan sistem'), 'error');
      }
    } catch (err: any) {
      showToast('Gagal mengunduh PDF: ' + (err.message || String(err)), 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Filter fees by period, non-cancelled status, selected doctor, and category filter
  const periodFees = useMemo(() => {
    return doctorFees.filter((f) => {
      const inPeriod = !selectedPeriod || f.feeDate.startsWith(selectedPeriod);
      const notCancelled = f.status !== 'CANCELLED';
      const matchDoc = selectedDoctorId === 'ALL' || String(f.doctorId) === selectedDoctorId;
      const isVip = isFeeVip(f);
      const matchCategory = 
        selectedCategoryFilter === 'ALL' ||
        (selectedCategoryFilter === 'VIP' && isVip) ||
        (selectedCategoryFilter === 'REGULER' && !isVip);

      return inPeriod && notCancelled && matchDoc && matchCategory;
    });
  }, [doctorFees, selectedPeriod, selectedDoctorId, selectedCategoryFilter]);

  // Overall Aggregates for Period
  const totalPeriodFee = periodFees.reduce((sum, f) => sum + f.feeAmount, 0);
  const totalPatients = periodFees.length;
  const totalPaid = periodFees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.feeAmount, 0);
  const totalUnpaid = periodFees.filter(f => f.status !== 'PAID').reduce((sum, f) => sum + f.feeAmount, 0);
  const totalPending = periodFees.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.feeAmount, 0);
  const totalApproved = periodFees.filter(f => f.status === 'APPROVED').reduce((sum, f) => sum + f.feeAmount, 0);

  // VIP & Reguler Period Aggregates
  const vipPeriodFees = periodFees.filter(isFeeVip);
  const regulerPeriodFees = periodFees.filter(f => !isFeeVip(f));
  const totalVipPatients = vipPeriodFees.length;
  const totalVipFee = vipPeriodFees.reduce((sum, f) => sum + f.feeAmount, 0);
  const totalRegulerPatients = regulerPeriodFees.length;
  const totalRegulerFee = regulerPeriodFees.reduce((sum, f) => sum + f.feeAmount, 0);

  // Group by doctor with VIP and Reguler breakdown
  const doctorSummaries = useMemo(() => {
    const docs = selectedDoctorId === 'ALL' 
      ? doctors 
      : doctors.filter(d => String(d.id) === selectedDoctorId);

    return docs.map(doc => {
      const docFees = periodFees.filter(f => f.doctorId === doc.id);
      
      // Separate procedure fees vs manual additional fees
      const procedureFees = docFees.filter(f => f.feeType !== 'MANUAL_ADDITIONAL');
      const manualFees = docFees.filter(f => f.feeType === 'MANUAL_ADDITIONAL');

      const patientCount = procedureFees.length;

      // VIP vs Reguler breakdown (hanya tindakan medis)
      const docVipFees = procedureFees.filter(isFeeVip);
      const docRegulerFees = procedureFees.filter(f => !isFeeVip(f));

      const vipCount = docVipFees.length;
      const vipTotal = docVipFees.reduce((sum, f) => sum + f.feeAmount, 0);
      const vipFeePerPatient = vipCount > 0 
        ? Math.round(vipTotal / vipCount) 
        : (doc.vipFee ?? 350000);

      const regulerCount = docRegulerFees.length;
      const regulerTotal = docRegulerFees.reduce((sum, f) => sum + f.feeAmount, 0);
      const regulerFeePerPatient = regulerCount > 0 
        ? Math.round(regulerTotal / regulerCount) 
        : (doc.regulerFee ?? 250000);

      // Fee Tambahan Manual breakdown
      const manualCount = manualFees.length;
      const manualTotal = manualFees.reduce((sum, f) => sum + f.feeAmount, 0);

      // Total komisi bulanan dokter = Tindakan Reguler + Tindakan VIP + Fee Tambahan Manual
      const feeTotal = regulerTotal + vipTotal + manualTotal;
      const avgFeePerPatient = patientCount > 0 ? Math.round((regulerTotal + vipTotal) / patientCount) : 0;

      const pendingFees = docFees.filter(f => f.status === 'PENDING');
      const approvedFees = docFees.filter(f => f.status === 'APPROVED');
      const paidFees = docFees.filter(f => f.status === 'PAID');

      // Group fees by package name
      const packageBreakdown: Record<string, { count: number; feePerPatient: number; total: number }> = {};
      procedureFees.forEach(f => {
        const pkgName = f.packageName || 'Tindakan Khitan';
        if (!packageBreakdown[pkgName]) {
          packageBreakdown[pkgName] = { count: 0, feePerPatient: f.feeAmount, total: 0 };
        }
        packageBreakdown[pkgName].count += 1;
        packageBreakdown[pkgName].total += f.feeAmount;
      });

      return {
        doctor: doc,
        fees: docFees,
        procedureFees,
        manualFees,
        patientCount,
        feeTotal,
        avgFeePerPatient,
        regulerCount,
        regulerTotal,
        regulerFeePerPatient,
        vipCount,
        vipTotal,
        vipFeePerPatient,
        manualCount,
        manualTotal,
        pendingCount: pendingFees.length,
        pendingAmount: pendingFees.reduce((sum, f) => sum + f.feeAmount, 0),
        approvedCount: approvedFees.length,
        approvedAmount: approvedFees.reduce((sum, f) => sum + f.feeAmount, 0),
        paidCount: paidFees.length,
        paidAmount: paidFees.reduce((sum, f) => sum + f.feeAmount, 0),
        packageBreakdown,
      };
    }).filter(summary => summary.fees.length > 0 || selectedDoctorId !== 'ALL');
  }, [doctors, periodFees, selectedDoctorId]);

  // Handle single fee status update
  const handleSingleFeeStatus = async (feeId: number, status: 'APPROVED' | 'PAID' | 'CANCELLED') => {
    const role = (currentUser?.role || '').toLowerCase();
    const canManage = !currentUser || role === 'admin' || role === 'owner' || role.includes('admin') || role.includes('owner') || role.includes('master');
    if (!canManage) {
      showToast('Hanya Administrator atau Pemilik (Owner / Super Admin) yang berwenang memproses fee dokter.', 'error');
      return;
    }
    await updateDoctorFeeStatus(feeId, status, { paymentMethod: 'TRANSFER' });
  };

  // Open Manual Fee Modal for Doctor
  const handleOpenManualFeeModal = (doc: any) => {
    setSelectedDoctorForManual(doc);
    const defaultDate = selectedPeriod && selectedPeriod.length === 7
      ? `${selectedPeriod}-01`
      : new Date().toISOString().slice(0, 10);
    setManualForm({
      feeAmount: 150000,
      feeDate: defaultDate,
      title: 'Fee Tindakan Khusus / Kasus Penyulit',
      notes: `Fee tambahan periode ${selectedPeriod || 'berjalan'}`,
      status: 'APPROVED',
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManualFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForManual) return;
    if (!manualForm.feeAmount || Number(manualForm.feeAmount) <= 0) {
      showToast('Nominal fee tambahan harus lebih dari 0', 'error');
      return;
    }
    try {
      setIsSubmittingManual(true);
      const res = await createDoctorFee({
        doctorId: selectedDoctorForManual.id,
        feeAmount: Number(manualForm.feeAmount),
        feeDate: manualForm.feeDate,
        title: manualForm.title.trim() || 'Fee Tambahan Dokter',
        notes: manualForm.notes.trim() || undefined,
        status: manualForm.status,
      });
      if (res.success) {
        setIsManualModalOpen(false);
      }
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDeleteManualFee = async (feeId: number, feeNum: string) => {
    if (!window.confirm(`Yakin ingin menghapus fee tambahan ${feeNum}?`)) return;
    await deleteDoctorFee(feeId);
  };

  // Synchronize doctor fees with latest master doctor data
  const handleSyncMaster = async () => {
    try {
      setIsSyncing(true);
      await syncDoctorFeesWithMaster(selectedDoctorId === 'ALL' ? undefined : Number(selectedDoctorId));
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Batch Pay Modal
  const handleOpenPayModal = (docSummary: any) => {
    const role = (currentUser?.role || '').toLowerCase();
    const canManage = !currentUser || role === 'admin' || role === 'owner' || role.includes('admin') || role.includes('owner') || role.includes('master');
    if (!canManage) {
      showToast('Hanya Administrator atau Pemilik (Owner / Super Admin) yang berwenang mencairkan fee dokter.', 'error');
      return;
    }
    const unpaidFees = docSummary.fees.filter((f: DoctorFeeTransaction) => f.status !== 'PAID');
    if (unpaidFees.length === 0) {
      showToast('Semua fee dokter ini sudah dibayarkan / lunas.', 'info');
      return;
    }
    setPayingDoctor({
      doctor: docSummary.doctor,
      fees: unpaidFees,
    });
    setPayMethod('TRANSFER');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayNotes(`Pencairan fee dokter periode ${selectedPeriod}`);
  };

  // Submit Batch Pay
  const handleConfirmBatchPay = async () => {
    if (!payingDoctor) return;
    try {
      setIsSubmittingPay(true);
      const feeIds = payingDoctor.fees.map(f => f.id);
      const res = await payDoctorFeesBatch({
        doctorId: payingDoctor.doctor.id,
        feeIds,
        paymentMethod: payMethod,
        paymentDate: payDate,
        notes: payNotes,
      });
      if (res && res.success) {
        setPayingDoctor(null);
      }
    } catch (err: any) {
      showToast('Gagal memproses pembayaran: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Open Slip Print Modal
  const handleOpenSlipModal = (docSummary: any) => {
    setSlipDoctor({
      doctor: docSummary.doctor,
      fees: docSummary.fees,
      regulerCount: docSummary.regulerCount,
      regulerTotal: docSummary.regulerTotal,
      regulerRate: docSummary.regulerFeePerPatient,
      vipCount: docSummary.vipCount,
      vipTotal: docSummary.vipTotal,
      vipRate: docSummary.vipFeePerPatient,
      manualCount: docSummary.manualCount || 0,
      manualTotal: docSummary.manualTotal || 0,
      manualFees: docSummary.manualFees || [],
    });
    setIsSlipModalOpen(true);
  };

  // Number to Words (Terbilang Bahasa Indonesia)
  const terbilang = (angka: number): string => {
    const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    angka = Math.floor(Math.abs(angka));
    if (angka < 12) return bilangan[angka];
    if (angka < 20) return terbilang(angka - 10) + ' Belas';
    if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10);
    if (angka < 200) return 'Seratus ' + terbilang(angka - 100);
    if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100);
    if (angka < 2000) return 'Seribu ' + terbilang(angka - 1000);
    if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000);
    if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000);
    return terbilang(Math.floor(angka / 1000000000)) + ' Milyar ' + terbilang(angka % 1000000000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Laporan Fee &amp; Payroll Dokter Khitan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hasil laporan payroll dokter berdasarkan jumlah pasien yang ditangani dengan rincian lengkap tarif pasien VIP dan Reguler, terintegrasi penuh ke data master klinik.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Filter Doctor */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Dokter Operator</option>
              {doctors.map(d => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Kategori Pasien (VIP / Reguler) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedCategoryFilter}
              onChange={(e: any) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Jenis Pasien (VIP &amp; Reguler)</option>
              <option value="VIP">👑 Hanya Pasien VIP</option>
              <option value="REGULER">Hanya Pasien Reguler</option>
            </select>
          </div>

          {/* Sync With Master Button */}
          <button
            onClick={handleSyncMaster}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Sinkronkan transaksi fee pending dengan konfigurasi tarif master data dokter"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkron Data Master'}</span>
          </button>

          {/* Tombol Input Fee Tambahan Manual di Header */}
          <button
            onClick={() => handleOpenManualFeeModal(doctors[0])}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Input fee tambahan manual untuk dokter (otomatis masuk ke rekap komisi bulanan)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Input Fee Tambahan</span>
          </button>

          {/* Master Print Button */}
          <button
            onClick={() => {
              if (doctorSummaries.length === 0) {
                showToast('Tidak ada data rekap fee dokter untuk dicetak pada periode ini', 'info');
                return;
              }
              printElementById('master-doctor-payroll-print', { title: 'Rekap_Fee_Dokter_Periode_' + selectedPeriod });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap Bulanan</span>
          </button>
        </div>
      </div>

      {/* Financial Affiliation Notification Badge */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 text-emerald-900">
          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-emerald-950">Terintegrasi Master &amp; Laporan Akuntansi:</span>{' '}
            Perhitungan fee otomatis mengambil tarif master dokter berdasarkan jenis pasien (<span className="font-bold text-amber-700">VIP</span> vs <span className="font-bold text-sky-700">Reguler</span>). Saat fee dicairkan (<span className="font-bold text-emerald-700">Lunas/PAID</span>), otomatis tercatat ke <span className="font-bold underline">Beban Pengeluaran Operasional</span> dan mengurangi laba bersih klinik pada <span className="font-bold underline">Laporan Laba Rugi</span>.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
            100% Master Integrated
          </span>
        </div>
      </div>

      {/* Summary KPI Cards: Total, Reguler, VIP, Paid, Unpaid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Fee Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Fee Dokter</span>
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{formatRupiah(totalPeriodFee)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalPatients} Pasien Khitan Ditangani</p>
        </div>

        {/* Pasien Reguler Breakdown Card */}
        <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Pasien Reguler</span>
            <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <span className="text-xs">👶</span>
            </div>
          </div>
          <div className="text-xl font-black text-sky-900 mt-1">{formatRupiah(totalRegulerFee)}</div>
          <p className="text-[10px] text-sky-600 mt-0.5">{totalRegulerPatients} Pasien Reguler</p>
        </div>

        {/* Pasien VIP Breakdown Card */}
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pasien VIP</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-900 mt-1">{formatRupiah(totalVipFee)}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">{totalVipPatients} Pasien VIP</p>
        </div>

        {/* Telah Dibayar (PAID) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Telah Dibayar (PAID)</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(totalPaid)}</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Sudah masuk beban operasional</p>
        </div>

        {/* Belum Selesai (PENDING / APPROVED) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Belum Cair</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">{formatRupiah(totalUnpaid)}</div>
          <p className="text-[10px] text-amber-600 mt-0.5">{totalPending > 0 ? `${formatRupiah(totalPending)} Pending` : 'Siap dicairkan'}</p>
        </div>
      </div>

      {/* Doctor Payroll Breakdown List */}
      <div className="space-y-4">
        {doctorSummaries.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Catatan Fee Dokter Pada Periode Ini</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fee dokter akan terhitung otomatis ketika tindakan khitan selesai ditangani oleh dokter operator sesuai tarif master data.
            </p>
          </div>
        ) : (
          doctorSummaries.map((summary) => {
            const isExpanded = !!expandedDoctors[summary.doctor.id];
            const hasUnpaid = summary.pendingCount > 0 || summary.approvedCount > 0;

            return (
              <div 
                key={summary.doctor.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Doctor Card Top Summary */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Doctor Info & Main Formula */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-sm">
                        {summary.doctor.name.replace(/^(dr\.|drg\.|dr\s+|drg\s+)/i, '').charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {summary.doctor.name}
                          </h3>
                          {summary.doctor.sipNumber && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                              SIP: {summary.doctor.sipNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/60 rounded text-[10px] font-bold">
                            {summary.doctor.specialty || summary.doctor.specialization || 'Dokter Operator Khitan'}
                          </span>
                        </div>

                        {/* FORMULA PAYROLL DOKTER: KETERANGAN VIP & REGULER LENGKAP */}
                        <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-2">
                          <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                            <span>Perhitungan Fee Pasien (Berdasarkan Jumlah Pasien &amp; Kategori):</span>
                            <span className="font-mono font-bold text-slate-700">{summary.patientCount} Pasien Ditangani</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            {/* Pasien Reguler Breakdown */}
                            <div className="p-2.5 bg-sky-50/80 border border-sky-200/80 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-sky-600 text-white font-black text-[10px] rounded uppercase">
                                  Reguler
                                </span>
                                <span className="font-bold text-sky-950">
                                  {summary.regulerCount} Pasien × {formatRupiah(summary.regulerFeePerPatient)}
                                </span>
                              </div>
                              <span className="font-black text-sky-900 font-mono text-xs">
                                = {formatRupiah(summary.regulerTotal)}
                              </span>
                            </div>

                            {/* Pasien VIP Breakdown */}
                            <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded uppercase flex items-center gap-1">
                                  👑 VIP
                                </span>
                                <span className="font-bold text-amber-950">
                                  {summary.vipCount} Pasien × {formatRupiah(summary.vipFeePerPatient)}
                                </span>
                              </div>
                              <span className="font-black text-amber-900 font-mono text-xs">
                                = {formatRupiah(summary.vipTotal)}
                              </span>
                            </div>

                            {/* Fee Tambahan Manual Breakdown */}
                            <div className="p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-600 text-white font-black text-[10px] rounded uppercase flex items-center gap-1">
                                  ✨ Manual
                                </span>
                                <span className="font-bold text-purple-950">
                                  {summary.manualCount} Fee Tambahan
                                </span>
                              </div>
                              <span className="font-black text-purple-900 font-mono text-xs">
                                = {formatRupiah(summary.manualTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Total Bar */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-xs">
                            <span className="font-bold text-slate-600">
                              Total Komisi Bulan Ini ({summary.regulerCount} Reguler + {summary.vipCount} VIP {summary.manualCount > 0 ? `+ ${summary.manualCount} Fee Tambahan` : ''}):
                            </span>
                            <span className="font-black text-sm text-sky-800 bg-white px-2.5 py-0.5 rounded-lg border border-sky-200 font-mono">
                              {formatRupiah(summary.feeTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Detail Per Paket jika ada variasi paket tindakan */}
                        {Object.keys(summary.packageBreakdown).length > 1 && (
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                            {Object.entries(summary.packageBreakdown).map(([pkg, data]: [string, any]) => (
                              <span key={pkg} className="bg-slate-100/80 px-2 py-0.5 rounded text-slate-600">
                                {pkg}: {data.count} × {formatRupiah(data.feePerPatient)} ({formatRupiah(data.total)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Breakdown & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:self-center">
                      {/* Mini status pills */}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {summary.paidCount > 0 && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold" title="Telah dicairkan">
                            {summary.paidCount} Lunas ({formatRupiah(summary.paidAmount)})
                          </span>
                        )}
                        {summary.approvedCount > 0 && (
                          <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg font-bold" title="Siap dicairkan">
                            {summary.approvedCount} Disetujui ({formatRupiah(summary.approvedAmount)})
                          </span>
                        )}
                        {summary.pendingCount > 0 && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold" title="Menunggu approval">
                            {summary.pendingCount} Pending ({formatRupiah(summary.pendingAmount)})
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Tombol Input Fee Tambahan Manual */}
                        <button
                          onClick={() => handleOpenManualFeeModal(summary.doctor)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                          title="Input fee tambahan manual / insentif khusus dokter ini"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>+ Fee Tambahan</span>
                        </button>

                        {hasUnpaid && (
                          <button
                            onClick={() => handleOpenPayModal(summary)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                            title="Cairkan fee dokter ini dan catat otomatis ke Beban Pengeluaran"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cairkan Fee Dokter</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenSlipModal(summary)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Cetak Slip Rekapitulasi Honorarium Dokter"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Cetak Slip</span>
                        </button>

                        <button
                          onClick={() => toggleDoctorExpand(summary.doctor.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                          title={isExpanded ? 'Sembunyikan detail pasien' : 'Lihat rincian pasien'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Patient Details Table with VIP / Reguler Tag */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Rincian Pasien Ditangani {summary.doctor.name} ({summary.patientCount} Tindakan)
                        </h4>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {summary.regulerCount} Reguler • {summary.vipCount} VIP
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Periode: {selectedPeriod || 'Semua Periode'}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">No Fee / Tanggal</th>
                            <th className="py-2.5 px-3">Pasien &amp; No RM</th>
                            <th className="py-2.5 px-3">Jenis Pasien</th>
                            <th className="py-2.5 px-3">Paket Tindakan</th>
                            <th className="py-2.5 px-3 text-right">Fee Dokter</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {summary.fees.map((fee, idx) => {
                            const isManual = fee.feeType === 'MANUAL_ADDITIONAL';
                            const isVip = isFeeVip(fee);

                            return (
                              <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-slate-800">{fee.feeNumber}</span>
                                    {isManual && (
                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-black rounded uppercase">
                                        MANUAL
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{fee.feeDate}</div>
                                </td>
                                <td className="py-2.5 px-3">
                                  {isManual ? (
                                    <div>
                                      <div className="font-black text-purple-900 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-purple-500 inline shrink-0" />
                                        <span>{fee.title || 'Fee Tambahan Dokter'}</span>
                                      </div>
                                      {fee.patientName && (
                                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          Pasien: {fee.patientName}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-bold text-slate-900">{fee.patientName}</div>
                                      <div className="text-[10px] text-slate-400">RM: {fee.rmNumber || '-'}</div>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {isManual ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                      ✨ Fee Tambahan
                                    </span>
                                  ) : isVip ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                      👑 VIP
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                                      Reguler
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-medium text-slate-700">
                                    {isManual ? (fee.notes || 'Input manual') : fee.packageName}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                  {formatRupiah(fee.feeAmount)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {fee.status === 'PAID' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                      <Check className="w-3 h-3" /> Lunas
                                    </span>
                                  ) : fee.status === 'APPROVED' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold">
                                      <Sparkles className="w-3 h-3" /> Disetujui
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">
                                      <Clock className="w-3 h-3" /> Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {fee.status === 'PENDING' && (
                                      <button
                                        onClick={() => handleSingleFeeStatus(fee.id, 'APPROVED')}
                                        className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[10px] font-bold cursor-pointer"
                                        title="Setujui fee ini"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {fee.status !== 'PAID' && (
                                      <button
                                        onClick={() => handleSingleFeeStatus(fee.id, 'PAID')}
                                        className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold cursor-pointer"
                                        title="Bayar & masukkan ke pengeluaran"
                                      >
                                        Bayar
                                      </button>
                                    )}
                                    {fee.status === 'PAID' && (
                                      <span className="text-[10px] text-emerald-600 font-medium">
                                        Tercatat di Beban
                                      </span>
                                    )}
                                    {isManual && fee.status !== 'PAID' && (
                                      <button
                                        onClick={() => handleDeleteManualFee(fee.id, fee.feeNumber)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Hapus Fee Tambahan Manual"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-black border-t border-slate-200 text-xs">
                          <tr>
                            <td colSpan={5} className="py-2.5 px-3 text-right text-slate-600">
                              Total Fee {summary.doctor.name}:
                            </td>
                            <td className="py-2.5 px-3 text-right text-sky-800 text-sm font-mono">
                              {formatRupiah(summary.feeTotal)}
                            </td>
                            <td colSpan={2} className="py-2.5 px-3 text-slate-500 text-[11px] font-normal">
                              ({summary.regulerCount} Reguler + {summary.vipCount} VIP = {summary.patientCount} Pasien)
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Pencairan / Bayar Fee Dokter Batch & Auto-Expense */}
      {payingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Cairkan Fee Dokter</h3>
                  <p className="text-xs text-slate-500">{payingDoctor.doctor.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setPayingDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Information */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 p-3.5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-medium">Jumlah Pasien Ditangani:</span>
                <span className="font-black text-emerald-950">{payingDoctor.fees.length} Pasien</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-medium">Rincian Pasien:</span>
                <span className="font-bold text-emerald-900">
                  {payingDoctor.fees.filter(isFeeVip).length} VIP • {payingDoctor.fees.filter(f => !isFeeVip(f)).length} Reguler
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-800 font-medium">Total Nominal Fee:</span>
                <span className="font-black text-emerald-950 text-base font-mono">
                  {formatRupiah(payingDoctor.fees.reduce((sum, f) => sum + f.feeAmount, 0))}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-200/50 text-[11px] text-emerald-700 leading-tight">
                * Otomatis dicatat ke <strong>Beban Pengeluaran Operasional</strong> (Kategori: <em>Fee Dokter Khitan</em>) dan masuk ke Laporan Keuangan &amp; Laba Rugi klinik.
              </div>
            </div>

            {/* Payment Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={(e: any) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="TRANSFER">Transfer Bank / Rekening Dokter</option>
                  <option value="CASH">Kas Tunai Klinik</option>
                  <option value="QRIS">QRIS / Dompet Digital</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Misal: Fee dokter periode September 2026 via BCA"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPayingDoctor(null)}
                disabled={isSubmittingPay}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBatchPay}
                disabled={isSubmittingPay}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                {isSubmittingPay ? 'Memproses...' : 'Konfirmasi & Masukkan Beban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Slip Rekapitulasi Honorarium / Payroll Dokter */}
      {isSlipModalOpen && slipDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 no-print">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-800 rounded-xl">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Slip Honorarium Dokter Khitan</h3>
                  <p className="text-xs text-slate-500">Ringkasan resmi honorarium berdasarkan jumlah pasien (VIP &amp; Reguler)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={handleDownloadDoctorPdf}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  title="Unduh langsung sebagai berkas file PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPdf ? 'Mengunduh PDF...' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => openElementInNewTab('doctor-fee-slip-print', { title: 'Slip_Honorarium_' + slipDoctor.doctor.name.replace(/\s+/g, '_') })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  title="Buka pratinjau di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => printElementById('doctor-fee-slip-print', { title: 'Slip_Honorarium_' + slipDoctor.doctor.name.replace(/\s+/g, '_') })}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Slip</span>
                </button>

                <button 
                  onClick={() => setIsSlipModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Container (Simple tapi Profesional, Tanpa Daftar Pasien Perorangan) */}
            <div 
              id="doctor-fee-slip-print" 
              className="p-6 sm:p-7 bg-white border border-slate-200 rounded-2xl space-y-5 text-slate-800 text-xs font-sans print:border-none print:p-0"
            >
              {/* Slip Header / Kop Klinik Resmi */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-3.5">
                  <NanoMasterLogo 
                    src={settings?.logoUrl} 
                    height={48} 
                    width={60} 
                    className="max-h-[48px] max-w-[60px] object-contain shrink-0 print-kop-logo" 
                  />
                  <div>
                    <h2 className="font-black text-base text-slate-950 uppercase tracking-tight">
                      {settings?.clinicName || 'KLINIK KHITAN NANO MASTER MEDIKA'}
                    </h2>
                    <p className="text-[10px] text-slate-500 max-w-md leading-relaxed">
                      {settings?.address || 'Jl. Raya Utama No. 123'} • Telp: {settings?.phone || '0812-3456-7890'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-sky-800 text-white font-black text-[10px] tracking-wider uppercase rounded">
                    SLIP HONORARIUM DOKTER
                  </span>
                  <div className="text-[10px] text-slate-600 mt-1 font-mono font-bold">
                    NO: SLIP-DOC-{selectedPeriod.replace('-', '')}-{String(slipDoctor.doctor.id).padStart(3, '0')}
                  </div>
                </div>
              </div>

              {/* Doctor & Period Details */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50/90 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    Dokter Operator Penerima:
                  </div>
                  <div className="font-black text-sm text-slate-950">{slipDoctor.doctor.name}</div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    SIP: <span className="font-mono">{slipDoctor.doctor.sipNumber || '-'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Spesialisasi: {slipDoctor.doctor.specialty || slipDoctor.doctor.specialization || 'Dokter Operator Khitan'}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                    Periode Penggajian:
                  </div>
                  <div className="font-black text-sm text-sky-900 font-mono">
                    {selectedPeriod || 'Semua Periode'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Tanggal Cetak: <span className="font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    Status: {slipDoctor.fees.every(f => f.status === 'PAID') ? 'LUNAS (DIBAYARKAN)' : 'TERVERIFIKASI'}
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Honorarium (Simple & Profesional: Hanya Jumlah Pasien, Reguler, VIP, & Total) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200">
                  <span className="font-black uppercase tracking-wider text-slate-700">
                    Rincian Honorarium Berdasarkan Jumlah Pasien
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    Total: {slipDoctor.fees.length} Pasien
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5 w-10 text-center">No</th>
                        <th className="py-2.5 px-3.5">Kategori Pasien Tindakan</th>
                        <th className="py-2.5 px-3.5 text-center">Jumlah Pasien</th>
                        <th className="py-2.5 px-3.5 text-right">Tarif Fee / Pasien</th>
                        <th className="py-2.5 px-3.5 text-right">Subtotal Honorarium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {/* Pasien Reguler */}
                      <tr>
                        <td className="py-3 px-3.5 text-center text-slate-400 font-bold">1</td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900">Pasien Khitan Reguler</div>
                          <div className="text-[10px] text-slate-400">Tindakan khitan paket reguler / standar</div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-bold font-mono text-xs">
                            {slipDoctor.regulerCount} Pasien
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-700">
                          {formatRupiah(slipDoctor.regulerRate)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(slipDoctor.regulerTotal)}
                        </td>
                      </tr>

                      {/* Pasien VIP */}
                      <tr>
                        <td className="py-3 px-3.5 text-center text-slate-400 font-bold">2</td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-amber-950 flex items-center gap-1.5">
                            <span>👑 Pasien Khitan VIP</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-black border border-amber-200 uppercase">
                              VIP
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">Tindakan khitan paket eksklusif VIP modern</div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-bold font-mono text-xs">
                            {slipDoctor.vipCount} Pasien
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-700">
                          {formatRupiah(slipDoctor.vipRate)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-950">
                          {formatRupiah(slipDoctor.vipTotal)}
                        </td>
                      </tr>

                      {/* Fee Tambahan Manual jika ada */}
                      {(slipDoctor.manualTotal || 0) > 0 && (
                        <tr>
                          <td className="py-3 px-3.5 text-center text-slate-400 font-bold">3</td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-purple-950 flex items-center gap-1.5">
                              <span>✨ Fee Tambahan / Insentif Manual</span>
                              <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded font-black border border-purple-200 uppercase">
                                BONUS
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {slipDoctor.manualFees?.map(f => f.title || 'Fee Tambahan').join(', ') || 'Insentif / bonus tindakan'}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-md font-bold font-mono text-xs">
                              {slipDoctor.manualCount || 1} Item
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-400 text-[11px]">
                            -
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-purple-950">
                            {formatRupiah(slipDoctor.manualTotal || 0)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300 text-xs">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3.5 uppercase text-slate-700">
                          Total Komisi / Honorarium Bulan Ini:
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-900 font-bold">
                          {slipDoctor.regulerCount + slipDoctor.vipCount} Pasien {(slipDoctor.manualCount || 0) > 0 ? `+ ${slipDoctor.manualCount} Bonus` : ''}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-[11px] text-slate-500 font-normal">
                          ({slipDoctor.regulerCount} Reg + {slipDoctor.vipCount} VIP {(slipDoctor.manualTotal || 0) > 0 ? `+ Fee Tambahan` : ''})
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-sm text-sky-900">
                          {formatRupiah(slipDoctor.fees.reduce((sum, f) => sum + f.feeAmount, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Total Box */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-xl flex items-center justify-between border border-sky-800/40">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider block">
                    TOTAL HONORARIUM BERSIH DITERIMA
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {formatRupiah(slipDoctor.fees.reduce((sum, f) => sum + f.feeAmount, 0))}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Metode Pembayaran:</div>
                  <div className="text-xs font-bold text-white uppercase font-mono">Transfer Bank / Kas</div>
                </div>
              </div>

              {/* Terbilang */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="font-bold text-slate-600">Terbilang: </span>
                <span className="italic font-serif font-bold text-slate-800">
                  {terbilang(slipDoctor.fees.reduce((sum, f) => sum + f.feeAmount, 0))} Rupiah
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-6 gap-8 text-center text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Diserahkan Oleh (Keuangan):</div>
                  <div className="h-14"></div>
                  <div className="font-black text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[170px]">
                    ( {currentUser?.name || 'Bagian Keuangan'} )
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Diterima Oleh (Dokter Operator):</div>
                  <div className="h-14"></div>
                  <div className="font-black text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[170px]">
                    ( {slipDoctor.doctor.name} )
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-center text-slate-400 pt-3 border-t border-slate-100">
                Dokumen resmi slip honorarium dokter ini diterbitkan secara elektronik oleh Sistem Informasi Klinik Nano Circumcision.
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 no-print">
              <span className="text-[11px] text-slate-400">
                * Dokumen siap cetak ke printer atau simpan sebagai berkas PDF
              </span>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Fee Tambahan Manual Khusus Dokter */}
      {isManualModalOpen && selectedDoctorForManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Input Fee Tambahan Dokter
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {selectedDoctorForManual.name} • Periode {selectedPeriod || 'Berjalan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualFee} className="p-5 space-y-4 text-xs">
              {/* Doctor Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Dokter Penerima Fee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDoctorForManual.id}
                  onChange={(e) => {
                    const found = doctors.find(d => d.id === Number(e.target.value));
                    if (found) setSelectedDoctorForManual(found);
                  }}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization || 'Dokter Khitan'})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 leading-relaxed text-[11px]">
                💡 <strong>Catatan Komisi:</strong> Fee tambahan ini akan otomatis menyatu ke dalam total komisi dan slip honorarium dokter {selectedDoctorForManual.name} saat rekap bulanan ({selectedPeriod}).
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Fee Tambahan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={manualForm.feeAmount}
                    onChange={(e) => setManualForm({ ...manualForm, feeAmount: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="150000"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {[50000, 100000, 150000, 200000, 300000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, feeAmount: amt })}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded text-[10px] font-bold cursor-pointer"
                    >
                      +Rp {amt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Judul Fee */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul / Jenis Fee Tambahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Contoh: Fee Tindakan Khusus Kasus Penyulit"
                />
              </div>

              {/* Tanggal & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Fee
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.feeDate}
                    onChange={(e) => setManualForm({ ...manualForm, feeDate: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="APPROVED">APPROVED (Siap Cair)</option>
                    <option value="PENDING">PENDING (Menunggu)</option>
                  </select>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan / Alasan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Catatan tambahan alasan penambahan fee..."
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{isSubmittingManual ? 'Menyimpan...' : 'Simpan Fee Dokter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Master Print Document for Full Monthly Report */}
      <div id="master-doctor-payroll-print" className="hidden print:block p-6 text-xs font-sans text-slate-900">
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
          <h1 className="text-base font-black uppercase tracking-tight">
            {settings?.clinicName || 'KLINIK KHITAN NANO MASTER MEDIKA'}
          </h1>
          <p className="text-[10px] text-slate-500">
            {settings?.address || 'Jl. Raya Utama No. 123'} • Telp: {settings?.phone || '0812-3456-7890'}
          </p>
          <h2 className="text-sm font-bold uppercase mt-2 text-slate-800">
            REKAPITULASI LAPORAN FEE &amp; PAYROLL DOKTER OPERATOR KHITAN
          </h2>
          <p className="text-[10px] text-slate-600 font-mono">Periode: {selectedPeriod || 'Semua Periode'}</p>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-slate-300">
          <thead className="bg-slate-100 uppercase text-[10px]">
            <tr>
              <th className="border border-slate-300 p-2 text-center">No</th>
              <th className="border border-slate-300 p-2">Nama Dokter Operator</th>
              <th className="border border-slate-300 p-2 text-center">Pasien Reguler</th>
              <th className="border border-slate-300 p-2 text-center">Pasien VIP</th>
              <th className="border border-slate-300 p-2 text-center">Total Pasien</th>
              <th className="border border-slate-300 p-2 text-right">Total Fee Dokter</th>
              <th className="border border-slate-300 p-2 text-center">Status Afiliasi Beban</th>
            </tr>
          </thead>
          <tbody>
            {doctorSummaries.map((s, i) => (
              <tr key={s.doctor.id}>
                <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                <td className="border border-slate-300 p-2 font-bold">{s.doctor.name}</td>
                <td className="border border-slate-300 p-2 text-center">
                  {s.regulerCount} ps ({formatRupiah(s.regulerTotal)})
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold text-amber-900">
                  {s.vipCount} ps ({formatRupiah(s.vipTotal)})
                </td>
                <td className="border border-slate-300 p-2 text-center font-bold">{s.patientCount} Pasien</td>
                <td className="border border-slate-300 p-2 text-right font-bold font-mono">
                  {formatRupiah(s.feeTotal)}
                </td>
                <td className="border border-slate-300 p-2 text-center text-[10px]">
                  {s.paidCount === s.patientCount ? 'Lunas (Beban Pengeluaran)' : `${s.paidCount} Lunas, ${s.patientCount - s.paidCount} Belum Cair`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-black">
            <tr>
              <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase">Total Seluruh Dokter:</td>
              <td className="border border-slate-300 p-2 text-center">{totalRegulerPatients} ps ({formatRupiah(totalRegulerFee)})</td>
              <td className="border border-slate-300 p-2 text-center text-amber-900">{totalVipPatients} ps ({formatRupiah(totalVipFee)})</td>
              <td className="border border-slate-300 p-2 text-center">{totalPatients} Pasien</td>
              <td className="border border-slate-300 p-2 text-right font-mono text-sm">{formatRupiah(totalPeriodFee)}</td>
              <td className="border border-slate-300 p-2"></td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 pt-8 text-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Mengetahui (Pimpinan / Owner):</div>
            <div className="h-16"></div>
            <div className="font-bold border-t border-slate-400 inline-block min-w-[160px] pt-1">
              ( Ahmadur Ridho )
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Dibuat Oleh (Finance):</div>
            <div className="h-16"></div>
            <div className="font-bold border-t border-slate-400 inline-block min-w-[160px] pt-1">
              ( {currentUser?.name || 'Bendahara Klinik'} )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
