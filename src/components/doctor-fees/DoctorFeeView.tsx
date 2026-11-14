import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Stethoscope, CheckCircle2, Clock, Filter, DollarSign, 
  UserCheck, AlertCircle, ShieldCheck, ArrowUpRight, Plus,
  FileText, Trash2, X, Sparkles, User, Calendar, Tag,
  Settings, RefreshCw, Layers, Search, Save, Edit3, Sliders,
  Check, Activity, Award, CreditCard, ChevronRight
} from 'lucide-react';
import { DoctorMethodFeeRule, PatientConditionType } from '../../types';

export const DoctorFeeView: React.FC = () => {
  const { 
    doctorFees, 
    doctors, 
    patients,
    doctorMethodFees,
    circumcisionMethods,
    updateDoctorFeeStatus, 
    createDoctorFee,
    deleteDoctorFee,
    payDoctorFeesBatch,
    saveDoctorMethodFeesBatch,
    createDoctorMethodFeeRule,
    updateDoctorMethodFeeRule,
    deleteDoctorMethodFeeRule,
    syncDoctorMethodFeesWithPending,
    currentUser, 
    showToast 
  } = useClinic();

  // Active Main View Tab: 'TRANSACTIONS' | 'METHOD_RATES' | 'DOCTOR_SUMMARY'
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'METHOD_RATES' | 'DOCTOR_SUMMARY'>('TRANSACTIONS');

  // Filters for Transactions
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'PROCEDURE' | 'MANUAL_ADDITIONAL'>('ALL');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');

  // Filters for Method Rates Configuration
  const [rateDoctorFilter, setRateDoctorFilter] = useState<string>('GLOBAL'); // 'GLOBAL' (semua dokter) or specific doctorId
  const [searchMethodQuery, setSearchMethodQuery] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL'); // 'ALL' | 'STANDAR' | 'GEMUK' | 'ABK' | 'DEWASA'

  // Editable Method Rates local state (for fast responsive inline editing & batch saving)
  const [editedRates, setEditedRates] = useState<Record<number, { regulerFee: number; vipFee: number; description?: string }>>({});
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [isSyncingPending, setIsSyncingPending] = useState(false);

  // Modal: Input Fee Tambahan Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    doctorId: doctors[0]?.id ? String(doctors[0].id) : '',
    feeAmount: 150000,
    feeDate: new Date().toISOString().slice(0, 10),
    title: 'Fee Tindakan Khusus / Kasus Penyulit',
    notes: '',
    patientId: '',
    status: 'APPROVED' as 'PENDING' | 'APPROVED',
  });

  // Modal: Tambah Aturan Metode Baru
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [isSubmittingNewRule, setIsSubmittingNewRule] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    doctorId: 'GLOBAL',
    methodName: 'Metode Glans Pro Bipolar Pensealer',
    patientCondition: 'GEMUK',
    regulerFee: 400000,
    vipFee: 500000,
    description: '',
  });

  // Modal: Batch Payment
  const [isBatchPayModalOpen, setIsBatchPayModalOpen] = useState(false);
  const [isSubmittingBatchPay, setIsSubmittingBatchPay] = useState(false);
  const [batchPayDoctorId, setBatchPayDoctorId] = useState<number>(doctors[0]?.id || 1);
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<'TRANSFER' | 'CASH'>('TRANSFER');
  const [batchPaymentNotes, setBatchPaymentNotes] = useState('');

  const [processingFeeId, setProcessingFeeId] = useState<number | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // ---------------- FILTERED TRANSACTIONS ----------------
  const filteredFees = useMemo(() => {
    return doctorFees.filter((f) => {
      const matchesDoctor = selectedDoctorFilter === 'ALL' || String(f.doctorId) === selectedDoctorFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || f.status === selectedStatusFilter;
      const matchesType = selectedTypeFilter === 'ALL' || 
        (selectedTypeFilter === 'MANUAL_ADDITIONAL' ? f.feeType === 'MANUAL_ADDITIONAL' : f.feeType !== 'MANUAL_ADDITIONAL');
      
      let matchesMethod = true;
      if (selectedMethodFilter !== 'ALL') {
        const itemMethod = (f.methodName || f.packageName || '').toLowerCase();
        matchesMethod = itemMethod.includes(selectedMethodFilter.toLowerCase());
      }

      return matchesDoctor && matchesStatus && matchesType && matchesMethod;
    });
  }, [doctorFees, selectedDoctorFilter, selectedStatusFilter, selectedTypeFilter, selectedMethodFilter]);

  // Aggregates for Transaction Summary
  const totalAllFees = filteredFees.reduce((acc, curr) => acc + curr.feeAmount, 0);
  const procedureFees = filteredFees.filter(f => f.feeType !== 'MANUAL_ADDITIONAL');
  const manualAdditionalFees = filteredFees.filter(f => f.feeType === 'MANUAL_ADDITIONAL');
  const manualTotal = manualAdditionalFees.reduce((acc, curr) => acc + curr.feeAmount, 0);
  const pendingTotal = filteredFees.filter(f => f.status === 'PENDING').reduce((acc, curr) => acc + curr.feeAmount, 0);
  const approvedTotal = filteredFees.filter(f => f.status === 'APPROVED').reduce((acc, curr) => acc + curr.feeAmount, 0);
  const paidTotal = filteredFees.filter(f => f.status === 'PAID').reduce((acc, curr) => acc + curr.feeAmount, 0);

  // ---------------- FILTERED METHOD RULES ----------------
  const filteredMethodRules = useMemo(() => {
    return doctorMethodFees.filter(r => {
      // Doctor filter
      if (rateDoctorFilter === 'GLOBAL' && r.doctorId !== null) return false;
      if (rateDoctorFilter !== 'GLOBAL' && rateDoctorFilter !== 'ALL') {
        if (r.doctorId !== Number(rateDoctorFilter) && r.doctorId !== null) return false;
      }

      // Condition filter
      if (conditionFilter !== 'ALL' && r.patientCondition !== conditionFilter) return false;

      // Search method query
      if (searchMethodQuery.trim()) {
        const q = searchMethodQuery.toLowerCase();
        const m = (r.methodName || '').toLowerCase();
        const c = (r.patientCondition || '').toLowerCase();
        const d = (r.description || '').toLowerCase();
        if (!m.includes(q) && !c.includes(q) && !d.includes(q)) return false;
      }

      return true;
    });
  }, [doctorMethodFees, rateDoctorFilter, conditionFilter, searchMethodQuery]);

  // Group rules by Method Name
  const groupedMethodRules = useMemo(() => {
    const groups: Record<string, DoctorMethodFeeRule[]> = {};
    for (const rule of filteredMethodRules) {
      const key = rule.methodName || 'Metode Khitan Modern';
      if (!groups[key]) groups[key] = [];
      groups[key].push(rule);
    }
    // Sort conditions inside each group: STANDAR -> GEMUK -> ABK -> DEWASA
    const conditionOrder: Record<string, number> = { 'STANDAR': 1, 'GEMUK': 2, 'ABK': 3, 'DEWASA': 4 };
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const ordA = conditionOrder[a.patientCondition] || 99;
        const ordB = conditionOrder[b.patientCondition] || 99;
        return ordA - ordB;
      });
    });
    return groups;
  }, [filteredMethodRules]);

  // ---------------- DOCTOR SUMMARY RECAP ----------------
  const doctorSummaries = useMemo(() => {
    return doctors.map(doc => {
      const docFees = doctorFees.filter(f => f.doctorId === doc.id);
      const totalAmount = docFees.reduce((sum, f) => sum + f.feeAmount, 0);
      const pendingAmount = docFees.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.feeAmount, 0);
      const approvedAmount = docFees.filter(f => f.status === 'APPROVED').reduce((sum, f) => sum + f.feeAmount, 0);
      const paidAmount = docFees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.feeAmount, 0);

      // Method counts
      const methodBreakdown: Record<string, { count: number; total: number }> = {};
      docFees.forEach(f => {
        const key = f.feeType === 'MANUAL_ADDITIONAL' 
          ? (f.title || 'Fee Tambahan Manual')
          : `${f.methodName || f.packageName || 'Tindakan'} (${f.patientCondition || 'Standar'} - ${f.serviceType || 'Reguler'})`;
        if (!methodBreakdown[key]) methodBreakdown[key] = { count: 0, total: 0 };
        methodBreakdown[key].count++;
        methodBreakdown[key].total += f.feeAmount;
      });

      return {
        doctor: doc,
        totalFeesCount: docFees.length,
        totalAmount,
        pendingAmount,
        approvedAmount,
        paidAmount,
        unpaidCount: docFees.filter(f => f.status === 'APPROVED' || f.status === 'PENDING').length,
        methodBreakdown,
      };
    });
  }, [doctors, doctorFees]);

  // Handlers
  const handleUpdateStatus = async (feeId: number, status: 'APPROVED' | 'PAID' | 'CANCELLED') => {
    const role = (currentUser?.role || '').toLowerCase();
    const canApprove = !currentUser || role === 'admin' || role === 'owner' || role.includes('admin') || role.includes('owner') || role.includes('master');
    if (!canApprove) {
      showToast('Hanya Administrator atau Pemilik (Owner) yang berwenang menyetujui fee dokter.', 'error');
      return;
    }
    setProcessingFeeId(feeId);
    try {
      await updateDoctorFeeStatus(feeId, status);
    } finally {
      setProcessingFeeId(null);
    }
  };

  const handleOpenManualModal = (preselectedDoctorId?: number) => {
    const defaultDocId = preselectedDoctorId 
      ? String(preselectedDoctorId) 
      : (doctors[0]?.id ? String(doctors[0].id) : '');
    
    setManualForm({
      doctorId: defaultDocId,
      feeAmount: 150000,
      feeDate: new Date().toISOString().slice(0, 10),
      title: 'Fee Kasus Penyulit / Bonus Tindakan',
      notes: '',
      patientId: '',
      status: 'APPROVED',
    });
    setIsManualModalOpen(true);
  };

  const handleSaveManualFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.doctorId) {
      showToast('Pilih dokter terlebih dahulu', 'error');
      return;
    }
    if (!manualForm.feeAmount || Number(manualForm.feeAmount) <= 0) {
      showToast('Nominal fee tambahan harus lebih dari 0', 'error');
      return;
    }

    try {
      setIsSubmittingManual(true);
      const res = await createDoctorFee({
        doctorId: Number(manualForm.doctorId),
        feeAmount: Number(manualForm.feeAmount),
        feeDate: manualForm.feeDate,
        title: manualForm.title.trim() || 'Fee Tambahan Dokter',
        notes: manualForm.notes.trim() || undefined,
        patientId: manualForm.patientId ? Number(manualForm.patientId) : undefined,
        status: manualForm.status,
      });

      if (res.success) {
        setIsManualModalOpen(false);
      }
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDeleteFee = async (feeId: number, feeNumber: string) => {
    if (!window.confirm(`Yakin ingin menghapus fee tambahan ${feeNumber}?`)) return;
    await deleteDoctorFee(feeId);
  };

  // Local Rate Changes
  const handleRateInputChange = (ruleId: number, field: 'regulerFee' | 'vipFee' | 'description', value: any) => {
    setEditedRates(prev => {
      const current = prev[ruleId] || {
        regulerFee: doctorMethodFees.find(r => r.id === ruleId)?.regulerFee || 250000,
        vipFee: doctorMethodFees.find(r => r.id === ruleId)?.vipFee || 350000,
        description: doctorMethodFees.find(r => r.id === ruleId)?.description || '',
      };
      return {
        ...prev,
        [ruleId]: {
          ...current,
          [field]: field === 'description' ? value : Number(value),
        }
      };
    });
  };

  const handleSaveAllEditedRates = async () => {
    const ruleIds = Object.keys(editedRates).map(Number);
    if (ruleIds.length === 0) {
      showToast('Belum ada perubahan tarif yang dilakukan.', 'info');
      return;
    }

    try {
      setIsSavingRates(true);
      const payload = ruleIds.map(id => {
        const existing = doctorMethodFees.find(r => r.id === id);
        return {
          id,
          ...existing,
          ...editedRates[id],
        };
      });

      const res = await saveDoctorMethodFeesBatch(payload, true);
      if (res.success) {
        setEditedRates({});
      }
    } finally {
      setIsSavingRates(false);
    }
  };

  const handleSyncPendingFees = async () => {
    try {
      setIsSyncingPending(true);
      await syncDoctorMethodFeesWithPending(rateDoctorFilter === 'GLOBAL' ? 'ALL' : rateDoctorFilter);
    } finally {
      setIsSyncingPending(false);
    }
  };

  const handleCreateNewRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.methodName.trim()) {
      showToast('Nama metode khitan wajib diisi', 'error');
      return;
    }

    try {
      setIsSubmittingNewRule(true);
      const res = await createDoctorMethodFeeRule({
        doctorId: newRuleForm.doctorId === 'GLOBAL' ? null : Number(newRuleForm.doctorId),
        methodName: newRuleForm.methodName.trim(),
        patientCondition: newRuleForm.patientCondition as PatientConditionType,
        regulerFee: Number(newRuleForm.regulerFee),
        vipFee: Number(newRuleForm.vipFee),
        description: newRuleForm.description.trim() || undefined,
        isActive: true,
      });

      if (res.success) {
        setIsNewRuleModalOpen(false);
        setNewRuleForm({
          doctorId: 'GLOBAL',
          methodName: 'Metode Glans Pro Bipolar Pensealer',
          patientCondition: 'GEMUK',
          regulerFee: 400000,
          vipFee: 500000,
          description: '',
        });
      }
    } finally {
      setIsSubmittingNewRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: number, methodName: string, condition: string) => {
    if (!window.confirm(`Hapus aturan fee untuk ${methodName} (${condition})?`)) return;
    await deleteDoctorMethodFeeRule(ruleId);
  };

  const handleOpenBatchPayModal = (docId?: number) => {
    if (docId) setBatchPayDoctorId(docId);
    setIsBatchPayModalOpen(true);
  };

  const handleExecuteBatchPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const docFeesToPay = doctorFees.filter(f => f.doctorId === batchPayDoctorId && (f.status === 'APPROVED' || f.status === 'PENDING'));
    if (docFeesToPay.length === 0) {
      showToast('Tidak ada fee berstatus PENDING/APPROVED untuk dicairkan bagi dokter ini', 'error');
      return;
    }

    try {
      setIsSubmittingBatchPay(true);
      const feeIds = docFeesToPay.map(f => f.id);
      const res = await payDoctorFeesBatch({
        doctorId: batchPayDoctorId,
        feeIds,
        paymentMethod: batchPaymentMethod,
        paymentDate: new Date().toISOString().slice(0, 10),
        notes: batchPaymentNotes.trim() || `Pencairan batch ${feeIds.length} tindakan dokter`,
      });

      if (res.success) {
        setIsBatchPayModalOpen(false);
        setBatchPaymentNotes('');
      }
    } finally {
      setIsSubmittingBatchPay(false);
    }
  };

  const PRESET_TITLES = [
    'Fee Tindakan Khusus / Kasus Penyulit',
    'Bonus Insentif Khitan Massal',
    'Fee Jaga / On-Call Dokter',
    'Bonus Kinerja & Dedikasi Dokter',
    'Insentif Tindakan Pasien VIP Khusus',
    'Koreksi / Penyesuaian Fee Khitan',
  ];

  const CONDITION_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
    'STANDAR': { label: 'Standar / Normal', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    'GEMUK': { label: 'Gemuk / Obesitas', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'ABK': { label: 'ABK (Khusus)', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    'DEWASA': { label: 'Dewasa', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  };

  const editedCount = Object.keys(editedRates).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-700">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Manajemen & Aturan Fee Dokter
            </h1>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-black rounded-md uppercase tracking-wider">
              Berbasis Metode & Kasus
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Konfigurasi tarif fee tindakan dokter per metode khitan (Glans Pro Bipolar Pensealer, Nano Klemp, dsb) untuk kasus Standar, Gemuk, ABK, Dewasa pada tipe Reguler & VIP.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenManualModal()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Fee Manual</span>
          </button>

          <button
            onClick={() => handleOpenBatchPayModal()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Cairkan Fee Dokter</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-200/70 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200">
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Riwayat & Rekap Fee Transaksi</span>
          <span className="ml-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
            {doctorFees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('METHOD_RATES')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'METHOD_RATES'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-white/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Pengaturan Tarif per Metode Tindakan</span>
          <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black uppercase">
            Glanspro & Nano Klemp
          </span>
          {editedCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-black animate-pulse">
              {editedCount} edit
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DOCTOR_SUMMARY')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'DOCTOR_SUMMARY'
              ? 'bg-white text-emerald-900 shadow-sm'
              : 'text-slate-600 hover:text-emerald-900 hover:bg-white/50'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Rekap Komisi Dokter & Breakdown Metode</span>
        </button>
      </div>

      {/* ================= TAB 1: TRANSACTIONS & REKAP ================= */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Semua Fee</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">{formatRupiah(totalAllFees)}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">{filteredFees.length} Item Transaksi</div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Fee Tambahan Manual</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-800 mt-1">{formatRupiah(manualTotal)}</div>
              <div className="text-[10px] font-bold text-purple-500 mt-0.5">{manualAdditionalFees.length} Fee Manual Input</div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Status: PENDING</div>
              <div className="text-lg sm:text-xl font-black text-amber-600 mt-1">{formatRupiah(pendingTotal)}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">Menunggu approval</div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Status: APPROVED</div>
              <div className="text-lg sm:text-xl font-black text-sky-700 mt-1">{formatRupiah(approvedTotal)}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">Disetujui / Siap cair</div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Status: PAID</div>
              <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">{formatRupiah(paidTotal)}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">Telah dibayarkan</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">Dokter:</span>
                <select
                  value={selectedDoctorFilter}
                  onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Semua Dokter Operator</option>
                  {doctors.map(d => (
                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Metode:</span>
                <select
                  value={selectedMethodFilter}
                  onChange={(e) => setSelectedMethodFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Semua Metode Tindakan</option>
                  <option value="Glans">Glans Pro Bipolar Pensealer</option>
                  <option value="Nano">Nano Klemp</option>
                  <option value="Laser">Laser CO2 / Cauter</option>
                  <option value="Ring">Super Ring</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Jenis:</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="PROCEDURE">Tindakan Medis Khitan</option>
                  <option value="MANUAL_ADDITIONAL">Fee Tambahan / Insentif Manual</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSyncPendingFees}
              disabled={isSyncingPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-black transition-colors cursor-pointer border border-sky-200"
              title="Sinkronkan tarif metode terkini ke tindakan berstatus PENDING"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPending ? 'animate-spin' : ''}`} />
              <span>{isSyncingPending ? 'Menyinkronkan...' : 'Sinkronkan Tarif'}</span>
            </button>
          </div>

          {/* Fee Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">No. Fee & Tanggal</th>
                    <th className="py-2.5 px-3">Dokter Operator</th>
                    <th className="py-2.5 px-3">Pasien & Rekam Medis</th>
                    <th className="py-2.5 px-3">Metode Khitan & Kasus</th>
                    <th className="py-2.5 px-3 font-mono">Nominal Komisi</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Stethoscope className="w-8 h-8 text-slate-300" />
                          <span>Tidak ada transaksi fee dokter yang cocok dengan filter.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFees.map((fee) => {
                      const isManual = fee.feeType === 'MANUAL_ADDITIONAL';
                      const condBadge = CONDITION_BADGES[fee.patientCondition || 'STANDAR'] || CONDITION_BADGES['STANDAR'];
                      return (
                        <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sky-800 text-xs">{fee.feeNumber}</span>
                              {isManual && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded uppercase">
                                  MANUAL
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{fee.feeDate}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 text-xs">{fee.doctorName}</div>
                            <div className="text-[10px] text-slate-400">{fee.branchCode || 'PUSAT'}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            {isManual ? (
                              <div>
                                <div className="font-black text-purple-900 text-xs flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-500 inline shrink-0" />
                                  <span>{fee.title || 'Fee Tambahan / Insentif'}</span>
                                </div>
                                {fee.patientName && (
                                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    Pasien: {fee.patientName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{fee.patientName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {fee.rmNumber || (fee.bookingNumber ? `Booking: ${fee.bookingNumber}` : '-')}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {isManual ? (
                              <div className="text-xs text-slate-600 italic">
                                {fee.notes || 'Input insentif manual administrasi'}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-500 inline shrink-0" />
                                  <span>{fee.methodName || fee.packageName || 'Metode Khitan'}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {fee.patientCondition && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${condBadge.bg} ${condBadge.text} ${condBadge.border}`}>
                                      {condBadge.label}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    fee.serviceType === 'VIP' || fee.categoryCode === 'VIP'
                                      ? 'bg-amber-100 text-amber-900 font-black border border-amber-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {fee.serviceType || fee.categoryCode || 'REGULER'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono font-black text-emerald-700 text-xs sm:text-sm">
                            {formatRupiah(fee.feeAmount)}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              fee.status === 'APPROVED' ? 'bg-sky-100 text-sky-800' :
                              fee.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {fee.status}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            {fee.status === 'PENDING' && (
                              <button
                                disabled={processingFeeId === fee.id}
                                onClick={() => handleUpdateStatus(fee.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                              >
                                {processingFeeId === fee.id ? '...' : 'Approve'}
                              </button>
                            )}
                            {fee.status === 'APPROVED' && (
                              <button
                                disabled={processingFeeId === fee.id}
                                onClick={() => handleUpdateStatus(fee.id, 'PAID')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                              >
                                {processingFeeId === fee.id ? '...' : 'Cairkan'}
                              </button>
                            )}
                            {fee.status === 'PAID' && (
                              <span className="text-xs font-bold text-emerald-600">Lunas</span>
                            )}

                            {isManual && fee.status !== 'PAID' && (
                              <button
                                onClick={() => handleDeleteFee(fee.id, fee.feeNumber)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Fee Tambahan Manual"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: METHOD RATES CONFIGURATION ================= */}
      {activeTab === 'METHOD_RATES' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-sky-50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs mt-0.5">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
                  Aturan & Tarif Komisi Dokter Berdasarkan Metode Khitan
                </h3>
                <p className="text-xs text-indigo-800/80 font-medium mt-0.5">
                  Dokter mendapatkan fee per tindakan berdasarkan metode yang dikerjakan (Glans Pro Bipolar Pensealer, Nano Klemp, dsb) serta variasi kondisi kasus (Gemuk, ABK, Dewasa, Standar) pada kelas Reguler & VIP.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsNewRuleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Metode / Aturan</span>
              </button>

              <button
                onClick={handleSaveAllEditedRates}
                disabled={isSavingRates || editedCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingRates ? 'Menyimpan...' : `Simpan Tarif (${editedCount})`}</span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Doctor Filter, Condition Filter, Search */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Lingkup Tarif:</span>
                <select
                  value={rateDoctorFilter}
                  onChange={(e) => setRateDoctorFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="GLOBAL">Semua Dokter (Tarif Standar Klinik)</option>
                  <option value="ALL">Semua Aturan (Termasuk Khusus Dokter)</option>
                  {doctors.map(d => (
                    <option key={d.id} value={String(d.id)}>Khusus: {d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase">Filter Kasus:</span>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="ALL">Semua Kondisi Kasus</option>
                  <option value="STANDAR">Standar (Normal)</option>
                  <option value="GEMUK">Kasus Gemuk / Obesitas</option>
                  <option value="ABK">Kasus ABK (Kebutuhan Khusus)</option>
                  <option value="DEWASA">Kasus Pasien Dewasa</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchMethodQuery}
                  onChange={(e) => setSearchMethodQuery(e.target.value)}
                  placeholder="Cari metode tindakan..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleSyncPendingFees}
              disabled={isSyncingPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-black transition-colors cursor-pointer border border-amber-200"
              title="Perbarui nominal fee pada semua tindakan berstatus PENDING dengan tarif terbaru ini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPending ? 'animate-spin' : ''}`} />
              <span>{isSyncingPending ? 'Menyinkronkan...' : 'Terapkan ke Transaksi PENDING'}</span>
            </button>
          </div>

          {/* Grouped Method Rate Cards */}
          <div className="space-y-4">
            {Object.keys(groupedMethodRules).length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 font-medium">
                <Sliders className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">Tidak ada aturan tarif metode khitan yang sesuai filter.</p>
                <button
                  onClick={() => setIsNewRuleModalOpen(true)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Tambah Aturan Metode Baru
                </button>
              </div>
            ) : (
              Object.entries(groupedMethodRules).map(([methodName, rawRules]) => {
                const rules = rawRules as DoctorMethodFeeRule[];
                const isGlans = methodName.toLowerCase().includes('glans') || methodName.toLowerCase().includes('bipolar');
                const isNano = methodName.toLowerCase().includes('nano') || methodName.toLowerCase().includes('klem');
                return (
                  <div key={methodName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Method Group Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-white ${
                          isGlans ? 'bg-indigo-600' : isNano ? 'bg-sky-600' : 'bg-emerald-600'
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">
                            {methodName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {rules.length} variasi kasus terkonfigurasi (Gemuk, ABK, Dewasa, Standar)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewRuleForm({
                              doctorId: 'GLOBAL',
                              methodName: methodName,
                              patientCondition: 'GEMUK',
                              regulerFee: 400000,
                              vipFee: 500000,
                              description: '',
                            });
                            setIsNewRuleModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-black cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Kasus</span>
                        </button>
                      </div>
                    </div>

                    {/* Method Conditions Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-4 w-1/4">Kondisi / Kasus Klinis Pasien</th>
                            <th className="py-2.5 px-4 w-1/4">Fee Pasien REGULER (Rp)</th>
                            <th className="py-2.5 px-4 w-1/4">Fee Pasien VIP (Rp)</th>
                            <th className="py-2.5 px-4 w-1/4 text-right">Aksi & Lingkup</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rules.map((rule) => {
                            const condBadge = CONDITION_BADGES[rule.patientCondition] || {
                              label: rule.patientCondition,
                              bg: 'bg-slate-100',
                              text: 'text-slate-800',
                              border: 'border-slate-200',
                            };
                            const isEdited = Boolean(editedRates[rule.id]);
                            const curReg = editedRates[rule.id]?.regulerFee !== undefined ? editedRates[rule.id].regulerFee : rule.regulerFee;
                            const curVip = editedRates[rule.id]?.vipFee !== undefined ? editedRates[rule.id].vipFee : rule.vipFee;

                            return (
                              <tr key={rule.id} className={`hover:bg-slate-50/60 transition-colors ${isEdited ? 'bg-amber-50/30' : ''}`}>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border uppercase ${condBadge.bg} ${condBadge.text} ${condBadge.border}`}>
                                      {condBadge.label}
                                    </span>
                                    {isEdited && (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                                        Diedit
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                                    {rule.description || `Fee tindakan ${methodName} untuk ${condBadge.label}`}
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="relative max-w-xs">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      step="5000"
                                      min="0"
                                      value={curReg}
                                      onChange={(e) => handleRateInputChange(rule.id, 'regulerFee', e.target.value)}
                                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                                    {formatRupiah(curReg)}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="relative max-w-xs">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      step="5000"
                                      min="0"
                                      value={curVip}
                                      onChange={(e) => handleRateInputChange(rule.id, 'vipFee', e.target.value)}
                                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-amber-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
                                    {formatRupiah(curVip)}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {rule.doctorName || 'Semua Dokter'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRule(rule.id, methodName, rule.patientCondition)}
                                      className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                      title="Hapus Aturan Ini"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DOCTOR SUMMARY & METHOD BREAKDOWN ================= */}
      {activeTab === 'DOCTOR_SUMMARY' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctorSummaries.map(({ doctor, totalFeesCount, totalAmount, pendingAmount, approvedAmount, paidAmount, unpaidCount, methodBreakdown }) => (
              <div key={doctor.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        {doctor.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">{doctor.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {doctor.specialty || 'Dokter Operator Khitan'} • {doctor.branchCode || 'PUSAT'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBatchPayModal(doctor.id)}
                      disabled={unpaidCount === 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cairkan Fee</span>
                    </button>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Komisi</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(totalAmount)}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{totalFeesCount} Tindakan</div>
                    </div>

                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      <div className="text-[10px] font-bold text-amber-700 uppercase">Siap Cair</div>
                      <div className="text-sm font-black text-amber-800 mt-0.5">{formatRupiah(approvedAmount + pendingAmount)}</div>
                      <div className="text-[9px] text-amber-600 font-bold">{unpaidCount} Belum Lunas</div>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">Sudah Dicairkan</div>
                      <div className="text-sm font-black text-emerald-800 mt-0.5">{formatRupiah(paidAmount)}</div>
                      <div className="text-[9px] text-emerald-600 font-bold">Lunas</div>
                    </div>
                  </div>

                  {/* Method Breakdown */}
                  <div className="mt-4">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Rincian Tindakan per Metode:</span>
                    </div>

                    {Object.keys(methodBreakdown).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada riwayat tindakan untuk dokter ini.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {Object.entries(methodBreakdown).map(([key, rawData]) => {
                          const data = rawData as { count: number; total: number };
                          return (
                            <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                              <span className="font-bold text-slate-800 text-[11px] truncate pr-2">{key}</span>
                              <div className="text-right shrink-0">
                                <span className="font-black text-emerald-700 text-xs">{formatRupiah(data.total)}</span>
                                <span className="text-[10px] text-slate-400 font-medium ml-1.5">({data.count}x)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedDoctorFilter(String(doctor.id));
                      setActiveTab('TRANSACTIONS');
                    }}
                    className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Rincian Transaksi Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH ATURAN METODE BARU ================= */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-indigo-700 to-sky-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Sliders className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Tambah Aturan Fee Metode Baru
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    Konfigurasi fee dokter per metode & kondisi kasus pasien
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRuleModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRule} className="p-5 space-y-4">
              {/* Nama Metode Khitan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Metode Tindakan Khitan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRuleForm.methodName}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, methodName: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Metode Glans Pro Bipolar Pensealer"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {['Metode Glans Pro Bipolar Pensealer', 'Metode Tindakan Nano Klemp', 'Laser CO2 / Cauter Presisi', 'Super Ring Khitan'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewRuleForm({ ...newRuleForm, methodName: preset })}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kondisi / Kasus Pasien */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Kondisi Pasien <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newRuleForm.patientCondition}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, patientCondition: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STANDAR">STANDAR (Anak Normal / Standar)</option>
                  <option value="GEMUK">GEMUK (Kasus Anak Gemuk / Mikropenis / Buried)</option>
                  <option value="ABK">ABK (Anak Berkebutuhan Khusus / Hiperaktif)</option>
                  <option value="DEWASA">DEWASA (Pasien Usia Dewasa)</option>
                </select>
              </div>

              {/* Fee Reguler & VIP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tarif Fee REGULER (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      required
                      value={newRuleForm.regulerFee}
                      onChange={(e) => setNewRuleForm({ ...newRuleForm, regulerFee: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                    {formatRupiah(newRuleForm.regulerFee)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tarif Fee VIP (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      required
                      value={newRuleForm.vipFee}
                      onChange={(e) => setNewRuleForm({ ...newRuleForm, vipFee: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">
                    {formatRupiah(newRuleForm.vipFee)}
                  </span>
                </div>
              </div>

              {/* Lingkup Dokter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Berlaku Untuk Dokter
                </label>
                <select
                  value={newRuleForm.doctorId}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, doctorId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GLOBAL">Semua Dokter (Aturan Standar Klinik)</option>
                  {doctors.map(d => (
                    <option key={d.id} value={String(d.id)}>Khusus: {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Kasus / Catatan
                </label>
                <input
                  type="text"
                  value={newRuleForm.description}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, description: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Kasus penyulit anak obesitas dengan teknik hemostatis ganda"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewRule}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingNewRule ? 'Menyimpan...' : 'Simpan Aturan Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INPUT FEE TAMBAHAN MANUAL ================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Input Fee Tambahan Manual Dokter
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Otomatis dihitung menjadi komisi saat rekapitulasi bulanan dokter
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

            <form onSubmit={handleSaveManualFee} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Dokter Operator <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.doctorId}
                  onChange={(e) => setManualForm({ ...manualForm, doctorId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Pilih Dokter --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name} {d.specialty ? `(${d.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Fee Tambahan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={manualForm.feeAmount}
                    onChange={(e) => setManualForm({ ...manualForm, feeAmount: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {[50000, 100000, 150000, 250000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, feeAmount: amt })}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      +Rp {amt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul / Jenis Fee Tambahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Contoh: Fee Kasus Penyulit / Bonus Khitan Massal"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {PRESET_TITLES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, title: preset })}
                      className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Fee
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.feeDate}
                    onChange={(e) => setManualForm({ ...manualForm, feeDate: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Approval
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="APPROVED">APPROVED (Langsung Siap Cair)</option>
                    <option value="PENDING">PENDING (Menunggu Persetujuan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pasien Terkait <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <select
                  value={manualForm.patientId}
                  onChange={(e) => setManualForm({ ...manualForm, patientId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Tanpa Pasien Spesifik (Umum / Bonus Dokter) --</option>
                  {patients.slice(0, 50).map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.fullName} ({p.rmNumber || 'No RM'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Alasan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tambahkan catatan rincian penyebab penambahan fee..."
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{isSubmittingManual ? 'Menyimpan...' : 'Simpan Fee Tambahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PENCAIRAN FEE DOKTER MASSAL ================= */}
      {isBatchPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Pencairan & Pembayaran Fee Dokter
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Otomatis tercatat pada Beban Pengeluaran Operasional Klinik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPayModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBatchPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Dokter Yang Akan Dicairkan Fee-nya:
                </label>
                <select
                  value={batchPayDoctorId}
                  onChange={(e) => setBatchPayDoctorId(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {doctors.map(d => {
                    const unpCount = doctorFees.filter(f => f.doctorId === d.id && (f.status === 'APPROVED' || f.status === 'PENDING')).length;
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} ({unpCount} tindakan belum cair)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Rincian Komisi Yang Siap Dicairkan */}
              {(() => {
                const targetFees = doctorFees.filter(f => f.doctorId === batchPayDoctorId && (f.status === 'APPROVED' || f.status === 'PENDING'));
                const sumAmount = targetFees.reduce((s, f) => s + f.feeAmount, 0);
                return (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-800 font-bold">Jumlah Tindakan Belum Cair:</span>
                      <span className="font-black text-emerald-950">{targetFees.length} Tindakan</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-emerald-200/60 pt-2">
                      <span className="text-emerald-900 font-black">Total Nominal Pencairan:</span>
                      <span className="text-base font-black text-emerald-700">{formatRupiah(sumAmount)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={batchPaymentMethod}
                    onChange={(e) => setBatchPaymentMethod(e.target.value as any)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="TRANSFER">Transfer Bank / Payroll</option>
                    <option value="CASH">Tunai (Kas Klinik)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    disabled
                    className="w-full py-2 px-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Transfer
                </label>
                <input
                  type="text"
                  value={batchPaymentNotes}
                  onChange={(e) => setBatchPaymentNotes(e.target.value)}
                  placeholder="Contoh: Pencairan komisi khitan periode akhir bulan"
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatchPay}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingBatchPay ? 'Memproses...' : 'Konfirmasi & Cairkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
