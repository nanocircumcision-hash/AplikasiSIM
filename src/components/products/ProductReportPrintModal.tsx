import React, { useState } from 'react';
import {
  Printer,
  ExternalLink,
  FileSpreadsheet,
  X,
  ShoppingBag,
  Package,
  Boxes,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { NanoMasterLogo } from '../common/PrintIcons';
import { formatRupiah, formatDateIndo } from '../../utils/helpers';
import {
  generateProductReportHtml,
  executeIframePrint,
  openReportInNewTab,
} from '../../utils/productReportPrintHelper';

export interface ProductReportPrintItem {
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
  qtyTotal: number;
  totalRevenue: number;
  totalCost: number;
  estimatedProfit: number;
}

export interface ProductReportPrintTransaction {
  id: number | string;
  date: string;
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
}

const getCelanaSize = (item: { category: string; productName?: string; productSku?: string; size?: string | null; notes?: string }): string | null => {
  const isCelana = item.category === 'CELANA_SUNAT' || (item.category as any) === 'CELANA' || (item.productName || '').toLowerCase().includes('celana');
  if (!isCelana) return null;
  if (item.size) return String(item.size).toUpperCase();
  const text = `${item.productName || ''} ${item.productSku || ''} ${item.notes || ''}`;
  const m = text.match(/ukuran\s*([a-zA-Z]+)/i) || text.match(/\b(XS|XL|S|M|L)\b/i);
  if (m) return m[1].toUpperCase();
  return 'M';
};

export interface ProductReportPrintSummary {
  totalItems: number;
  totalQtyDisbursed: number;
  totalQtyIncluded: number;
  totalQtyAddon: number;
  totalRevenueAddons: number;
  totalProductHpp: number;
  totalGrossProfitAddons: number;
  totalTransactions?: number;
}

interface ProductReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    period: { startDate: string; endDate: string };
    summary: ProductReportPrintSummary;
    items: ProductReportPrintItem[];
    transactions: ProductReportPrintTransaction[];
  } | null;
  settings: {
    clinicName?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    email?: string;
  };
  currentUser: {
    name?: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
  periodLabel: string;
  selectedCategory: string;
  selectedItemType: string;
  initialScope?: 'ALL' | 'REKAP' | 'TRANSAKSI';
}

export const ProductReportPrintModal: React.FC<ProductReportPrintModalProps> = ({
  isOpen,
  onClose,
  reportData,
  settings,
  currentUser,
  periodLabel,
  selectedCategory,
  selectedItemType,
  initialScope = 'ALL',
}) => {
  const [scope, setScope] = useState<'ALL' | 'REKAP' | 'TRANSAKSI'>(initialScope);

  if (!isOpen || !reportData) return null;

  const { summary, items, transactions, period } = reportData;
  const clinicName = settings?.clinicName || 'NANO CIRCUMCISION CLINIC';
  const tagline = (settings?.tagline && settings.tagline !== 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit' && settings.tagline !== 'Pusat Sunat Canggih & Modern Tanpa Jahit') ? settings.tagline : 'Sunat Canggih & Modern';
  const address = settings?.address || 'Ruko Khayangan Nomor RB-16 Bangkalan';
  const phone = settings?.phone || '085236069788';
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const userName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Admin Logistik';

  const marginPct =
    summary.totalRevenueAddons > 0
      ? Math.round((summary.totalGrossProfitAddons / summary.totalRevenueAddons) * 100)
      : 0;

  // Direct print trigger using isolated iframe with window.print fallback
  const handlePrint = () => {
    try {
      const html = generateProductReportHtml({
        reportData: { summary, items: items as any, transactions: transactions as any, period },
        settings,
        currentUser,
        periodLabel,
        selectedCategory,
        selectedItemType,
        scope,
      });
      executeIframePrint(html);
    } catch (err) {
      console.warn('Iframe print error, falling back to window.print():', err);
      window.print();
    }
  };

  // Open standalone HTML in new tab to bypass iframe sandbox limits
  const handleOpenInNewTab = () => {
    const html = generateProductReportHtml({
      reportData: { summary, items: items as any, transactions: transactions as any, period },
      settings,
      currentUser,
      periodLabel,
      selectedCategory,
      selectedItemType,
      scope,
    });
    openReportInNewTab(html);
  };

  // CSV Export for Excel
  const handleExportCsv = () => {
    const rows: string[][] = [];

    rows.push(['KLINIK', clinicName]);
    rows.push(['LAPORAN', 'LAPORAN PENJUALAN & PENGELUARAN STOK BARANG']);
    rows.push(['PERIODE', periodLabel]);
    rows.push(['KATEGORI', selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory]);
    rows.push(['TIPE DISTRIBUSI', selectedItemType === 'ALL' ? 'Semua (Included + Add-on)' : selectedItemType]);
    rows.push(['WAKTU CETAK', printDateStr]);
    rows.push(['PETUGAS', userName]);
    rows.push([]);

    rows.push(['RINGKASAN INDIKATOR PENJUALAN STOK']);
    rows.push(['Total Fisik Keluar (Unit)', String(summary.totalQtyDisbursed)]);
    rows.push(['Qty Included Paket (Unit)', String(summary.totalQtyIncluded)]);
    rows.push(['Qty Add-on Berbayar (Unit)', String(summary.totalQtyAddon)]);
    rows.push(['Total Omzet Penjualan Add-on (Rp)', String(summary.totalRevenueAddons)]);
    rows.push(['Total Beban Modal HPP (Rp)', String(summary.totalProductHpp)]);
    rows.push(['Total Laba Kotor Add-on (Rp)', String(summary.totalGrossProfitAddons)]);
    rows.push(['Margin Laba Kotor Add-on (%)', `${marginPct}%`]);
    rows.push([]);

    if (scope === 'ALL' || scope === 'REKAP') {
      rows.push(['I. REKAPITULASI PENJUALAN PER PRODUK (SKU)']);
      rows.push([
        'No',
        'Kode SKU',
        'Nama Produk',
        'Ukuran',
        'Kategori',
        'Satuan',
        'Stok Sisa',
        'Qty Included',
        'Qty Add-on',
        'Total Qty Keluar',
        'HPP Modal (Rp)',
        'Harga Jual (Rp)',
        'Total Omzet Add-on (Rp)',
        'Total Beban HPP (Rp)',
        'Laba Kotor Add-on (Rp)',
      ]);

      items.forEach((item, idx) => {
        const celanaSize = getCelanaSize(item);
        rows.push([
          String(idx + 1),
          item.productSku,
          item.productName,
          celanaSize ? `Ukuran ${celanaSize}` : '-',
          item.category,
          item.unit,
          String(item.currentStock),
          String(item.qtyIncluded),
          String(item.qtyAddon),
          String(item.qtyTotal),
          String(item.costPrice),
          String(item.sellPrice),
          String(item.totalRevenue),
          String(item.totalCost),
          String(item.estimatedProfit),
        ]);
      });
      rows.push([]);
    }

    if (scope === 'ALL' || scope === 'TRANSAKSI') {
      rows.push(['II. BUKU RINCIAN TRANSAKSI PENJUALAN / PENGELUARAN']);
      rows.push([
        'No',
        'Tanggal Transaksi',
        'No. Booking',
        'No. Invoice',
        'Nama Pasien',
        'Usia',
        'Paket Sunat',
        'Kategori Pasien',
        'Kode SKU',
        'Nama Produk',
        'Ukuran',
        'Kategori',
        'Tipe Distribusi',
        'Qty',
        'Satuan',
        'Harga Satuan (Rp)',
        'Diskon (Rp)',
        'Total Tagihan (Rp)',
        'Status Potong Stok',
      ]);

      transactions.forEach((txn, idx) => {
        const celanaSize = getCelanaSize(txn);
        rows.push([
          String(idx + 1),
          txn.date,
          txn.bookingNumber,
          txn.invoiceNumber,
          txn.patientName,
          txn.patientAge || '-',
          txn.packageName || 'Paket Sunat',
          txn.patientCategory || 'Reguler',
          txn.productSku,
          txn.productName,
          celanaSize ? `Ukuran ${celanaSize}` : '-',
          txn.category,
          txn.itemType === 'ADDON'
            ? 'Add-on Berbayar'
            : txn.itemType === 'MANUAL_OUT'
            ? 'Mutasi Operasional Keluar'
            : 'Included Paket Sunat',
          String(txn.quantity),
          txn.unit,
          String(txn.sellPrice),
          String(txn.discountAmount || 0),
          String(txn.totalAmount),
          txn.isStockDeducted ? 'Terpotong Otomatis' : 'Belum Terpotong',
        ]);
      });
    }

    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '');
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Pengeluaran_Stok_${period.startDate || 'semua'}_${period.endDate || 'semua'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate standalone HTML string
  const generatePrintHtml = () => {
    const logoSrc = settings?.logoUrl || '/branding/logo-nano-circumcision.png';

    const itemsHtml = items
      .map(
        (it, idx) => {
          const celanaSize = getCelanaSize(it);
          const sizeBadge = celanaSize ? `<span style="display:inline-block; padding: 1px 5px; font-size: 8px; font-weight: bold; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; border-radius: 3px; margin-left: 4px;">Ukuran ${celanaSize}</span>` : '';
          return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: bold;">${it.productSku}</td>
        <td><strong>${it.productName}</strong> ${sizeBadge}</td>
        <td>${it.category}${celanaSize ? `<br/><span style="font-size: 8px; color: #6b21a8; font-weight: bold;">[Size ${celanaSize}]</span>` : ''}</td>
        <td style="text-align: center;">${it.currentStock} ${it.unit}</td>
        <td style="text-align: center;">${it.qtyIncluded}</td>
        <td style="text-align: center; font-weight: bold; color: #0284c7;">${it.qtyAddon}</td>
        <td style="text-align: center; font-weight: bold;">${it.qtyTotal}</td>
        <td style="text-align: right;">${formatRupiah(it.costPrice)}</td>
        <td style="text-align: right;">${it.sellPrice > 0 ? formatRupiah(it.sellPrice) : '-'}</td>
        <td style="text-align: right; font-weight: bold; color: #0369a1;">${formatRupiah(it.totalRevenue)}</td>
        <td style="text-align: right;">${formatRupiah(it.totalCost)}</td>
        <td style="text-align: right; font-weight: bold; color: ${it.estimatedProfit > 0 ? '#15803d' : '#334155'};">
          ${formatRupiah(it.estimatedProfit)}
        </td>
      </tr>
    `;
        }
      )
      .join('');

    const transactionsHtml = transactions
      .map(
        (t, idx) => {
          const celanaSize = getCelanaSize(t);
          const sizeBadge = celanaSize ? `<span style="display:inline-block; padding: 1px 5px; font-size: 8px; font-weight: bold; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; border-radius: 3px; margin-left: 4px;">Ukuran ${celanaSize}</span>` : '';
          return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="white-space: nowrap;">${t.date}</td>
        <td style="font-family: monospace; font-size: 9px;">${t.bookingNumber}</td>
        <td style="font-family: monospace; font-size: 9px; font-weight: bold;">${t.invoiceNumber}</td>
        <td><strong>${t.patientName}</strong> <span style="font-size: 9px; color: #64748b;">(${t.patientAge || '-'})</span></td>
        <td style="font-size: 9px;">
          <strong>${t.packageName || 'Paket Sunat'}</strong>
          ${t.patientCategory ? `<br/><span style="color: #0284c7; font-weight: bold; font-size: 8px;">${t.patientCategory}</span>` : ''}
        </td>
        <td><strong>${t.productName}</strong> ${sizeBadge}<br/><span style="font-size: 8px; color: #64748b;">${t.productSku}${celanaSize ? ` • Ukuran ${celanaSize}` : ''}</span></td>
        <td style="text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 8.5px; border-radius: 4px; font-weight: bold; ${
            t.itemType === 'ADDON'
              ? 'background: #e0f2fe; color: #0369a1;'
              : t.itemType === 'MANUAL_OUT'
              ? 'background: #fef3c7; color: #92400e;'
              : 'background: #dcfce7; color: #166534;'
          }">
            ${t.itemType === 'ADDON' ? 'Add-on Berbayar' : t.itemType === 'MANUAL_OUT' ? '📦 Mutasi Keluar' : '🎁 Paket Sunat'}
          </span>
        </td>
        <td style="text-align: center; font-weight: bold;">${t.quantity} ${t.unit}</td>
        <td style="text-align: right;">${t.itemType === 'ADDON' ? formatRupiah(t.sellPrice) : t.itemType === 'MANUAL_OUT' ? '<span style="color: #92400e;">Operasional</span>' : '<span style="color: #166534; font-weight: bold;">Termasuk Paket</span>'}</td>
        <td style="text-align: right; font-weight: bold;">${t.itemType === 'ADDON' ? formatRupiah(t.totalAmount) : t.itemType === 'MANUAL_OUT' ? '<span style="color: #92400e;">Rp 0 (Mutasi)</span>' : '<span style="color: #166534; font-weight: bold;">Rp 0 (Paket)</span>'}</td>
        <td style="text-align: center; font-size: 9px; ${t.isStockDeducted ? 'color: #166534; font-weight: bold;' : 'color: #854d0e;'}">
          ${t.isStockDeducted ? '✓ Terpotong' : 'Menunggu'}
        </td>
      </tr>
    `;
        }
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Laporan Pengeluaran Stok - ${clinicName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 12px;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.35;
    }
    .no-print {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: #0f172a; color: #ffffff; }
    .btn-primary:hover { background: #1e293b; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-secondary:hover { background: #cbd5e1; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; }
    }
    .header-kop {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      gap: 16px;
    }
    .clinic-logo {
      max-height: 52px;
      max-width: 68px;
      object-fit: contain;
    }
    .clinic-name {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.1;
    }
    .clinic-tagline {
      font-size: 10px;
      font-weight: bold;
      color: #0369a1;
      margin: 2px 0;
    }
    .clinic-address {
      font-size: 9.5px;
      color: #475569;
      margin: 0;
    }
    .report-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #0f172a;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.5px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .report-title {
      text-align: center;
      margin: 10px 0 6px 0;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-align: center;
    }
    .kpi-title { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .kpi-sub { font-size: 8.5px; color: #64748b; margin-top: 1px; }
    .section-heading {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      background: #f1f5f9;
      padding: 4px 8px;
      border-left: 3px solid #0f172a;
      margin: 12px 0 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 6px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #0f172a;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .tfoot-total {
      background: #e2e8f0 !important;
      font-weight: bold;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-space { height: 48px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
    .sig-role { font-size: 9px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="font-size: 13px;">Pratinjau Siap Cetak (A4 Resmi)</strong>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Klik tombol cetak di samping untuk membuka dialog print browser atau simpan sebagai file PDF.
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Cetak Dokumen / Simpan PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✖ Tutup Halaman Ini
      </button>
    </div>
  </div>

  <div class="header-kop">
    <div style="display: flex; align-items: center; gap: 12px;">
      <img src="${logoSrc}" alt="Logo" class="clinic-logo" onerror="this.style.display='none'" />
      <div>
        <h1 class="clinic-name">${clinicName}</h1>
        <div class="clinic-tagline">${tagline}</div>
        <div class="clinic-address">${address} • Telp/WA: ${phone}</div>
      </div>
    </div>
    <div style="text-align: right;">
      <span class="report-badge">LAPORAN PENGELUARAN STOK RESMI</span>
      <div style="font-size: 9.5px; font-weight: bold; margin-top: 4px;">Tanggal Cetak: ${printDateStr}</div>
      <div style="font-size: 9px; color: #64748b;">Petugas: ${userName}</div>
    </div>
  </div>

  <div class="report-title">LAPORAN PENGELUARAN STOK &amp; PEMAKAIAN BARANG</div>
  <div class="report-meta">
    <span>Periode: <strong>${periodLabel}</strong></span>
    <span>•</span>
    <span>Kategori: <strong>${selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory}</strong></span>
    <span>•</span>
    <span>Tipe: <strong>${selectedItemType === 'ALL' ? 'Semua (Included + Add-on)' : selectedItemType === 'ADDON' ? 'Hanya Add-on Penjualan' : 'Included Paket'}</strong></span>
  </div>

  <div class="kpi-grid">
    <div>
      <div class="kpi-title">Total Fisik Keluar</div>
      <div class="kpi-value">${summary.totalQtyDisbursed.toLocaleString('id-ID')} unit</div>
      <div class="kpi-sub">Inc: ${summary.totalQtyIncluded} | Add: ${summary.totalQtyAddon}</div>
    </div>
    <div>
      <div class="kpi-title">Omzet Penjualan Add-on</div>
      <div class="kpi-value" style="color: #0369a1;">${formatRupiah(summary.totalRevenueAddons)}</div>
      <div class="kpi-sub">Dari ${summary.totalQtyAddon} unit produk add-on</div>
    </div>
    <div>
      <div class="kpi-title">Total Beban HPP Modal</div>
      <div class="kpi-value">${formatRupiah(summary.totalProductHpp)}</div>
      <div class="kpi-sub">Beban modal keluar</div>
    </div>
    <div>
      <div class="kpi-title">Laba Kotor Add-on</div>
      <div class="kpi-value" style="color: #15803d;">${formatRupiah(summary.totalGrossProfitAddons)}</div>
      <div class="kpi-sub">Margin: ${marginPct}%</div>
    </div>
  </div>

  ${
    scope === 'ALL' || scope === 'REKAP'
      ? `
  <div class="section-heading">I. Rekapitulasi Penjualan Per Produk (SKU)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 24px; text-align: center;">No</th>
        <th>SKU</th>
        <th>Nama Produk</th>
        <th>Kategori</th>
        <th style="text-align: center;">Stok</th>
        <th style="text-align: center;">Inc</th>
        <th style="text-align: center;">Add</th>
        <th style="text-align: center;">Total</th>
        <th style="text-align: right;">HPP Modal</th>
        <th style="text-align: right;">Harga Jual</th>
        <th style="text-align: right;">Total Omzet</th>
        <th style="text-align: right;">Beban HPP</th>
        <th style="text-align: right;">Laba Kotor</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml || '<tr><td colspan="13" style="text-align: center; padding: 12px; color: #94a3b8;">Tidak ada produk keluar pada periode ini</td></tr>'}
    </tbody>
    <tfoot>
      <tr class="tfoot-total">
        <td colspan="5" style="text-align: right;">TOTAL:</td>
        <td style="text-align: center;">${summary.totalQtyIncluded}</td>
        <td style="text-align: center;">${summary.totalQtyAddon}</td>
        <td style="text-align: center;">${summary.totalQtyDisbursed}</td>
        <td colspan="2"></td>
        <td style="text-align: right; color: #0369a1;">${formatRupiah(summary.totalRevenueAddons)}</td>
        <td style="text-align: right;">${formatRupiah(summary.totalProductHpp)}</td>
        <td style="text-align: right; color: #15803d;">${formatRupiah(summary.totalGrossProfitAddons)}</td>
      </tr>
    </tfoot>
  </table>
  `
      : ''
  }

  ${
    scope === 'ALL' || scope === 'TRANSAKSI'
      ? `
  <div class="section-heading">II. Buku Rincian Transaksi Penjualan / Pengeluaran</div>
  <table>
    <thead>
      <tr>
        <th style="width: 24px; text-align: center;">No</th>
        <th>Tanggal</th>
        <th>No. Booking</th>
        <th>No. Invoice</th>
        <th>Nama Pasien</th>
        <th>Paket Sunat</th>
        <th>Nama Produk</th>
        <th style="text-align: center;">Tipe</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Harga Satuan</th>
        <th style="text-align: right;">Total Tagihan</th>
        <th style="text-align: center;">Status Stok</th>
      </tr>
    </thead>
    <tbody>
      ${transactionsHtml || '<tr><td colspan="12" style="text-align: center; padding: 12px; color: #94a3b8;">Tidak ada transaksi penjualan pada periode ini</td></tr>'}
    </tbody>
  </table>
  `
      : ''
  }

  <div class="signatures">
    <div>
      <div>Dibuat &amp; Dilaporkan Oleh,</div>
      <div style="font-weight: bold; margin-top: 2px;">Petugas Farmasi / Logistik / Kasir</div>
      <div class="sig-space"></div>
      <div class="sig-name">( ${userName} )</div>
      <div class="sig-role">Staf Penanggung Jawab Inventaris</div>
    </div>
    <div>
      <div>${clinicName ? String(clinicName).split(' ')[0] : 'Klinik'}, ${printDateStr ? String(printDateStr).split(',')[0] : ''}</div>
      <div style="font-weight: bold; margin-top: 2px;">Dokter Penanggung Jawab / Pimpinan Klinik</div>
      <div class="sig-space"></div>
      <div class="sig-name">( dr. ................................................... )</div>
      <div class="sig-role">SIP / NIP Penanggung Jawab</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[96vh] print:max-h-none print:h-auto print:overflow-visible shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto print-modal-card">
        {/* ========================================================================= */}
        {/* MODAL TOP HEADER & CONTROL BAR (No Print)                                 */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900 text-white gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Pratinjau Cetak Laporan Pengeluaran Stok
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {periodLabel} • {selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory}
              </p>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setScope('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                scope === 'ALL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📑 Lengkap (Rekap &amp; Log)
            </button>
            <button
              type="button"
              onClick={() => setScope('REKAP')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                scope === 'REKAP'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Rekap Produk Saja
            </button>
            <button
              type="button"
              onClick={() => setScope('TRANSAKSI')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                scope === 'TRANSAKSI'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧾 Rincian Transaksi
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-modal-print-now"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              title="Cetak via printer browser atau simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen (Print / PDF)</span>
            </button>

            <button
              type="button"
              id="btn-modal-open-tab"
              onClick={handleOpenInNewTab}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Buka dokumen di tab browser baru (menghindari limitasi iframe)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tab Baru</span>
            </button>

            <button
              type="button"
              id="btn-modal-export-csv"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Unduh laporan dalam format CSV untuk Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE DOCUMENT VIEW (A4 Page Preview)                                 */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto p-4 sm:p-6 md:p-8 bg-slate-200/80 print:p-0 print:bg-transparent">
          <div
            id="product-report-print-container"
            className="product-report-print-sheet mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 text-slate-950 font-sans text-xs leading-tight select-text print:shadow-none print:border-none print:rounded-none print:p-0 max-w-4xl"
          >
            {/* Kop Surat Resmi Klinik */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 flex items-center justify-center">
                  <NanoMasterLogo
                    src={settings.logoUrl}
                    height={52}
                    width={68}
                    className="max-h-[52px] max-w-[68px] object-contain print-kop-logo"
                  />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">
                    {clinicName}
                  </h1>
                  <p className="text-[11px] font-bold text-sky-800 mt-0.5">
                    {tagline}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                    {address} • Telp/WA: {phone}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider rounded">
                  LAPORAN PENGELUARAN STOK RESMI
                </span>
                <div className="text-[10px] font-bold text-slate-800 mt-1">
                  Tanggal Cetak: {printDateStr}
                </div>
                <div className="text-[9.5px] text-slate-500 font-mono">
                  Petugas: {userName}
                </div>
              </div>
            </div>

            {/* Title & Filter Metadata Header */}
            <div className="text-center my-3.5">
              <h2 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide">
                LAPORAN PENGELUARAN STOK &amp; PEMAKAIAN BARANG
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-slate-700 mt-1">
                <span>
                  Periode: <strong className="text-slate-950">{periodLabel}</strong>
                </span>
                <span>•</span>
                <span>
                  Kategori:{' '}
                  <strong className="text-slate-950">
                    {selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory.replace('_', ' ')}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Tipe:{' '}
                  <strong className="text-slate-950">
                    {selectedItemType === 'ALL'
                      ? 'Semua (Included + Add-on)'
                      : selectedItemType === 'ADDON'
                      ? 'Hanya Add-on Penjualan'
                      : 'Included Paket'}
                  </strong>
                </span>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-center">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-500">Total Fisik Keluar</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {summary.totalQtyDisbursed.toLocaleString('id-ID')} unit
                </div>
                <div className="text-[9px] text-slate-500">
                  Inc: {summary.totalQtyIncluded} | Add: {summary.totalQtyAddon}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-500">Omzet Penjualan Add-on</div>
                <div className="text-sm font-black text-sky-950 mt-0.5">
                  {formatRupiah(summary.totalRevenueAddons)}
                </div>
                <div className="text-[9px] text-slate-500">Dari {summary.totalQtyAddon} unit produk</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-500">Total HPP Modal Barang</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {formatRupiah(summary.totalProductHpp)}
                </div>
                <div className="text-[9px] text-slate-500">Beban modal keluar</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-500">Laba Kotor Add-on</div>
                <div className="text-sm font-black text-emerald-950 mt-0.5">
                  {formatRupiah(summary.totalGrossProfitAddons)}
                </div>
                <div className="text-[9px] text-emerald-800 font-bold">Margin: {marginPct}%</div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TABEL REKAPITULASI PRODUK (SKU)                                           */}
            {/* ========================================================================= */}
            {(scope === 'ALL' || scope === 'REKAP') && (
              <div className="mb-4">
                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wide pb-1 mb-1.5 border-b border-slate-300 flex items-center justify-between">
                  <span>I. Rekapitulasi Penjualan Per Produk (SKU)</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Total {items.length} jenis barang
                  </span>
                </div>
                <div className="border border-slate-900 rounded-xs overflow-hidden">
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="py-1 px-1.5 text-center w-7 border-r border-slate-800">No</th>
                        <th className="py-1 px-2 text-left border-r border-slate-800">SKU</th>
                        <th className="py-1 px-2.5 text-left border-r border-slate-800">Nama Produk</th>
                        <th className="py-1 px-2 text-left border-r border-slate-800">Kategori</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-800">Stok</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-800">Inc</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-800">Add</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-800">Total</th>
                        <th className="py-1 px-2 text-right border-r border-slate-800">HPP Modal</th>
                        <th className="py-1 px-2 text-right border-r border-slate-800">Harga Jual</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-800">Omzet Add-on</th>
                        <th className="py-1 px-2 text-right border-r border-slate-800">Beban HPP</th>
                        <th className="py-1 px-2.5 text-right">Laba Add-on</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-4 text-center text-slate-400 italic">
                            Tidak ada data penjualan atau barang keluar pada periode ini
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                          <tr key={it.productId} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200">{idx + 1}</td>
                            <td className="py-1 px-2 border-r border-slate-200 font-mono text-[9.5px]">
                              {it.productSku}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{it.productName}</span>
                                {(() => {
                                  const sz = getCelanaSize(it);
                                  return sz ? (
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                      Ukuran {sz}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </td>
                            <td className="py-1 px-2 border-r border-slate-200 text-slate-600">
                              {it.category}
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono text-slate-500">
                              {it.currentStock} {it.unit}
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono text-slate-600">
                              {it.qtyIncluded}
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono font-bold text-sky-800">
                              {it.qtyAddon}
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono font-bold text-slate-900">
                              {it.qtyTotal}
                            </td>
                            <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                              {formatRupiah(it.costPrice)}
                            </td>
                            <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                              {it.sellPrice > 0 ? formatRupiah(it.sellPrice) : '-'}
                            </td>
                            <td className="py-1 px-2.5 text-right border-r border-slate-200 font-mono font-bold text-sky-950">
                              {it.totalRevenue > 0 ? formatRupiah(it.totalRevenue) : 'Rp 0'}
                            </td>
                            <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                              {formatRupiah(it.totalCost)}
                            </td>
                            <td className="py-1 px-2.5 text-right font-mono font-bold text-emerald-900">
                              {it.estimatedProfit > 0 ? formatRupiah(it.estimatedProfit) : 'Rp 0'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-900">
                        <td colSpan={5} className="py-1.5 px-2 text-right border-r border-slate-300">
                          TOTAL:
                        </td>
                        <td className="py-1.5 px-1.5 text-center border-r border-slate-300 font-mono">
                          {summary.totalQtyIncluded}
                        </td>
                        <td className="py-1.5 px-1.5 text-center border-r border-slate-300 font-mono text-sky-900">
                          {summary.totalQtyAddon}
                        </td>
                        <td className="py-1.5 px-1.5 text-center border-r border-slate-300 font-mono">
                          {summary.totalQtyDisbursed}
                        </td>
                        <td colSpan={2} className="border-r border-slate-300"></td>
                        <td className="py-1.5 px-2.5 text-right border-r border-slate-300 font-mono text-sky-950">
                          {formatRupiah(summary.totalRevenueAddons)}
                        </td>
                        <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono">
                          {formatRupiah(summary.totalProductHpp)}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-emerald-950">
                          {formatRupiah(summary.totalGrossProfitAddons)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TABEL BUKU RINCIAN TRANSAKSI PENJUALAN                                    */}
            {/* ========================================================================= */}
            {(scope === 'ALL' || scope === 'TRANSAKSI') && (
              <div className="mb-4">
                <div className="text-[11px] font-black uppercase text-slate-900 tracking-wide pb-1 mb-1.5 border-b border-slate-300 flex items-center justify-between">
                  <span>II. Buku Rincian Transaksi Penjualan / Pemakaian</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Total {transactions.length} entri transaksi
                  </span>
                </div>
                <div className="border border-slate-900 rounded-xs overflow-hidden">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        <th className="py-1 px-1.5 text-center w-7 border-r border-slate-800">No</th>
                        <th className="py-1 px-2 text-left border-r border-slate-800">Tanggal</th>
                        <th className="py-1 px-2 text-left border-r border-slate-800">No. Booking</th>
                        <th className="py-1 px-2 text-left border-r border-slate-800">No. Invoice</th>
                        <th className="py-1 px-2.5 text-left border-r border-slate-800">Pasien</th>
                        <th className="py-1 px-2.5 text-left border-r border-slate-800">Paket Sunat</th>
                        <th className="py-1 px-2.5 text-left border-r border-slate-800">Nama Produk</th>
                        <th className="py-1 px-1.5 text-center border-r border-slate-800">Tipe</th>
                        <th className="py-1 px-1 text-center border-r border-slate-800">Qty</th>
                        <th className="py-1 px-2 text-right border-r border-slate-800">Harga Satuan</th>
                        <th className="py-1 px-2.5 text-right border-r border-slate-800">Total Tagihan</th>
                        <th className="py-1 px-2 text-center">Status Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-4 text-center text-slate-400 italic">
                            Tidak ada catatan transaksi item pada periode ini
                          </td>
                        </tr>
                      ) : (
                        transactions.map((txn, idx) => (
                          <tr key={txn.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200">{idx + 1}</td>
                            <td className="py-1 px-2 border-r border-slate-200 font-mono text-[9px] whitespace-nowrap">
                              {txn.date}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-200 font-mono text-[8.5px]">
                              {txn.bookingNumber}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-200 font-mono text-[9px] font-bold text-slate-900">
                              {txn.invoiceNumber}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                              <div>{txn.patientName}</div>
                              {txn.patientAge && (
                                <span className="text-[8.5px] font-normal text-slate-500">
                                  ({txn.patientAge})
                                </span>
                              )}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 text-slate-800">
                              <div className="font-bold text-[9px]">{txn.packageName || 'Paket Sunat'}</div>
                              {txn.patientCategory && (
                                <span className="text-[8px] text-sky-700 font-semibold">{txn.patientCategory}</span>
                              )}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 font-medium text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">{txn.productName}</span>
                                {(() => {
                                  const sz = getCelanaSize(txn);
                                  return sz ? (
                                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                      Ukuran {sz}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <span className="text-[8px] text-slate-400 font-mono">
                                {txn.productSku}
                                {getCelanaSize(txn) ? ` • Ukuran ${getCelanaSize(txn)}` : ''}
                              </span>
                            </td>
                            <td className="py-1 px-1.5 text-center border-r border-slate-200">
                              {txn.itemType === 'ADDON' ? (
                                <span className="text-[8px] font-bold text-sky-800 bg-sky-50 px-1 py-0.5 rounded border border-sky-200 whitespace-nowrap">
                                  Add-on
                                </span>
                              ) : txn.itemType === 'MANUAL_OUT' ? (
                                <span className="text-[8px] font-bold text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                                  📦 Mutasi
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                  🎁 Paket
                                </span>
                              )}
                            </td>
                            <td className="py-1 px-1 text-center border-r border-slate-200 font-mono font-bold">
                              {txn.quantity} {txn.unit}
                            </td>
                            <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                              {txn.itemType === 'ADDON' ? (
                                formatRupiah(txn.sellPrice)
                              ) : txn.itemType === 'MANUAL_OUT' ? (
                                <span className="text-amber-800 text-[8.5px]">Operasional</span>
                              ) : (
                                <span className="text-emerald-700 text-[8.5px] font-bold">Termasuk</span>
                              )}
                            </td>
                            <td className="py-1 px-2.5 text-right border-r border-slate-200 font-mono font-bold text-slate-950">
                              {txn.itemType === 'ADDON' ? (
                                formatRupiah(txn.totalAmount)
                              ) : txn.itemType === 'MANUAL_OUT' ? (
                                <span className="text-amber-800 text-[8.5px] font-bold">Rp 0 (Mutasi)</span>
                              ) : (
                                <span className="text-emerald-700 text-[8.5px] font-bold">Rp 0 (Paket)</span>
                              )}
                            </td>
                            <td className="py-1 px-2 text-center">
                              {txn.isStockDeducted ? (
                                <span className="text-[8.5px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">✓ Terpotong (-{txn.quantity})</span>
                              ) : (
                                <span className="text-[8.5px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Menunggu</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* LEMBAR PENGESAHAN TANDA TANGAN RESMI                                      */}
            {/* ========================================================================= */}
            <div className="mt-8 pt-4 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                {/* Kolom Kiri: Petugas Farmasi / Logistik */}
                <div className="flex flex-col justify-between h-28">
                  <div>
                    <div className="font-medium text-slate-700">Dibuat &amp; Dilaporkan Oleh,</div>
                    <div className="font-bold text-slate-900 mt-0.5">Petugas Farmasi / Logistik / Kasir</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-950 underline">
                      ( {userName} )
                    </div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">Staf Penanggung Jawab Inventaris</div>
                  </div>
                </div>

                {/* Kolom Kanan: Pimpinan / Dokter Penanggung Jawab */}
                <div className="flex flex-col justify-between h-28">
                  <div>
                    <div className="font-medium text-slate-700">
                      {clinicName ? String(clinicName).split(' ')[0] : 'Klinik'}, {printDateStr ? String(printDateStr).split(',')[0] : ''}
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      Dokter Penanggung Jawab / Pimpinan Klinik
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-950 underline">
                      ( dr. ................................................... )
                    </div>
                    <div className="text-[9.5px] text-slate-500 mt-0.5">SIP / NIP Penanggung Jawab</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER (No Print)                                                   */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0 no-print">
          <div className="text-xs text-slate-600 font-medium">
            💡 Tips: Untuk menyimpan sebagai PDF, pada jendela cetak pilih printer:{' '}
            <strong className="text-slate-900">"Save as PDF" / "Simpan sebagai PDF"</strong>.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
