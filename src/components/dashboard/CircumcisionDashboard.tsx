import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Users, CheckCircle2, Calendar, Stethoscope, Clock, 
  ArrowRight, UserCheck, AlertTriangle, Package, Boxes, 
  ChevronLeft, ChevronRight, Search, Filter, Sparkles,
  ExternalLink, Plus, ShieldCheck, Activity, Eye
} from 'lucide-react';
import { CircumcisionBooking } from '../../types';

interface Props {
  onNavigate: (view: string) => void;
}

export const CircumcisionDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { 
    bookings, 
    procedures, 
    patients, 
    products, 
    inventorySummary, 
    checkInBooking, 
    currentUser, 
    settings,
    activeBranchCode
  } = useClinic();

  // Selected date for patient schedules (default: today)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Search filter inside schedule table
  const [scheduleSearch, setScheduleSearch] = useState<string>('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>('ALL');

  // Stock monitor category filter and search
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('ALL');
  const [stockSearch, setStockSearch] = useState<string>('');

  // Indonesian date formatter with defensive fallback
  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-').map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2]) && parts[0] > 1900) {
          const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }
        }
      }
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper to adjust date by delta days with defensive checks
  const handleShiftDate = (days: number) => {
    try {
      if (!selectedDate || typeof selectedDate !== 'string' || !selectedDate.includes('-')) {
        setSelectedDate(todayStr);
        return;
      }
      const parts = selectedDate.split('-').map(Number);
      if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
        setSelectedDate(todayStr);
        return;
      }
      const curr = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(curr.getTime())) {
        setSelectedDate(todayStr);
        return;
      }
      curr.setDate(curr.getDate() + days);
      const nextY = curr.getFullYear();
      const nextM = String(curr.getMonth() + 1).padStart(2, '0');
      const nextD = String(curr.getDate()).padStart(2, '0');
      setSelectedDate(`${nextY}-${nextM}-${nextD}`);
    } catch {
      setSelectedDate(todayStr);
    }
  };

  // 1. STATISTIK PASIEN TERSUNAT / YANG SUDAH SELESAI
  const completedAllTimeProcedures = useMemo(() => {
    return procedures.filter(p => p.status === 'COMPLETED');
  }, [procedures]);

  const completedTodayProcedures = useMemo(() => {
    return procedures.filter(p => p.status === 'COMPLETED' && p.procedureDate === selectedDate);
  }, [procedures, selectedDate]);

  const totalPatientsCount = patients.length;

  // 2. JADWAL PASIEN PADA TANGGAL TERPILIH
  const selectedDateBookings = useMemo(() => {
    return bookings.filter(b => b.bookingDate === selectedDate);
  }, [bookings, selectedDate]);

  const filteredBookings = useMemo(() => {
    return selectedDateBookings.filter(b => {
      const q = scheduleSearch.toLowerCase().trim();
      const matchSearch = !q || 
        (b.patientName || '').toLowerCase().includes(q) ||
        (b.bookingNumber || '').toLowerCase().includes(q) ||
        (b.guardianName || '').toLowerCase().includes(q) ||
        (b.doctorName || '').toLowerCase().includes(q);

      const matchStatus = scheduleStatusFilter === 'ALL' || b.status === scheduleStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [selectedDateBookings, scheduleSearch, scheduleStatusFilter]);

  // Upcoming bookings across all future dates (helpful fallback if today has no bookings)
  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => b.bookingDate && b.bookingDate >= todayStr)
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate))
      .slice(0, 5);
  }, [bookings, todayStr]);

  // 3. MONITOR STOCK (Live Inventory Status)
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive !== false);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(p => p.stock <= (p.minStock || 5));
  }, [activeProducts]);

  const totalStockUnits = useMemo(() => {
    return activeProducts.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
  }, [activeProducts]);

  const filteredStockList = useMemo(() => {
    return activeProducts.filter(p => {
      // Category filter
      if (stockCategoryFilter === 'CELANA_SUNAT') {
        const isCelana = p.category === 'CELANA_SUNAT' || (p.category as any) === 'CELANA' || p.name.toLowerCase().includes('celana');
        if (!isCelana) return false;
      } else if (stockCategoryFilter === 'OBAT') {
        const isObat = p.category === 'OBAT' || p.category === 'OBAT_ORAL' || p.category === 'OBAT_LUAR' || p.name.toLowerCase().includes('obat') || p.name.toLowerCase().includes('sirup') || p.name.toLowerCase().includes('salep');
        if (!isObat) return false;
      } else if (stockCategoryFilter === 'ALKES') {
        const isAlkes = p.category === 'ALKES' || p.category === 'KLEM' || p.category === 'RING' || p.name.toLowerCase().includes('klem') || p.name.toLowerCase().includes('ring') || p.name.toLowerCase().includes('bipolar');
        if (!isAlkes) return false;
      } else if (stockCategoryFilter === 'CRITICAL') {
        if (p.stock > (p.minStock || 5)) return false;
      }

      // Search filter
      if (stockSearch.trim()) {
        const q = stockSearch.toLowerCase().trim();
        const match = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [activeProducts, stockCategoryFilter, stockSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
              Klinik Khitan {activeBranchCode && activeBranchCode !== 'ALL' ? `• Cabang ${activeBranchCode}` : '• Pusat'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
            Dashboard Operasional Khitan
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            Monitoring jadwal pasien, rekapitulasi pasien yang telah tersunat, dan pantauan stok obat & alkes medis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('procedures')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <span>Ruang Tindakan</span>
          </button>

          <button
            onClick={() => onNavigate('bookings')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-xs shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Booking Baru</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          WIDGET 1: JUMLAH PASIEN TERSUNAT / YANG SUDAH SELESAI
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pasien Tersunat Selesai (Kumulatif) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500/60 shadow-xs hover:border-emerald-600 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
              Pasien Selesai Tersunat
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight font-mono">
              {completedAllTimeProcedures.length}
            </span>
            <span className="text-xs font-bold text-emerald-800">Anak Selesai</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Total kumulatif tindakan medis sukses
          </p>
        </div>

        {/* Card 2: Pasien Selesai Tersunat Tanggal Terpilih / Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-2xs hover:shadow-xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-sky-950 uppercase tracking-wider">
              Selesai Pada {selectedDate === todayStr ? 'Hari Ini' : 'Tanggal Ini'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black shadow-2xs">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {completedTodayProcedures.length}
            </span>
            <span className="text-xs font-bold text-sky-700">Pasien</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Dari total {selectedDateBookings.length} jadwal pada tanggal ini
          </p>
        </div>

        {/* Card 3: Pasien Antrean / Terjadwal Tanggal Terpilih */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Jadwal & Antrean
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-800 tracking-tight font-mono">
              {selectedDateBookings.length}
            </span>
            <span className="text-xs font-bold text-amber-700">Terdaftar</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {selectedDateBookings.filter(b => b.status === 'ARRIVED').length} pasien sudah tiba di klinik
          </p>
        </div>

        {/* Card 4: Total Pasien Terdaftar di Database */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Database Pasien Anak
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {totalPatientsCount}
            </span>
            <span className="text-xs font-bold text-slate-600">Total Pasien</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Rekam medis digital tersimpan lengkap
          </p>
        </div>
      </div>

      {/* =========================================================================
          WIDGET 2: JADWAL PASIEN (TANGGAL)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Toolbar: Tanggal Pasien Navigasi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Jadwal Pasien Khitan
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pilih tanggal untuk melihat jadwal antrean kedatangan & panggilan ke ruang tindakan medis.
            </p>
          </div>

          {/* Quick Date Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Direct Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="hidden lg:block text-xs font-black text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
              {formatIndonesianDate(selectedDate)}
            </div>
          </div>
        </div>

        {/* Filter bar inside schedule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pasien, wali, no. booking..."
              value={scheduleSearch}
              onChange={(e) => setScheduleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filter Status:</span>
            <select
              value={scheduleStatusFilter}
              onChange={(e) => setScheduleStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="BOOKED">Terjadwal (BOOKED)</option>
              <option value="CONFIRMED">Terkonfirmasi (CONFIRMED)</option>
              <option value="ARRIVED">Tiba di Klinik (ARRIVED)</option>
              <option value="COMPLETED">Selesai Tersunat (COMPLETED)</option>
            </select>

            <button
              onClick={() => onNavigate('bookings')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 ml-auto flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Jadwal Kalender</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10.5px] font-black tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5">Waktu / Jam</th>
                <th className="py-3 px-3.5">No. Booking</th>
                <th className="py-3 px-3.5">Nama Pasien Anak & Usia</th>
                <th className="py-3 px-3.5">Orang Tua / Wali</th>
                <th className="py-3 px-3.5">Metode / Paket</th>
                <th className="py-3 px-3.5">Dokter Operator</th>
                <th className="py-3 px-3.5 text-center">Status Pasien</th>
                <th className="py-3 px-3.5 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Tidak ada jadwal pasien pada tanggal {formatIndonesianDate(selectedDate)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Gunakan tombol panah di atas untuk berpindah tanggal, atau buat booking pendaftaran baru.
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate('bookings')}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          + Daftarkan Pasien Baru
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((bk) => {
                  const isCompleted = bk.status === 'COMPLETED';
                  const isArrived = bk.status === 'ARRIVED';

                  return (
                    <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{bk.bookingTime || '09:00'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-mono font-bold text-sky-700 whitespace-nowrap">
                        {bk.bookingNumber}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-black text-slate-900">{bk.patientName}</div>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          No. RM: {bk.rmNumber || '-'} • Usia: {bk.patientAge ? `${bk.patientAge} th` : '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">{bk.guardianName || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {bk.guardianPhone || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider mb-0.5 ${
                          bk.categoryCode === 'VIP'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {bk.categoryCode || 'REGULER'}
                        </span>
                        <div className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">
                          {bk.packageName || bk.methodType || 'Paket Khitan'}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-medium text-slate-700">
                        {bk.doctorName || 'dr. Operator'}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isArrived
                            ? 'bg-sky-100 text-sky-800 border border-sky-300 animate-pulse'
                            : bk.status === 'CONFIRMED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                          {bk.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {bk.status === 'BOOKED' || bk.status === 'CONFIRMED' || bk.status === 'DP_PAID' ? (
                          <button
                            type="button"
                            onClick={() => checkInBooking(bk.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check-In</span>
                          </button>
                        ) : isArrived ? (
                          <button
                            type="button"
                            onClick={() => onNavigate('procedures')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Tindakan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('procedures')}
                            className="px-2.5 py-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
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

        {/* If selectedDate has 0 bookings, show upcoming schedule preview */}
        {selectedDateBookings.length === 0 && upcomingBookings.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Jadwal Pasien Terdekat Berikutnya:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {upcomingBookings.map((ub) => (
                <div
                  key={ub.id}
                  onClick={() => setSelectedDate(ub.bookingDate)}
                  className="p-3 bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-black text-slate-900">{ub.patientName}</div>
                    <div className="text-[10.5px] text-slate-500">
                      {formatIndonesianDate(ub.bookingDate)} • {ub.bookingTime}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-sky-700 border border-slate-200">
                    Buka Tanggal
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          WIDGET 3: MONITOR STOCK (Live Medication, Pants & Medical Supplies)
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Header & Status Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Monitor Stock Gudang & Alkes Khitan
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pantauan fisik persediaan celana sunat, obat antibiotik/analgesik, klem, ring, dan alkes medis secara langsung.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Katalog & + Stok Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('product-reports')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Laporan Pengeluaran</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Stock Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Fisik Gudang
            </span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {totalStockUnits} <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Semua obat & alkes aktif</p>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            lowStockProducts.length > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              {lowStockProducts.length > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Stok Kritis / Menipis
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Stok Aman Terkendali
                </>
              )}
            </span>
            <div className={`text-2xl font-black font-mono mt-1 ${
              lowStockProducts.length > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {lowStockProducts.length} <span className="text-xs font-normal">item</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">
              {lowStockProducts.length > 0 ? 'Segera lakukan restock' : 'Semua persediaan di atas batas aman'}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stok Celana Sunat
            </span>
            <div className="text-2xl font-black font-mono text-indigo-700 mt-1">
              {activeProducts
                .filter(p => p.category === 'CELANA_SUNAT' || (p.category as any) === 'CELANA' || p.name.toLowerCase().includes('celana'))
                .reduce((sum, p) => sum + Math.max(0, p.stock), 0)}{' '}
              <span className="text-xs font-normal text-slate-500">pcs</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Semua ukuran (XS s/d XXL)</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stok Obat & Salep
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {activeProducts
                .filter(p => p.category === 'OBAT' || p.category === 'OBAT_ORAL' || p.category === 'OBAT_LUAR' || p.name.toLowerCase().includes('obat') || p.name.toLowerCase().includes('salep'))
                .reduce((sum, p) => sum + Math.max(0, p.stock), 0)}{' '}
              <span className="text-xs font-normal text-slate-500">unit</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Oral & topikal khitan</p>
          </div>
        </div>

        {/* Filter Toolbar for Stock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStockCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockCategoryFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua ({activeProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setStockCategoryFilter('CELANA_SUNAT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockCategoryFilter === 'CELANA_SUNAT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Celana Sunat
            </button>
            <button
              type="button"
              onClick={() => setStockCategoryFilter('OBAT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockCategoryFilter === 'OBAT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Obat & Salep
            </button>
            <button
              type="button"
              onClick={() => setStockCategoryFilter('ALKES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockCategoryFilter === 'ALKES'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Alkes & Klem
            </button>
            {lowStockProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setStockCategoryFilter('CRITICAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  stockCategoryFilter === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                ⚠️ Perlu Restock ({lowStockProducts.length})
              </button>
            )}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari obat / celana / alkes..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
            />
          </div>
        </div>

        {/* Stock Monitoring Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10.5px] font-black tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3.5">Kode SKU</th>
                <th className="py-2.5 px-3.5">Nama Produk & Alkes</th>
                <th className="py-2.5 px-3.5">Kategori</th>
                <th className="py-2.5 px-3.5 text-center">Stok Fisik Saat Ini</th>
                <th className="py-2.5 px-3.5 text-center">Batas Aman</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStockList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-xs">
                    Tidak ada produk yang cocok dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                filteredStockList.slice(0, 15).map((prod) => {
                  const isLow = prod.stock <= (prod.minStock || 5);

                  // Extract size if celana
                  let sizeTag: string | null = null;
                  const mSize = (prod.name + ' ' + prod.sku).match(/\b(XS|XL|XXL|S|M|L)\b/i);
                  if (mSize) sizeTag = mSize[1].toUpperCase();

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[11px] font-bold text-slate-600">
                        {prod.sku}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{prod.name}</span>
                          {sizeTag && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9.5px] font-black">
                              Size {sizeTag}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-500 font-medium text-[11px]">
                        {prod.category}
                      </td>

                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`font-mono text-sm font-black px-2.5 py-0.5 rounded-lg ${
                          isLow
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : 'bg-slate-100 text-slate-900'
                        }`}>
                          {prod.stock} {prod.unit || 'pcs'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-500 text-xs">
                        Min. {prod.minStock || 5} {prod.unit || 'pcs'}
                      </td>

                      <td className="py-2.5 px-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Stok Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aman
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('products')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          + Tambah
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredStockList.length > 15 && (
          <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
            <span>Menampilkan 15 dari total {filteredStockList.length} produk</span>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
            >
              <span>Lihat Seluruh Katalog Stok di Menu Produk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
