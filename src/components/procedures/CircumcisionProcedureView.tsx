import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Stethoscope, CheckCircle2, AlertTriangle, FileText, Award, ShieldCheck, 
  Calendar, Clock, User, Phone, CheckSquare, Square, ChevronRight, X,
  CreditCard, ArrowRight, Save, Sparkles, Check, Syringe, UserCheck, Plus, ExternalLink,
  Edit3, UserCog, HeartHandshake, MapPin, Tag, Users, CheckCircle, Play, RotateCcw, ShieldAlert, AlertCircle
} from 'lucide-react';
import { CircumcisionProcedure, ProcedureChecklist } from '../../types';
import { TransactionItemManager } from '../products/TransactionItemManager';
import { NanoMasterLogo, PrintDocumentIcon } from '../common/PrintIcons';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';

interface CircumcisionProcedureViewProps {
  onNavigateToCashier?: (invoiceId?: number, autoOpenPayment?: boolean) => void;
}

export const ANESTHESIA_OPTIONS = [
  {
    id: 'FNI',
    name: 'Bius tanpa jarum suntik /FREE Needle injection (FNI)',
    short: 'Bius FNI (Tanpa Jarum)',
    badge: 'FNI Bebas Jarum',
    desc: 'Bius modern bertekanan udara tanpa tusukan jarum suntik, minim trauma & sangat nyaman untuk anak.',
  },
  {
    id: 'KOMBINASI',
    name: 'Bius Kombinasi ( FNI + injeksi)',
    short: 'Bius Kombinasi (FNI + Injeksi)',
    badge: 'Kombinasi FNI & Injeksi',
    desc: 'Teknik kombinasi FNI untuk area permukaan dan jarum mikro minimal untuk durasi tindakan optimal.',
  },
  {
    id: 'INJEKSI',
    name: 'Injeksi Jarum Mikro Konvensional',
    short: 'Injeksi Konvensional',
    badge: 'Injeksi Jarum Halus',
    desc: 'Teknik infiltrasi blok cincin standar dengan jarum mikro halus.',
  },
];

export const CircumcisionProcedureView: React.FC<CircumcisionProcedureViewProps> = ({
  onNavigateToCashier,
}) => {
  const { 
    procedures, completeProcedure, updateProcedure, currentUser, employees, 
    circumcisionMethods, doctorMethodFees, showToast, settings, patients, doctors, categories, 
    packages, refreshAllData, updatePatient 
  } = useClinic();
  
  const activeMethods = React.useMemo(() => {
    const fromMaster = (circumcisionMethods || []).filter(m => m.isActive && !m.isDeleted);
    if (fromMaster.length > 0) return fromMaster;
    if (packages && packages.length > 0) {
      return packages.filter(p => p.isActive).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        notes: '',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        isDeleted: false,
      }));
    }
    return [
      { id: 2, name: 'Metode Glans Pro Bipolar Pensealer', description: '', notes: '', isActive: true, createdAt: '', updatedAt: '', isDeleted: false },
      { id: 1, name: 'Metode Tindakan Nano Klemp', description: '', notes: '', isActive: true, createdAt: '', updatedAt: '', isDeleted: false },
    ];
  }, [circumcisionMethods, packages]);
  const [selectedProc, setSelectedProc] = useState<CircumcisionProcedure | null>(procedures[0] || null);
  const [selectedAssistantStaffIds, setSelectedAssistantStaffIds] = useState<number[]>([]);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [signerName, setSignerName] = useState('Budi Santoso');
  const [signerRelation, setSignerRelation] = useState('Ayah Kandung');

  // State Modal Edit Data Pasien & Layanan Terpadu
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [isSavingPatientEdit, setIsSavingPatientEdit] = useState(false);
  const [patientEditForm, setPatientEditForm] = useState({
    fullName: '',
    nickname: '',
    nik: '',
    birthDate: '',
    gender: 'Laki-laki',
    address: '',
    phone: '',
    allergies: '',
    notes: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'Ayah Kandung',
    plannedDoctorId: 0,
    plannedMethodType: '',
    plannedPackageCategory: 'REGULER',
    plannedPackageId: 0,
    plannedAnesthesiaType: '',
  });

  const handleOpenEditPatientModal = () => {
    if (!selectedProc) return;
    const currentPt = patients.find(p => p.id === selectedProc.patientId);
    const matchedPkg = packages.find(p => p.name === selectedProc.packageName);
    setPatientEditForm({
      fullName: currentPt?.fullName || selectedProc.patientName || '',
      nickname: currentPt?.nickname || '',
      nik: currentPt?.nik || '',
      birthDate: currentPt?.birthDate || '',
      gender: currentPt?.gender || 'Laki-laki',
      address: currentPt?.address || '',
      phone: currentPt?.phone || '',
      allergies: currentPt?.allergies || '',
      notes: currentPt?.notes || '',
      guardianName: currentPt?.guardianName || selectedProc.guardianName || '',
      guardianPhone: currentPt?.guardianPhone || selectedProc.guardianPhone || '',
      guardianRelationship: currentPt?.guardianRelationship || 'Ayah Kandung',
      plannedDoctorId: selectedProc.doctorId || (doctors[0]?.id ?? 0),
      plannedMethodType: formData.methodType || selectedProc.methodType || 'Klem Nano Sealer',
      plannedPackageCategory: selectedProc.categoryCode || 'REGULER',
      plannedPackageId: matchedPkg?.id || (packages[0]?.id ?? 1),
      plannedAnesthesiaType: formData.anesthesiaType || selectedProc.anesthesiaType || ANESTHESIA_OPTIONS[0].name,
    });
    setIsEditPatientModalOpen(true);
  };

  const handleSavePatientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProc || isSavingPatientEdit) return;
    setIsSavingPatientEdit(true);
    try {
      const res = await updatePatient(selectedProc.patientId, {
        fullName: patientEditForm.fullName,
        nickname: patientEditForm.nickname,
        nik: patientEditForm.nik,
        birthDate: patientEditForm.birthDate,
        gender: patientEditForm.gender,
        address: patientEditForm.address,
        phone: patientEditForm.phone,
        allergies: patientEditForm.allergies,
        notes: patientEditForm.notes,
        guardianName: patientEditForm.guardianName,
        guardianPhone: patientEditForm.guardianPhone,
        guardianRelationship: patientEditForm.guardianRelationship,
        plannedDoctorId: Number(patientEditForm.plannedDoctorId),
        doctorId: Number(patientEditForm.plannedDoctorId),
        plannedMethodType: patientEditForm.plannedMethodType,
        methodType: patientEditForm.plannedMethodType,
        plannedPackageCategory: patientEditForm.plannedPackageCategory,
        packageCategory: patientEditForm.plannedPackageCategory,
        plannedPackageId: Number(patientEditForm.plannedPackageId),
        packageId: Number(patientEditForm.plannedPackageId),
        plannedAnesthesiaType: patientEditForm.plannedAnesthesiaType,
        anesthesiaType: patientEditForm.plannedAnesthesiaType,
      });

      if (res.success) {
        setFormData(prev => ({
          ...prev,
          methodType: patientEditForm.plannedMethodType,
          anesthesiaType: patientEditForm.plannedAnesthesiaType,
        }));
        await refreshAllData();
        showToast('Data pasien, dokter, metode, dan paket berhasil disinkronkan!', 'success');
        setIsEditPatientModalOpen(false);
      } else {
        showToast(res.error || 'Gagal memperbarui data pasien', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan perubahan', 'error');
    } finally {
      setIsSavingPatientEdit(false);
    }
  };

  // Dynamic Date & Status Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [hideCompleted, setHideCompleted] = useState<boolean>(true); // Default true: sembunyikan yang sudah selesai
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');

  // Filtered procedures list based on user date & status criteria
  const filteredProcedures = procedures.filter((proc) => {
    // Filter by procedure date (if empty, matches all)
    const matchesDate = !selectedDate || proc.procedureDate === selectedDate;
    // Filter out completed procedures if hideCompleted is true
    const matchesStatus = hideCompleted ? proc.status !== 'COMPLETED' : true;
    // Filter by doctor
    const matchesDoctor = selectedDoctorFilter === 'ALL' || String(proc.doctorId) === selectedDoctorFilter;

    return matchesDate && matchesStatus && matchesDoctor;
  });

  // Active form state for selected procedure
  const [formData, setFormData] = useState({
    methodType: selectedProc?.methodType || 'Metode Glans Pro Bipolar Pensealer',
    patientCondition: (selectedProc as any)?.patientCondition || 'STANDAR',
    anesthesiaType: selectedProc?.anesthesiaType || 'Bius tanpa jarum suntik /FREE Needle injection (FNI)',
    preCondition: selectedProc?.preCondition || 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.',
    procedureNotes: selectedProc?.procedureNotes || 'Anestesi blok cincin tanpa jarum suntik, insisi presisi hemostatis baik, aplikasi sealer medis steril.',
    postCondition: selectedProc?.postCondition || 'Luka tertutup rapi, sirkulasi glans baik, tidak ada pendarahan aktif.',
    careInstructions: selectedProc?.careInstructions || 'Boleh mandi setelah 24 jam dengan celana khitan khusus. Minum obat analgetik dan antibiotik teratur.',
    controlDate: selectedProc?.controlDate || '2026-09-09',
    additionalNotes: selectedProc?.additionalNotes || '',
  });

  // Estimasi Fee Dokter Operator berdasarkan Metode & Kondisi Kasus
  const estimatedDoctorFee = React.useMemo(() => {
    if (!selectedProc) return null;
    const isVip = selectedProc.categoryCode === 'VIP' || selectedProc.patientCategoryId === 2;
    const currentMethod = formData.methodType || selectedProc.methodType || '';
    const currentCond = formData.patientCondition || 'STANDAR';

    const m = currentMethod.toLowerCase();
    const matchRule = doctorMethodFees.find(r => {
      const rm = (r.methodName || '').toLowerCase();
      const matchName = rm === m || (m.includes('glans') && rm.includes('glans')) || (m.includes('nano') && rm.includes('nano')) || rm.includes(m) || m.includes(rm);
      return matchName && r.patientCondition === currentCond;
    }) || doctorMethodFees.find(r => {
      const rm = (r.methodName || '').toLowerCase();
      return (rm === m || (m.includes('glans') && rm.includes('glans')) || (m.includes('nano') && rm.includes('nano'))) && r.patientCondition === 'STANDAR';
    });

    const feeAmount = matchRule 
      ? (isVip ? matchRule.vipFee : matchRule.regulerFee)
      : (isVip ? 350000 : 250000);

    return {
      feeAmount,
      methodName: matchRule?.methodName || currentMethod,
      condition: currentCond,
      serviceType: isVip ? 'VIP' : 'REGULER',
    };
  }, [selectedProc, formData.methodType, formData.patientCondition, doctorMethodFees]);

  // Checklist state parser
  const parseChecklist = (raw?: any, status?: string): ProcedureChecklist => {
    const isCompleted = status === 'COMPLETED';
    const defaultChecklist: ProcedureChecklist = {
      identityVerified: true,
      guardianVerified: true,
      packageConfirmed: true,
      consentSigned: true,
      procedureDone: isCompleted,
      notesFilled: isCompleted,
      careGiven: isCompleted,
      controlScheduled: isCompleted,
    };
    if (!raw) return defaultChecklist;
    let parsed = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return defaultChecklist;
      }
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        ...defaultChecklist,
        ...parsed,
        procedureDone: Boolean(parsed.procedureDone || isCompleted),
        notesFilled: Boolean(parsed.notesFilled || isCompleted),
        careGiven: Boolean(parsed.careGiven || isCompleted),
        controlScheduled: Boolean(parsed.controlScheduled || isCompleted),
      };
    }
    return defaultChecklist;
  };

  const [checklist, setChecklist] = useState<ProcedureChecklist>(
    parseChecklist(selectedProc?.checklistData, selectedProc?.status)
  );

  // Synchronize selected procedure automatically when filtered procedures load or change
  useEffect(() => {
    if (filteredProcedures.length > 0) {
      if (!selectedProc || !filteredProcedures.some(p => p.id === selectedProc.id)) {
        const active = filteredProcedures.find(p => p.status === 'IN_PROGRESS' || p.status === 'WAITING') || filteredProcedures[0];
        handleSelectProcedure(active);
      } else {
        const fresh = filteredProcedures.find(p => p.id === selectedProc.id);
        if (fresh && (fresh.status !== selectedProc.status || fresh.completedAt !== selectedProc.completedAt)) {
          setSelectedProc(fresh);
        }
      }
    } else {
      setSelectedProc(null);
    }
  }, [filteredProcedures]);

  const handleSelectProcedure = (proc: CircumcisionProcedure) => {
    setSelectedProc(proc);
    
    // Support multiple assistant IDs from checklistData or assistantStaffId/Name
    const parsedChecklist = parseChecklist(proc.checklistData);
    let initialAssistantIds: number[] = [];
    if (Array.isArray(parsedChecklist.assistantStaffIds) && parsedChecklist.assistantStaffIds.length > 0) {
      initialAssistantIds = parsedChecklist.assistantStaffIds;
    } else if (proc.assistantStaffId) {
      initialAssistantIds = [proc.assistantStaffId];
    } else if (proc.assistantStaffName) {
      const matched = employees.filter(e => proc.assistantStaffName?.includes(e.name)).map(e => e.id);
      if (matched.length > 0) initialAssistantIds = matched;
    }
    setSelectedAssistantStaffIds(initialAssistantIds);

    setFormData({
      methodType: proc.methodType || 'Metode Glans Pro Bipolar Pensealer',
      patientCondition: (proc as any).patientCondition || 'STANDAR',
      anesthesiaType: proc.anesthesiaType || 'Bius tanpa jarum suntik /FREE Needle injection (FNI)',
      preCondition: proc.preCondition || 'Anatomi normal, preputium mobile, tidak ada kelainan bawaan.',
      procedureNotes: proc.procedureNotes || 'Anestesi blok cincin tanpa jarum, insisi presisi hemostatis baik, aplikasi sealer.',
      postCondition: proc.postCondition || 'Luka tertutup rapi, sirkulasi glans baik.',
      careInstructions: proc.careInstructions || 'Minum obat teratur, gunakan celana khitan khusus.',
      controlDate: proc.controlDate || '2026-09-09',
      additionalNotes: proc.additionalNotes || '',
    });
    setChecklist(parsedChecklist);
  };

  const handleToggleChecklist = (key: keyof ProcedureChecklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (selectedProc) {
      updateProcedure(selectedProc.id, { checklistData: updated });
    }
  };

  // Memulai Prosedur Tindakan (Proceed with Procedure)
  const handleStartProcedure = async () => {
    if (!selectedProc || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const updatedChecklist = {
        ...checklist,
        assistantStaffIds: selectedAssistantStaffIds,
      };
      await updateProcedure(selectedProc.id, {
        ...formData,
        status: 'IN_PROGRESS',
        checklistData: updatedChecklist,
        assistantStaffId: selectedAssistantStaffIds[0] || undefined,
        assistantStaffIds: selectedAssistantStaffIds,
      });
      showToast('Prosedur tindakan dimulai (IN PROGRESS)', 'success');
      await refreshAllData();
    } catch (err: any) {
      showToast('Gagal memulai prosedur: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedProc || isSavingNotes) return;
    setIsSavingNotes(true);
    try {
      const updatedChecklist = {
        ...checklist,
        assistantStaffIds: selectedAssistantStaffIds,
      };
      await updateProcedure(selectedProc.id, {
        ...formData,
        assistantStaffId: selectedAssistantStaffIds[0] || undefined,
        assistantStaffIds: selectedAssistantStaffIds,
        checklistData: updatedChecklist,
        status: selectedProc.status === 'WAITING' ? 'IN_PROGRESS' : selectedProc.status,
      });
      showToast('Draf catatan medis & asisten berhasil disimpan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan catatan: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleOpenCompleteModal = () => {
    if (!selectedProc || isSubmitting) return;
    setIsConfirmModalOpen(true);
  };

  const executeCompleteProcedure = async () => {
    if (!selectedProc || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updatedChecklist = { 
        ...checklist, 
        procedureDone: true, 
        notesFilled: true, 
        careGiven: true, 
        controlScheduled: true,
        assistantStaffIds: selectedAssistantStaffIds,
      };
      setChecklist(updatedChecklist);

      // Save latest updates to procedure
      await updateProcedure(selectedProc.id, {
        ...formData,
        assistantStaffId: selectedAssistantStaffIds[0] || undefined,
        assistantStaffIds: selectedAssistantStaffIds,
        checklistData: updatedChecklist,
      });

      const res = await completeProcedure(selectedProc.id, {
        assistantStaffId: selectedAssistantStaffIds[0] || undefined,
        assistantStaffIds: selectedAssistantStaffIds,
        ...formData,
        checklistData: updatedChecklist,
      });

      setIsConfirmModalOpen(false);

      if (res && res.success) {
        showToast('Tindakan khitan selesai! Beralih ke kasir pembayaran...', 'success');
        if (onNavigateToCashier) {
          onNavigateToCashier(res.invoiceId || selectedProc.bookingId, true);
        }
      }
    } catch (err: any) {
      console.error('Error completing procedure:', err);
      showToast('Gagal menyelesaikan tindakan: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Ruang Tindakan &amp; Rekam Medis Khitan
            </h1>
            <span className="hidden sm:inline-flex text-[10px] font-black uppercase text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
              Clinical
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Standardisasi operasional tindakan medis, checklist keselamatan, catatan anestesi, dan sertifikat kelulusan khitan.
          </p>
        </div>

        {selectedProc && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsConsentModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Informed Consent</span>
            </button>
            <button
              onClick={() => setIsCertificateModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Sertifikat Khitan</span>
            </button>
          </div>
        )}
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wide">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Pilih Tanggal:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedDate 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Tanggal
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Sembunyikan Selesai */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="w-4 h-4 text-sky-600 accent-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">
              Sembunyikan Yang Selesai
            </span>
          </label>

          {/* Dokter Filter */}
          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">Semua Dokter Operator</option>
            {employees.filter(e => e.role === 'DOCTOR').map((d, idx) => (
              <option key={`doc-filter-${d.id}-${idx}`} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Daftar Pasien Menunggu / Sedang Tindakan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {selectedDate ? (selectedDate === todayStr ? 'Antrean Tindakan Hari Ini' : `Tindakan: ${selectedDate}`) : 'Semua Antrean Tindakan'}
            </h2>
            <span className="text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
              {filteredProcedures.length} {hideCompleted ? 'Terjadwal' : 'Total'}
            </span>
          </div>

          {filteredProcedures.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2.5">
              <p className="text-xs font-bold text-slate-600">
                Tidak ada tindakan {hideCompleted ? 'terjadwal / aktif' : ''} pada {selectedDate ? (selectedDate === todayStr ? 'hari ini' : selectedDate) : 'filter ini'}.
              </p>
              {hideCompleted && (
                <button
                  type="button"
                  onClick={() => setHideCompleted(false)}
                  className="text-xs font-bold text-sky-600 hover:underline cursor-pointer block mx-auto"
                >
                  Tampilkan tindakan yang sudah selesai
                </button>
              )}
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 underline cursor-pointer block mx-auto"
                >
                  Lihat seluruh tanggal
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProcedures.map((proc, idx) => {
                const isSelected = selectedProc?.id === proc.id;
                return (
                  <div
                    key={`proc-card-${proc.id}-${idx}`}
                    onClick={() => handleSelectProcedure(proc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/60 border-sky-500 shadow-xs ring-1 ring-sky-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {proc.rmNumber}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">
                          {proc.patientName}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Usia {proc.patientAge} th • {proc.categoryName} ({proc.categoryCode})
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {proc.anesthesiaType?.includes('Kombinasi') || proc.anesthesiaType?.includes('kombinasi')
                              ? 'Bius Kombinasi'
                              : (proc.anesthesiaType?.includes('FNI') || proc.anesthesiaType?.includes('FREE Needle')
                                ? 'Bius FNI'
                                : 'Bius FNI')}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        proc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        proc.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {proc.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span>Operator: <strong className="text-slate-700">{(proc.doctorName || '-').split(',')[0]}</strong></span>
                      <span className="font-bold text-slate-700">{proc.procedureTime || '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (2 spans): Detail Tindakan & Form Medis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProc ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* 1. Patient Banner (Data Pasien, Metode, Paket VIP/Reguler, Dokter Pelaksana) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{selectedProc.rmNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedProc.categoryCode === 'VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedProc.categoryCode}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-700">{selectedProc.packageName}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedProc.patientName} ({selectedProc.patientAge} Tahun)
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Wali: {selectedProc.guardianName} • HP: {selectedProc.guardianPhone}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200/70 px-2.5 py-0.5 rounded-full">
                      Metode: {formData.methodType || selectedProc.methodType}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                      {formData.anesthesiaType || selectedProc.anesthesiaType || 'Bius tanpa jarum suntik /FREE Needle injection (FNI)'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-2.5 shrink-0">
                  <div className="sm:text-right">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dokter Pelaksana</div>
                    <div className="text-sm font-extrabold text-slate-800">{selectedProc.doctorName}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedProc.procedureDate} • {selectedProc.procedureTime}</div>
                  </div>

                  {selectedProc.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={handleOpenEditPatientModal}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                      title="Ubah Data Pasien, Dokter, Metode & Paket (Semua Terintegrasi)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ubah Data Pasien & Layanan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status & Kontrol Prosedur Tindakan */}
              {selectedProc.status === 'WAITING' ? (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide">
                        Pasien Siap Dilakukan Tindakan
                      </div>
                      <div className="text-[11px] text-sky-800/80">
                        Klik Mulai Prosedur untuk mengubah status menjadi Sedang Berlangsung (IN PROGRESS).
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartProcedure}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs bg-sky-600 hover:bg-sky-700 text-white active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Prosedur Tindakan</span>
                  </button>
                </div>
              ) : selectedProc.status === 'IN_PROGRESS' ? (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-2 text-amber-950">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold">
                      Prosedur Tindakan Khitan Sedang Berlangsung (Operator: {selectedProc.doctorName})
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    IN PROGRESS
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2 text-emerald-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">
                      Prosedur Tindakan Khitan Telah Selesai Dilaksanakan
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    COMPLETED
                  </span>
                </div>
              )}

              {/* 3. Petugas Asisten Tindakan Khitan (Master Karyawan & Fee Terintegrasi Payroll) */}
              <div className="bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-orange-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-orange-950 uppercase tracking-wider">
                        Petugas Asisten Tindakan Khitan
                      </h4>
                      <p className="text-[11px] text-orange-800/80">
                        Asisten dari daftar karyawan resmi. Fee per pasien otomatis dialokasikan ke rekap payroll.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-900 border border-orange-200 shrink-0">
                    {selectedAssistantStaffIds.length} Asisten Dipilih (Bisa &gt; 1)
                  </span>
                </div>

                {/* Selected Assistants Badges */}
                {selectedAssistantStaffIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-orange-100">
                    {Array.from(new Set(selectedAssistantStaffIds)).map((astId, idx) => {
                      const emp = employees.find(e => e.id === astId);
                      if (!emp) return null;
                      return (
                        <span
                          key={`asst-sel-${astId}-${idx}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-950 rounded-xl text-xs font-bold shadow-2xs"
                        >
                          <UserCheck className="w-4 h-4 text-orange-600 shrink-0" />
                          <span>{emp.name}</span>
                          <span className="text-[10px] text-orange-800/70 font-semibold bg-white px-2 py-0.5 rounded border border-orange-200">
                            {emp.position} • Fee: Rp {(emp.defaultPatientFee ?? 0).toLocaleString('id-ID')} / px
                          </span>
                          {selectedProc.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => setSelectedAssistantStaffIds(selectedAssistantStaffIds.filter(id => id !== astId))}
                              className="hover:bg-rose-100 p-0.5 rounded-full text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus asisten ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-orange-100 text-xs text-orange-700/70 italic flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Belum ada asisten dipilih. Pilih minimal 1 asisten untuk pencatatan fee dan rekam medis.</span>
                  </div>
                )}

                {selectedProc.status !== 'COMPLETED' && (
                  <div className="space-y-2 pt-1">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val && !selectedAssistantStaffIds.includes(val)) {
                          setSelectedAssistantStaffIds([...selectedAssistantStaffIds, val]);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                    >
                      <option value="">+ Tambah Petugas Asisten dari Master Karyawan...</option>
                      {employees
                        .filter(e => e.isActive && !selectedAssistantStaffIds.includes(e.id))
                        .map((emp, idx) => (
                          <option key={`emp-opt-${emp.id}-${idx}`} value={emp.id}>
                            + {emp.name} ({emp.position} • Fee: Rp {(emp.defaultPatientFee ?? 0).toLocaleString('id-ID')} / px)
                          </option>
                        ))}
                    </select>

                    {/* Quick Selection Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-orange-900/60 uppercase tracking-wider mr-1">Pilih Cepat:</span>
                      {employees.filter(e => e.isActive).map((emp, idx) => {
                        const isSelected = selectedAssistantStaffIds.includes(emp.id);
                        return (
                          <button
                            key={`emp-quick-${emp.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAssistantStaffIds(selectedAssistantStaffIds.filter(id => id !== emp.id));
                              } else {
                                setSelectedAssistantStaffIds([...selectedAssistantStaffIds, emp.id]);
                              }
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' 
                                : 'bg-white hover:bg-orange-50 text-slate-700 border-slate-200 hover:border-orange-200'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{emp.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Form Catatan Medis & Prosedur Operasi Khitan */}
              <div className="space-y-4">
                {/* Pilihan Jenis Bius / Anestesi Khitan */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Syringe className="w-4 h-4 text-emerald-600" />
                      Pilihan Jenis Bius / Anestesi Khitan:
                    </label>
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Bebas Jarum Suntik & Minim Nyeri
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ANESTHESIA_OPTIONS.map((opt, idx) => {
                      const isSelected = formData.anesthesiaType === opt.name;
                      return (
                        <div
                          key={`anesth-opt-${opt.id}-${idx}`}
                          onClick={() => {
                            if (selectedProc.status !== 'COMPLETED') {
                              setFormData({ ...formData, anesthesiaType: opt.name });
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white/70 border-emerald-200/80 hover:border-emerald-300 hover:bg-white'
                          } ${selectedProc.status === 'COMPLETED' ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {opt.badge}
                              </span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </div>
                            </div>
                            <div className="text-xs font-black text-slate-900 leading-tight">
                              {opt.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                              {opt.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                      Metode Tindakan Khitan:
                    </label>
                    <select
                      value={formData.methodType}
                      onChange={(e) => setFormData({ ...formData, methodType: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {activeMethods.map((m, idx) => (
                        <option key={`meth-opt-${m.id}-${idx}`} value={m.name}>
                          {m.name} {m.description ? `(${m.description})` : ''}
                        </option>
                      ))}
                      {formData.methodType && !activeMethods.some(m => m.name === formData.methodType) && (
                        <option value={formData.methodType}>{formData.methodType} (Tersimpan)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                      Kondisi / Kasus Khusus Pasien:
                    </label>
                    <select
                      value={formData.patientCondition}
                      onChange={(e) => setFormData({ ...formData, patientCondition: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="STANDAR">STANDAR (Anak Normal / Standar)</option>
                      <option value="GEMUK">GEMUK (Kasus Anak Gemuk / Mikropenis)</option>
                      <option value="ABK">ABK (Anak Berkebutuhan Khusus / Hiperaktif)</option>
                      <option value="DEWASA">DEWASA (Pasien Usia Dewasa)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Estimated Doctor Fee Preview */}
                {estimatedDoctorFee && (
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Estimasi Fee Dokter Operator:
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          {estimatedDoctorFee.methodName} • {estimatedDoctorFee.condition} ({estimatedDoctorFee.serviceType})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-sm font-mono block">
                        Rp {estimatedDoctorFee.feeAmount.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold uppercase">
                        Otomatis Diterbitkan ke Fee Dokter
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Pemeriksaan Pra-Tindakan & Anatomi:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.preCondition}
                    onChange={(e) => setFormData({ ...formData, preCondition: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="Contoh: Anatomi normal, preputium mobile, tidak ada fimosis berat, anak rileks..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Catatan Prosedur Operasi & Anestesi:
                  </label>
                  <textarea
                    rows={3}
                    value={formData.procedureNotes}
                    onChange={(e) => setFormData({ ...formData, procedureNotes: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="Contoh: Anestesi infiltrasi blok cincin tanpa jarum suntik, insisi presisi, zero bleeding, pemasangan sealer..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                      Kondisi Pasca-Tindakan:
                    </label>
                    <textarea
                      rows={2}
                      value={formData.postCondition}
                      onChange={(e) => setFormData({ ...formData, postCondition: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      placeholder="Luka tertutup rapi, sirkulasi glans baik..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                      Instruksi Perawatan & Obat:
                    </label>
                    <textarea
                      rows={2}
                      value={formData.careInstructions}
                      onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                      placeholder="Gunakan celana khitan khusus, boleh mandi setelah 24 jam..."
                    />
                  </div>
                </div>
              </div>

              {/* 5. Modul Produk, Celana Sunat & 3 Jenis Obat Sesuai Paket Reguler/VIP */}
              <TransactionItemManager
                key={`proc-items-${selectedProc.bookingId}`}
                bookingId={selectedProc.bookingId}
                patientName={selectedProc.patientName}
                categoryName={selectedProc.categoryCode}
                packageName={selectedProc.packageName}
                isReadOnly={selectedProc.status === 'COMPLETED'}
              />

              {/* 6. Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Simpan Draf Catatan Medis
                </button>

                {selectedProc.status !== 'COMPLETED' ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleOpenCompleteModal}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan & Mengalihkan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesaikan Tindakan & Masuk Kasir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase">
                      <CheckCircle2 className="w-5 h-5" />
                      Tindakan Khitan Telah Selesai
                    </div>
                    {onNavigateToCashier && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCashier(selectedProc.bookingId, false)}
                        className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Buka Kasir Pembayaran</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium">
              Pilih salah satu antrean tindakan di sisi kiri untuk melihat rekam medis khitan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Informed Consent */}
      {isConsentModalOpen && selectedProc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <h3 className="text-base font-black text-slate-900 uppercase">
                Surat Persetujuan Tindakan Medis (Informed Consent)
              </h3>
              <button onClick={() => setIsConsentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700 space-y-2.5">
                <p className="font-bold text-slate-900">
                  Yang bertanda tangan di bawah ini:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Nama Orang Tua/Wali: <span className="font-bold text-slate-900">{selectedProc.guardianName}</span></div>
                  <div>Nomor Kontak: <span className="font-bold text-slate-900">{selectedProc.guardianPhone}</span></div>
                </div>
                <p className="pt-2">
                  Menyatakan dengan sesungguhnya telah menerima penjelasan lengkap mengenai indikasi, prosedur, manfaat, dan risiko tindakan khitan metode <span className="font-bold text-sky-800">{selectedProc.methodType}</span> terhadap anak kami:
                </p>
                <div className="p-2.5 bg-white rounded border border-slate-200 font-bold text-slate-900">
                  {selectedProc.patientName} (No. RM: {selectedProc.rmNumber}, Usia: {selectedProc.patientAge} Tahun)
                </div>
                <p>
                  Dengan ini memberikan PERSETUJUAN PENUH kepada tim medis Nano Circumcision untuk melakukan tindakan khitan sesuai standar operasional yang berlaku.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Status: Sah & Ditandatangani
              </span>
              <button
                onClick={() => setIsConsentModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sertifikat Khitan Digital */}
      {isCertificateModalOpen && selectedProc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[94vh] shadow-2xl border-4 border-amber-400 flex flex-col overflow-hidden my-auto print-modal-card print:border-none print:shadow-none print:max-h-none">
            <div className="flex justify-between items-center px-5 py-3 border-b border-amber-100 shrink-0 bg-white no-print">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest border border-amber-300">
                NANO CIRCUMCISION OFFICIAL CERTIFICATE
              </div>
              <button onClick={() => setIsCertificateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="certificate-print-document" className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
              {/* Kop Sertifikat Resmi (Logo Asli di Samping Kop) */}
              <div className="flex items-center gap-4 pb-4 mb-4 border-b-2 border-amber-300/80">
                <div className="shrink-0 flex items-center justify-center">
                  <NanoMasterLogo 
                    src={settings.logoUrl} 
                    height={52} 
                    width={65} 
                    className="max-h-[52px] max-w-[65px] object-contain print-kop-logo" 
                  />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                    SERTIFIKAT KEBERANIAN KHITAN
                  </h2>
                  <p className="text-xs font-bold text-sky-900 tracking-wide uppercase mt-0.5">
                    {settings.clinicName || 'NANO CIRCUMCISION CLINIC'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    NOMOR: CERT-2026-{String(selectedProc.id).padStart(6, '0')}
                  </p>
                </div>
                <div className="shrink-0 hidden sm:block text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-900 border border-amber-300 rounded px-2 py-0.5 bg-amber-50">
                    SERTIFIKAT RESMI
                  </span>
                </div>
              </div>

              <div className="text-center py-6 border-y-2 border-dashed border-amber-200 space-y-4">
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                  DIBERIKAN DENGAN BANGGA KEPADA:
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-sky-900 tracking-tight uppercase">
                  {selectedProc.patientName}
                </h3>
                <p className="text-xs font-mono font-bold text-slate-600">
                  Nomor Rekam Medis: {selectedProc.rmNumber} • Usia: {selectedProc.patientAge} Tahun
                </p>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Atas keberanian, ketabahan, dan kesuksesannya menjalani tindakan khitan modern dengan metode{' '}
                  <span className="font-bold text-slate-900">{selectedProc.packageName}</span> di Nano Circumcision Clinic.
                </p>
              </div>

              <div className="mt-6 flex justify-between items-end text-center">
                <div>
                  <div className="text-xs font-bold text-slate-500">Tanggal Tindakan</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{selectedProc.procedureDate}</div>
                </div>

                <div className="text-center">
                  <div className="w-32 border-b border-slate-900 pb-1 mx-auto font-black text-xs text-slate-900">
                    {selectedProc.doctorName}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    Dokter Operator Khitan
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0 no-print">
              <button
                type="button"
                onClick={() => {
                  openElementInNewTab('certificate-print-document', {
                    title: `Sertifikat Khitan - ${selectedProc.patientName}`,
                    paperSize: 'A4',
                    clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
                  });
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-sky-700 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Buka pratinjau di tab baru untuk cetak mandiri atau simpan PDF"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tab Baru / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  printElementById('certificate-print-document', {
                    title: `Sertifikat Khitan - ${selectedProc.patientName}`,
                    paperSize: 'A4',
                    clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
                  });
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PrintDocumentIcon size={16} />
                Cetak Sertifikat
              </button>
              <button
                type="button"
                onClick={() => setIsCertificateModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Selesaikan Tindakan & Masuk Kasir */}
      {isConfirmModalOpen && selectedProc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5 px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Selesaikan Tindakan & Lanjut Kasir
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Konfirmasi finalisasi rekam medis dan penerbitan invoice kasir
                </p>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Pasien:</span>
                  <span className="font-black text-slate-900">{selectedProc.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Nomor RM:</span>
                  <span className="font-mono font-bold text-sky-700">{selectedProc.rmNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Metode Khitan:</span>
                  <span className="font-bold text-slate-900">{formData.methodType || selectedProc.methodType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Jenis Bius / Anestesi:</span>
                  <span className="font-bold text-emerald-700">{formData.anesthesiaType || selectedProc.anesthesiaType || 'Bius tanpa jarum suntik (FNI)'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Dokter Operator:</span>
                  <span className="font-bold text-slate-900">{selectedProc.doctorName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500 font-medium">Asisten Medis ({selectedAssistantStaffIds.length}):</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs">
                    {selectedAssistantStaffIds.length > 0
                      ? selectedAssistantStaffIds.map(id => employees.find(e => e.id === id)?.name).filter(Boolean).join(', ')
                      : (selectedProc.assistantStaffName || 'Tanpa Asisten Khusus')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-emerald-900">
                <p className="font-black flex items-center gap-1.5 text-xs text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Otomatisasi Sistem:
                </p>
                <ul className="space-y-1 font-medium text-[11px] text-emerald-800">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Rekam medis dan catatan anestesi disimpan permanen</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fee dokter & fee asisten medis dicatat otomatis</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Stok obat dan alkes terpotong otomatis dari inventaris</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sertifikat khitan otomatis diterbitkan</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sistem langsung membuka invoice di kasir untuk pembayaran</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeCompleteProcedure}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan & Mengalihkan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Selesaikan & Buka Kasir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TERPADU: EDIT DATA PASIEN, DOKTER, METODE & PAKET */}
      {isEditPatientModalOpen && selectedProc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Ubah Data Pasien & Layanan Khitan Terpadu
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    No. RM: <strong className="font-mono text-sky-700">{selectedProc.rmNumber}</strong> • Seluruh data otomatis sinkron ke Tindakan, Dokter, Metode, Paket & Kasir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPatientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatientEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* BAGIAN 1: DATA PASIEN */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>1. Identitas Pasien & Orang Tua / Wali</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Lengkap Pasien <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientEditForm.fullName}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, fullName: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      placeholder="Nama lengkap anak"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      value={patientEditForm.nickname}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, nickname: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      placeholder="Nama panggilan anak"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={patientEditForm.birthDate}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, birthDate: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={patientEditForm.gender}
                      onChange={(e: any) => setPatientEditForm({ ...patientEditForm, gender: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Orang Tua / Wali
                    </label>
                    <input
                      type="text"
                      value={patientEditForm.guardianName}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, guardianName: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      placeholder="Nama ayah / ibu / wali"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      No. HP / WhatsApp Wali
                    </label>
                    <input
                      type="text"
                      value={patientEditForm.guardianPhone}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, guardianPhone: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                      placeholder="0812xxxx"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Alamat Domisili Pasien
                    </label>
                    <input
                      type="text"
                      value={patientEditForm.address}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, address: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                      placeholder="Alamat lengkap tempat tinggal"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan Alergi Pasien
                    </label>
                    <input
                      type="text"
                      value={patientEditForm.allergies}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, allergies: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                      placeholder="Tidak ada / Alergi Amoxicillin, dll"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: DOKTER, METODE, PAKET (REGULER/VIP) & BIAYA */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 space-y-3">
                <div className="text-[11px] font-black uppercase text-sky-900 tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  <span>2. Dokter Pelaksana, Metode & Paket Layanan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pilihan Dokter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Dokter Operator / Pelaksana <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={patientEditForm.plannedDoctorId}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, plannedDoctorId: Number(e.target.value) })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {doctors.filter(d => d.isActive).map((doc) => (
                        <option key={`doc-edit-${doc.id}`} value={doc.id}>
                          {doc.name} ({doc.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Metode Khitan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Metode Tindakan Khitan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={patientEditForm.plannedMethodType}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, plannedMethodType: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {activeMethods.map((m) => (
                        <option key={`meth-edit-${m.id}`} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                      {patientEditForm.plannedMethodType && !activeMethods.some(m => m.name === patientEditForm.plannedMethodType) && (
                        <option value={patientEditForm.plannedMethodType}>{patientEditForm.plannedMethodType} (Tersimpan)</option>
                      )}
                    </select>
                  </div>

                  {/* Pilihan Kategori Paket (REGULER vs VIP) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kategori Paket Layanan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPatientEditForm({ ...patientEditForm, plannedPackageCategory: 'REGULER' })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                          patientEditForm.plannedPackageCategory !== 'VIP'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        REGULER
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientEditForm({ ...patientEditForm, plannedPackageCategory: 'VIP' })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                          patientEditForm.plannedPackageCategory === 'VIP'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ⭐ VIP
                      </button>
                    </div>
                  </div>

                  {/* Pilihan Paket Khitan Terdaftar */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Paket Khitan Terdaftar
                    </label>
                    <select
                      value={patientEditForm.plannedPackageId}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, plannedPackageId: Number(e.target.value) })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {packages.filter(p => p.isActive).map((pkg) => (
                        <option key={`pkg-edit-${pkg.id}`} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Jenis Bius / Anestesi */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jenis Bius / Anestesi
                    </label>
                    <select
                      value={patientEditForm.plannedAnesthesiaType}
                      onChange={(e) => setPatientEditForm({ ...patientEditForm, plannedAnesthesiaType: e.target.value })}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {ANESTHESIA_OPTIONS.map((opt) => (
                        <option key={`anesth-modal-${opt.id}`} value={opt.name}>
                          {opt.name} ({opt.badge})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-medium">
                  * Seluruh data otomatis terintegrasi ke Rekam Medis & Kasir
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingPatientEdit}
                    onClick={() => setIsEditPatientModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPatientEdit}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingPatientEdit ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan & Menyinkronkan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan & Sinkronkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
