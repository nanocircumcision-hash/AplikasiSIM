import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ProductCategory } from '../../types';
import {
  FileBarChart,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Filter,
  Calendar,
  CheckCircle2,
  Boxes,
  Layers,
  ArrowRight,
  Printer,
  Search,
  RefreshCw,
  Clock,
  User,
  Receipt,
  FileText,
  Percent,
  ExternalLink,
  FileSpreadsheet,
  Gift,
  Eye,
} from 'lucide-react';
import { NanoMasterLogo, PrintReportIcon } from '../common/PrintIcons';
import { ProductReportPrintModal } from './ProductReportPrintModal';
import {
  generateProductReportHtml,
  executeIframePrint,
} from '../../utils/productReportPrintHelper';
import { canViewRevenueAndProfit } from '../../utils/permissionUtils';

interface ProductReportItem {
  productId: number;
  productSku: string;
  productName: string;
  category: string;
  size?: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  qtyIncluded: number;
  qtyAddon: number;
  qtyManualOut?: number;
  qtyTotal: number;
  qtyDeducted?: number;
  qtyPending?: number;
  totalRevenue: number;
  totalCost: number;
  estimatedProfit: number;
}

interface ProductTransactionRecord {
  id: number | string;
  date: string;
  bookingDate?: string;
  procedureDate?: string;
  bookingId?: number | null;
  bookingNumber: string;
  invoiceNumber: string;
  patientName: string;
  patientAge: string;
  packageId?: number | null;
  packageName?: string;
  patientCategory?: string;
  packageDetail?: string;
  productId: number;
  productSku: string;
  productName: string;
  category: string;
  size?: string | null;
  itemType: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  discountAmount: number;
  totalAmount: number;
  isStockDeducted: boolean;
  deductedAt: string | Date | null;
  notes: string;
  performedBy?: string;
}

const getCelanaSize = (item: { category: string; productName?: string; productSku?: string; size?: string | null; notes?: string }): string | null => {
  const isCelana = item.category === 'CELANA_SUNAT' || (item.category as any) === 'CELANA' || (item.productName || '').toLowerCase().includes('celana');
  if (!isCelana) return null;
  if (item.size) return String(item.size).toUpperCase();
  const text = `${item.productName || ''} ${item.productSku || ''} ${item.notes || ''}`;
  const m = text.match(/ukuran\s*(XXL|XS|XL|S|M|L)\b/i) || text.match(/\b(XXL|XS|XL|S|M|L)\b/i);
  if (m) return m[1].toUpperCase();
  return 'M';
};

interface ProductReportSummary {
  totalItems: number;
  totalQtyDisbursed: number;
  totalQtyDeducted?: number;
  totalQtyPending?: number;
  totalQtyIncluded: number;
  totalQtyAddon: number;
  totalQtyManualOut?: number;
  totalRevenueAddons: number;
  totalProductHpp: number;
  totalGrossProfitAddons: number;
  totalTransactions?: number;
}

type PeriodMode = 'TODAY' | 'DAY' | 'MONTH' | 'CUSTOM' | 'ALL';
type ViewTab = 'REKAP' | 'TRANSAKSI' | 'ALL';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface ProductReportViewProps {
  onNavigate?: (view: string) => void;
}

export const ProductReportView: React.FC<ProductReportViewProps> = ({ onNavigate }) => {
  const { settings, currentUser, getHeaders, branches, activeBranchCode } = useClinic();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []); // 1-12

  // Period Filter State (Default to ALL so all recorded data is instantly visible)
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>(activeBranchCode || 'ALL');
  const [specificDate, setSpecificDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  const canSeeFinancials = canViewRevenueAndProfit(currentUser);

  // Category & Distribution Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItemType, setSelectedItemType] = useState<'ALL' | 'INCLUDED' | 'ADDON' | 'MANUAL_OUT'>('ALL');
  const [stockStatus, setStockStatus] = useState<'ALL' | 'DEDUCTED' | 'PENDING'>('ALL');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('ALL');
  const [packagesList, setPackagesList] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tab & Print View State
  const [activeTab, setActiveTab] = useState<ViewTab>('REKAP');
  const [printScope, setPrintScope] = useState<'ALL' | 'REKAP' | 'TRANSAKSI'>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Report Data State
  const [reportData, setReportData] = useState<{
    period: { startDate: string; endDate: string };
    summary: ProductReportSummary;
    items: ProductReportItem[];
    transactions: ProductTransactionRecord[];
    packages?: { id: number; name: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to compute date range from selected month & year
  const getMonthDateRange = (year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  };

  // Determine effective start and end dates
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodMode === 'TODAY') {
      return {
        startDate: todayStr,
        endDate: todayStr,
        periodLabel: `Hari Ini (${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })})`,
      };
    }
    if (periodMode === 'DAY') {
      const d = specificDate ? new Date(specificDate + 'T00:00:00') : new Date();
      return {
        startDate: specificDate,
        endDate: specificDate,
        periodLabel: `Harian: ${d.toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      };
    }
    if (periodMode === 'MONTH') {
      const { start, end } = getMonthDateRange(selectedYear, selectedMonth);
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Bulanan: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
      };
    }
    if (periodMode === 'CUSTOM') {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        periodLabel: `Rentang: ${customStartDate} s/d ${customEndDate}`,
      };
    }
    return {
      startDate: '',
      endDate: '',
      periodLabel: 'Semua Waktu (Kumulatif)',
    };
  }, [periodMode, specificDate, selectedMonth, selectedYear, customStartDate, customEndDate, todayStr]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedItemType !== 'ALL') params.append('itemType', selectedItemType);
      if (selectedPackageId !== 'ALL') params.append('packageId', selectedPackageId);
      if (stockStatus !== 'ALL') params.append('stockStatus', stockStatus);
      const effectiveBranch = selectedBranch || activeBranchCode || 'ALL';
      if (effectiveBranch) params.append('branchCode', effectiveBranch);

      const headers = getHeaders ? getHeaders(effectiveBranch) : {
        'Content-Type': 'application/json',
        'x-branch-code': effectiveBranch,
      };

      const res = await fetch(`/api/reports/products?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        if (data.packages && Array.isArray(data.packages)) {
          setPackagesList(data.packages);
        }
      }
    } catch (err) {
      console.error('Failed to load product sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, selectedCategory, selectedItemType, selectedPackageId, stockStatus, selectedBranch, activeBranchCode]);

  const handleOpenPreviewModal = (scope: 'ALL' | 'REKAP' | 'TRANSAKSI' = 'ALL') => {
    setPrintScope(scope);
    setIsPrintModalOpen(true);
  };

  const handlePrint = (scope: 'ALL' | 'REKAP' | 'TRANSAKSI' = 'ALL') => {
    handleOpenPreviewModal(scope);
  };

  const handleDirectPrint = (scope: 'ALL' | 'REKAP' | 'TRANSAKSI' = 'ALL') => {
    if (!reportData) {
      handleOpenPreviewModal(scope);
      return;
    }
    try {
      const html = generateProductReportHtml({
        reportData: {
          summary: reportData.summary,
          items: filteredItems as any,
          transactions: filteredTransactions as any,
          period: reportData.period,
        },
        settings,
        currentUser,
        periodLabel,
        selectedCategory,
        selectedItemType,
        scope,
      });
      executeIframePrint(html);
    } catch (err) {
      console.warn('Iframe print error, falling back to modal preview:', err);
      handleOpenPreviewModal(scope);
    }
  };

  const summary = reportData?.summary || {
    totalItems: 0,
    totalQtyDisbursed: 0,
    totalQtyIncluded: 0,
    totalQtyAddon: 0,
    totalRevenueAddons: 0,
    totalProductHpp: 0,
    totalGrossProfitAddons: 0,
    totalTransactions: 0,
  };

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!reportData?.items) return [];
    if (!searchQuery.trim()) return reportData.items;
    const q = searchQuery.toLowerCase();
    return reportData.items.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.productSku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [reportData?.items, searchQuery]);

  // Filter transaction records by search query
  const filteredTransactions = useMemo(() => {
    if (!reportData?.transactions) return [];
    if (!searchQuery.trim()) return reportData.transactions;
    const q = searchQuery.toLowerCase();
    return reportData.transactions.filter(
      (txn) =>
        txn.productName.toLowerCase().includes(q) ||
        txn.productSku.toLowerCase().includes(q) ||
        txn.patientName.toLowerCase().includes(q) ||
        (txn.packageName && txn.packageName.toLowerCase().includes(q)) ||
        (txn.patientCategory && txn.patientCategory.toLowerCase().includes(q)) ||
        txn.bookingNumber.toLowerCase().includes(q) ||
        txn.invoiceNumber.toLowerCase().includes(q)
    );
  }, [reportData?.transactions, searchQuery]);

  const marginPercentage = useMemo(() => {
    if (summary.totalRevenueAddons <= 0) return 0;
    return Math.round((summary.totalGrossProfitAddons / summary.totalRevenueAddons) * 100);
  }, [summary.totalRevenueAddons, summary.totalGrossProfitAddons]);

  const formatMoney = (amount: number) => {
    if (!canSeeFinancials) return 'Rp •••••••• (Terkunci)';
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Background Page Content: Hidden during print when modal is open to avoid duplicate sheets */}
      <div className={`space-y-6 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {/* ========================================================================= */}
        {/* PRINTABLE OFFICIAL KOP SURAT (Only visible in Print)                      */}
        {/* ========================================================================= */}
        <div className="hidden print:block mb-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <NanoMasterLogo
              src={settings.logoUrl}
              height={52}
              width={68}
              className="max-h-[52px] max-w-[68px] object-contain print-kop-logo"
            />
            <div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                {settings.clinicName || 'NANO CIRCUMCISION CLINIC'}
              </h1>
              <p className="text-xs font-bold text-slate-800">
                {settings.tagline || 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {settings.address} • Telp/WA: {settings.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded">
              LAPORAN PENGELUARAN STOK
            </span>
            <div className="text-[11px] font-bold text-slate-800 mt-1">
              Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}
            </div>
            <div className="text-[10px] text-slate-500">
              Petugas: {currentUser?.name || currentUser?.email || 'Admin'}
            </div>
          </div>
        </div>

        {/* Title and Metadata Header in Print */}
        <div className="text-center my-3">
          <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
            LAPORAN PENJUALAN &amp; PENGELUARAN STOK BARANG
          </h2>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-700 mt-1">
            <span>Periode: <strong className="text-slate-950">{periodLabel}</strong></span>
            <span>•</span>
            <span>Kategori: <strong className="text-slate-950">{selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory.replace('_', ' ')}</strong></span>
            <span>•</span>
            <span>Tipe: <strong className="text-slate-950">{selectedItemType === 'ALL' ? 'Semua (Included + Add-on)' : selectedItemType === 'ADDON' ? 'Hanya Add-on Penjualan' : 'Included Paket'}</strong></span>
          </div>
        </div>

        {/* Print KPI Summary Strip */}
        <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 bg-slate-50 border border-slate-300 rounded text-center">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Total Fisik Keluar</div>
            <div className="text-sm font-black text-slate-900">
              {summary.totalQtyDisbursed.toLocaleString('id-ID')} unit
            </div>
            <div className="text-[9px] text-slate-500">
              Inc: {summary.totalQtyIncluded} | Add: {summary.totalQtyAddon}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Omzet Penjualan Add-on</div>
            <div className="text-sm font-black text-sky-950">
              {formatMoney(summary.totalRevenueAddons)}
            </div>
            <div className="text-[9px] text-slate-500">Dari {summary.totalQtyAddon} unit produk</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Total HPP Modal Barang</div>
            <div className="text-sm font-black text-slate-900">
              {formatMoney(summary.totalProductHpp)}
            </div>
            <div className="text-[9px] text-slate-500">Beban modal keluar</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Laba Kotor Add-on</div>
            <div className="text-sm font-black text-emerald-950">
              {formatMoney(summary.totalGrossProfitAddons)}
            </div>
            <div className="text-[9px] text-emerald-800 font-bold">Margin: {canSeeFinancials ? `${marginPercentage}%` : '••%'}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER & ACTION BUTTONS (Hidden in Print)                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-emerald-700" />
              Laporan Pengeluaran Stok
            </span>
            <span className="text-xs font-semibold text-slate-500">
              PostgreSQL Cloud SQL • Real-Time Logistik
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Laporan Pengeluaran Stok &amp; Pemakaian Barang
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rekapitulasi lengkap pengeluaran stok fisik barang (pemakaian paket khitan, penjualan kasir add-on, dan mutasi operasional klinik) dengan rincian HPP modal dan status potong stok.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('products')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-slate-600" />
              Kelola Stok Barang
            </button>
          )}

          {/* Tombol Cetak Utama: Direct Print A4 Resmi */}
          <button
            type="button"
            id="btn-direct-print-product-report"
            onClick={() => handleDirectPrint('ALL')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/30"
            title="Cetak langsung dokumen resmi A4 (Print / PDF)"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Laporan Resmi (A4)</span>
          </button>

          {/* Pratinjau & Pilihan Cetak Khusus */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              id="btn-print-product-report"
              onClick={() => handleOpenPreviewModal('ALL')}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-l-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Buka pratinjau dan opsi cetak laporan pengeluaran stok A4"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Pratinjau &amp; Opsi</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectPrint('REKAP')}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-l border-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Cetak Cepat Rekapitulasi Produk Saja"
            >
              Cetak Rekap
            </button>
            <button
              type="button"
              onClick={() => handleDirectPrint('TRANSAKSI')}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-l border-slate-700 rounded-r-xl text-xs font-bold transition-all cursor-pointer"
              title="Cetak Cepat Log Rincian Transaksi Saja"
            >
              Cetak Rincian
            </button>
          </div>

          {/* Direct CSV Download */}
          <button
            type="button"
            id="btn-quick-export-csv"
            onClick={() => handleOpenPreviewModal('ALL')}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Buka dialog ekspor atau cetak"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={fetchReport}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Segarkan Data Laporan"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PERIOD FILTER SELECTION BAR (Per Hari / Per Bulan / Kustom)               */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 no-print">
        {/* Row 1: Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-700" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Pilihan Periode Pengeluaran Stok:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setPeriodMode('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'TODAY'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('DAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'DAY'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pilih Hari
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodMode('MONTH');
                setSelectedMonth(currentMonth);
                setSelectedYear(currentYear);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'MONTH' && selectedMonth === currentMonth && selectedYear === currentYear
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'MONTH'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pilih Bulan
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'CUSTOM'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rentang Tanggal
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'ALL'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Waktu
            </button>
          </div>
        </div>

        {/* Row 2: Dynamic Inputs depending on selected period mode */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Period-specific inputs */}
          <div className="flex flex-wrap items-center gap-3">
            {periodMode === 'TODAY' && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>Pengeluaran stok barang hari ini: <strong>{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</strong></span>
              </div>
            )}

            {periodMode === 'DAY' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {periodMode === 'MONTH' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-bold text-slate-600 ml-1">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodMode === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Dari:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-xs font-bold text-slate-600">Sampai:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {periodMode === 'ALL' && (
              <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl">
                Menampilkan seluruh rekapitulasi data pengeluaran stok barang dari awal klinik beroperasi.
              </div>
            )}
          </div>

          {/* Secondary Filters: Category, Distribution Type, Stock Status, Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="report-filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="OBAT">Obat Oral &amp; Salep</option>
                <option value="OBAT_TETES">Obat Tetes Khitan</option>
                <option value="CELANA_SUNAT">Celana Sunat</option>
                <option value="AKSESORIS">Aksesoris &amp; Medali</option>
                <option value="MAINAN">Mainan Anak</option>
                <option value="LAINNYA">Produk Lainnya</option>
              </select>
            </div>

            {/* Filter Paket Sunat */}
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <select
                id="report-filter-package"
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[150px] truncate"
              >
                <option value="ALL">Semua Paket</option>
                {packagesList.map((pkg) => (
                  <option key={pkg.id} value={String(pkg.id)}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tipe Distribusi */}
            <div className="flex items-center gap-1.5">
              <select
                id="report-filter-itemtype"
                value={selectedItemType}
                onChange={(e) => setSelectedItemType(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Semua Pengeluaran</option>
                <option value="INCLUDED">Termasuk Paket (Included)</option>
                <option value="ADDON">Penjualan Kasir (Add-on)</option>
                <option value="MANUAL_OUT">Mutasi Keluar Gudang</option>
              </select>
            </div>

            {/* Filter Status Potong Stok */}
            <div className="flex items-center gap-1.5">
              <select
                id="report-filter-stock-status"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Semua Status Fisik</option>
                <option value="DEDUCTED">✓ Terpotong Keluar</option>
                <option value="PENDING">⏳ Pending Tindakan</option>
              </select>
            </div>

            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Segarkan Data Laporan"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KPI METRIC CARDS                                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 no-print">
        {/* Total Unit Keluar */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Fisik Keluar</p>
            <Boxes className="w-5 h-5 text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {summary.totalQtyDisbursed.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-semibold text-slate-400">unit</span>
          </h3>
          <div className="mt-2 flex items-center justify-between text-[10.5px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
            <span className="text-emerald-700">✓ {summary.totalQtyDeducted ?? summary.totalQtyDisbursed} Terpotong</span>
            {(summary.totalQtyPending ?? 0) > 0 && (
              <span className="text-amber-600 font-bold">{summary.totalQtyPending} Pending</span>
            )}
          </div>
        </div>

        {/* Barang Paket Sunat (Hak Pasien - Potong Stok) */}
        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Item Paket Sunat</p>
            <Gift className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-950 mt-2">
            {summary.totalQtyIncluded.toLocaleString('id-ID')}{' '}
            <span className="text-xs font-semibold text-emerald-600">unit</span>
          </h3>
          <p className="text-[10.5px] text-emerald-700 font-medium mt-1">
            Obat, celana, mainan, sertifikat hak pasien paket khitan
          </p>
        </div>

        {/* Pendapatan Penjualan Add-on */}
        <div className="bg-white p-4.5 rounded-2xl border border-sky-200 shadow-sm bg-gradient-to-br from-sky-50/50 to-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Penjualan Kasir (Add-on)</p>
            <ShoppingBag className="w-5 h-5 text-sky-700" />
          </div>
          <h3 className="text-2xl font-black text-sky-950 mt-2">
            {formatMoney(summary.totalRevenueAddons)}
          </h3>
          <p className="text-[10.5px] text-sky-700 font-medium mt-1">
            {summary.totalQtyAddon} unit produk tambahan terjual di kasir
          </p>
        </div>

        {/* Total Modal HPP Barang */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beban Modal HPP</p>
            <DollarSign className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {formatMoney(summary.totalProductHpp)}
          </h3>
          <p className="text-[10.5px] text-slate-500 font-medium mt-1">
            Total nilai modal barang yang telah keluar klinik
          </p>
        </div>

        {/* Laba Kotor Add-on */}
        <div className="bg-white p-4.5 rounded-2xl border border-teal-200 shadow-sm bg-gradient-to-br from-teal-50/60 to-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Laba Kotor Add-on</p>
            <TrendingUp className="w-5 h-5 text-teal-700" />
          </div>
          <h3 className="text-2xl font-black text-teal-950 mt-2">
            {formatMoney(summary.totalGrossProfitAddons)}
          </h3>
          <div className="mt-1 flex items-center justify-between text-[11px] text-teal-800 font-semibold">
            <span>Margin Keuntungan</span>
            <span className="px-1.5 py-0.5 bg-teal-100 rounded text-teal-900 font-bold">
              {canSeeFinancials ? `${marginPercentage}%` : '••%'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB SWITCHER & SEARCH BAR (Screen View Only)                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        {/* Tabs */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('REKAP')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'REKAP'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBarChart className="w-4 h-4 text-sky-700" />
            <span>Rekapitulasi Per Produk ({filteredItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRANSAKSI')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TRANSAKSI'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-700" />
            <span>Rincian Transaksi ({filteredTransactions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-700" />
            <span>Tampilkan Keduanya</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk, SKU, pasien, no booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TABEL REKAPITULASI PER PRODUK                                 */}
      {/* ========================================================================= */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${
        activeTab === 'REKAP' || activeTab === 'ALL' ? '' : 'hidden'
      } ${
        printScope === 'TRANSAKSI' ? 'print:hidden' : 'print:block print:border-none print:shadow-none'
      }`}>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 print:bg-white print:border-b-2 print:border-slate-900 print:px-0">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <FileBarChart className="w-4 h-4 text-sky-700 no-print" />
              1. Rekapitulasi Pemakaian &amp; Penjualan Produk (SKU)
            </h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Periode: {periodLabel}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-slate-950 print:border-slate-900">
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Nama Produk &amp; Kategori</th>
                  <th className="py-2.5 px-2 text-center">Qty Included</th>
                  <th className="py-2.5 px-2 text-center">Qty Add-on</th>
                  <th className="py-2.5 px-2 text-center">Total Fisik</th>
                  <th className="py-2.5 px-3 text-right">Harga Modal / Jual</th>
                  <th className="py-2.5 px-3 text-right">Total Omzet Add-on</th>
                  <th className="py-2.5 px-3 text-right">Total HPP Modal</th>
                  <th className="py-2.5 px-3 text-right">Laba Add-on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 print:divide-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      <p className="text-xs font-bold">Menghubungkan ke Cloud SQL &amp; memproses data produk...</p>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">
                        Tidak ada aktivitas penjualan produk untuk periode &amp; filter yang dipilih
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent">
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-900 print:text-black">
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] print:bg-transparent print:border-none print:p-0">
                          {item.productSku}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        {(() => {
                          const celanaSize = getCelanaSize(item);
                          return (
                            <>
                              <div className="font-bold text-slate-900 print:text-black flex items-center gap-1.5 flex-wrap">
                                <span>{item.productName}</span>
                                {celanaSize && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 print:border-slate-800 print:bg-slate-100 print:text-black">
                                    Ukuran {celanaSize}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{item.category.replace('_', ' ')}</span>
                                {celanaSize && (
                                  <span className="text-purple-700 font-bold print:text-black">• Ukuran: {celanaSize}</span>
                                )}
                                <span>• Sisa Stok: {item.currentStock} {item.unit}</span>
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold print:border-none print:bg-transparent print:text-black">
                          {item.qtyIncluded} {item.unit}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-xs font-bold print:border-none print:bg-transparent print:text-black">
                          {item.qtyAddon} {item.unit}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-black text-slate-900 print:text-black">
                        {item.qtyTotal} {item.unit}
                      </td>

                      <td className="py-2.5 px-3 text-right text-[11px]">
                        <div className="text-slate-500 print:text-slate-700 font-medium">
                          HPP: {canSeeFinancials ? `Rp ${item.costPrice.toLocaleString('id-ID')}` : '••••'}
                        </div>
                        <div className="font-bold text-slate-900 print:text-black">
                          Jual: Rp {item.sellPrice.toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-sky-950 print:text-black">
                        {canSeeFinancials ? `Rp ${item.totalRevenue.toLocaleString('id-ID')}` : '••••'}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600 print:text-black font-medium">
                        {canSeeFinancials ? `Rp ${item.totalCost.toLocaleString('id-ID')}` : '••••'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span className="font-black text-emerald-700 print:text-black">
                          {canSeeFinancials ? `Rp ${item.estimatedProfit.toLocaleString('id-ID')}` : '••••'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {filteredItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300 text-xs print:bg-slate-200 print:border-slate-900">
                    <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-[11px]">
                      TOTAL REKAPITULASI
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-800 print:text-black">
                      {summary.totalQtyIncluded}
                    </td>
                    <td className="py-3 px-2 text-center text-sky-800 print:text-black">
                      {summary.totalQtyAddon}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-900 print:text-black">
                      {summary.totalQtyDisbursed}
                    </td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right text-sky-950 print:text-black text-sm">
                      {formatMoney(summary.totalRevenueAddons)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800 print:text-black text-sm">
                      {formatMoney(summary.totalProductHpp)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-800 print:text-black text-sm">
                      {formatMoney(summary.totalGrossProfitAddons)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* SECTION 2: TABEL RINCIAN BUKU TRANSAKSI PENJUALAN STOK                    */}
      {/* ========================================================================= */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${
        activeTab === 'TRANSAKSI' || activeTab === 'ALL' ? '' : 'hidden'
      } ${
        printScope === 'REKAP' ? 'print:hidden' : 'print:block print:border-none print:shadow-none print:mt-6'
      }`}>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 print:bg-white print:border-b-2 print:border-slate-900 print:px-0">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-700 no-print" />
              2. Buku Log Rincian Transaksi Penjualan Barang
            </h3>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total: {filteredTransactions.length} Transaksi Terdata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-slate-950 print:border-slate-900">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">No. Booking / Inv</th>
                  <th className="py-2.5 px-3">Nama Pasien</th>
                  <th className="py-2.5 px-3">Paket Sunat</th>
                  <th className="py-2.5 px-3">Nama Produk &amp; SKU</th>
                  <th className="py-2.5 px-2 text-center">Tipe</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga Jual</th>
                  <th className="py-2.5 px-3 text-right">Total Bayar</th>
                  <th className="py-2.5 px-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 print:divide-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <p className="text-xs font-bold">Memuat rincian transaksi penjualan...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p className="font-semibold text-slate-600">
                        Belum ada riwayat transaksi penjualan barang pada periode ini
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent">
                      <td className="py-2.5 px-3 font-medium whitespace-nowrap text-slate-900 print:text-black">
                        {txn.date}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 print:text-black">
                        <div>{txn.bookingNumber}</div>
                        {txn.invoiceNumber !== '-' && (
                          <div className="text-[10px] text-slate-400 print:text-slate-600">{txn.invoiceNumber}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900 print:text-black">
                        <div>{txn.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{txn.patientAge}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-xs">{txn.packageName || 'Paket Sunat'}</div>
                        {txn.patientCategory && (
                          <span className="text-[10px] text-sky-700 font-semibold">{txn.patientCategory}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {(() => {
                          const celanaSize = getCelanaSize(txn);
                          return (
                            <>
                              <div className="font-bold text-slate-900 print:text-black flex items-center gap-1.5 flex-wrap">
                                <span>{txn.productName}</span>
                                {celanaSize && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 print:border-slate-800 print:bg-slate-100 print:text-black">
                                    Ukuran {celanaSize}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 print:text-slate-600 flex items-center gap-1.5 flex-wrap">
                                <span>{txn.productSku} • {txn.category.replace('_', ' ')}</span>
                                {celanaSize && (
                                  <span className="font-sans font-bold text-purple-700 print:text-black">• Ukuran: {celanaSize}</span>
                                )}
                              </div>
                              {txn.notes && (
                                <div className="text-[9.5px] text-slate-500 italic mt-0.5 max-w-xs truncate">{txn.notes}</div>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            txn.itemType === 'ADDON'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200 print:border-none print:bg-transparent print:text-black'
                              : txn.itemType === 'MANUAL_OUT'
                              ? 'bg-amber-50 text-amber-900 border border-amber-200 print:border-none print:bg-transparent print:text-black'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-none print:bg-transparent print:text-black'
                          }`}
                        >
                          {txn.itemType === 'ADDON' ? 'Add-on' : txn.itemType === 'MANUAL_OUT' ? '📦 Mutasi Keluar' : '🎁 Paket'}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 text-center font-bold text-slate-900 print:text-black">
                        {txn.quantity} {txn.unit}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-800 print:text-black">
                        {txn.itemType === 'ADDON' ? (
                          `Rp ${txn.sellPrice.toLocaleString('id-ID')}`
                        ) : txn.itemType === 'MANUAL_OUT' ? (
                          <span className="text-amber-800 font-semibold text-[11px]">Operasional Klinik</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">Termasuk Paket</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-sky-950 print:text-black">
                        {txn.itemType === 'ADDON' ? (
                          `Rp ${txn.totalAmount.toLocaleString('id-ID')}`
                        ) : txn.itemType === 'MANUAL_OUT' ? (
                          <span className="text-amber-800 font-bold text-[11px]">Rp 0 (Mutasi)</span>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">Rp 0 (Paket)</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            txn.isStockDeducted
                              ? 'bg-emerald-50 text-emerald-800 print:bg-transparent print:text-black'
                              : 'bg-amber-50 text-amber-800 print:bg-transparent print:text-black'
                          }`}
                        >
                          {txn.isStockDeducted ? `✓ Terpotong (-${txn.quantity})` : 'Pending Tindakan'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* PRINT OFFICIAL SIGNATURE BLOCK (Only visible in Print)                    */}
      {/* ========================================================================= */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          {/* Kolom Kiri: Petugas Farmasi / Logistik */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <div className="font-medium text-slate-700">Dibuat &amp; Dilaporkan Oleh,</div>
              <div className="font-bold text-slate-900 mt-0.5">Petugas Farmasi / Logistik / Kasir</div>
            </div>
            <div>
              <div className="font-bold text-slate-950 underline">
                ( {currentUser?.name || currentUser?.email || '...........................................'} )
              </div>
              <div className="text-[10px] text-slate-500">Staf Penanggung Jawab Inventaris</div>
            </div>
          </div>

          {/* Kolom Kanan: Pimpinan / Dokter Penanggung Jawab */}
          <div className="flex flex-col justify-between h-32">
            <div>
              <div className="font-medium text-slate-700">
                {settings.clinicName ? settings.clinicName.split(' ')[0] : 'Klinik'}, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </div>
              <div className="font-bold text-slate-900 mt-0.5">Dokter Penanggung Jawab / Pimpinan Klinik</div>
            </div>
            <div>
              <div className="font-bold text-slate-950 underline">
                ( dr. ................................................... )
              </div>
              <div className="text-[10px] text-slate-500">SIP / NIP Penanggung Jawab</div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT PREVIEW & HIGH-FIDELITY PRINT MODAL                                */}
      {/* ========================================================================= */}
      <ProductReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportData={reportData}
        settings={settings}
        currentUser={currentUser}
        periodLabel={periodLabel}
        selectedCategory={selectedCategory}
        selectedItemType={selectedItemType}
        initialScope={printScope}
      />
    </div>
  );
};
