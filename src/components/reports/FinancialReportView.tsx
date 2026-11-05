import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  FileBarChart, DollarSign, TrendingUp, TrendingDown, Award, 
  Calendar, ShieldCheck, Stethoscope, PieChart, ShoppingBag, 
  Package, RefreshCw, Layers, CheckCircle2, ExternalLink,
  CreditCard, Users, Building, Wallet, ArrowRight, Activity, Box, Download,
  Lock, Eye, EyeOff, AlertTriangle, FileText, CheckSquare, Clock
} from 'lucide-react';
import { NanoMasterLogo, PrintReportIcon } from '../common/PrintIcons';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';
import { downloadElementAsPdf } from '../../utils/pdfHelper';
import { canViewRevenueAndProfit } from '../../utils/permissionUtils';

interface ProfitLossResponse {
  period: {
    startDate: string;
    endDate: string;
    isAllTime?: boolean;
  };
  summary?: {
    completedProceduresCount: number;
    totalProceduresCount: number;
  };
  revenue: {
    total: number;
    circumcision: number;
    products: number;
    other: number;
  };
  paymentMethods?: {
    cash: number;
    transfer: number;
    qris: number;
    debit: number;
    other: number;
  };
  inventoryValuation?: {
    totalProductsCount: number;
    totalPhysicalStock: number;
    totalStockAssetValuation: number;
    totalStockSellPotential: number;
  };
  cogs: {
    totalProductHpp: number;
    includedProductHpp: number;
    addonProductHpp: number;
  };
  expenses: {
    doctorFees: number;
    employeeFees: number;
    salaries: number;
    operatingExpenses: Record<string, number>;
    totalOperating: number;
    productHpp: number;
    totalBeban: number;
  };
  netProfit: number;
}

interface ProcedureReportItem {
  id: number;
  procedureNumber: string;
  bookingId: number;
  bookingNumber: string;
  procedureDate: string;
  procedureTime: string;
  endTime?: string;
  status: string;
  patientName: string;
  patientAge: string;
  rmNumber: string;
  guardianName: string;
  guardianPhone: string;
  packageName: string;
  doctorName: string;
  assistantName: string;
  anesthesiaNotes: string;
  notes: string;
  invoiceId: number | null;
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceTotalAmount: number;
  invoicePaidAmount: number;
  doctorFeeAmount: number;
  employeeFeeAmount: number;
  usedItemsCount: number;
  usedItems?: Array<{
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    itemType: string;
    isStockDeducted: boolean;
  }>;
}

type PeriodFilterMode = 'ALL' | 'MONTH' | 'TODAY' | 'CUSTOM';
type ReportTab = 'FINANCIAL' | 'PROCEDURES' | 'PRODUCTS';

export const FinancialReportView: React.FC = () => {
  const { 
    dashboardData, settings, currentUser, invoices, inventorySummary, 
    refreshAllData, showToast, getHeaders, branches, activeBranchCode, setActiveBranchCode 
  } = useClinic();

  const todayStr = new Date().toISOString().split('T')[0];
  // Default to 'ALL' (Semua Waktu - Kumulatif) so existing data is immediately shown and never blank!
  const [filterMode, setFilterMode] = useState<PeriodFilterMode>('ALL');
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCIAL');
  // Default to 'ALL' (Konsolidasi Seluruh Cabang) so all financial transactions appear across branches
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [syncStatusBanner, setSyncStatusBanner] = useState<string | null>(null);
  
  // Date states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Month & Year states for monthly report
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [reportData, setReportData] = useState<ProfitLossResponse | null>(null);
  const [proceduresData, setProceduresData] = useState<{
    summary: {
      totalProcedures: number;
      completedCount: number;
      waitingCount: number;
      inProgressCount: number;
      totalInvoiceAmount: number;
      totalPaidAmount: number;
      totalDoctorFee: number;
    };
    procedures: ProcedureReportItem[];
  } | null>(null);

  const [productsData, setProductsData] = useState<{
    summary: {
      totalTransactions: number;
      totalItemsDisbursed: number;
      totalRevenue: number;
      totalCost: number;
      totalMargin: number;
      totalIncludedItems: number;
      totalAddonItems: number;
      totalManualOutItems: number;
    };
    items: Array<{
      productId: number;
      productSku: string;
      productName: string;
      category: string;
      size: string | null;
      qtyIncluded: number;
      qtyAddon: number;
      qtyTotal: number;
      qtyDeducted: number;
      totalRevenue: number;
    }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Check if current user has permission to see Omset & Keuntungan
  const canSeeFinancials = canViewRevenueAndProfit(currentUser);

  // Helper to calculate start & end date for a given month & year
  const getMonthDateRange = (year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  };

  // Switch filter mode and update dates
  const handleSetMode = (mode: PeriodFilterMode) => {
    setFilterMode(mode);
    if (mode === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (mode === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (mode === 'MONTH') {
      const { start, end } = getMonthDateRange(selectedYear, selectedMonth);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    const { start, end } = getMonthDateRange(year, month);
    setStartDate(start);
    setEndDate(end);
  };

  // Fetch report data
  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterMode === 'ALL') {
        params.append('allTime', 'true');
      } else {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      const effectiveBranch = selectedBranch || activeBranchCode || 'ALL';
      if (effectiveBranch) {
        params.append('branchCode', effectiveBranch);
      }

      const headers = getHeaders ? getHeaders(effectiveBranch) : {
        'Content-Type': 'application/json',
        'x-branch-code': effectiveBranch,
      };

      // 1. Fetch Profit & Loss
      const resPl = await fetch(`/api/reports/profit-loss?${params.toString()}`, { headers });
      if (resPl.ok) {
        const dataPl = await resPl.json();
        setReportData(dataPl);
      }

      // 2. Fetch Procedures Report
      const resProc = await fetch(`/api/reports/procedures?${params.toString()}`, { headers });
      if (resProc.ok) {
        const dataProc = await resProc.json();
        setProceduresData(dataProc);
      }

      // 3. Fetch Products / Stock Outflow Report
      const resProd = await fetch(`/api/reports/products?${params.toString()}`, { headers });
      if (resProd.ok) {
        const dataProd = await resProd.json();
        setProductsData(dataProd);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Full Database Synchronization
  const handleFullSync = async () => {
    try {
      setIsSyncing(true);
      showToast('Menyinkronkan seluruh tindakan, stok obat, dan pembayaran kasir ke database...', 'info');
      const effectiveBranch = selectedBranch || activeBranchCode || 'ALL';
      const headers = getHeaders ? getHeaders(effectiveBranch) : { 'Content-Type': 'application/json' };
      
      const res = await fetch('/api/reports/sync', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatusBanner(data.message || 'Sinkronisasi database berhasil dilakukan!');
        showToast(data.message || 'Sinkronisasi laporan berhasil dilakukan!', 'success');
      } else {
        showToast(data.error || 'Sinkronisasi selesai dengan peringatan', 'info');
      }
      await refreshAllData();
      await fetchReport();
    } catch (err: any) {
      showToast('Gagal melakukan sinkronisasi: ' + (err.message || String(err)), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, filterMode, selectedBranch, activeBranchCode, invoices.length]);

  const formatRupiah = (val: number) => {
    if (!canSeeFinancials) {
      return 'Rp •••••••• (Terkunci)';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const monthsList = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const totalRev = reportData?.revenue?.total ?? 0;
  const circumcisionRev = reportData?.revenue?.circumcision ?? 0;
  const productsRev = reportData?.revenue?.products ?? 0;
  const cogsHpp = reportData?.cogs?.totalProductHpp ?? 0;
  const doctorFees = reportData?.expenses?.doctorFees ?? 0;
  const employeeFees = reportData?.expenses?.employeeFees ?? 0;
  const salaries = reportData?.expenses?.salaries ?? 0;
  const totalOperating = reportData?.expenses?.totalOperating ?? 0;
  const totalBeban = reportData?.expenses?.totalBeban ?? (totalOperating + cogsHpp + doctorFees + employeeFees + salaries);
  const netProfit = reportData?.netProfit ?? (totalRev - totalBeban);

  // Stock inventory valuation numbers
  const totalStockAsset = reportData?.inventoryValuation?.totalStockAssetValuation ?? inventorySummary?.totalValuation ?? 0;
  const totalPhysicalUnits = reportData?.inventoryValuation?.totalPhysicalStock ?? inventorySummary?.totalStockUnits ?? 0;
  const totalProductsCount = reportData?.inventoryValuation?.totalProductsCount ?? inventorySummary?.totalProducts ?? 0;

  const operatingExpensesMap = reportData?.expenses?.operatingExpenses || {};
  const paymentMethods = reportData?.paymentMethods;

  // Formatted period title
  const getPeriodLabel = () => {
    if (filterMode === 'ALL') {
      return 'Semua Waktu (Kumulatif Database)';
    }
    if (filterMode === 'TODAY' || startDate === endDate) {
      if (startDate === todayStr) {
        return `Hari Ini (${formatIndoDate(startDate)})`;
      }
      return `Tanggal ${formatIndoDate(startDate)}`;
    }
    if (filterMode === 'MONTH') {
      const mName = monthsList.find(m => m.value === selectedMonth)?.label;
      return `Bulan ${mName} ${selectedYear}`;
    }
    return `${formatIndoDate(startDate)} s/d ${formatIndoDate(endDate)}`;
  };

  const handlePrintReport = () => {
    printElementById('financial-report-print-document', {
      title: `Laporan Keuangan & Laba Rugi - ${getPeriodLabel()}`,
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  const handleOpenReportNewTab = () => {
    openElementInNewTab('financial-report-print-document', {
      title: `Laporan Keuangan & Laba Rugi - ${getPeriodLabel()}`,
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  const handleDownloadFinancialPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      showToast('Menyiapkan berkas PDF Laporan Keuangan...', 'info');
      const filename = `Laporan_${activeTab}_${getPeriodLabel().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const res = await downloadElementAsPdf('financial-report-print-document', {
        filename,
        margin: [8, 8, 8, 8],
        format: 'a4',
        orientation: 'portrait',
      });
      if (res.success) {
        showToast('Laporan berhasil diunduh dalam format PDF!', 'success');
      } else {
        showToast('Gagal mengunduh PDF: ' + (res.error || 'Terjadi kesalahan sistem'), 'error');
      }
    } catch (err: any) {
      showToast('Gagal mengunduh PDF: ' + (err.message || String(err)), 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
              Laporan Terpadu Klinik Khitan
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
            Laporan Keuangan, Tindakan & Stok
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Semua data tersinkronisasi: Tindakan Medis Pasien, Pengeluaran Stok Obat/Alkes, dan Arus Kas Keuangan.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Master Sync Button */}
          <button
            type="button"
            onClick={handleFullSync}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            title="Sinkronkan seluruh data tindakan, pengeluaran stok, dan kas keuangan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>

          <button
            type="button"
            disabled={isDownloadingPdf}
            onClick={handleDownloadFinancialPdf}
            className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            title="Unduh laporan sebagai berkas file PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDownloadingPdf ? 'Mengunduh...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenReportNewTab}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            title="Buka pratinjau cetak di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Baru</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <PrintReportIcon size={18} />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Omset & Keuntungan Restriction Notice (For Non-Owner Users) */}
      {!canSeeFinancials && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>Akses Finansial Dibatasi</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[9.5px] font-black">
                Khusus Owner & Izin Khusus
              </span>
            </h3>
            <p className="text-xs text-amber-900/90 font-medium mt-0.5 leading-relaxed">
              Sesuai kebijakan privasi klinik, <strong>nominal Omset dan Keuntungan/Laba Bersih</strong> disembunyikan untuk pengguna Admin Operasional/Staff. Angka finansial hanya dapat dilihat oleh akun <strong>Owner</strong> atau pengguna yang diberikan izin khusus <em>"Lihat Omset & Keuntungan Finansial"</em> melalui Manajemen Pengguna.
            </p>
          </div>
        </div>
      )}

      {/* Database Sync Status Notice / Fresh Deploy Helper Banner */}
      {syncStatusBanner && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                Status Sinkronisasi Database
              </h4>
              <p className="text-xs text-emerald-800 font-medium">
                {syncStatusBanner}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatusBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Fresh Render Deploy / Empty Report Helper Banner */}
      {(!reportData || (totalRev === 0 && (reportData.summary?.completedProceduresCount || 0) === 0)) && !isLoading && (
        <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-2 border-sky-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Laporan Belum Muncul / Database Baru Saja Di-deploy di Render?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                Jika Anda baru saja melakukan deploy ke Render atau tabel masih baru, klik tombol <strong>"Sinkronkan Database Sekarang"</strong> di bawah. Server akan otomatis memverifikasi struktur tabel PostgreSQL, memulihkan status invoice & pembayaran, dan menyinkronkan data tindakan klinis ke laporan laba rugi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFullSync}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm transition-all whitespace-nowrap self-stretch md:self-auto justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database Sekarang'}</span>
          </button>
        </div>
      )}

      {/* Top Tabs: 3 Unified Report Modules */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('FINANCIAL')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'FINANCIAL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <FileBarChart className="w-4 h-4 text-sky-400" />
          <span>1. Rekap Laba Rugi & Keuangan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROCEDURES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'PROCEDURES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-purple-400" />
          <span>2. Laporan Tindakan Medis Khitan ({proceduresData?.summary?.completedCount ?? proceduresData?.procedures?.length ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'PRODUCTS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>3. Laporan Pengeluaran Obat & Alkes ({productsData?.summary?.totalItemsDisbursed ?? 0} item)</span>
        </button>
      </div>

      {/* Date & Period Selector Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                Pilih Periode:
              </span>
            </div>

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-black text-slate-500 uppercase">Cabang:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">🏢 Semua Cabang (Konsolidasi)</option>
                {branches.map(b => (
                  <option key={b.code} value={b.code}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetMode('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Semua Waktu (Kumulatif)
            </button>
            <button
              type="button"
              onClick={() => handleSetMode('MONTH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === 'MONTH'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Per Bulan
            </button>
            <button
              type="button"
              onClick={() => handleSetMode('TODAY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === 'TODAY'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('CUSTOM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                filterMode === 'CUSTOM'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Rentang Tanggal
            </button>
          </div>
        </div>

        {/* Dynamic Controls depending on mode */}
        <div className="flex flex-wrap items-center gap-4">
          {filterMode === 'MONTH' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value), selectedYear)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => handleMonthChange(selectedMonth, Number(e.target.value))}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>
          )}

          {(filterMode === 'CUSTOM' || filterMode === 'TODAY') && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Mulai:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setFilterMode('CUSTOM');
                    setStartDate(e.target.value);
                  }}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setFilterMode('CUSTOM');
                    setEndDate(e.target.value);
                  }}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div className="ml-auto text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Periode Terpilih: <span className="text-sky-700 font-black">{getPeriodLabel()}</span>
          </div>
        </div>
      </div>

      {/* TAB 1: REKAP LABA RUGI & KEUANGAN */}
      {activeTab === 'FINANCIAL' && (
        <div id="financial-report-print-document" className="space-y-6">
          {/* Printable Official Kop Surat */}
          <div className="hidden print:flex print-kop items-center justify-between pb-4 mb-2 border-b-2 border-slate-900">
            <div className="flex items-center gap-4">
              <NanoMasterLogo 
                src={settings.logoUrl} 
                height={50} 
                width={65} 
                className="max-h-[50px] max-w-[65px] object-contain print-kop-logo" 
              />
              <div>
                <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                  {settings.clinicName || 'NANO CIRCUMCISION'}
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  {settings.tagline || 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {settings.address} • Telp: {settings.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                LAPORAN KEUANGAN RESMI
              </span>
              <div className="text-xs font-bold text-slate-700 mt-1">
                Periode: {getPeriodLabel()}
              </div>
            </div>
          </div>

          {/* Top 4 KPI Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Penerimaan Kas Pasien (Omzet)</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 mt-2">
                {formatRupiah(totalRev)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {canSeeFinancials ? `Paket: ${formatRupiah(circumcisionRev)} • Add-on: ${formatRupiah(productsRev)}` : 'Hanya dapat dilihat Owner'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Beban Operasional & HPP</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-rose-600 mt-2">
                {formatRupiah(totalOperating + cogsHpp)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {canSeeFinancials ? `HPP: ${formatRupiah(cogsHpp)} • Operasional: ${formatRupiah(totalOperating)}` : 'Beban logistik & operasional'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Fee Dokter & Nakes</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-amber-700 mt-2">
                {formatRupiah(doctorFees + employeeFees + salaries)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {canSeeFinancials ? `Dokter: ${formatRupiah(doctorFees)} • Asisten: ${formatRupiah(employeeFees)}` : 'Jasa medis terhubung'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">Laba Bersih Operasional</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-xl font-black font-mono mt-2 ${netProfit >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
                {formatRupiah(netProfit)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {canSeeFinancials && totalRev > 0 ? `Margin: ${Math.round((netProfit / totalRev) * 100)}% dari Omzet` : 'Laba bersih klinis'}
              </p>
            </div>
          </div>

          {/* Formal Laba Rugi P&L Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-sm p-6 sm:p-8">
            <div className="text-center pb-5 border-b-2 border-slate-900">
              <div className="text-xs font-mono font-black text-sky-700 uppercase tracking-widest">
                {settings.clinicName || 'NANO CIRCUMCISION CLINIC'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-1">
                LAPORAN LABA RUGI OPERASIONAL
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Periode: {getPeriodLabel()} • Rekonsiliasi Transaksi Kas & Prosedur Medis
              </p>
            </div>

            <div className="py-6 max-w-2xl mx-auto space-y-5 text-sm">
              {/* 1. Penerimaan */}
              <div className="space-y-2">
                <div className="flex justify-between font-black text-slate-900 uppercase text-xs tracking-wider pb-1 border-b border-slate-200">
                  <span>1. Penerimaan / Omzet Kas Masuk (Revenue)</span>
                  <span>Nominal (Rp)</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>• Pelunasan & Kas Masuk Paket Khitan</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(circumcisionRev)}</span>
                </div>
                {productsRev > 0 && (
                  <div className="flex justify-between text-sky-800 pl-4">
                    <span>• Penjualan Produk & Obat Tambahan (Add-on)</span>
                    <span className="font-mono font-bold text-sky-700">+ {formatRupiah(productsRev)}</span>
                  </div>
                )}

                {/* Rincian Metode Pembayaran Pasien */}
                {paymentMethods && totalRev > 0 && canSeeFinancials && (
                  <div className="pl-6 py-1.5 my-1 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Rincian Jalur Penerimaan Kasir:
                    </div>
                    {paymentMethods.cash > 0 && (
                      <div className="flex justify-between">
                        <span>- Tunai Kasir (CASH)</span>
                        <span className="font-mono">{formatRupiah(paymentMethods.cash)}</span>
                      </div>
                    )}
                    {paymentMethods.transfer > 0 && (
                      <div className="flex justify-between">
                        <span>- Transfer Bank</span>
                        <span className="font-mono">{formatRupiah(paymentMethods.transfer)}</span>
                      </div>
                    )}
                    {paymentMethods.qris > 0 && (
                      <div className="flex justify-between">
                        <span>- QRIS</span>
                        <span className="font-mono">{formatRupiah(paymentMethods.qris)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between font-black text-emerald-700 pt-2 border-t border-slate-200">
                  <span>TOTAL OMZET KAS MASUK</span>
                  <span className="font-mono">{formatRupiah(totalRev)}</span>
                </div>
              </div>

              {/* 2. HPP */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-black text-slate-900 uppercase text-xs tracking-wider pb-1 border-b border-slate-200">
                  <span>2. Harga Pokok Penjualan (HPP Logistik Alkes & Obat)</span>
                  <span>Nominal (Rp)</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>• HPP Paket Include Khitan (Celana Sunat & Obat)</span>
                  <span className="font-mono text-slate-800">{formatRupiah(reportData?.cogs?.includedProductHpp || 0)}</span>
                </div>
                {(reportData?.cogs?.addonProductHpp || 0) > 0 && (
                  <div className="flex justify-between text-slate-700 pl-4">
                    <span>• HPP Produk / Obat Tambahan Add-on</span>
                    <span className="font-mono text-slate-800">{formatRupiah(reportData?.cogs?.addonProductHpp || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-rose-700 pt-1 border-t border-slate-200">
                  <span>TOTAL BEBAN HPP ALKES & OBAT</span>
                  <span className="font-mono">{formatRupiah(cogsHpp)}</span>
                </div>
              </div>

              {/* 3. Beban Jasa Medis & Operasional */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-black text-slate-900 uppercase text-xs tracking-wider pb-1 border-b border-slate-200">
                  <span>3. Beban Jasa Medis, Gaji & Operasional</span>
                  <span>Nominal (Rp)</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>• Komisi / Fee Dokter Khitan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(doctorFees)}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-4">
                  <span>• Fee Karyawan / Asisten Medis Khitan</span>
                  <span className="font-mono text-slate-800">{formatRupiah(employeeFees)}</span>
                </div>
                {salaries > 0 && (
                  <div className="flex justify-between text-slate-700 pl-4">
                    <span>• Gaji Pokok & Payroll Karyawan</span>
                    <span className="font-mono text-slate-800">{formatRupiah(salaries)}</span>
                  </div>
                )}
                {totalOperating > 0 && (
                  <div className="flex justify-between text-slate-700 pl-4">
                    <span>• Beban Operasional Klinik (Sewa, Listrik, Konsumsi, ATK)</span>
                    <span className="font-mono text-slate-800">{formatRupiah(totalOperating)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-rose-700 pt-1 border-t border-slate-200">
                  <span>TOTAL BEBAN MEDIS & OPERASIONAL</span>
                  <span className="font-mono">{formatRupiah(doctorFees + employeeFees + salaries + totalOperating)}</span>
                </div>
              </div>

              {/* 4. Laba Bersih */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center text-base font-black">
                <span className="uppercase tracking-wider">LABA BERSIH OPERASIONAL KLINIK</span>
                <span className={`font-mono text-lg ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN TINDAKAN MEDIS KHITAN */}
      {activeTab === 'PROCEDURES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" />
                Laporan Prosedur Tindakan Medis Khitan
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Daftar seluruh pasien yang telah menjalani tindakan khitan, dokter operator, asisten, metode, dan status tagihan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-black">
                {proceduresData?.summary?.completedCount ?? 0} Pasien Selesai Tersunat
              </span>
            </div>
          </div>

          {/* Procedures Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[10.5px] font-black tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">Tanggal & Jam</th>
                  <th className="py-3 px-3.5">No. Tindakan / Booking</th>
                  <th className="py-3 px-3.5">Nama Pasien Anak</th>
                  <th className="py-3 px-3.5">Metode / Paket Khitan</th>
                  <th className="py-3 px-3.5">Dokter & Asisten</th>
                  <th className="py-3 px-3.5 text-center">Status Tindakan</th>
                  <th className="py-3 px-3.5 text-center">Status Invoice</th>
                  <th className="py-3 px-3.5 text-right">Biaya Paket</th>
                  <th className="py-3 px-3.5 text-right">Fee Dokter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!proceduresData || proceduresData.procedures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                      Belum ada data tindakan medis khitan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  proceduresData.procedures.map((proc) => (
                    <tr key={proc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-900 whitespace-nowrap">
                        <div className="font-bold">{proc.procedureDate || '-'}</div>
                        <div className="text-[10.5px] text-slate-400">{proc.procedureTime}</div>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-sky-700 whitespace-nowrap">
                        <div className="font-bold">{proc.procedureNumber}</div>
                        <div className="text-[10.5px] text-slate-400">{proc.bookingNumber}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-black text-slate-900">{proc.patientName}</div>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          No. RM: {proc.rmNumber} • Usia: {proc.patientAge}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">{proc.packageName}</div>
                        {proc.usedItemsCount > 0 && (
                          <div className="text-[10px] text-purple-700 font-medium">
                            {proc.usedItemsCount} alkes/obat terpotong
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800">{proc.doctorName}</div>
                        <div className="text-[10.5px] text-slate-500">Asisten: {proc.assistantName}</div>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          proc.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {proc.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                          {proc.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          proc.invoiceStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {proc.invoiceStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(proc.invoiceTotalAmount)}
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                        {formatRupiah(proc.doctorFeeAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN PENJUALAN OBAT & PENGELUARAN STOK */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                Laporan Penjualan Obat & Pengeluaran Stok
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Rincian arus barang medis, paket include tindakan, dan penjualan langsung add-on kasir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFullSync}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sinkronkan Stok</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Barang Terdistribusi
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {productsData?.summary?.totalItemsDisbursed ?? 0}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                Dari {productsData?.summary?.totalTransactions ?? 0} transaksi tercatat
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
              <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                Item Include Paket Khitan
              </div>
              <div className="text-2xl font-black text-purple-900 font-mono mt-1">
                {productsData?.summary?.totalIncludedItems ?? 0}
              </div>
              <div className="text-[10.5px] text-purple-700 mt-0.5">
                Celana khitan & obat paket
              </div>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
              <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                Penjualan Tambahan (Add-on)
              </div>
              <div className="text-2xl font-black text-sky-900 font-mono mt-1">
                {productsData?.summary?.totalAddonItems ?? 0}
              </div>
              <div className="text-[10.5px] text-sky-700 mt-0.5">
                Obat & alkes ekstra kasir
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Omzet Penjualan Produk
              </div>
              <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                {formatRupiah(productsData?.summary?.totalRevenue ?? 0)}
              </div>
              <div className="text-[10.5px] text-emerald-700 mt-0.5">
                Penerimaan kasir obat & alkes
              </div>
            </div>
          </div>

          {/* Table of Disbursed Items */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[10.5px] font-black tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3.5">SKU / Kode</th>
                  <th className="py-3 px-3.5">Nama Barang Medis / Obat</th>
                  <th className="py-3 px-3.5">Kategori</th>
                  <th className="py-3 px-3.5 text-center">Include Paket</th>
                  <th className="py-3 px-3.5 text-center">Add-on Kasir</th>
                  <th className="py-3 px-3.5 text-center font-bold">Total Terpotong</th>
                  <th className="py-3 px-3.5 text-right">Total Penjualan (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!productsData || !productsData.items || productsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      Belum ada data barang atau obat yang terdistribusi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  productsData.items.map((it) => (
                    <tr key={it.productId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-500 font-bold">
                        {it.productSku}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{it.productName}</div>
                        {it.size && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                            Ukuran: {it.size}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 text-slate-700">
                          {it.category}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-medium text-purple-700">
                        {it.qtyIncluded}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-medium text-sky-700">
                        {it.qtyAddon}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-black text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {it.qtyTotal} unit
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(it.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <p className="font-medium leading-relaxed">
              Untuk melihat rincian pemotongan stok fisik barang per nomor transaksi pasien, filter per jenis celana/obat, dan ekspor cetak terpisah, buka modul <strong>Laporan Pengeluaran Stok</strong> melalui menu Keuangan atau tombol di bawah ini:
            </p>
            <div className="pt-1">
              <a
                href="#product-reports"
                onClick={(e) => {
                  e.preventDefault();
                  const event = new CustomEvent('navigate-to-menu', { detail: 'product-reports' });
                  window.dispatchEvent(event);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                <span>Buka Rincian Log Pengeluaran Stok & Filter Khusus</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
