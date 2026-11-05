import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  DollarSign, Calendar, CheckCircle2, AlertCircle, 
  User, Plus, RefreshCw, FileText, X, ArrowRight, ShieldCheck,
  Clock, UserCheck, Edit3, Trash2, Save, Search, Check, CreditCard,
  Building, Sparkles, Layers, ExternalLink, Stethoscope, Award, Download
} from 'lucide-react';
import { PayrollItem } from '../../types';
import { NanoMasterLogo, PrintDocumentIcon } from '../common/PrintIcons';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';
import { downloadElementAsPdf } from '../../utils/pdfHelper';
import { DoctorPayrollReport } from './DoctorPayrollReport';

export const PayrollView: React.FC = () => {
  const { 
    payrolls, 
    doctorFees,
    procedures,
    generatePayroll, 
    updatePayroll, 
    deletePayroll, 
    payPayroll, 
    currentUser, 
    settings, 
    employees, 
    showToast 
  } = useClinic();

  // Active Tab: DOCTOR (Laporan Payroll Fee Dokter VIP/Reguler) or STAFF (Penggajian Staf & Karyawan)
  const [activePayrollTab, setActivePayrollTab] = useState<'DOCTOR' | 'STAFF'>('DOCTOR');

  // Selected period (format YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PAID'>('ALL');

  // Modals state
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollItem | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  
  // Quick/Full Generate Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<'ALL' | string>('ALL');
  const [generateForm, setGenerateForm] = useState({
    periodMonth: selectedPeriod,
    employeeId: 'ALL',
    closingPatientCount: 0,
    closingFeePerPatient: 50000,
    overtimeHours: 0,
    overtimeHourlyRate: 25000,
    bonusAmount: 0,
    deductionAmount: 0,
    paymentMethod: 'TRANSFER',
    notes: '',
  });

  // Edit Modal State
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    closingPatientCount: 0,
    closingFeePerPatient: 50000,
    overtimeHours: 0,
    overtimeHourlyRate: 25000,
    bonusAmount: 0,
    deductionAmount: 0,
    paymentMethod: 'TRANSFER',
    notes: '',
  });

  // Pay Modal State
  const [payingPayroll, setPayingPayroll] = useState<PayrollItem | null>(null);
  const [payMethod, setPayMethod] = useState<'TRANSFER' | 'CASH' | 'QRIS'>('TRANSFER');
  const [payNotes, setPayNotes] = useState('');
  const [isPayingSubmitting, setIsPayingSubmitting] = useState(false);

  // Delete Modal State
  const [deletingPayroll, setDeletingPayroll] = useState<PayrollItem | null>(null);
  const [isDeletingSubmitting, setIsDeletingSubmitting] = useState(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Filter payrolls by period, search query, and status
  const filteredPayrolls = payrolls.filter((p) => {
    const matchesPeriod = !selectedPeriod || p.periodMonth === selectedPeriod;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch = !searchQuery.trim() || 
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payrollNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPeriod && matchesStatus && matchesSearch;
  });

  // 1-Click Quick Generate for all active employees
  const handleQuickGenerateAll = async () => {
    if (!selectedPeriod) {
      showToast('Pilih periode bulan terlebih dahulu', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generatePayroll(selectedPeriod);
      if (res && res.success) {
        showToast(`Kalkulasi payroll periode ${selectedPeriod} berhasil diperbarui!`, 'success');
      }
    } catch (err: any) {
      showToast('Gagal generate payroll: ' + (err.message || String(err)), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Generate Modal
  const handleOpenGenerateModal = () => {
    setGenerateTarget('ALL');
    setGenerateForm({
      periodMonth: selectedPeriod,
      employeeId: 'ALL',
      closingPatientCount: 0,
      closingFeePerPatient: 50000,
      overtimeHours: 0,
      overtimeHourlyRate: 25000,
      bonusAmount: 0,
      deductionAmount: 0,
      paymentMethod: 'TRANSFER',
      notes: '',
    });
    setIsGenerateModalOpen(true);
  };

  // Submit Generate Form (Single or All)
  const handleSubmitGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      if (generateTarget === 'ALL') {
        const res = await generatePayroll(generateForm.periodMonth);
        if (res && res.success) {
          setIsGenerateModalOpen(false);
        }
      } else {
        const empId = Number(generateTarget);
        const res = await generatePayroll({
          periodMonth: generateForm.periodMonth,
          employeeId: empId,
          closingPatientCount: Number(generateForm.closingPatientCount) || 0,
          closingFeePerPatient: Number(generateForm.closingFeePerPatient) || 50000,
          overtimeHours: Number(generateForm.overtimeHours) || 0,
          overtimeHourlyRate: Number(generateForm.overtimeHourlyRate) || 25000,
          bonusAmount: Number(generateForm.bonusAmount) || 0,
          deductionAmount: Number(generateForm.deductionAmount) || 0,
          paymentMethod: generateForm.paymentMethod,
          notes: generateForm.notes,
        });
        if (res && res.success) {
          setIsGenerateModalOpen(false);
        }
      }
    } catch (err: any) {
      showToast('Gagal proses payroll: ' + (err.message || String(err)), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PayrollItem) => {
    if (item.status === 'PAID') {
      showToast('Payroll yang sudah berstatus PAID tidak dapat diubah.', 'error');
      return;
    }
    setEditingPayroll(item);
    setEditForm({
      basicSalary: item.basicSalary || 0,
      closingPatientCount: item.closingPatientCount || 0,
      closingFeePerPatient: item.closingFeePerPatient || 50000,
      overtimeHours: item.overtimeHours || 0,
      overtimeHourlyRate: item.overtimeHourlyRate || 25000,
      bonusAmount: item.bonusAmount || 0,
      deductionAmount: item.deductionAmount || 0,
      paymentMethod: item.paymentMethod || 'TRANSFER',
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    setIsSavingEdit(true);
    try {
      await updatePayroll(editingPayroll.id, editForm);
      setIsEditModalOpen(false);
      setEditingPayroll(null);
    } catch (err: any) {
      showToast('Gagal menyimpan perubahan: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit Pay
  const handleConfirmPay = async () => {
    if (!payingPayroll) return;
    setIsPayingSubmitting(true);
    try {
      await payPayroll(payingPayroll.id, {
        paymentMethod: payMethod,
        notes: payNotes || `Pelunasan gaji via ${payMethod}`,
      });
      setPayingPayroll(null);
    } catch (err: any) {
      showToast('Gagal melunasi gaji: ' + (err.message || String(err)), 'error');
    } finally {
      setIsPayingSubmitting(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    if (!deletingPayroll) return;
    setIsDeletingSubmitting(true);
    try {
      await deletePayroll(deletingPayroll.id);
      setDeletingPayroll(null);
    } catch (err: any) {
      showToast('Gagal menghapus payroll: ' + (err.message || String(err)), 'error');
    } finally {
      setIsDeletingSubmitting(false);
    }
  };

  const handleViewSlip = (item: PayrollItem) => {
    setSelectedPayroll(item);
    setIsSlipModalOpen(true);
  };

  const handlePrint = () => {
    if (!selectedPayroll) return;
    printElementById('payroll-slip-print-document', {
      title: `Slip Gaji - ${selectedPayroll.employeeName} (${selectedPayroll.payrollNumber})`,
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  const handleOpenSlipNewTab = () => {
    if (!selectedPayroll) return;
    openElementInNewTab('payroll-slip-print-document', {
      title: `Slip Gaji - ${selectedPayroll.employeeName} (${selectedPayroll.payrollNumber})`,
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Number to Words (Terbilang Rupiah)
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

  // Calculate patient breakdown (Reguler & VIP & Total) for selected employee payroll
  const getEmployeePatientBreakdown = (payroll: PayrollItem) => {
    const matchedProcedures = procedures.filter(p => 
      (p.assistantId === payroll.employeeId || p.assistantName === payroll.employeeName) &&
      p.procedureDate && p.procedureDate.startsWith(payroll.periodMonth)
    );
    
    if (matchedProcedures.length > 0) {
      const vipCount = matchedProcedures.filter(p => {
        const cat = `${p.categoryCode || ''} ${p.categoryName || ''} ${p.packageName || ''}`.toUpperCase();
        return cat.includes('VIP');
      }).length;
      const regulerCount = matchedProcedures.length - vipCount;
      return {
        total: payroll.patientCount || matchedProcedures.length,
        reguler: regulerCount,
        vip: vipCount,
      };
    }

    return {
      total: payroll.patientCount || 0,
      reguler: payroll.patientCount || 0,
      vip: 0,
    };
  };

  // Download PDF handler for Employee Slip
  const handleDownloadEmployeePdf = async () => {
    if (!selectedPayroll) return;
    try {
      setIsDownloadingPdf(true);
      showToast('Menyiapkan berkas PDF Slip Gaji Karyawan...', 'info');
      const cleanName = selectedPayroll.employeeName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Slip_Gaji_${cleanName}_${selectedPayroll.periodMonth}.pdf`;
      const res = await downloadElementAsPdf('payroll-slip-print-document', {
        filename,
        margin: [8, 8, 8, 8],
        format: 'a4',
        orientation: 'portrait',
      });
      if (res.success) {
        showToast('Slip gaji karyawan berhasil diunduh dalam format PDF!', 'success');
      } else {
        showToast('Gagal mengunduh PDF: ' + (res.error || 'Terjadi kesalahan sistem'), 'error');
      }
    } catch (err: any) {
      showToast('Gagal mengunduh PDF: ' + (err.message || String(err)), 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Summary Metrics
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalPaid = filteredPayrolls.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const pendingCount = filteredPayrolls.filter(p => p.status !== 'PAID').length;
  const totalPatientFees = filteredPayrolls.reduce((sum, p) => sum + (p.patientFeeTotal || 0), 0);
  const totalClosingFees = filteredPayrolls.reduce((sum, p) => sum + (p.closingFeeTotal || 0), 0);
  const totalOvertimeFees = filteredPayrolls.reduce((sum, p) => sum + (p.overtimeTotal || 0), 0);

  // Live calculation preview in Edit Modal
  const previewNetSalary = editingPayroll 
    ? (Number(editForm.basicSalary) || 0) +
      (editingPayroll.patientFeeTotal || 0) +
      ((Number(editForm.closingPatientCount) || 0) * (Number(editForm.closingFeePerPatient) || 0)) +
      ((Number(editForm.overtimeHours) || 0) * (Number(editForm.overtimeHourlyRate) || 0)) +
      (Number(editForm.bonusAmount) || 0) -
      (Number(editForm.deductionAmount) || 0)
    : 0;

  // Selected employee in Generate Modal
  const selectedGenerateEmp = generateTarget !== 'ALL' 
    ? employees.find(e => e.id === Number(generateTarget))
    : null;

  // Doctor fee summary for Tab Pill
  const periodDoctorFees = (doctorFees || []).filter(
    (f) => (!selectedPeriod || f.feeDate.startsWith(selectedPeriod)) && f.status !== 'CANCELLED'
  );
  const totalDoctorFeeAmount = periodDoctorFees.reduce((sum, f) => sum + f.feeAmount, 0);
  const totalDoctorPatients = periodDoctorFees.length;

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Laporan Fee Dokter (VIP & Reguler) vs Penggajian Staf */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActivePayrollTab('DOCTOR')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePayrollTab === 'DOCTOR'
              ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activePayrollTab === 'DOCTOR' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            <Stethoscope className="w-4 h-4" />
          </div>
          <span>Laporan Payroll &amp; Fee Dokter (VIP &amp; Reguler)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 font-mono">
            {formatRupiah(totalDoctorFeeAmount)} ({totalDoctorPatients} Pasien)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePayrollTab('STAFF')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activePayrollTab === 'STAFF'
              ? 'bg-white text-orange-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activePayrollTab === 'STAFF' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            <DollarSign className="w-4 h-4" />
          </div>
          <span>Penggajian Staf &amp; Karyawan</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300 font-mono">
            {filteredPayrolls.length} Staf
          </span>
        </button>
      </div>

      {activePayrollTab === 'DOCTOR' ? (
        <DoctorPayrollReport 
          selectedPeriod={selectedPeriod} 
          onPeriodChange={(p) => {
            setSelectedPeriod(p);
            setGenerateForm(prev => ({ ...prev, periodMonth: p }));
          }} 
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-700 rounded-xl font-bold">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              Sistem Penggajian &amp; Payroll Karyawan
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Kalkulasi otomatis gaji pokok, komisi asisten tindakan, fee closing pasien langsung, uang lembur per jam, dan cetak slip gaji resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setGenerateForm(prev => ({ ...prev, periodMonth: e.target.value }));
              }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleQuickGenerateAll}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Kalkulasi otomatis semua karyawan aktif"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Menghitung...' : 'Hitung Semua Staf'}</span>
          </button>

          <button
            onClick={handleOpenGenerateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat / Kustomisasi Payroll</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Beban Gaji</span>
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{formatRupiah(totalNet)}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Periode {selectedPeriod} ({filteredPayrolls.length} staf)</p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Asisten Khitan</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">{formatRupiah(totalPatientFees)}</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Tindakan khitan selesai</p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Closing Pasien</span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-700 mt-1">{formatRupiah(totalClosingFees)}</div>
          <p className="text-[10px] text-amber-600 mt-0.5">Daftar langsung klinik</p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Lembur (Jam)</span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-700 mt-1">{formatRupiah(totalOvertimeFees)}</div>
          <p className="text-[10px] text-purple-600 mt-0.5">Akumulasi jam lembur</p>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Pencairan</span>
            <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-teal-700 mt-1">{formatRupiah(totalPaid)}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">{pendingCount} menunggu pembayaran</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau nomor payroll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
          {(['ALL', 'DRAFT', 'PAID'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Daftar Rekapitulasi Slip Gaji Periode: {selectedPeriod}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gaji pokok, komisi asisten tindakan, fee closing pasien langsung, uang lembur, dan bonus karyawan
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded-full">
            {filteredPayrolls.length} Penerima Gaji
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">No. Payroll</th>
                <th className="py-2.5 px-3">Nama Staf</th>
                <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                <th className="py-2.5 px-3 text-right">Fee Tindakan</th>
                <th className="py-2.5 px-3 text-right">Fee Closing</th>
                <th className="py-2.5 px-3 text-right">Fee Lembur</th>
                <th className="py-2.5 px-3 text-right">Bonus / Pot.</th>
                <th className="py-2.5 px-3 text-right">Gaji Bersih (THP)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Belum ada data slip payroll untuk periode {selectedPeriod}.</p>
                      <p className="text-xs text-slate-500">
                        Klik tombol di bawah ini untuk mengkalkulasi otomatis dari data klinik atau memasukkan rincian penggajian baru.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={handleQuickGenerateAll}
                          disabled={isGenerating}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                          <span>Hitung Otomatis Semua Staf</span>
                        </button>
                        <button
                          onClick={handleOpenGenerateModal}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          + Kustomisasi Payroll
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-orange-700">
                      {item.payrollNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">{item.employeeName}</div>
                      <div className="text-[10px] text-slate-400">Metode: {item.paymentMethod || 'TRANSFER'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 text-xs">
                      {formatRupiah(item.basicSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-emerald-700 text-xs">{formatRupiah(item.patientFeeTotal || 0)}</div>
                      <div className="text-[10px] text-slate-400">{item.patientCount || 0} pasien khitan</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-amber-600 text-xs">{formatRupiah(item.closingFeeTotal || 0)}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.closingPatientCount || 0} pasien @ {formatRupiah(item.closingFeePerPatient || 50000)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-purple-700 text-xs">{formatRupiah(item.overtimeTotal || 0)}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.overtimeHours || 0} jam @ {formatRupiah(item.overtimeHourlyRate || 25000)}/jam
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs">
                      <div className="text-emerald-700 font-semibold text-[11px]">+{formatRupiah(item.bonusAmount || 0)}</div>
                      <div className="text-rose-600 font-semibold text-[11px]">-{formatRupiah(item.deductionAmount || 0)}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs sm:text-sm">
                      {formatRupiah(item.netSalary)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewSlip(item)}
                          className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Lihat &amp; Cetak Slip Gaji"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-600" />
                          <span>Slip</span>
                        </button>
                        {item.status !== 'PAID' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                              title="Sesuaikan Closing, Lembur &amp; Bonus"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setPayingPayroll(item);
                                setPayMethod((item.paymentMethod as any) || 'TRANSFER');
                                setPayNotes(`Pelunasan gaji periode ${item.periodMonth}`);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                              title="Bayar dan Tandai Lunas"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => setDeletingPayroll(item)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Draf Payroll"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {/* MODAL 1: Generate / Kustomisasi Payroll */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[94vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Kalkulasi &amp; Generate Payroll
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hitung komisi tindakan asisten, fee closing pasien langsung, dan uang lembur per jam
                </p>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGenerate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Periode Bulan:
                  </label>
                  <input
                    type="month"
                    required
                    value={generateForm.periodMonth}
                    onChange={(e) => setGenerateForm({ ...generateForm, periodMonth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Karyawan:
                  </label>
                  <select
                    value={generateTarget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGenerateTarget(val);
                      if (val !== 'ALL') {
                        const found = employees.find(emp => emp.id === Number(val));
                        if (found) {
                          setGenerateForm(prev => ({
                            ...prev,
                            closingFeePerPatient: found.closingFeePerPatient || 50000,
                            overtimeHourlyRate: found.overtimeHourlyRate || 25000,
                          }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Karyawan Aktif (Kolektif)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific employee granular options */}
              {generateTarget !== 'ALL' && selectedGenerateEmp && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      Pengaturan Spesifik: {selectedGenerateEmp.name}
                    </span>
                    <span className="text-[11px] font-semibold text-orange-700">
                      Gaji Pokok Master: {formatRupiah(selectedGenerateEmp.basicSalary)}
                    </span>
                  </div>

                  {/* Closing Pasien */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Pasien Closing (Daftar Langsung):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generateForm.closingPatientCount}
                        onChange={(e) => setGenerateForm({ ...generateForm, closingPatientCount: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tarif per Closing (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generateForm.closingFeePerPatient}
                        onChange={(e) => setGenerateForm({ ...generateForm, closingFeePerPatient: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Overtime */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jam Lembur (Jam):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={generateForm.overtimeHours}
                        onChange={(e) => setGenerateForm({ ...generateForm, overtimeHours: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tarif Lembur per Jam (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generateForm.overtimeHourlyRate}
                        onChange={(e) => setGenerateForm({ ...generateForm, overtimeHourlyRate: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Bonus & Potongan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Bonus / Insentif (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generateForm.bonusAmount}
                        onChange={(e) => setGenerateForm({ ...generateForm, bonusAmount: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Potongan / Kasbon (Rp):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={generateForm.deductionAmount}
                        onChange={(e) => setGenerateForm({ ...generateForm, deductionAmount: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Metode Pembayaran &amp; Catatan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={generateForm.paymentMethod}
                        onChange={(e) => setGenerateForm({ ...generateForm, paymentMethod: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="TRANSFER">Transfer Rekening Bank</option>
                        <option value="CASH">Kasir Tunai</option>
                        <option value="QRIS">QRIS / E-Wallet</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Catatan transfer..."
                        value={generateForm.notes}
                        onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Helpful notice */}
              <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-orange-950">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                  Kalkulasi Otomatis Sistem:
                </p>
                <p className="text-[11px] text-orange-800">
                  Komisi tindakan asisten khitan yang berstatus PENDING pada bulan ini akan otomatis diakumulasikan dan diubah menjadi bagian slip gaji.
                </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Memproses...' : 'Hitung &amp; Generate Slip Gaji'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Payroll Modal */}
      {isEditModalOpen && editingPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[94vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Sesuaikan Payroll: {editingPayroll.employeeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {editingPayroll.payrollNumber} • Periode {editingPayroll.periodMonth}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gaji Pokok (Rp)
                </label>
                <input
                  type="number"
                  value={editForm.basicSalary}
                  onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Fee Tindakan Khitan (Readonly info) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Fee Asisten Tindakan ({editingPayroll.patientCount || 0} Pasien)</span>
                  <span className="text-slate-400 text-[11px]">Dihitung otomatis dari log tindakan asisten khitan</span>
                </div>
                <span className="font-black text-emerald-700 text-sm">{formatRupiah(editingPayroll.patientFeeTotal || 0)}</span>
              </div>

              {/* Fee Closing Pasien */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-950">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fee Closing Pasien (Daftar Langsung ke Klinik)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jumlah Pasien Closing
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.closingPatientCount}
                      onChange={(e) => setEditForm({ ...editForm, closingPatientCount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarif per Pasien (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.closingFeePerPatient}
                      onChange={(e) => setEditForm({ ...editForm, closingFeePerPatient: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-black text-amber-800 pt-1 border-t border-amber-200/60">
                  Subtotal Closing: {formatRupiah(editForm.closingPatientCount * editForm.closingFeePerPatient)}
                </div>
              </div>

              {/* Fee Lembur */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-950">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Fee Lembur Karyawan (Dihitung Per Jam)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jumlah Jam Lembur
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editForm.overtimeHours}
                      onChange={(e) => setEditForm({ ...editForm, overtimeHours: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarif per Jam (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.overtimeHourlyRate}
                      onChange={(e) => setEditForm({ ...editForm, overtimeHourlyRate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="text-right text-xs font-black text-purple-800 pt-1 border-t border-purple-200/60">
                  Subtotal Lembur: {formatRupiah(editForm.overtimeHours * editForm.overtimeHourlyRate)}
                </div>
              </div>

              {/* Bonus & Potongan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bonus / Insentif (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.bonusAmount}
                    onChange={(e) => setEditForm({ ...editForm, bonusAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Potongan / Kasbon (Rp)
                  </label>
                  <input
                    type="number"
                    value={editForm.deductionAmount}
                    onChange={(e) => setEditForm({ ...editForm, deductionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Slip Gaji
                </label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Keterangan lembur shift sore, bonus target dsb."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Total THP Live Calculation */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Estimasi Gaji Bersih (THP)
                  </span>
                  <span className="text-base font-black text-orange-400">
                    {formatRupiah(previewNetSalary)}
                  </span>
                </div>
                <Save className="w-4 h-4 text-orange-400" />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* MODAL 3: Pay / Finalize Modal */}
      {payingPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[94vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-white">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Konfirmasi Pembayaran Gaji</span>
              </div>
              <button
                onClick={() => setPayingPayroll(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Nominal yang Dibayarkan:
                </span>
                <div className="text-xl font-black text-emerald-700">
                  {formatRupiah(payingPayroll.netSalary)}
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  {payingPayroll.employeeName} ({payingPayroll.payrollNumber})
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Metode Pencairan:
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer text-xs"
                  >
                    <option value="TRANSFER">Transfer Bank (BCA, Mandiri, BSI, dll.)</option>
                    <option value="CASH">Tunai / Kasir Operasional</option>
                    <option value="QRIS">QRIS / E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan / Bukti Referensi Transfer:
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Contoh: Transfer via KlikBCA Ref: 89201"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs"
                  />
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  *Status slip gaji akan ditandai LUNAS (PAID) dan seluruh transaksi fee tindakan asisten terkait akan ditandai lunas.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setPayingPayroll(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPayingSubmitting}
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isPayingSubmitting ? 'Memproses...' : 'Konfirmasi Pelunasan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal */}
      {deletingPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                Hapus Draf Slip Payroll?
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Hapus slip <span className="font-bold text-slate-700">{deletingPayroll.payrollNumber}</span> untuk <span className="font-bold text-slate-700">{deletingPayroll.employeeName}</span>?
              </p>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 text-left mt-2 leading-relaxed">
                Fee tindakan asisten yang terhubung akan otomatis dikembalikan ke status PENDING agar bisa dikalkulasi ulang pada periode penggajian berikutnya.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingPayroll(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isDeletingSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Printable Slip Gaji Modal */}
      {isSlipModalOpen && selectedPayroll && (() => {
        const ptBreakdown = getEmployeePatientBreakdown(selectedPayroll);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print-modal-overlay">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto print-modal-card print:border-none print:shadow-none print:max-h-none print:p-0">
              {/* Header / Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Pratinjau Slip Gaji Karyawan</h3>
                    <p className="text-xs text-slate-500">Rincian resmi gaji &amp; komisi tindakan khitan</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={handleDownloadEmployeePdf}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                    title="Unduh langsung sebagai berkas file PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPdf ? 'Mengunduh...' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSlipNewTab}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Buka pratinjau di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tab Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <PrintDocumentIcon size={15} />
                    <span>Cetak Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSlipModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Area (Simple & Profesional, Tanpa Daftar Pasien Perorangan) */}
              <div id="payroll-slip-print-document" className="print-area space-y-5 text-slate-800 border p-6 sm:p-7 rounded-2xl border-slate-200 bg-white print:border-none print:p-0">
                {/* Slip Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <NanoMasterLogo 
                      src={settings.logoUrl} 
                      height={48} 
                      width={60} 
                      className="max-h-[48px] max-w-[60px] object-contain shrink-0 print-kop-logo" 
                    />
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                        {settings.clinicName || 'NANO CIRCUMCISION'}
                      </h2>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        {settings.address || 'Klinik Khitan Modern Spesialis'} • Telp: {settings.phone || '0812-3456-7890'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 text-white text-[10px] font-black uppercase tracking-wider rounded">
                      SLIP GAJI KARYAWAN
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                      {selectedPayroll.payrollNumber}
                    </div>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Nama Karyawan:</span>
                    <span className="font-bold text-sm text-slate-900">{selectedPayroll.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Periode Penggajian:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedPayroll.periodMonth}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Tanggal Pembayaran:</span>
                    <span className="font-bold text-slate-800">{selectedPayroll.paymentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status Pembayaran:</span>
                    <span className="font-black text-emerald-700">{selectedPayroll.status}</span>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>Rincian Penghasilan, Komisi &amp; Lembur</span>
                    <span className="text-[10px] text-slate-400 font-normal">Tanpa data per pasien (Ringkasan Resmi)</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    {/* Gaji Pokok */}
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">Gaji Pokok Staf &amp; Karyawan</span>
                      <span className="font-bold text-slate-900 font-mono">{formatRupiah(selectedPayroll.basicSalary)}</span>
                    </div>

                    {/* Komisi Asisten Tindakan (Jumlah Pasien, Reguler, VIP, Total) */}
                    <div className="flex justify-between py-1.5 border-b border-slate-100 bg-sky-50/50 px-2 rounded-lg">
                      <div>
                        <div className="text-slate-800 font-bold flex items-center gap-1.5">
                          <span>Komisi Asisten Tindakan Khitan</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-800 font-mono font-bold rounded">
                            {ptBreakdown.total} Pasien
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Rincian: <strong className="text-slate-700">{ptBreakdown.reguler} Pasien Reguler</strong> • <strong className="text-amber-800">{ptBreakdown.vip} Pasien VIP</strong>
                        </div>
                      </div>
                      <span className="font-black text-emerald-700 self-center font-mono text-sm">
                        +{formatRupiah(selectedPayroll.patientFeeTotal || 0)}
                      </span>
                    </div>

                    {/* Fee Closing Pasien */}
                    {selectedPayroll.closingFeeTotal > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100 px-2">
                        <div>
                          <span className="text-amber-950 font-bold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                            Fee Closing Pasien (Daftar Langsung ke Klinik)
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Jumlah: <strong>{selectedPayroll.closingPatientCount || 0} Pasien</strong> @ {formatRupiah(selectedPayroll.closingFeePerPatient || 50000)}
                          </span>
                        </div>
                        <span className="font-bold text-amber-600 self-center font-mono">
                          +{formatRupiah(selectedPayroll.closingFeeTotal || 0)}
                        </span>
                      </div>
                    )}

                    {/* Fee Lembur */}
                    {selectedPayroll.overtimeTotal > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100 px-2">
                        <div>
                          <span className="text-purple-950 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            Fee Lembur Karyawan
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Jumlah: <strong>{selectedPayroll.overtimeHours || 0} Jam</strong> @ {formatRupiah(selectedPayroll.overtimeHourlyRate || 25000)} / Jam
                          </span>
                        </div>
                        <span className="font-bold text-purple-700 self-center font-mono">
                          +{formatRupiah(selectedPayroll.overtimeTotal || 0)}
                        </span>
                      </div>
                    )}

                    {selectedPayroll.bonusAmount > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100 px-2">
                        <span className="text-slate-700 font-medium">Bonus Prestasi / Insentif Operasional</span>
                        <span className="font-bold text-emerald-700 font-mono">+{formatRupiah(selectedPayroll.bonusAmount)}</span>
                      </div>
                    )}

                    {selectedPayroll.deductionAmount > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100 px-2">
                        <span className="text-slate-700 font-medium">Potongan Absensi / Kasbon Karyawan</span>
                        <span className="font-bold text-rose-600 font-mono">-{formatRupiah(selectedPayroll.deductionAmount)}</span>
                      </div>
                    )}

                    {selectedPayroll.notes && (
                      <div className="py-1 text-slate-500 italic text-[11px]">
                        Catatan: {selectedPayroll.notes}
                      </div>
                    )}
                  </div>

                  {/* Net Total Box */}
                  <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-xl flex items-center justify-between border border-purple-800/30">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-orange-300 block tracking-wider">
                        TOTAL GAJI BERSIH (TAKE HOME PAY)
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                        {formatRupiah(selectedPayroll.netSalary)}
                      </span>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-orange-400 opacity-90" />
                  </div>

                  {/* Terbilang */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <span className="font-bold text-slate-600">Terbilang: </span>
                    <span className="italic font-serif font-bold text-slate-800">
                      {terbilang(selectedPayroll.netSalary)} Rupiah
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Penerima (Karyawan),</div>
                    <div className="h-14"></div>
                    <div className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[150px]">
                      {selectedPayroll.employeeName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Manajemen / Keuangan,</div>
                    <div className="h-14"></div>
                    <div className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[150px]">
                      {settings.clinicName || 'NANO CIRCUMCISION'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-[10px] text-center text-slate-400 pt-3 border-t border-slate-100">
                  Dokumen resmi penggajian ini diterbitkan secara elektronik oleh Sistem Informasi Klinik Nano Circumcision.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
