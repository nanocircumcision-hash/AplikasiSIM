import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Calendar, Clock, UserCheck, AlertTriangle, Search, Filter, Plus, 
  DollarSign, CheckCircle2, User, Stethoscope, ChevronRight, X, ShieldCheck,
  Edit3, Sparkles, Heart, Info, List, CalendarRange, Check, Phone, ArrowRight,
  ThumbsUp, Smile, PartyPopper, CheckCheck, Eye, EyeOff, Award
} from 'lucide-react';
import { CircumcisionBooking } from '../../types';
import { getPatientAgeDisplay } from '../../utils/ageHelper';
import { InformedConsentModal } from './InformedConsentModal';
import { PrintDocumentIcon } from '../common/PrintIcons';

export const CircumcisionBookingView: React.FC = () => {
  const { 
    bookings, patients, categories, packages, doctors, 
    procedures, invoices, employees, circumcisionMethods,
    createBooking, updateBooking, checkInBooking, updatePatient, currentUser,
    showToast 
  } = useClinic();

  const activeMethods = useMemo(() => {
    const fromMaster = (circumcisionMethods || []).filter(m => m.isActive && !m.isDeleted);
    if (fromMaster.length > 0) return fromMaster.map(m => m.name);
    if (packages && packages.length > 0) return packages.map(p => p.name);
    return ['Metode Glans Pro Bipolar Pensealer', 'Metode Tindakan Nano Klemp'];
  }, [circumcisionMethods, packages]);

  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  // Completion filter: 'ACTIVE' (sembunyikan pasien yang sudah selesai), 'ALL' (semua), 'COMPLETED' (hanya yang sudah selesai)
  const [completionFilter, setCompletionFilter] = useState<'ACTIVE' | 'ALL' | 'COMPLETED'>('ACTIVE');
  const todayStr = new Date().toISOString().split('T')[0];
  
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr); // Default hari ini jika tidak input tanggal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Informed Consent Modal State
  const [consentBooking, setConsentBooking] = useState<CircumcisionBooking | null>(null);

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState<CircumcisionBooking | null>(null);
  const [editFormData, setEditFormData] = useState({
    methodType: 'Glans Pro Bipolar Pen Sealer',
    anesthesiaType: 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
    doctorId: doctors[0]?.id || 1,
    bookingDate: todayStr,
    bookingTime: '08:00',
    status: 'BOOKED',
    notes: '',
    patientSource: 'WhatsApp / Chat Pendaftaran',
    closingStaffId: '' as number | string,
    closingStaffName: '',
  });

  const handleOpenEditModal = (bk: CircumcisionBooking) => {
    setEditingBooking(bk);
    setEditFormData({
      methodType: bk.methodType || bk.packageName || 'Glans Pro Bipolar Pen Sealer',
      anesthesiaType: bk.anesthesiaType || 'Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)',
      doctorId: bk.doctorId,
      bookingDate: bk.bookingDate,
      bookingTime: bk.bookingTime,
      status: bk.status,
      notes: bk.notes || '',
      patientSource: bk.patientSource || 'WhatsApp / Chat Pendaftaran',
      closingStaffId: bk.closingStaffId || '',
      closingStaffName: bk.closingStaffName || '',
    });
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const matchedEmp = employees.find(emp => emp.id === Number(editFormData.closingStaffId));
    const payload = {
      ...editFormData,
      closingStaffId: editFormData.closingStaffId ? Number(editFormData.closingStaffId) : null,
      closingStaffName: editFormData.closingStaffId ? (matchedEmp?.name || editFormData.closingStaffName) : null,
    };

    const res = await updateBooking(editingBooking.id, payload);
    if (res.success) {
      setEditingBooking(null);
    }
  };

  // Form State
  const [patientId, setPatientId] = useState<number>(patients[0]?.id || 1);
  const [patientCategoryId, setPatientCategoryId] = useState<number>(categories[0]?.id || 1);
  const [packageId, setPackageId] = useState<number>(packages[0]?.id || 1);
  const [anesthesiaType, setAnesthesiaType] = useState<string>('Bius Tanpa Jarum Suntik / FREE Needle injection (FNI)');
  const [doctorId, setDoctorId] = useState<number>(doctors[0]?.id || 1);
  const [bookingDate, setBookingDate] = useState<string>(todayStr);
  const [bookingTime, setBookingTime] = useState<string>('14:00');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [dpAmount, setDpAmount] = useState<number>(500000);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'QRIS'>('TRANSFER');
  const [patientSource, setPatientSource] = useState<string>('WhatsApp / Chat');
  const [closingStaffId, setClosingStaffId] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');

  // Selected Patient Helper
  const currentPatient = patients.find(p => p.id === Number(patientId));

  // Dynamic Price Preview
  const selectedPkg = packages.find(p => p.id === Number(packageId));
  const activePriceObj = selectedPkg?.prices?.find(p => p.patientCategoryId === Number(patientCategoryId));
  const activePrice = activePriceObj ? activePriceObj.price : 1800000;
  const netTotal = Math.max(0, activePrice - discountAmount);
  const remaining = Math.max(0, netTotal - dpAmount);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return 'Tanpa Tanggal';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getRelativeDateBadge = (dateStr: string, today: string) => {
    if (dateStr === today) {
      return { label: 'Hari Ini', color: 'bg-emerald-500 text-white shadow-xs' };
    }
    const todayDate = new Date(today);
    const targetDate = new Date(dateStr);
    const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      return { label: 'Besok', color: 'bg-sky-500 text-white shadow-xs' };
    }
    if (diffDays === -1) {
      return { label: 'Kemarin', color: 'bg-slate-400 text-white' };
    }
    if (diffDays > 1 && diffDays <= 30) {
      return { label: `${diffDays} hari lagi`, color: 'bg-indigo-500 text-white' };
    }
    return null;
  };

  const isProcedureDone = (bk: CircumcisionBooking) => {
    if (bk.status === 'COMPLETED') return true;
    const proc = procedures.find(p => p.bookingId === bk.id || p.patientId === bk.patientId);
    return proc?.status === 'COMPLETED';
  };

  const isFullyPaid = (bk: CircumcisionBooking) => {
    const proc = procedures.find(p => p.bookingId === bk.id || p.patientId === bk.patientId);
    const inv = invoices.find(i => i.bookingId === bk.id || (proc && i.procedureId === proc.id) || i.patientId === bk.patientId);
    if (inv) return inv.status === 'PAID' || inv.remainingAmount === 0;
    return bk.remainingAmount === 0;
  };

  // True jika pasien telah menyelesaikan tindakan khitan dan pembayaran lunas
  const isBookingFinished = (bk: CircumcisionBooking) => {
    if (bk.status === 'COMPLETED' && bk.remainingAmount === 0) return true;
    return isProcedureDone(bk) && isFullyPaid(bk);
  };

  const getStatusBadge = (bk: CircumcisionBooking) => {
    const isFinished = isBookingFinished(bk);
    const procDone = isProcedureDone(bk);

    if (isFinished) {
      return { 
        label: 'SUDAH TERSUNAT 👍', 
        subLabel: 'Tindakan Selesai & Lunas',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black shadow-2xs', 
        dot: 'bg-emerald-600',
        ring: 'border-emerald-500 text-emerald-700 bg-emerald-100',
        isFinished: true,
      };
    }

    if (procDone) {
      return { 
        label: 'SUDAH TERSUNAT (KASIR)', 
        subLabel: 'Menunggu Pelunasan',
        bg: 'bg-teal-50 text-teal-900 border-teal-300 font-bold', 
        dot: 'bg-teal-600 animate-pulse',
        ring: 'border-teal-500 text-teal-700 bg-teal-50',
        isFinished: false,
      };
    }

    switch (bk.status) {
      case 'COMPLETED':
        return { 
          label: 'SUDAH TERSUNAT 👍', 
          subLabel: 'Selesai Tindakan',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black shadow-2xs', 
          dot: 'bg-emerald-600',
          ring: 'border-emerald-500 text-emerald-700 bg-emerald-100',
          isFinished: true,
        };
      case 'ARRIVED':
        return { 
          label: 'DI KLINIK (ARRIVED)', 
          subLabel: 'Dalam Antrean Tindakan',
          bg: 'bg-sky-50 text-sky-800 border-sky-200 animate-pulse font-bold', 
          dot: 'bg-sky-500 animate-ping',
          ring: 'border-sky-500 text-sky-700 bg-sky-50',
          isFinished: false,
        };
      case 'CONFIRMED':
        return { 
          label: 'TERKONFIRMASI', 
          subLabel: 'Jadwal Siap',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold', 
          dot: 'bg-indigo-500',
          ring: 'border-indigo-500 text-indigo-700 bg-indigo-50',
          isFinished: false,
        };
      case 'DP_PAID':
        return { 
          label: 'DP TERBAYAR', 
          subLabel: 'Uang Muka Diterima',
          bg: 'bg-purple-50 text-purple-800 border-purple-200 font-bold', 
          dot: 'bg-purple-500',
          ring: 'border-purple-500 text-purple-700 bg-purple-50',
          isFinished: false,
        };
      case 'CANCELLED':
        return { 
          label: 'DIBATALKAN', 
          subLabel: 'Batal',
          bg: 'bg-rose-50 text-rose-800 border-rose-200 font-bold', 
          dot: 'bg-rose-500',
          ring: 'border-rose-400 text-rose-700 bg-rose-50',
          isFinished: false,
        };
      default:
        return { 
          label: 'BOOKED', 
          subLabel: 'Menunggu Kedatangan',
          bg: 'bg-amber-50 text-amber-900 border-amber-200 font-bold', 
          dot: 'bg-amber-500',
          ring: 'border-amber-500 text-amber-700 bg-amber-50',
          isFinished: false,
        };
    }
  };

  // Counts for completion filtering tabs
  const { activeCount, completedCount, totalCount } = useMemo(() => {
    let active = 0;
    let completed = 0;
    bookings.forEach((b) => {
      const matchesDate = !selectedDate || b.bookingDate === selectedDate;
      if (matchesDate) {
        if (isBookingFinished(b)) {
          completed++;
        } else {
          active++;
        }
      }
    });
    return {
      activeCount: active,
      completedCount: completed,
      totalCount: active + completed,
    };
  }, [bookings, selectedDate, procedures, invoices]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = 
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.rmNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const finished = isBookingFinished(b);

      // Completion status filter
      if (completionFilter === 'ACTIVE' && finished) return false;
      if (completionFilter === 'COMPLETED' && !finished) return false;

      const matchesStatus = selectedStatusFilter === 'ALL' || b.status === selectedStatusFilter;
      const matchesDoctor = selectedDoctorFilter === 'ALL' || String(b.doctorId) === selectedDoctorFilter;
      const matchesDate = !selectedDate || b.bookingDate === selectedDate;

      return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    });
  }, [bookings, searchTerm, selectedStatusFilter, selectedDoctorFilter, selectedDate, completionFilter, procedures, invoices]);

  // Group filtered bookings by bookingDate for Simple Timeline view
  const groupedBookings = useMemo(() => {
    const groups: { [date: string]: CircumcisionBooking[] } = {};
    filteredBookings.forEach((bk) => {
      const d = bk.bookingDate || 'Tanpa Tanggal';
      if (!groups[d]) groups[d] = [];
      groups[d].push(bk);
    });

    // Sort dates ascending
    const sortedDates = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedDates.map((date) => {
      // Sort items within date by bookingTime ascending
      const items = [...groups[date]].sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));
      return {
        date,
        items,
      };
    });
  }, [filteredBookings]);

  const getAgeText = (bk: CircumcisionBooking) => {
    const pat = patients.find(p => p.id === bk.patientId);
    if (pat?.birthDate) {
      return getPatientAgeDisplay(pat);
    }
    return bk.patientAge ? `${bk.patientAge} Tahun` : '-';
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      showToast('Silakan pilih pasien terlebih dahulu', 'error');
      return;
    }

    const payload = {
      patientId: Number(patientId),
      guardianId: currentPatient.guardianId,
      patientCategoryId: Number(patientCategoryId),
      packageId: Number(packageId),
      methodType: selectedPkg?.name || 'Glans Pro Bipolar Pen Sealer',
      anesthesiaType,
      doctorId: Number(doctorId),
      bookingDate,
      bookingTime,
      discountAmount,
      dpAmount,
      paymentMethod,
      patientSource,
      closingStaffId: closingStaffId ? Number(closingStaffId) : null,
      closingStaffName: closingStaffId ? (employees.find(e => e.id === Number(closingStaffId))?.name || null) : null,
      notes,
    };

    const res = await createBooking(payload);
    if (res.success) {
      setIsModalOpen(false);
      setNotes('');
      setClosingStaffId('');
    }
  };

  return (
    <div className={`space-y-6 ${consentBooking ? 'print:hidden' : ''}`}>
      {/* Header with View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Jadwal &amp; Timeline Khitan
            </h1>
            <span className="hidden sm:inline-flex text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Real-time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Jadwal tindakan khitan per tanggal, urutan kedatangan, dan pemantauan status pasien klinis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'timeline' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            onClick={() => {
              setBookingDate(selectedDate || todayStr);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Booking Manual</span>
          </button>
        </div>
      </div>

      {/* Info Notice: Pendaftaran & Booking Integration */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Timeline Penjadwalan Khitan Terintegrasi
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Pasien yang didaftarkan di menu <strong className="text-slate-800">Pendaftaran Pasien</strong> otomatis tercatat pada tanggal rencana tindakan di bawah. Klik <strong className="text-sky-700">"Edit Metode"</strong> pada kartu pasien untuk mengganti metode, dokter operator, atau menjadwalkan ulang jam tindakan.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Date Navigation Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Row 1: Status Selesai / Aktif Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCompletionFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                completionFilter === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Hanya tampilkan pasien yang masih antre atau belum selesai tindakan & pelunasan"
            >
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Jadwal Aktif</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                completionFilter === 'ACTIVE' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCompletionFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                completionFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilkan semua pasien termasuk yang sudah selesai"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Semua Jadwal</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                completionFilter === 'ALL' ? 'bg-slate-100 text-slate-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCompletionFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                completionFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Khusus pasien yang sudah menjalani tindakan sunat dan pembayaran lunas"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${completionFilter === 'COMPLETED' ? 'fill-white' : 'fill-emerald-600'}`} />
              <span>Sudah Tersunat 👍</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                completionFilter === 'COMPLETED' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {completedCount}
              </span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none px-2 py-1 hover:bg-slate-50 rounded-xl transition-colors">
            <input
              type="checkbox"
              checked={completionFilter === 'ACTIVE'}
              onChange={(e) => setCompletionFilter(e.target.checked ? 'ACTIVE' : 'ALL')}
              className="w-4 h-4 text-sky-600 accent-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span>Sembunyikan pasien selesai tindakan</span>
            </span>
          </label>
        </div>

        {/* Date Fast Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Tanggal:</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDate === todayStr 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>Hari Ini</span>
              {selectedDate === todayStr && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDate === tomorrowStr 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>Besok</span>
              {selectedDate === tomorrowStr && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !selectedDate 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span>Semua</span>
              {!selectedDate && <Check className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-1 pl-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer transition-all"
                title="Pilih tanggal spesifik"
              />
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <span>Menampilkan:</span>
            <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {filteredBookings.length} Pasien
            </span>
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no booking (e.g. BOOK-20260902-0001), nama anak, atau RM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="BOOKED">BOOKED (Belum DP)</option>
              <option value="DP_PAID">DP PAID</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ARRIVED">ARRIVED (Di Klinik)</option>
              <option value="COMPLETED">COMPLETED (Selesai)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="ALL">Semua Dokter Operator</option>
              {doctors.map((d, idx) => (
                <option key={`doc-filter-${d.id}-${idx}`} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: SIMPLE TIMELINE VIEW (DEFAULT) */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-3">
                <CalendarRange className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                {completionFilter === 'ACTIVE' && completedCount > 0 
                  ? 'Semua Pasien Telah Selesai Tindakan & Lunas 👍'
                  : 'Tidak Ada Jadwal Khitan Ditemukan'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {completionFilter === 'ACTIVE' && completedCount > 0
                  ? `Seluruh pasien (${completedCount} anak) yang terjadwal telah selesai menjalani tindakan khitan dan menyelesaikan pembayaran kasir.`
                  : selectedDate 
                    ? `Belum ada pasien yang terjadwal tindakan khitan pada tanggal ${formatIndonesianDate(selectedDate)}.`
                    : 'Tidak ada data jadwal khitan yang cocok dengan filter atau kata kunci pencarian Anda.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {completionFilter === 'ACTIVE' && completedCount > 0 ? (
                  <button
                    onClick={() => setCompletionFilter('ALL')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 fill-white" />
                    <span>Lihat Pasien Selesai / Sudah Tersunat ({completedCount})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setBookingDate(selectedDate || todayStr);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    + Jadwalkan Pasien di Tanggal Ini
                  </button>
                )}
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Lihat Semua Tanggal
                  </button>
                )}
              </div>
            </div>
          ) : (
            groupedBookings.map((group, gIdx) => {
              const relBadge = getRelativeDateBadge(group.date, todayStr);

              return (
                <div key={`date-group-${group.date}-${gIdx}`} className="space-y-4">
                  {/* Date Header Strip */}
                  <div className="sticky top-20 z-10 flex items-center justify-between gap-3 bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {formatIndonesianDate(group.date)}
                          </span>
                          {relBadge && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {relBadge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-full">
                        {group.items.length} Pasien
                      </span>
                    </div>
                  </div>

                  {/* Vertical Timeline Track */}
                  <div className="relative pl-6 sm:pl-10 ml-3 sm:ml-5 border-l-2 border-dashed border-slate-200 space-y-4 pt-2 pb-2">
                    {group.items.map((bk, idx) => {
                      const statusInfo = getStatusBadge(bk);
                      const isFinished = statusInfo.isFinished;
                      const ageText = getAgeText(bk);

                      return (
                        <div key={`timeline-bk-${bk.id}-${idx}`} className="relative group">
                          {/* Timeline Node Point */}
                          <div className={`absolute -left-[33px] sm:-left-[49px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-xs transition-transform ${
                            isFinished 
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                              : `bg-white ${statusInfo.ring}`
                          }`}>
                            {isFinished ? (
                              <ThumbsUp className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                          </div>

                          {/* Simple Timeline Card */}
                          <div className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-3.5 ${
                            isFinished 
                              ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
                              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                          }`}>
                            {/* Celebratory Banner for Completed Circumcision */}
                            {isFinished && (
                              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                                <div className="flex items-center gap-2">
                                  <ThumbsUp className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                                  <span>PASIEN TELAH SELESAI KHITAN &amp; LUNAS 🎉</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                  Tersunat 👍
                                </span>
                              </div>
                            )}

                            {/* Card Top: Time, Number, Status, & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  isFinished ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                                }`}>
                                  <Clock className={`w-3.5 h-3.5 ${isFinished ? 'text-emerald-700' : 'text-slate-600'}`} />
                                  <span>{bk.bookingTime} WIB</span>
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                                  {bk.bookingNumber}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                  {statusInfo.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => setConsentBooking(bk)}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                                  title="Cetak Surat Persetujuan Tindakan Khitan (Informed Consent - 1 Lembar A4)"
                                >
                                  <PrintDocumentIcon size={14} />
                                  <span>Informed Consent</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditModal(bk)}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-slate-200"
                                  title="Ubah Metode Khitan, Bius, atau Jam"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit Metode</span>
                                </button>

                                {isFinished ? (
                                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                    <span>Tersunat 👍</span>
                                  </span>
                                ) : bk.status === 'CONFIRMED' || bk.status === 'DP_PAID' || bk.status === 'BOOKED' ? (
                                  <button
                                    onClick={() => checkInBooking(bk.id)}
                                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Check-In</span>
                                  </button>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                                    Tercatat
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                              {/* Pasien & Wali (Column 1) */}
                              <div className="md:col-span-4 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-base">
                                    {bk.patientName}
                                  </span>
                                  <span className="text-xs font-bold text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    {bk.rmNumber}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-600">
                                  Umur: <span className="text-slate-900 font-bold">{ageText}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Wali: {bk.guardianName} ({bk.guardianPhone})</span>
                                </div>
                                {bk.closingStaffName ? (
                                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mt-1">
                                    <UserCheck className="w-3 h-3 text-amber-700" />
                                    <span>Fee Closing: {bk.closingStaffName}</span>
                                  </div>
                                ) : (bk.patientSource === 'Datang Langsung (Walk-in)' || bk.patientSource === 'Walk-in') ? (
                                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full mt-1">
                                    <span>Walk-in</span>
                                  </div>
                                ) : null}
                              </div>

                              {/* Metode Tindakan & Bius (Column 2) */}
                              <div className="md:col-span-5 space-y-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    bk.categoryCode === 'VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {bk.categoryCode || 'REG'}
                                  </span>
                                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                                    {bk.branchCode || 'PUSAT'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    <span>{bk.methodType || bk.packageName || 'Metode Glans Pro Bipolar Pensealer'}</span>
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                                    <Heart className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{bk.anesthesiaType || 'Bius Tanpa Jarum Suntik (FNI)'}</span>
                                  </div>

                                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                                    <Stethoscope className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>{bk.doctorName}</span>
                                  </div>
                                </div>

                                {bk.notes && (
                                  <div className="text-xs text-slate-500 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
                                    Catatan: {bk.notes}
                                  </div>
                                )}
                              </div>

                              {/* Finansial & DP (Column 3) */}
                              <div className="md:col-span-3 bg-slate-50/70 rounded-2xl p-3 border border-slate-100 text-right space-y-1">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Tarif Khitan</div>
                                <div className="text-base font-extrabold text-slate-900">
                                  {formatRupiah(bk.totalAmount)}
                                </div>
                                <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-emerald-600">
                                  <span>DP:</span>
                                  <span>{formatRupiah(bk.dpAmount)}</span>
                                </div>
                                {bk.remainingAmount > 0 ? (
                                  <div className="text-[11px] text-amber-700 font-bold">
                                    Sisa: {formatRupiah(bk.remainingAmount)}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-emerald-700 font-black uppercase bg-emerald-100 px-1.5 py-0.5 rounded w-fit ml-auto mt-0.5">
                                    LUNAS
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: TABULAR VIEW (OPTIONAL SWITCH) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">No. Booking & Jadwal</th>
                  <th className="py-3.5 px-4">Pasien & Wali</th>
                  <th className="py-3.5 px-4">Metode Khitan & Bius</th>
                  <th className="py-3.5 px-4">Dokter Operator</th>
                  <th className="py-3.5 px-4">Biaya & Pembayaran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada jadwal booking khitan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((bk, idx) => {
                    const isFinished = isBookingFinished(bk);

                    return (
                      <tr key={`table-bk-${bk.id}-${idx}`} className={`transition-colors ${
                        isFinished ? 'bg-emerald-50/50 hover:bg-emerald-100/50' : 'hover:bg-slate-50/80'
                      }`}>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-black text-sky-800 text-xs">{bk.bookingNumber}</div>
                          <div className="flex items-center gap-1 font-bold text-slate-900 text-xs mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {bk.bookingDate} • {bk.bookingTime}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Sumber: {bk.patientSource || 'WhatsApp / Chat'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <div className="font-bold text-slate-900">{bk.patientName}</div>
                            {isFinished && (
                              <ThumbsUp className="w-3 h-3 text-emerald-600 fill-emerald-600 shrink-0" />
                            )}
                          </div>
                          <div className="font-mono text-xs text-sky-700">{bk.rmNumber}</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            Wali: {bk.guardianName} ({bk.guardianPhone})
                          </div>
                          {bk.closingStaffName ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded mt-1">
                              <UserCheck className="w-2.5 h-2.5 text-amber-700" />
                              <span>Fee Closing: {bk.closingStaffName}</span>
                            </div>
                          ) : (bk.patientSource === 'Datang Langsung (Walk-in)' || bk.patientSource === 'Walk-in') ? (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1">
                              <span>Walk-in</span>
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              bk.categoryCode === 'VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {bk.categoryCode || 'REG'}
                            </span>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                              {bk.branchCode || 'PUSAT'}
                            </span>
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              {bk.methodType || bk.packageName || 'Metode Glans Pro Bipolar Pensealer'}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md w-fit">
                            <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{bk.anesthesiaType || 'Bius Tanpa Jarum Suntik (FNI)'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                            {bk.doctorName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-black text-slate-900">
                            {formatRupiah(bk.totalAmount)}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                            DP: {formatRupiah(bk.dpAmount)}
                          </div>
                          {bk.remainingAmount > 0 ? (
                            <div className="text-[11px] text-amber-600 font-bold">
                              Sisa: {formatRupiah(bk.remainingAmount)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 font-black uppercase bg-emerald-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              LUNAS
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ThumbsUp className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                              <span>SUDAH TERSUNAT 👍</span>
                            </span>
                          ) : (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              bk.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              bk.status === 'ARRIVED' ? 'bg-sky-100 text-sky-800 animate-pulse' :
                              bk.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-800' :
                              bk.status === 'DP_PAID' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {bk.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConsentBooking(bk)}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1 border border-sky-200"
                              title="Cetak Surat Persetujuan Tindakan Khitan (Informed Consent - 1 Lembar A4)"
                            >
                              <PrintDocumentIcon size={14} />
                              <span>Informed Consent</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(bk)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Edit Metode Khitan & Jenis Bius Pasien"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Metode</span>
                            </button>
                            {isFinished ? (
                              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                                <span>Selesai 👍</span>
                              </span>
                            ) : bk.status === 'CONFIRMED' || bk.status === 'DP_PAID' || bk.status === 'BOOKED' ? (
                              <button
                                onClick={() => checkInBooking(bk.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Check-In
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 px-1">Tercatat</span>
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

      {/* Modal Buat Booking */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Pendaftaran Booking Tindakan Khitan
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Sistem mengecek ketersediaan dokter dan merekam snapshot harga paket.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body & sticky footer */}
            <form onSubmit={handleCreateBooking} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {/* Pilih Pasien */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Pilih Pasien Anak:
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.rmNumber} - {p.fullName} ({getPatientAgeDisplay(p)}) • Wali: {p.guardianName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Pasien & Paket Khitan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Kategori Pasien / Paket:
                  </label>
                  <select
                    value={patientCategoryId}
                    onChange={(e) => setPatientCategoryId(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code === 'VIP' ? 'Paket VIP (Private Room & Prioritas)' : 'Paket Reguler (Standar Pelayanan)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Pilihan Paket / Metode Khitan:
                  </label>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {packages.map((pkg, idx) => {
                      const pObj = pkg.prices?.find(p => p.patientCategoryId === Number(patientCategoryId));
                      const priceLabel = pObj ? ` (Rp ${pObj.price.toLocaleString('id-ID')})` : '';
                      return (
                        <option key={`create-pkg-${pkg.id}-${idx}`} value={pkg.id}>
                          {pkg.name}{priceLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Pilihan Bius, Dokter & Jadwal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Jenis Bius / Anastesi:
                  </label>
                  <select
                    value={anesthesiaType}
                    onChange={(e) => setAnesthesiaType(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Dokter Operator:
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {doctors.map((d, idx) => (
                      <option key={`create-doc-${d.id}-${idx}`} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tanggal Tindakan:
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Jam Tindakan:
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Snapshot Rincian Tarif Paket, Diskon, DP & Sisa Pelunasan */}
              <div className="p-4 bg-gradient-to-br from-sky-50 to-indigo-50/40 rounded-2xl border border-sky-200/80 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-sky-950 pb-2 border-b border-sky-200/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                    Tarif Paket ({categories.find(c => c.id === Number(patientCategoryId))?.name}):
                  </span>
                  <span className="font-mono text-sm font-black text-slate-900">{formatRupiah(activePrice)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-sky-900 mb-1">
                      Potongan Diskon / Voucher (Rp):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full py-1.5 px-2 bg-white border border-sky-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-sky-900 mb-1">
                      Total Biaya Bersih:
                    </label>
                    <div className="py-1.5 px-2 bg-white/80 border border-sky-200 rounded-lg text-xs font-black text-sky-950 font-mono">
                      {formatRupiah(netTotal)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-200/60">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-sky-900 mb-1">
                      Uang Muka / DP Dibayarkan (Rp):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={dpAmount}
                      onChange={(e) => setDpAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full py-1.5 px-2 bg-white border border-sky-200 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-sky-900 mb-1">
                      Metode Pembayaran DP:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full py-1.5 px-2 bg-white border border-sky-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value="TRANSFER">Transfer Bank BCA/Mandiri</option>
                      <option value="QRIS">QRIS Dinamis</option>
                      <option value="CASH">Tunai / Kasir Front Office</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-sky-200/60 text-xs font-black">
                  <span className="text-slate-700">Sisa Pelunasan di Hari Tindakan:</span>
                  <span className={`font-mono text-sm px-2.5 py-0.5 rounded-lg ${remaining === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {remaining === 0 ? 'LUNAS (Rp 0)' : formatRupiah(remaining)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Sumber Informasi / Pendaftaran Pasien:
                  </label>
                  <select
                    value={patientSource}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPatientSource(val);
                      if (val === 'Datang Langsung (Walk-in)') {
                        if (!closingStaffId) setClosingStaffId(employees[0]?.id || '');
                      } else {
                        setClosingStaffId('');
                      }
                    }}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="WhatsApp / Chat Pendaftaran">WhatsApp / Chat Pendaftaran</option>
                    <option value="Instagram / Ads">Instagram / Ads</option>
                    <option value="TikTok Video">TikTok Video</option>
                    <option value="Rekomendasi Keluarga / Teman">Rekomendasi Keluarga / Teman</option>
                    <option value="Datang Langsung (Walk-in)">Datang Langsung ke Klinik (Walk-in)</option>
                    <option value="Google / Website">Google / Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Catatan Booking:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Minta ruangan dingin, anak ditemani ayah dan ibu..."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Fee Closing jika Pasien Datang Langsung ke Klinik */}
              {patientSource === 'Datang Langsung (Walk-in)' && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-black uppercase text-amber-950">
                      Petugas Penerima Pendaftaran Langsung (Fee Closing)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    Fee closing dihitung dari <strong>pendaftaran pasien langsung ke klinik</strong> (bukan dari hasil tindakan). Pilih staf yang melayani pendaftaran untuk mendapatkan komisi closing pada rekap gaji:
                  </p>
                  <select
                    value={closingStaffId}
                    onChange={(e) => setClosingStaffId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full py-2 px-3 bg-white border border-amber-400 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Karyawan Penerima Fee Closing --</option>
                    {employees.filter(e => e.isActive && !e.isDeleted).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position || 'Staf'}) — Rp {(emp.closingFeePerPatient || 30000).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Simpan Booking & Buat Invoice
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Modal Edit Rencana Metode & Bius Pasien */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Edit Metode Khitan & Jadwal
                  </h3>
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {editingBooking.bookingNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Pasien: <strong className="text-slate-900">{editingBooking.patientName}</strong> ({editingBooking.rmNumber}) • Wali: {editingBooking.guardianName}
                </p>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form with scrollable body & sticky footer */}
            <form onSubmit={handleSaveEditBooking} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {/* Pilihan Metode Khitan */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Pilihan Metode Tindakan Khitan:
                </label>
                <select
                  value={editFormData.methodType}
                  onChange={(e) => setEditFormData({ ...editFormData, methodType: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {activeMethods.map((m, idx) => (
                    <option key={`edit-meth-opt-${idx}`} value={m}>
                      {m}
                    </option>
                  ))}
                  {editFormData.methodType && !activeMethods.includes(editFormData.methodType) && (
                    <option value={editFormData.methodType}>{editFormData.methodType} (Tersimpan)</option>
                  )}
                </select>
              </div>

              {/* Pilihan Jenis Bius / Anastesi */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Pilihan Jenis Bius / Anastesi:
                </label>
                <select
                  value={editFormData.anesthesiaType}
                  onChange={(e) => setEditFormData({ ...editFormData, anesthesiaType: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
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

              {/* Dokter Operator & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                    Dokter Operator:
                  </label>
                  <select
                    value={editFormData.doctorId}
                    onChange={(e) => setEditFormData({ ...editFormData, doctorId: Number(e.target.value) })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {doctors.map((d, idx) => (
                      <option key={`edit-doc-${d.id}-${idx}`} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Status Booking:
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="BOOKED">BOOKED (Belum DP)</option>
                    <option value="DP_PAID">DP PAID</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ARRIVED">ARRIVED (Di Klinik)</option>
                    <option value="COMPLETED">COMPLETED (Selesai)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Tanggal & Jam */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Tanggal Tindakan:
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.bookingDate}
                    onChange={(e) => setEditFormData({ ...editFormData, bookingDate: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Jam Tindakan:
                  </label>
                  <input
                    type="time"
                    required
                    value={editFormData.bookingTime}
                    onChange={(e) => setEditFormData({ ...editFormData, bookingTime: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Sumber Pendaftaran & Petugas Closing */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Sumber Informasi / Pendaftaran Pasien:
                  </label>
                  <select
                    value={editFormData.patientSource}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        patientSource: val,
                        closingStaffId: val === 'Datang Langsung (Walk-in)' ? (editFormData.closingStaffId || employees[0]?.id || '') : '',
                      });
                    }}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="WhatsApp / Chat Pendaftaran">WhatsApp / Chat Pendaftaran</option>
                    <option value="Instagram / Ads">Instagram / Ads</option>
                    <option value="TikTok Video">TikTok Video</option>
                    <option value="Rekomendasi Keluarga / Teman">Rekomendasi Keluarga / Teman</option>
                    <option value="Datang Langsung (Walk-in)">Datang Langsung ke Klinik (Walk-in)</option>
                    <option value="Google / Website">Google / Website</option>
                  </select>
                </div>

                {editFormData.patientSource === 'Datang Langsung (Walk-in)' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase">
                      <UserCheck className="w-4 h-4 text-amber-700" />
                      <span>Petugas Penerima Fee Closing Pendaftaran Langsung:</span>
                    </div>
                    <select
                      value={editFormData.closingStaffId}
                      onChange={(e) => {
                        const sId = e.target.value ? Number(e.target.value) : '';
                        const emp = employees.find(x => x.id === Number(sId));
                        setEditFormData({
                          ...editFormData,
                          closingStaffId: sId,
                          closingStaffName: emp?.name || '',
                        });
                      }}
                      className="w-full py-2 px-3 bg-white border border-amber-400 rounded-lg text-xs font-bold text-slate-900"
                    >
                      <option value="">-- Pilih Staf Penerima Fee Closing --</option>
                      {employees.filter(e => e.isActive && !e.isDeleted).map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position || 'Staf'}) — Rp {(emp.closingFeePerPatient || 30000).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-amber-800 font-medium">
                      Fee closing bersumber dari pendaftaran langsung di front office (bukan tindakan) dan diakumulasikan ke payroll staf terpilih.
                    </p>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Catatan Perubahan / Khusus:
                </label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="e.g. Permintaan orang tua ubah metode atau bius..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Informed Consent & Surat Persetujuan Tindakan Modal */}
      {consentBooking && (
        <InformedConsentModal
          booking={consentBooking}
          patient={patients.find((p) => p.id === consentBooking.patientId)}
          isOpen={!!consentBooking}
          onClose={() => setConsentBooking(null)}
          onUpdatePatient={updatePatient}
        />
      )}
    </div>
  );
};
