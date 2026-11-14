import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Users, Search, Plus, Filter, Phone, MapPin, Heart, ShieldAlert,
  Baby, Calendar, UserPlus, CheckCircle, ChevronRight, Sparkles, X,
  Archive, RotateCcw, Trash2, Eye, ClipboardPaste, FileText, Wand2,
  Clock, Stethoscope, UserCheck, CheckCircle2, Edit3, Save, AlertCircle, DollarSign, Printer
} from 'lucide-react';
import { CircumcisionPatient } from '../../types';
import { calculateAge, getPatientAgeDisplay } from '../../utils/ageHelper';
import { parsePatientRegistrationText } from '../../utils/patientTextParser';
import { DpReceiptPrintModal, DpReceiptData } from '../cashier/DpReceiptPrintModal';

const EXAMPLE_WA_TEXT = `*Silakan diisi form pendaftaran di bawah ini Ayah Bunda :SUNAT NANO*

- Tgl Daftar : 19 Agustus 2026
- Nama Anak : Adam Prihantoro Agus 
- Tgl Lahir Anak : 06-06-2020
- Usia Anak : 6th 3bulan
- BB & TB Anak : 18🙏🏻
- Hobi & Minat Anak : hobi melihara ikan & minat pengen jadi seorang pelayaran
- Prestasi Yang Pernah diraih Anak :
- Kelas & Nama Sekolah Anak : kelas 1Sd sekolah di SDN TAJUNGAN kec Kamal kab Bangkalan 
- Nama Ortu : Ayah : Agus Priyanto
- Ibu : Dewi Sinta
- Pekerjaan Ortu : Wiraswasta 
- Tanggal Sunat : 10 September 2026
- Request Jam : 07:00
- Cabang :  bangkalan
- Sumber informasi Sunat :  liat di tik tok
- No. HP/WA : 081336080648
- Alamat Lengkap : Desa Tajungan dusun asem blok 4
- RT/RW : 004/002 Kamal bangkalan
- Akun IG : Yuniki Ramadhani Agus 
- Metode Sunat : Glans Pro bipolar pen sealer
- Paket REG/VIP : VIP
- Agama : ISLAM
- vocher diskon : 

_nb : untuk pasien yang sudah daftar di mohon di konfirmasi ulang sebelum H-1 tindakan sunat (khitan)_`;

interface CircumcisionPatientListProps {
  initialOpenRegisterModal?: boolean;
  onClearInitialRegisterModal?: () => void;
}

export const CircumcisionPatientList: React.FC<CircumcisionPatientListProps> = ({
  initialOpenRegisterModal,
  onClearInitialRegisterModal,
}) => {
  const { 
    patients, guardians, doctors, categories, packages, circumcisionMethods,
    registerPatient, updatePatient, deletePatient, restorePatient, currentUser, employees, bookings,
    activeBranchCode, showToast
  } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuardianFilter, setSelectedGuardianFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [dpReceiptPreview, setDpReceiptPreview] = useState<DpReceiptData | null>(null);

  useEffect(() => {
    if (initialOpenRegisterModal) {
      setIsRegisterModalOpen(true);
      if (onClearInitialRegisterModal) {
        onClearInitialRegisterModal();
      }
    }
  }, [initialOpenRegisterModal, onClearInitialRegisterModal]);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<CircumcisionPatient | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<CircumcisionPatient | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<CircumcisionPatient | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [patientToRestore, setPatientToRestore] = useState<CircumcisionPatient | null>(null);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [isRestoringPatient, setIsRestoringPatient] = useState(false);

  const isAdmin = !currentUser || currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const todayStr = new Date().toISOString().split('T')[0];

  // Edit Form State (Core Data Synchronization)
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    nickname: '',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: 'Jakarta',
    birthDate: '2018-05-10',
    school: '',
    grade: '',
    weightKg: '',
    heightCm: '',
    allergies: '',
    notes: '',
    address: '',
    phone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'Ayah Kandung',
    fatherName: '',
    motherName: '',
    // Core Layanan Khitan yang Terhubung
    plannedPackageCategory: 'REG',
    plannedPackageId: 1,
    plannedMethodType: 'Glans Pro Bipolar Pen Sealer',
    plannedPackagePrice: 1800000,
    discountAmount: 0,
    dpAmount: 0,
    paymentMethod: 'TRANSFER' as 'TRANSFER' | 'QRIS' | 'CASH',
    plannedDoctorId: 1,
    plannedProcedureDate: todayStr,
    plannedProcedureTime: '08:00',
    plannedAnesthesiaType: 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
    patientSource: 'WhatsApp / Chat Pendaftaran',
    closingStaffId: '' as number | string,
  });

  // Form State
  const [useExistingGuardian, setUseExistingGuardian] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState<number>(guardians[0]?.id || 0);

  React.useEffect(() => {
    if (guardians && guardians.length > 0) {
      if (!selectedGuardianId || !guardians.some(g => g.id === selectedGuardianId)) {
        setSelectedGuardianId(guardians[0].id);
      }
    }
  }, [guardians, selectedGuardianId]);
  const [showAutoFillBox, setShowAutoFillBox] = useState(true);
  const [autoFillText, setAutoFillText] = useState('');
  const [autoFillSuccessMessage, setAutoFillSuccessMessage] = useState<string | null>(null);
  const [autoExtractedSummary, setAutoExtractedSummary] = useState<{
    birthDate?: string;
    weightKg?: string;
    bookingDate?: string;
    bookingTime?: string;
    fullName?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: 'Jakarta',
    birthDate: '2018-05-10',
    school: '',
    grade: '',
    weightKg: '',
    heightCm: '',
    allergies: '',
    notes: '',
    // If new guardian:
    guardianName: '',
    fatherName: '',
    motherName: '',
    relationship: 'Ayah Kandung',
    phone: '',
    alternatePhone: '',
    address: '',
    guardianNotes: '',
    // Rencana Tindakan Khitan & Booking Otomatis:
    createBookingAuto: true,
    plannedProcedureDate: todayStr,
    plannedProcedureTime: '08:00',
    plannedPackageId: packages[0]?.id || 1,
    plannedMethodType: packages[0]?.name || 'Metode Glans Pro Bipolar Pensealer',
    plannedAnesthesiaType: 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
    plannedPackageCategory: 'REG',
    plannedDoctorId: doctors[0]?.id || 1,
    discountAmount: 0,
    dpAmount: 0,
    paymentMethod: 'TRANSFER' as 'TRANSFER' | 'QRIS' | 'CASH',
    patientSource: 'WhatsApp / Chat Pendaftaran',
    closingStaffId: '' as number | string,
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Kalkulasi Biaya Khitan Real-time di Form Pendaftaran Pasien
  const regCatId = formData.plannedPackageCategory === 'VIP' ? 2 : 1;
  const regMethodFirstWord = (formData.plannedMethodType || '').toLowerCase().split(' ')[0];
  const regSelectedPkg = packages.find(p => p.id === Number(formData.plannedPackageId)) 
    || (regMethodFirstWord ? packages.find(p => (p?.name || '').toLowerCase().includes(regMethodFirstWord)) : undefined)
    || packages[0];
  const regPriceObj = regSelectedPkg?.prices?.find(p => p.patientCategoryId === regCatId);
  const regActivePrice = regPriceObj ? regPriceObj.price : (regCatId === 2 ? 2500000 : 1800000);
  const regDiscount = Number(formData.discountAmount || 0);
  const regNetTotal = Math.max(0, regActivePrice - regDiscount);
  const regDp = Number(formData.dpAmount || 0);
  const regRemaining = Math.max(0, regNetTotal - regDp);

  const handleOpenDpReceiptFromReg = () => {
    if (!formData.fullName.trim()) {
      showToast('Silakan isi Nama Lengkap Anak terlebih dahulu untuk mencetak Nota DP', 'info');
      return;
    }
    setDpReceiptPreview({
      receiptNumber: 'NOTA-DP-PENDAFTARAN',
      patientName: formData.fullName.trim(),
      rmNumber: 'Menunggu Penerbitan RM',
      date: new Date().toISOString().split('T')[0],
      packageName: formData.plannedMethodType || regSelectedPkg?.name || 'Paket Khitan',
      packageCategory: formData.plannedPackageCategory || 'REG',
      subtotal: regActivePrice,
      discount: regDiscount,
      totalAmount: regNetTotal,
      dpAmount: regDp,
      remainingAmount: regRemaining,
      paymentMethod: formData.paymentMethod,
      notes: formData.plannedProcedureDate
        ? `Rencana Tindakan: ${formData.plannedProcedureDate} (${formData.plannedProcedureTime || '08:00'})`
        : undefined,
      branchCode: activeBranchCode || 'PUSAT',
      cashierName: currentUser?.fullName || currentUser?.name || currentUser?.username || 'Kasir / Admin',
    });
  };

  // Kalkulasi Biaya Khitan Real-time di Form Edit Pasien (Core Data)
  const editCatId = editFormData.plannedPackageCategory === 'VIP' ? 2 : 1;
  const editMethodFirstWord = (editFormData.plannedMethodType || '').toLowerCase().split(' ')[0];
  const editSelectedPkg = packages.find(p => p.id === Number(editFormData.plannedPackageId))
    || (editMethodFirstWord ? packages.find(p => (p?.name || '').toLowerCase().includes(editMethodFirstWord)) : undefined)
    || packages[0];
  const editDiscount = Number(editFormData.discountAmount || 0);
  const editPrice = Number(editFormData.plannedPackagePrice || 0);
  const editNetTotal = Math.max(0, editPrice - editDiscount);
  const editDp = Number(editFormData.dpAmount || 0);
  const editRemaining = Math.max(0, editNetTotal - editDp);

  const handleOpenEditModal = (p: CircumcisionPatient) => {
    const linkedBk = bookings.find(b => b.patientId === p.id && b.status !== 'CANCELLED') || bookings.find(b => b.patientId === p.id);

    const catCode = linkedBk?.categoryCode === 'VIP' ? 'VIP' : 'REG';
    const catId = catCode === 'VIP' ? 2 : 1;
    const pkgId = linkedBk?.packageId || packages[0]?.id || 1;
    const matchedPkg = packages.find(pkg => pkg.id === pkgId) || packages[0];
    const methodStr = linkedBk?.methodType || linkedBk?.packageName || matchedPkg?.name || 'Glans Pro Bipolar Pen Sealer';

    let pkgPrice = linkedBk?.packagePriceSnapshot;
    if (pkgPrice === undefined || pkgPrice === null) {
      const priceRec = matchedPkg?.prices?.find(pr => pr.patientCategoryId === catId);
      pkgPrice = priceRec ? priceRec.price : (catId === 2 ? 2500000 : 1800000);
    }

    setEditFormData({
      fullName: p.fullName || '',
      nickname: p.nickname || '',
      nik: p.nik || '',
      gender: p.gender || 'Laki-laki',
      birthPlace: p.birthPlace || 'Jakarta',
      birthDate: p.birthDate || '2018-05-10',
      school: p.school || '',
      grade: p.grade || '',
      weightKg: p.weightKg || '',
      heightCm: p.heightCm || '',
      allergies: p.allergies || '',
      notes: p.notes || '',

      address: p.address || '',
      phone: p.phone || p.guardianPhone || '',
      guardianName: p.guardianName || p.fatherName || '',
      guardianPhone: p.guardianPhone || p.phone || '',
      guardianRelationship: p.guardianRelationship || 'Ayah Kandung',
      fatherName: p.fatherName || '',
      motherName: p.motherName || '',

      plannedPackageCategory: catCode,
      plannedPackageId: pkgId,
      plannedMethodType: methodStr,
      plannedPackagePrice: pkgPrice,
      discountAmount: linkedBk?.discountAmount || 0,
      dpAmount: linkedBk?.dpAmount || 0,
      paymentMethod: 'TRANSFER',
      plannedDoctorId: linkedBk?.doctorId || doctors[0]?.id || 1,
      plannedProcedureDate: linkedBk?.bookingDate || todayStr,
      plannedProcedureTime: linkedBk?.bookingTime || '08:00',
      plannedAnesthesiaType: linkedBk?.anesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
      patientSource: linkedBk?.patientSource || 'WhatsApp / Chat Pendaftaran',
      closingStaffId: linkedBk?.closingStaffId || '',
    });

    setPatientToEdit(p);
  };

  const handleSaveEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToEdit) return;
    if (!editFormData.fullName.trim()) {
      showToast('Nama lengkap anak wajib diisi!', 'error');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      const res = await updatePatient(patientToEdit.id, editFormData);
      if (res.success) {
        setPatientToEdit(null);
        if (selectedPatientDetail && selectedPatientDetail.id === patientToEdit.id) {
          setSelectedPatientDetail(null);
        }
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleApplyAutoFill = (textToParse?: string) => {
    const text = textToParse || autoFillText;
    if (!text.trim()) return;

    const parsed = parsePatientRegistrationText(text);

    setFormData((prev) => {
      let resolvedCategory = prev.plannedPackageCategory;
      if (parsed.packageCategory) {
        resolvedCategory = parsed.packageCategory.toUpperCase().includes('VIP') ? 'VIP' : 'REG';
      }

      let resolvedPkgId = prev.plannedPackageId;
      let resolvedMethod = prev.plannedMethodType;
      if (parsed.circumcisionMethod) {
        const methodWord = String(parsed.circumcisionMethod).trim().toLowerCase().split(' ')[0];
        const found = methodWord ? packages.find(p => (p?.name || '').toLowerCase().includes(methodWord)) : undefined;
        if (found) {
          resolvedPkgId = found.id;
          resolvedMethod = found.name;
        } else {
          resolvedMethod = parsed.circumcisionMethod;
        }
      }

      return {
        ...prev,
        fullName: parsed.fullName || prev.fullName,
        nickname: parsed.nickname || prev.nickname,
        birthDate: parsed.birthDate || prev.birthDate,
        birthPlace: parsed.birthPlace || prev.birthPlace,
        weightKg: parsed.weightKg || prev.weightKg,
        heightCm: parsed.heightCm || prev.heightCm,
        school: parsed.school || prev.school,
        grade: parsed.grade || prev.grade,
        allergies: parsed.allergies || prev.allergies,
        fatherName: parsed.fatherName || prev.fatherName,
        motherName: parsed.motherName || prev.motherName,
        guardianName: parsed.guardianName || prev.guardianName,
        relationship: parsed.relationship || prev.relationship,
        phone: parsed.phone || prev.phone,
        address: parsed.address || prev.address,
        notes: parsed.notes || prev.notes,
        // Auto extract booking plan:
        // Rencana Tindakan khitan & Jadwal Booking Otomatis salin dari text "Tanggal Sunat"
        createBookingAuto: true,
        plannedProcedureDate: parsed.bookingDate || prev.plannedProcedureDate,
        // Request Jam Tindakan salin otomatis dari text "Request Jam"
        plannedProcedureTime: parsed.bookingTime || prev.plannedProcedureTime,
        plannedPackageId: resolvedPkgId,
        plannedMethodType: resolvedMethod,
        plannedPackageCategory: resolvedCategory,
        patientSource: parsed.patientSource || prev.patientSource,
        discountAmount: parsed.discountAmount !== undefined ? parsed.discountAmount : prev.discountAmount,
        dpAmount: parsed.dpAmount !== undefined ? parsed.dpAmount : prev.dpAmount,
        paymentMethod: parsed.paymentMethod || prev.paymentMethod,
      };
    });

    if (parsed.fatherName || parsed.motherName || parsed.phone || parsed.address) {
      setUseExistingGuardian(false);
    }

    setAutoExtractedSummary({
      birthDate: parsed.birthDate,
      weightKg: parsed.weightKg,
      bookingDate: parsed.bookingDate,
      bookingTime: parsed.bookingTime,
      fullName: parsed.fullName,
    });

    const fieldSummary = parsed.extractedFields.length > 0 
      ? parsed.extractedFields.join(', ') 
      : 'Data pasien & rencana booking';

    setAutoFillSuccessMessage(`Berhasil menyalin otomatis: ${fieldSummary}. Tanggal lahir, BB, rencana sunat, dan request jam telah disinkronkan ke formulir.`);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setAutoFillText(clipText);
          handleApplyAutoFill(clipText);
          return;
        }
      }
    } catch (err) {
      console.warn('Clipboard direct read not permitted:', err);
    }
    setShowAutoFillBox(true);
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rmNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.guardianName && p.guardianName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGuardian = 
      selectedGuardianFilter === 'ALL' || String(p.guardianId) === selectedGuardianFilter;

    const matchesArchive = showArchived ? true : !(p as any).isDeleted;

    return matchesSearch && matchesGuardian && matchesArchive;
  });

  const handleDeletePatient = (p: CircumcisionPatient) => {
    setPatientToDelete(p);
    setDeleteReason('');
    setIsPermanentDelete(true);
  };

  const handleConfirmDeletePatient = async () => {
    if (!patientToDelete) return;
    try {
      setIsDeletingPatient(true);
      await deletePatient(patientToDelete.id, deleteReason.trim() || 'Dihapus oleh admin', isPermanentDelete);
      setPatientToDelete(null);
    } finally {
      setIsDeletingPatient(false);
    }
  };

  const handleRestorePatient = (p: CircumcisionPatient) => {
    setPatientToRestore(p);
  };

  const handleConfirmRestorePatient = async () => {
    if (!patientToRestore) return;
    try {
      setIsRestoringPatient(true);
      await restorePatient(patientToRestore.id);
      setPatientToRestore(null);
    } finally {
      setIsRestoringPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.birthDate) {
      showToast('Nama anak dan tanggal lahir wajib diisi', 'error');
      return;
    }

    const ageInfo = calculateAge(formData.birthDate);

    const payload: any = {
      fullName: formData.fullName,
      nickname: formData.nickname,
      nik: formData.nik,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      ageYears: ageInfo.years,
      ageMonths: ageInfo.months,
      school: formData.school,
      grade: formData.grade,
      weightKg: formData.weightKg,
      heightCm: formData.heightCm,
      allergies: formData.allergies,
      notes: formData.notes,
    };

    let targetGuardianId: number | undefined = undefined;
    if (useExistingGuardian) {
      if (selectedGuardianId && guardians.some(g => g.id === selectedGuardianId)) {
        targetGuardianId = selectedGuardianId;
      } else if (guardians.length > 0) {
        targetGuardianId = guardians[0].id;
      }
    }

    if (targetGuardianId) {
      payload.guardianId = targetGuardianId;
      const guard = guardians.find(g => g.id === targetGuardianId);
      payload.address = guard?.address || formData.address || '';
      payload.phone = guard?.phone || formData.phone || '';
    } else {
      const gName = (
        formData.guardianName || 
        formData.fatherName || 
        formData.motherName || 
        (formData.fullName ? `Orang Tua ${formData.fullName}` : 'Orang Tua / Wali')
      ).trim();
      payload.guardianData = {
        name: gName,
        fatherName: formData.fatherName || gName,
        motherName: formData.motherName || '',
        guardianName: formData.guardianName || formData.fatherName || formData.motherName || gName,
        relationship: formData.relationship || 'Orang Tua',
        phone: formData.phone || '-',
        alternatePhone: formData.alternatePhone || '',
        address: formData.address || '',
        notes: formData.guardianNotes || '',
      };
      payload.address = formData.address || '';
      payload.phone = formData.phone || '';
    }

    // Attach planned procedure & automatic booking details
    if (formData.createBookingAuto && formData.plannedProcedureDate) {
      payload.plannedProcedureDate = formData.plannedProcedureDate;
      payload.plannedProcedureTime = formData.plannedProcedureTime || '08:00';
      payload.plannedPackageId = Number(formData.plannedPackageId) || 1;
      payload.plannedMethodType = formData.plannedMethodType;
      payload.plannedAnesthesiaType = formData.plannedAnesthesiaType;
      payload.plannedPackageCategory = formData.plannedPackageCategory;
      payload.plannedDoctorId = Number(formData.plannedDoctorId) || (doctors[0]?.id || 1);
      payload.discountAmount = Number(formData.discountAmount || 0);
      payload.dpAmount = Number(formData.dpAmount || 0);
      payload.paymentMethod = formData.paymentMethod || 'TRANSFER';
      payload.patientSource = formData.patientSource || 'WhatsApp / Chat Pendaftaran';
      if (formData.closingStaffId) {
        payload.closingStaffId = Number(formData.closingStaffId);
        const emp = employees.find(e => e.id === Number(formData.closingStaffId));
        payload.closingStaffName = emp?.name || '';
      } else {
        payload.closingStaffId = null;
        payload.closingStaffName = null;
      }
    }

    const res = await registerPatient(payload);
    if (res.success) {
      setIsRegisterModalOpen(false);
      setFormData({
        fullName: '',
        nickname: '',
        nik: '',
        gender: 'Laki-laki',
        birthPlace: 'Jakarta',
        birthDate: '2018-05-10',
        school: '',
        grade: '',
        weightKg: '',
        heightCm: '',
        allergies: '',
        notes: '',
        guardianName: '',
        fatherName: '',
        motherName: '',
        relationship: 'Ayah Kandung',
        phone: '',
        alternatePhone: '',
        address: '',
        guardianNotes: '',
        createBookingAuto: true,
        plannedProcedureDate: todayStr,
        plannedProcedureTime: '08:00',
        plannedPackageId: packages[0]?.id || 1,
        plannedMethodType: packages[0]?.name || 'Metode Glans Pro Bipolar Pensealer',
        plannedAnesthesiaType: 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
        plannedPackageCategory: 'REG',
        plannedDoctorId: doctors[0]?.id || 1,
        discountAmount: 0,
        dpAmount: 0,
        paymentMethod: 'TRANSFER',
        patientSource: 'WhatsApp / Chat Pendaftaran',
        closingStaffId: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Data Pasien &amp; Wali Khitan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Pengelolaan identitas anak, nomor rekam medis (RM) terpusat, dan riwayat keluarga.
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Pasien Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama anak, No. RM (contoh: RM-2026-000001), atau orang tua..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedGuardianFilter}
              onChange={(e) => setSelectedGuardianFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Keluarga / Wali</option>
              {guardians.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  Keluarga: {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
              showArchived
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-slate-400" />
            <span>{showArchived ? 'Sembunyikan Arsip' : 'Arsip'}</span>
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4">No. RM &amp; Nama Anak</th>
                <th className="py-3.5 px-4">Usia &amp; Tgl Lahir</th>
                <th className="py-3.5 px-4">Orang Tua / Wali</th>
                <th className="py-3.5 px-4">Kontak &amp; Alamat</th>
                <th className="py-3.5 px-4">Catatan Khusus</th>
                <th className="py-3.5 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                    Tidak ditemukan data pasien khitan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const isDeleted = (p as any).isDeleted;
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${isDeleted ? 'bg-amber-50/40 opacity-75' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="font-mono font-black text-sky-700 text-xs">{p.rmNumber}</div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                            {p.branchCode || 'PUSAT'}
                          </span>
                          {isDeleted && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                              Arsip
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">{p.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-medium">Panggilan: &quot;{p.nickname}&quot;</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-black text-slate-800 text-xs">
                          {getPatientAgeDisplay(p)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-medium">
                          {p.birthPlace ? `${p.birthPlace}, ` : ''}{p.birthDate}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{p.guardianName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{p.guardianRelationship}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.guardianPhone || p.phone}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5 font-medium">
                          {p.address}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {p.allergies ? (
                          <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{p.allergies}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Tidak ada alergi</span>
                        )}
                        {p.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic line-clamp-1">
                            {p.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPatientDetail(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                            title="Lihat Detail Pasien"
                          >
                            Lihat
                          </button>
                          {!isDeleted && (
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Edit Data Pasien, Paket & Finansial (Core Data)"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Edit</span>
                            </button>
                          )}
                          {isAdmin && (
                            isDeleted ? (
                              <button
                                onClick={() => handleRestorePatient(p)}
                                className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                title="Pulihkan Pasien dari Arsip"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeletePatient(p)}
                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                title="Hapus / Arsipkan Pasien"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
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

      {/* Modal: Pendaftaran Pasien Baru */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            {/* Modal Header (Fixed) */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Pendaftaran Pasien Khitan Baru
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Nomor Rekam Medis (RM) akan diterbitkan otomatis secara berurutan oleh sistem.
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body & sticky footer */}
            <form
              onSubmit={handleSubmit}
              onPaste={(e) => {
                if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
                const pasted = e.clipboardData?.getData('text');
                if (
                  pasted &&
                  (pasted.includes('\n') ||
                    pasted.toLowerCase().includes('tgl') ||
                    pasted.toLowerCase().includes('lahir') ||
                    pasted.toLowerCase().includes('sunat') ||
                    pasted.toLowerCase().includes('bb') ||
                    pasted.toLowerCase().includes('jam'))
                ) {
                  setAutoFillText(pasted);
                  setShowAutoFillBox(true);
                  handleApplyAutoFill(pasted);
                }
              }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Quick Auto-Fill Banner / Section */}
            <div className="mb-5 bg-gradient-to-r from-sky-50 via-indigo-50/60 to-emerald-50 border border-sky-200/80 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Auto-Fill dari Salin Teks Chat WhatsApp / Formulir Pendaftaran
                      </h4>
                      <span className="text-[10px] font-black uppercase text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                        Otomatis Presisi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Menyalin otomatis <strong>Tgl Lahir Anak</strong>, <strong>BB</strong> (Berat Badan), <strong>Tanggal Sunat</strong> (Jadwal Booking), dan <strong>Request Jam</strong> tindakan khitan.
                    </p>
                    
                    {/* Quick Badges of the 4 requested automated fields */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-sky-800 border border-sky-200 shadow-2xs">
                        🎂 <span>Tgl Lahir Anak &rarr; Tanggal Lahir</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-emerald-800 border border-emerald-200 shadow-2xs">
                        ⚖️ <span>BB &rarr; Berat Badan (kg)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-indigo-800 border border-indigo-200 shadow-2xs">
                        📅 <span>Tanggal Sunat &rarr; Jadwal Booking</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-purple-800 border border-purple-200 shadow-2xs">
                        ⏰ <span>Request Jam &rarr; Jam Tindakan</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
                    title="Baca teks dari clipboard dan isi otomatis"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-sky-600" />
                    <span>Paste Clipboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAutoFillBox(!showAutoFillBox)}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{showAutoFillBox ? 'Tutup Kolom Teks' : 'Buka Tempel Teks'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible / Expandable Auto Fill Box */}
              {showAutoFillBox && (
                <div className="mt-4 pt-3.5 border-t border-sky-200/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-sky-600" />
                      Tempel (Paste) Teks Pendaftaran di bawah:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoFillText(EXAMPLE_WA_TEXT);
                        handleApplyAutoFill(EXAMPLE_WA_TEXT);
                      }}
                      className="text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Gunakan Contoh Format Teks WA & Terapkan
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={autoFillText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAutoFillText(val);
                      if (val.trim() && (val.includes('\n') || val.includes(':') || val.includes('-'))) {
                        handleApplyAutoFill(val);
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted && pasted.trim()) {
                        setAutoFillText(pasted);
                        handleApplyAutoFill(pasted);
                      }
                    }}
                    placeholder="Contoh format teks WhatsApp:
*Silakan diisi form pendaftaran di bawah ini Ayah Bunda :SUNAT NANO*
- Nama Anak : Adam Prihantoro Agus 
- Tgl Lahir Anak : 06-06-2020
- Usia Anak : 6th 3bulan
- BB & TB Anak : 18🙏🏻
- Nama Ortu : Ayah : Agus Priyanto
- Tanggal Sunat : 10 September 2026
- Request Jam : 07:00
- No. HP/WA : 081336080648..."
                    className="w-full p-3 bg-white border border-sky-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      💡 Sistem membaca &quot;Tgl Lahir Anak&quot;, &quot;BB&quot;, &quot;Tanggal Sunat&quot;, dan &quot;Request Jam&quot; secara otomatis.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoFillText('');
                          setShowAutoFillBox(false);
                        }}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAutoFill()}
                        disabled={!autoFillText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Terapkan & Salin Otomatis</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success feedback alert */}
              {autoFillSuccessMessage && (
                <div className="mt-3 p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl flex items-start justify-between gap-2 text-emerald-900 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-black text-emerald-950">Pengisian Otomatis Berhasil Terverifikasi!</span>
                      <p className="mt-0.5 text-emerald-800 font-medium">{autoFillSuccessMessage}</p>
                      
                      {autoExtractedSummary && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80">
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase">Tgl Lahir Anak</span>
                            <span className="font-black text-[11px] text-emerald-900">
                              {autoExtractedSummary.birthDate || '-'}
                            </span>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase">BB (Berat Badan)</span>
                            <span className="font-black text-[11px] text-emerald-900">
                              {autoExtractedSummary.weightKg ? `${autoExtractedSummary.weightKg} kg` : '-'}
                            </span>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase">Tanggal Sunat</span>
                            <span className="font-black text-[11px] text-indigo-900">
                              {autoExtractedSummary.bookingDate || '-'}
                            </span>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-200">
                            <span className="block text-[9px] font-bold text-slate-500 uppercase">Request Jam</span>
                            <span className="font-black text-[11px] text-purple-900">
                              {autoExtractedSummary.bookingTime ? `${autoExtractedSummary.bookingTime} WIB` : '-'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoFillSuccessMessage(null);
                      setAutoExtractedSummary(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Opsi Orang Tua / Wali */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Keluarga / Orang Tua / Wali
                  </span>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={useExistingGuardian}
                        onChange={() => setUseExistingGuardian(true)}
                        name="guardianOption"
                      />
                      Pilih yang Sudah Ada (Kakak/Adik)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useExistingGuardian}
                        onChange={() => setUseExistingGuardian(false)}
                        name="guardianOption"
                      />
                      Wali Baru
                    </label>
                  </div>
                </div>

                {useExistingGuardian ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Pilih Orang Tua Terdaftar:
                    </label>
                    <select
                      value={selectedGuardianId}
                      onChange={(e) => setSelectedGuardianId(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {guardians.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.relationship}) - Telp: {g.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Nama Lengkap Ayah / Wali:
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value, guardianName: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                        placeholder="e.g. Agus Priyanto"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Nama Lengkap Ibu:
                      </label>
                      <input
                        type="text"
                        value={formData.motherName}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                        placeholder="e.g. Dewi Sinta"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Nomor WhatsApp / HP:
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                        placeholder="e.g. 081336080648"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Hubungan dengan Pasien:
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="Ayah Kandung">Ayah Kandung</option>
                        <option value="Ibu Kandung">Ibu Kandung</option>
                        <option value="Wali / Keluarga">Wali / Keluarga</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Alamat Domisili Lengkap (termasuk RT/RW & Kecamatan):
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                        placeholder="e.g. Desa Tajungan dusun asem blok 4, RT/RW 004/002 Kamal bangkalan"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Data Pasien Anak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Nama Lengkap Anak:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="e.g. Ahmad Farhan Santoso"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Nama Panggilan:
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="e.g. Ahmad"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Tanggal Lahir Pasien:
                    </label>
                    {autoExtractedSummary?.birthDate && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Otomatis dari &quot;Tgl Lahir Anak&quot;: {autoExtractedSummary.birthDate}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  {formData.birthDate && (
                    <div className="mt-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-medium text-emerald-800">
                          Keterangan Umur:
                        </span>
                        <span className="text-xs font-black text-emerald-950">
                          {calculateAge(formData.birthDate).formatted}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                        Otomatis Dihitung
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tempat Lahir:
                  </label>
                  <input
                    type="text"
                    value={formData.birthPlace}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="e.g. Bangkalan"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Berat Badan (BB):
                    </label>
                    {autoExtractedSummary?.weightKg && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Otomatis dari &quot;BB&quot;: {autoExtractedSummary.weightKg} kg
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 pr-8"
                      placeholder="e.g. 18"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Asal Sekolah & Kelas:
                  </label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="e.g. SD Al-Azhar Kelas 4"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Riwayat Alergi:
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="Tidak ada / Alergi dingin / Alergi penisilin"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Catatan Khusus Pasien:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    placeholder="Contoh: Anak agak cemas, minta penanganan lembut / bius tanpa jarum suntik..."
                  />
                </div>
              </div>

              {/* Rencana Tindakan Khitan & Jadwal Booking Otomatis */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-sky-50/70 to-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/70">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Rencana Tindakan Khitan & Jadwal Booking
                        </h4>
                        <span className="text-[10px] font-black uppercase text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Otomatis Ke Menu Booking
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Data ini akan langsung tercatat & tampil di Menu Booking sesuai tanggal rencana tindakan. Tidak perlu isi booking manual lagi.
                      </p>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-black text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 cursor-pointer shadow-2xs self-start sm:self-auto">
                    <input
                      type="checkbox"
                      checked={formData.createBookingAuto}
                      onChange={(e) => setFormData({ ...formData, createBookingAuto: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Sinkronkan ke Booking</span>
                  </label>
                </div>

                {formData.createBookingAuto && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Tanggal & Jam Rencana Tindakan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-black text-indigo-950 uppercase flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            Rencana Tanggal Tindakan:
                          </label>
                          {autoExtractedSummary?.bookingDate && (
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                              Otomatis dari &quot;Tanggal Sunat&quot;: {autoExtractedSummary.bookingDate}
                            </span>
                          )}
                        </div>
                        <input
                          type="date"
                          required={formData.createBookingAuto}
                          value={formData.plannedProcedureDate}
                          onChange={(e) => setFormData({ ...formData, plannedProcedureDate: e.target.value })}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-black text-indigo-950 uppercase flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            Request Jam Tindakan:
                          </label>
                          {autoExtractedSummary?.bookingTime && (
                            <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-purple-600" />
                              Otomatis dari &quot;Request Jam&quot;: {autoExtractedSummary.bookingTime} WIB
                            </span>
                          )}
                        </div>
                        <input
                          type="time"
                          value={formData.plannedProcedureTime}
                          onChange={(e) => setFormData({ ...formData, plannedProcedureTime: e.target.value })}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Paket Reguler vs VIP */}
                      <div>
                        <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1">
                          Kategori Layanan:
                        </label>
                        <select
                          value={formData.plannedPackageCategory}
                          onChange={(e) => setFormData({ ...formData, plannedPackageCategory: e.target.value })}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="REG">Paket REG (Reguler Standar)</option>
                          <option value="VIP">Paket VIP (Private Room & Prioritas)</option>
                        </select>
                      </div>

                      {/* Pilihan Metode Sunat / Paket */}
                      <div>
                        <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Pilihan Paket / Metode Khitan:
                        </label>
                        <select
                          value={formData.plannedPackageId}
                          onChange={(e) => {
                            const pId = Number(e.target.value);
                            const found = packages.find(p => p.id === pId);
                            setFormData({
                              ...formData,
                              plannedPackageId: pId,
                              plannedMethodType: found?.name || formData.plannedMethodType
                            });
                          }}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        >
                          {packages.map((pkg) => {
                            const pObj = pkg.prices?.find(p => p.patientCategoryId === regCatId);
                            const priceLabel = pObj ? ` (Rp ${pObj.price.toLocaleString('id-ID')})` : '';
                            return (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name}{priceLabel}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Pilihan Jenis Bius / Anestesi */}
                      <div>
                        <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          Pilihan Jenis Bius / Anastesi:
                        </label>
                        <select
                          value={formData.plannedAnesthesiaType}
                          onChange={(e) => setFormData({ ...formData, plannedAnesthesiaType: e.target.value })}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)">
                            Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)
                          </option>
                          <option value="Bius Kombinasi (FNI + Injeksi)">
                            Bius Kombinasi (FNI + Injeksi)
                          </option>
                          <option value="Bius Injeksi Konvensional">
                            Bius Injeksi Konvensional
                          </option>
                        </select>
                      </div>

                      {/* Dokter Operator */}
                      <div>
                        <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                          Dokter Operator:
                        </label>
                        <select
                          value={formData.plannedDoctorId}
                          onChange={(e) => setFormData({ ...formData, plannedDoctorId: Number(e.target.value) })}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        >
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Snapshot Rincian Tarif Paket, Diskon, DP & Sisa Pelunasan */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/70 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-indigo-950 pb-2 border-b border-indigo-200/60">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          Tarif Paket ({formData.plannedPackageCategory === 'VIP' ? 'Paket VIP' : 'Paket REG'}):
                        </span>
                        <span className="font-mono text-sm font-black text-slate-900">{formatRupiah(regActivePrice)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-indigo-900 mb-1">
                            Diskon / Potongan Promo (Rp):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formData.discountAmount}
                            onChange={(e) => setFormData({ ...formData, discountAmount: Math.max(0, Number(e.target.value)) })}
                            className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-indigo-900 mb-1">
                            Total Biaya Bersih:
                          </label>
                          <div className="py-1.5 px-3 bg-white/80 border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 font-mono">
                            {formatRupiah(regNetTotal)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-200/60">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-indigo-900 mb-1">
                            Uang Muka / DP Dibayarkan (Rp):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formData.dpAmount}
                            onChange={(e) => setFormData({ ...formData, dpAmount: Math.max(0, Number(e.target.value)) })}
                            className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-indigo-900 mb-1">
                            Metode Pembayaran DP:
                          </label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e: any) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full py-1.5 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="TRANSFER">Transfer Bank BCA/Mandiri</option>
                            <option value="QRIS">QRIS Dinamis (Gopay/OVO/BCA)</option>
                            <option value="CASH">Tunai / Kasir Front Office</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-indigo-200/60 text-xs font-black">
                        <span className="text-slate-700">Sisa Pelunasan di Hari Tindakan:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm px-2.5 py-0.5 rounded-lg ${regRemaining === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {regRemaining === 0 ? 'LUNAS (Rp 0)' : formatRupiah(regRemaining)}
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenDpReceiptFromReg}
                            title="Cetak Nota Sementara / Kwitansi Pembayaran DP"
                            className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Nota DP</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Sumber Pasien & Opsi Kedatangan Langsung ke Klinik (Fee Closing) */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1">
                          Sumber Informasi / Pendaftaran Pasien:
                        </label>
                        <select
                          value={formData.patientSource}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              patientSource: val,
                              closingStaffId: val === 'Datang Langsung (Walk-in)' ? (formData.closingStaffId || employees[0]?.id || '') : '',
                            });
                          }}
                          className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="WhatsApp / Chat Pendaftaran">WhatsApp / Chat Pendaftaran</option>
                          <option value="Instagram / Ads">Instagram / Ads</option>
                          <option value="TikTok Video">TikTok Video</option>
                          <option value="Rekomendasi Keluarga / Teman">Rekomendasi Keluarga / Teman</option>
                          <option value="Datang Langsung (Walk-in)">Datang Langsung ke Klinik / Front Office (Walk-in)</option>
                          <option value="Google / Website">Google / Website</option>
                        </select>
                      </div>

                      {/* Card Khusus: Jika Pasien Datang/Mendaftar Langsung ke Klinik */}
                      <div className={`p-3.5 rounded-xl border transition-all ${
                        formData.patientSource === 'Datang Langsung (Walk-in)' 
                          ? 'bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border-amber-300 ring-2 ring-amber-400/30' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              formData.patientSource === 'Datang Langsung (Walk-in)' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase text-slate-900 tracking-tight">
                                Pendaftaran Pasien Datang Langsung (Walk-in)
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Hak fee closing bagi staf front office/admin penerima pendaftaran
                              </div>
                            </div>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.patientSource === 'Datang Langsung (Walk-in)'}
                              onChange={(e) => {
                                const isDirect = e.target.checked;
                                setFormData({
                                  ...formData,
                                  patientSource: isDirect ? 'Datang Langsung (Walk-in)' : 'WhatsApp / Chat Pendaftaran',
                                  closingStaffId: isDirect ? (formData.closingStaffId || employees[0]?.id || '') : '',
                                });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>

                        {formData.patientSource === 'Datang Langsung (Walk-in)' ? (
                          <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2.5">
                            <div className="text-[11px] text-amber-900 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-amber-200">
                              ⭐ <strong>Fee Closing Pendaftaran:</strong> Fee closing didapatkan dari <strong>pendaftaran pasien langsung</strong> di klinik/front office (bukan dari hasil tindakan). Pilih staf atau karyawan yang menerima pasien untuk mendapatkan fee closing pada slip gaji/payroll.
                            </div>

                            <div>
                              <label className="block text-[11px] font-black text-amber-950 uppercase mb-1">
                                Pilih Petugas / Karyawan Penerima Pendaftaran (Mendapat Fee Closing):
                              </label>
                              <select
                                value={formData.closingStaffId || ''}
                                onChange={(e) => setFormData({ ...formData, closingStaffId: e.target.value ? Number(e.target.value) : '' })}
                                className="w-full py-2.5 px-3 bg-white border-2 border-amber-400 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
                              >
                                <option value="">-- Pilih Staf / Petugas yang Menerima --</option>
                                {employees.filter(e => e.isActive && !e.isDeleted).map((emp) => (
                                  <option key={emp.id} value={emp.id}>
                                    {emp.name} ({emp.position || 'Staf'}) — Tarif Closing: Rp {(emp.closingFeePerPatient || 30000).toLocaleString('id-ID')}
                                  </option>
                                ))}
                              </select>

                              {formData.closingStaffId ? (
                                <div className="text-[11px] text-emerald-800 font-black mt-2 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>
                                    Fee closing sebesar Rp {(employees.find(e => e.id === Number(formData.closingStaffId))?.closingFeePerPatient || 30000).toLocaleString('id-ID')} otomatis dialokasikan ke <strong>{employees.find(e => e.id === Number(formData.closingStaffId))?.name}</strong> pada rekap payroll periode ini.
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-amber-700 font-bold mt-1.5">
                                  ⚠️ Harap pilih staf/karyawan yang melayani pendaftaran agar fee closing tercatat atas nama beliau.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Centang tombol di atas jika pasien datang langsung ke klinik/front office untuk memilih staf penerima fee closing.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={handleOpenDpReceiptFromReg}
                className="px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Cetak Kwitansi Pembayaran DP / Nota Sementara sebelum pelunasan"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota DP</span>
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap shrink-0"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                >
                  Simpan Pasien &amp; Terbitkan RM
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Modal: Detail Pasien */}
      {selectedPatientDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sky-600 text-sm">
                  {selectedPatientDetail.rmNumber}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  {selectedPatientDetail.gender}
                </span>
              </div>
              <button
                onClick={() => setSelectedPatientDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-lg font-black text-slate-900 uppercase">
                {selectedPatientDetail.fullName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Panggilan: &quot;{selectedPatientDetail.nickname}&quot;</p>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Usia Saat Ini:</span>
                <span className="font-bold text-emerald-700">{getPatientAgeDisplay(selectedPatientDetail)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Tempat & Tgl Lahir:</span>
                <span className="font-bold">{selectedPatientDetail.birthPlace}, {selectedPatientDetail.birthDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Nama Orang Tua/Wali:</span>
                <span className="font-bold">{selectedPatientDetail.guardianName} ({selectedPatientDetail.guardianRelationship})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Telepon / WhatsApp:</span>
                <span className="font-mono font-bold text-sky-700">{selectedPatientDetail.guardianPhone || selectedPatientDetail.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Alamat:</span>
                <span className="font-medium text-right max-w-xs">{selectedPatientDetail.address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Riwayat Alergi:</span>
                <span className="font-bold text-rose-600">{selectedPatientDetail.allergies || 'Tidak ada'}</span>
              </div>
              {(() => {
                const linkedBk = bookings.find(b => b.patientId === selectedPatientDetail.id);
                if (!linkedBk) return null;
                return (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Sumber Pendaftaran:</span>
                      <span className="font-bold text-slate-800">{linkedBk.patientSource || 'WhatsApp / Chat'}</span>
                    </div>
                    {linkedBk.closingStaffName && (
                      <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                        <span className="text-slate-400">Petugas Closing (Walk-in):</span>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          <UserCheck className="w-3 h-3 text-amber-700" />
                          {linkedBk.closingStaffName}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="py-1">
                <span className="text-slate-400 block mb-1">Catatan Tambahan:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                  {selectedPatientDetail.notes || 'Tidak ada catatan tambahan.'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = selectedPatientDetail;
                  setSelectedPatientDetail(null);
                  handleOpenEditModal(p);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Data</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPatientDetail;
                    setSelectedPatientDetail(null);
                    handleDeletePatient(p);
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Hapus pasien dan seluruh data terkait"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Pasien</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedPatientDetail(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Modal: Edit Data Pasien & Riwayat Layanan (Core Data) */}
      {patientToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Edit Data Pasien (Core Data)
                    </h3>
                    <span className="font-mono text-[11px] font-black bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md border border-orange-200">
                      RM: {patientToEdit.rmNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Perubahan data pasien akan otomatis terhubung ke seluruh modul: <strong>Booking</strong>, <strong>Ruang Tindakan</strong>, dan <strong>Pembayaran Kasir</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientToEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSaveEditPatient}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                
                {/* Synchronization Callout */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Pusat Data Pasien (Single Source of Truth):</strong> Anda dapat mengubah nama, alamat, kontak HP/WA, paket VIP/Reguler, metode khitan, diskon, harga, dokter, dan jadwal tindakan. Semua perubahan akan disinkronkan langsung ke rekam medis dan tagihan kasir.
                  </div>
                </div>

                {/* Bagian 1: Identitas & Medis Pasien */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                    <Baby className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Identitas Pasien & Medis Anak
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Lengkap Anak <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Panggilan
                      </label>
                      <input
                        type="text"
                        value={editFormData.nickname}
                        onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        NIK (No. KTP/KIA)
                      </label>
                      <input
                        type="text"
                        value={editFormData.nik}
                        onChange={(e) => setEditFormData({ ...editFormData, nik: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="16 digit NIK"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        value={editFormData.birthPlace}
                        onChange={(e) => setEditFormData({ ...editFormData, birthPlace: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Tanggal Lahir Anak <span className="text-rose-500">*</span>
                        </label>
                        {editFormData.birthDate && (
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {calculateAge(editFormData.birthDate).formatted}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        required
                        value={editFormData.birthDate}
                        onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Berat Badan (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.weightKg}
                        onChange={(e) => setEditFormData({ ...editFormData, weightKg: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="cth: 18.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tinggi Badan (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.heightCm}
                        onChange={(e) => setEditFormData({ ...editFormData, heightCm: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="cth: 115"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Sekolah / TK / SD
                      </label>
                      <input
                        type="text"
                        value={editFormData.school}
                        onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="cth: SDN Kamal 01"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kelas
                      </label>
                      <input
                        type="text"
                        value={editFormData.grade}
                        onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="cth: Kelas 1 SD"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Riwayat Alergi Obat / Makanan
                      </label>
                      <input
                        type="text"
                        value={editFormData.allergies}
                        onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-rose-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        placeholder="cth: Alergi Amoxicillin, Paracetamol, udang, dll."
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Catatan Khusus Medis / Permintaan Orang Tua
                      </label>
                      <input
                        type="text"
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="cth: Anak sedikit trauma jarum suntik, dsb."
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Kontak & Data Orang Tua / Alamat */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Alamat & Data Orang Tua / Wali
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Alamat Lengkap Domisili <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="Desa/Kelurahan, RT/RW, Kecamatan, Kabupaten/Kota"
                      />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nomor HP / WhatsApp Aktif <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value, guardianPhone: e.target.value })}
                          className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          placeholder="081234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nama Kontak / Wali Utama
                        </label>
                        <input
                          type="text"
                          value={editFormData.guardianName}
                          onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                          className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Hubungan dengan Anak
                      </label>
                      <select
                        value={editFormData.guardianRelationship}
                        onChange={(e) => setEditFormData({ ...editFormData, guardianRelationship: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Ayah Kandung">Ayah Kandung</option>
                        <option value="Ibu Kandung">Ibu Kandung</option>
                        <option value="Kakek / Nenek">Kakek / Nenek</option>
                        <option value="Paman / Bibi">Paman / Bibi</option>
                        <option value="Wali Lainnya">Wali Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Ayah
                      </label>
                      <input
                        type="text"
                        value={editFormData.fatherName}
                        onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Ibu
                      </label>
                      <input
                        type="text"
                        value={editFormData.motherName}
                        onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Core Layanan Khitan yang Terhubung (Booking, Tindakan, Kasir) */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-purple-50/70 p-4 rounded-2xl border border-indigo-200/90 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-200/70">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-indigo-700" />
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                        Paket Khitan, Metode, Harga & Finansial (Sinkronisasi Seluruh Modul)
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-800 bg-white/90 px-2 py-0.5 rounded-md border border-indigo-200">
                      Core Connected
                    </span>
                  </div>

                  {/* Paket Reguler vs VIP Switcher */}
                  <div>
                    <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1.5">
                      Pilihan Kategori Layanan:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newCatId = 1;
                          const pkg = packages.find(p => p.id === Number(editFormData.plannedPackageId));
                          const defPrice = pkg?.prices?.find(p => p.patientCategoryId === newCatId)?.price || 1800000;
                          setEditFormData({
                            ...editFormData,
                            plannedPackageCategory: 'REG',
                            plannedPackagePrice: defPrice,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          editFormData.plannedPackageCategory === 'REG'
                            ? 'bg-white border-indigo-500 ring-2 ring-indigo-400/40 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">Paket REG (Reguler)</span>
                          {editFormData.plannedPackageCategory === 'REG' && (
                            <CheckCircle className="w-4 h-4 text-indigo-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Layanan khitan standar berkualitas klinik
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newCatId = 2;
                          const pkg = packages.find(p => p.id === Number(editFormData.plannedPackageId));
                          const defPrice = pkg?.prices?.find(p => p.patientCategoryId === newCatId)?.price || 2500000;
                          setEditFormData({
                            ...editFormData,
                            plannedPackageCategory: 'VIP',
                            plannedPackagePrice: defPrice,
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          editFormData.plannedPackageCategory === 'VIP'
                            ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                            ⭐ Paket VIP Eksklusif
                          </span>
                          {editFormData.plannedPackageCategory === 'VIP' && (
                            <CheckCircle className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-amber-800/80 mt-0.5">
                          Private Room, Prioritas, & Fasilitas Ekstra
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pilihan Paket / Metode Khitan */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Pilihan Paket / Metode Khitan:
                      </label>
                      <select
                        value={editFormData.plannedPackageId}
                        onChange={(e) => {
                          const pId = Number(e.target.value);
                          const pkg = packages.find(p => p.id === pId);
                          const defPrice = pkg?.prices?.find(p => p.patientCategoryId === editCatId)?.price || (editCatId === 2 ? 2500000 : 1800000);
                          setEditFormData({
                            ...editFormData,
                            plannedPackageId: pId,
                            plannedMethodType: pkg?.name || editFormData.plannedMethodType,
                            plannedPackagePrice: defPrice,
                          });
                        }}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {packages.map((pkg) => {
                          const pObj = pkg.prices?.find(p => p.patientCategoryId === editCatId);
                          const priceLabel = pObj ? ` (Rp ${pObj.price.toLocaleString('id-ID')})` : '';
                          return (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name}{priceLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Pilihan Jenis Bius */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        Pilihan Jenis Bius / Anestesi:
                      </label>
                      <select
                        value={editFormData.plannedAnesthesiaType}
                        onChange={(e) => setEditFormData({ ...editFormData, plannedAnesthesiaType: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)">
                          Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)
                        </option>
                        <option value="Bius Kombinasi (FNI + Injeksi)">
                          Bius Kombinasi (FNI + Injeksi)
                        </option>
                        <option value="Bius Injeksi Konvensional">
                          Bius Injeksi Konvensional
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Tanggal Tindakan */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Tanggal Tindakan Khitan:
                      </label>
                      <input
                        type="date"
                        required
                        value={editFormData.plannedProcedureDate}
                        onChange={(e) => setEditFormData({ ...editFormData, plannedProcedureDate: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Jam Tindakan */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Jam Tindakan Khitan:
                      </label>
                      <input
                        type="time"
                        value={editFormData.plannedProcedureTime}
                        onChange={(e) => setEditFormData({ ...editFormData, plannedProcedureTime: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Dokter Operator */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                        Dokter Operator:
                      </label>
                      <select
                        value={editFormData.plannedDoctorId}
                        onChange={(e) => setEditFormData({ ...editFormData, plannedDoctorId: Number(e.target.value) })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Financial Fields & Live Breakdown */}
                  <div className="p-4 bg-white/90 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950 pb-2 border-b border-indigo-100">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Rincian Finansial Tarif, Diskon & Pelunasan Kasir</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-950 mb-1">
                          Tarif Paket Khitan (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editFormData.plannedPackagePrice}
                          onChange={(e) => setEditFormData({ ...editFormData, plannedPackagePrice: Math.max(0, Number(e.target.value)) })}
                          className="w-full py-1.5 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-950 mb-1">
                          Diskon / Potongan Promo (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editFormData.discountAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, discountAmount: Math.max(0, Number(e.target.value)) })}
                          className="w-full py-1.5 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-indigo-950 mb-1">
                          Uang Muka / DP Terbayar (Rp):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editFormData.dpAmount}
                          onChange={(e) => setEditFormData({ ...editFormData, dpAmount: Math.max(0, Number(e.target.value)) })}
                          className="w-full py-1.5 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Live Financial Calculation Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Tarif Dasar Paket ({editFormData.plannedPackageCategory}):</span>
                        <span className="font-mono font-bold text-slate-900">{formatRupiah(editPrice)}</span>
                      </div>
                      {editDiscount > 0 && (
                        <div className="flex justify-between items-center text-rose-600 font-medium">
                          <span>Diskon / Potongan:</span>
                          <span className="font-mono font-bold">- {formatRupiah(editDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-slate-900 font-black pt-1 border-t border-slate-200">
                        <span>Total Tagihan Bersih:</span>
                        <span className="font-mono text-sm text-indigo-950">{formatRupiah(editNetTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700 font-medium">
                        <span>Uang Muka / DP Terverifikasi:</span>
                        <span className="font-mono font-bold">{formatRupiah(editDp)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-700">Sisa Tagihan Kasir:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {formatRupiah(editRemaining)}
                          </span>
                          {editRemaining === 0 ? (
                            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Lunas
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                              Menunggu Pelunasan Kasir
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sumber Informasi Pasien */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1">
                        Sumber Informasi Pendaftaran:
                      </label>
                      <select
                        value={editFormData.patientSource}
                        onChange={(e) => setEditFormData({ ...editFormData, patientSource: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="WhatsApp / Chat Pendaftaran">WhatsApp / Chat Pendaftaran</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Rekomendasi Teman / Saudara">Rekomendasi Teman / Saudara</option>
                        <option value="Google / Website">Google / Website</option>
                        <option value="Walk-in / Datang Langsung">Walk-in / Datang Langsung</option>
                      </select>
                    </div>

                    {/* Petugas Closing Walk-in */}
                    <div>
                      <label className="block text-[11px] font-black text-indigo-950 uppercase mb-1 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Petugas Closing Pendaftaran:
                      </label>
                      <select
                        value={editFormData.closingStaffId}
                        onChange={(e) => setEditFormData({ ...editFormData, closingStaffId: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Tanpa Fee Closing / Online WA --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky Footer Actions */}
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setPatientToEdit(null)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Batal
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm shadow-amber-600/20 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan & Menyinkronkan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan & Sinkronkan ke Semua Menu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus / Arsipkan Pasien */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Hapus / Arsipkan Pasien
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Pengelolaan status data rekam medis pasien
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama Pasien:</span>
                  <span className="font-bold text-slate-900">{patientToDelete.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">No. Rekam Medis:</span>
                  <span className="font-mono font-bold text-orange-700">{patientToDelete.rmNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Orang Tua / Wali:</span>
                  <span className="font-bold text-slate-800">{patientToDelete.guardianName || '-'}</span>
                </div>
                {patientToDelete.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">No. WhatsApp/HP:</span>
                    <span className="font-mono text-slate-700">{patientToDelete.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alasan Penghapusan / Pengarsipan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Misal: Salah input data pendaftaran, pindah domisili, dsb."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              {/* Opsi Metode Penghapusan: Pasien Sebagai Kunci Utama */}
              <div className="space-y-2">
                <span className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Metode Penghapusan (Kunci Utama):
                </span>
                
                {/* Pilihan 1: Hapus Permanen Cascade */}
                <div 
                  onClick={() => setIsPermanentDelete(true)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    isPermanentDelete 
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={isPermanentDelete}
                      onChange={() => setIsPermanentDelete(true)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-rose-950">
                          Hapus Permanen & Bersihkan Semua Data Terkait
                        </span>
                        <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Cascade Delete
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed mt-1">
                        Data pasien adalah <strong>kunci utama</strong>. Menghapus pasien ini akan otomatis menghapus bersih seluruh data riwayat:
                      </p>
                      <ul className="text-[10px] text-rose-700 list-disc list-inside mt-1 space-y-0.5 font-medium">
                        <li>Rekam tindakan medis khitan & persetujuan medis</li>
                        <li>Pendaftaran jadwal booking ({bookings.filter(b => b.patientId === patientToDelete.id).length} data)</li>
                        <li>Tagihan invoice kasir & riwayat pembayaran</li>
                        <li>Antrean klinik, jadwal kontrol (follow-up) & fee dokter</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Pilihan 2: Arsipkan Pasien (Soft-Delete) */}
                <div 
                  onClick={() => setIsPermanentDelete(false)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    !isPermanentDelete 
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={!isPermanentDelete}
                      onChange={() => setIsPermanentDelete(false)}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-xs text-amber-950">
                        Arsipkan Pasien Saja (Soft Delete)
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                        Pasien dinonaktifkan dari tabel aktif, namun riwayat rekam medis dan nomor RM tetap tersimpan di arsip dan dapat dipulihkan sewaktu-waktu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeletingPatient}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePatient}
                disabled={isDeletingPatient}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                  isPermanentDelete 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' 
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                }`}
              >
                {isDeletingPatient ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus Kaskade...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isPermanentDelete ? 'Hapus Permanen & Rekam Medis' : 'Arsipkan Pasien'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pulihkan Pasien */}
      {patientToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Pulihkan Data Pasien
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Mengembalikan pasien ke daftar aktif
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2 mb-5">
              <p className="font-bold text-emerald-950">
                Apakah Anda ingin mengembalikan pasien berikut ke daftar pasien aktif?
              </p>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{patientToRestore.fullName}</div>
                <div className="font-mono text-[11px] text-orange-700">No. RM: {patientToRestore.rmNumber}</div>
                <div className="text-[11px] text-slate-600">Wali: {patientToRestore.guardianName || '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientToRestore(null)}
                disabled={isRestoringPatient}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestorePatient}
                disabled={isRestoringPatient}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRestoringPatient ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memulihkan...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Pulihkan Pasien</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DpReceiptPrintModal
        isOpen={Boolean(dpReceiptPreview)}
        onClose={() => setDpReceiptPreview(null)}
        data={dpReceiptPreview}
      />
    </div>
  );
};
