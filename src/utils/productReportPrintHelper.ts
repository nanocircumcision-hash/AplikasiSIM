// Helper for printing and generating HTML reports for Product Stock Outflows / Expenditure

export interface ProductReportPrintItem {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  size?: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
  qtyIncluded: number;
  qtyAddon: number;
  qtyManualOut?: number;
  qtyTotal: number;
  qtyDeducted: number;
  qtyPending: number;
  totalRevenue: number;
  totalCost: number;
  estimatedProfit: number;
  isBelowMin: boolean;
}

export interface ProductReportPrintTransaction {
  id: string;
  date: string;
  bookingNumber: string;
  invoiceNumber: string;
  patientName: string;
  patientAge?: string;
  patientCategory?: string;
  packageName: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  size?: string | null;
  itemType: 'INCLUDED' | 'ADDON' | 'MANUAL_OUT';
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  totalAmount: number;
  isStockDeducted: boolean;
  notes?: string;
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
  totalQtyDeducted: number;
  totalQtyPending: number;
  totalQtyIncluded: number;
  totalQtyAddon: number;
  totalQtyManualOut?: number;
  totalRevenueAddons: number;
  totalProductHpp: number;
  totalGrossProfitAddons: number;
  totalTransactions: number;
  packageBreakdown?: Array<{
    packageName: string;
    qtyTotal: number;
    qtyIncluded: number;
    qtyAddon: number;
    qtyManualOut?: number;
  }>;
}

export interface GenerateProductReportHtmlParams {
  reportData: {
    summary: ProductReportPrintSummary;
    items: ProductReportPrintItem[];
    transactions: ProductReportPrintTransaction[];
    period?: { startDate: string; endDate: string };
  };
  settings: any;
  currentUser: any;
  periodLabel: string;
  selectedCategory?: string;
  selectedItemType?: string;
  scope?: 'ALL' | 'REKAP' | 'TRANSAKSI';
}

export const formatRupiahPrint = (val: number): string => {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

export const generateProductReportHtml = ({
  reportData,
  settings,
  currentUser,
  periodLabel,
  selectedCategory = 'ALL',
  selectedItemType = 'ALL',
  scope = 'ALL',
}: GenerateProductReportHtmlParams): string => {
  const { summary, items, transactions } = reportData;
  const clinicName = settings?.clinicName || 'NANO CIRCUMCISION CLINIC';
  const tagline = settings?.tagline || 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit';
  const address = settings?.address || 'Ruko Khayangan Nomor RB-16 Bangkalan';
  const phone = settings?.phone || '085236069788';
  const logoSrc = settings?.logoUrl || '/branding/logo-nano-circumcision.png';

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const userName =
    currentUser?.fullName || currentUser?.name || currentUser?.email || 'Admin Logistik';

  const marginPct =
    summary.totalRevenueAddons > 0
      ? Math.round((summary.totalGrossProfitAddons / summary.totalRevenueAddons) * 100)
      : 0;

  const itemsHtml = items
    .map(
      (it, idx) => {
        const celanaSize = getCelanaSize(it);
        const sizeBadge = celanaSize
          ? `<span style="display: inline-block; margin-left: 5px; padding: 1px 5px; font-size: 8px; font-weight: bold; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; border-radius: 3px;">Ukuran ${celanaSize}</span>`
          : '';
        return `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="font-family: monospace; font-weight: bold; font-size: 8.5px;">${it.productSku}</td>
      <td><strong>${it.productName}</strong> ${sizeBadge}</td>
      <td style="font-size: 8.5px;">${it.category}${celanaSize ? `<br/><span style="font-size: 7.5px; color: #6b21a8; font-weight: bold;">[Ukuran ${celanaSize}]</span>` : ''}</td>
      <td style="text-align: center;">${it.currentStock} ${it.unit}</td>
      <td style="text-align: center;">${it.qtyIncluded}</td>
      <td style="text-align: center; font-weight: bold; color: #0284c7;">${it.qtyAddon}</td>
      <td style="text-align: center; color: #92400e;">${it.qtyManualOut || 0}</td>
      <td style="text-align: center; font-weight: bold; background: #f1f5f9;">${it.qtyTotal}</td>
      <td style="text-align: right;">${formatRupiahPrint(it.costPrice)}</td>
      <td style="text-align: right;">${it.sellPrice > 0 ? formatRupiahPrint(it.sellPrice) : '-'}</td>
      <td style="text-align: right; font-weight: bold; color: #0369a1;">${formatRupiahPrint(it.totalRevenue)}</td>
      <td style="text-align: right;">${formatRupiahPrint(it.totalCost)}</td>
      <td style="text-align: right; font-weight: bold; color: ${it.estimatedProfit > 0 ? '#15803d' : '#334155'};">
        ${formatRupiahPrint(it.estimatedProfit)}
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
        const sizeBadge = celanaSize
          ? `<span style="display: inline-block; margin-left: 4px; padding: 1px 4px; font-size: 7.5px; font-weight: bold; background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; border-radius: 3px;">Ukuran ${celanaSize}</span>`
          : '';
        return `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="white-space: nowrap; font-size: 8.5px;">${t.date}</td>
      <td style="font-family: monospace; font-size: 8.5px;">${t.bookingNumber}</td>
      <td style="font-family: monospace; font-size: 8.5px; font-weight: bold;">${t.invoiceNumber}</td>
      <td><strong>${t.patientName}</strong> <span style="font-size: 8.5px; color: #64748b;">(${t.patientAge || '-'})</span></td>
      <td style="font-size: 8.5px;">
        <strong>${t.packageName || 'Paket Sunat'}</strong>
        ${t.patientCategory ? `<br/><span style="color: #0284c7; font-weight: bold; font-size: 8px;">${t.patientCategory}</span>` : ''}
      </td>
      <td>
        <strong>${t.productName}</strong> ${sizeBadge}
        <br/><span style="font-size: 8px; color: #64748b;">${t.productSku}${celanaSize ? ` • Ukuran ${celanaSize}` : ''}</span>
      </td>
      <td style="text-align: center;">
        <span style="display: inline-block; padding: 2px 6px; font-size: 8px; border-radius: 4px; font-weight: bold; ${
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
      <td style="text-align: right;">${t.itemType === 'ADDON' ? formatRupiahPrint(t.sellPrice) : t.itemType === 'MANUAL_OUT' ? '<span style="color: #92400e;">Operasional</span>' : '<span style="color: #166534; font-weight: bold;">Termasuk Paket</span>'}</td>
      <td style="text-align: right; font-weight: bold;">${t.itemType === 'ADDON' ? formatRupiahPrint(t.totalAmount) : t.itemType === 'MANUAL_OUT' ? '<span style="color: #92400e;">Rp 0 (Mutasi)</span>' : '<span style="color: #166534; font-weight: bold;">Rp 0 (Paket)</span>'}</td>
      <td style="text-align: center; font-size: 8.5px; ${t.isStockDeducted ? 'color: #166534; font-weight: bold;' : 'color: #854d0e;'}">
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
      font-size: 10px;
      line-height: 1.35;
    }
    .no-print {
      margin-bottom: 16px;
      padding: 10px 14px;
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
      font-size: 11px;
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
      font-size: 9px;
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
      margin: 10px 0 4px 0;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-meta {
      display: flex;
      justify-content: center;
      gap: 14px;
      font-size: 9.5px;
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
    .kpi-title { font-size: 8.5px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 12.5px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .kpi-sub { font-size: 8px; color: #64748b; margin-top: 1px; }
    .section-heading {
      font-size: 10.5px;
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
      font-size: 9px;
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 4px 5px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #0f172a;
      font-size: 8.5px;
    }
    td {
      padding: 3.5px 5px;
      border: 1px solid #cbd5e1;
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
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-space { height: 44px; }
    .sig-name { font-weight: bold; text-decoration: underline; font-size: 10px; }
    .sig-role { font-size: 8.5px; color: #64748b; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong style="font-size: 12px;">Pratinjau Siap Cetak (A4 Resmi)</strong>
      <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
        Klik tombol cetak di samping untuk mencetak atau simpan sebagai PDF.
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Cetak Dokumen / PDF
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
      <span class="report-badge">LAPORAN PENGELUARAN STOK</span>
      <div style="font-size: 9.5px; font-weight: bold; color: #0f172a; margin-top: 4px;">
        Waktu Cetak: ${printDateStr}
      </div>
      <div style="font-size: 8.5px; color: #64748b;">
        Petugas: ${userName}
      </div>
    </div>
  </div>

  <div class="report-title">
    LAPORAN PENGELUARAN STOK &amp; PEMAKAIAN BARANG
  </div>

  <div class="report-meta">
    <span>Periode: <strong>${periodLabel}</strong></span>
    <span>•</span>
    <span>Kategori: <strong>${selectedCategory === 'ALL' ? 'Semua Kategori' : selectedCategory.replace('_', ' ')}</strong></span>
    <span>•</span>
    <span>Tipe: <strong>${selectedItemType === 'ALL' ? 'Semua Distribusi' : selectedItemType === 'ADDON' ? 'Hanya Add-on Penjualan' : selectedItemType === 'MANUAL_OUT' ? 'Mutasi Operasional' : 'Included Paket'}</strong></span>
  </div>

  <div class="kpi-grid">
    <div>
      <div class="kpi-title">Total Fisik Keluar</div>
      <div class="kpi-value">${summary.totalQtyDisbursed.toLocaleString('id-ID')} unit</div>
      <div class="kpi-sub">Inc: ${summary.totalQtyIncluded} | Add: ${summary.totalQtyAddon} | Mut: ${summary.totalQtyManualOut || 0}</div>
    </div>
    <div>
      <div class="kpi-title">Omzet Penjualan Add-on</div>
      <div class="kpi-value">${formatRupiahPrint(summary.totalRevenueAddons)}</div>
      <div class="kpi-sub">Dari ${summary.totalQtyAddon} unit produk add-on</div>
    </div>
    <div>
      <div class="kpi-title">Total Beban HPP Modal</div>
      <div class="kpi-value">${formatRupiahPrint(summary.totalProductHpp)}</div>
      <div class="kpi-sub">Beban modal keluar</div>
    </div>
    <div>
      <div class="kpi-title">Laba Kotor Add-on</div>
      <div class="kpi-value" style="color: ${summary.totalGrossProfitAddons >= 0 ? '#15803d' : '#b91c1c'};">
        ${formatRupiahPrint(summary.totalGrossProfitAddons)}
      </div>
      <div class="kpi-sub">Margin Kotor: ${marginPct}%</div>
    </div>
  </div>

  ${
    scope === 'ALL' || scope === 'REKAP'
      ? `
  <div class="section-heading">
    I. Rekapitulasi Pengeluaran Per Produk (SKU) • Total ${items.length} Item
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">No</th>
        <th style="width: 65px;">Kode SKU</th>
        <th>Nama Produk</th>
        <th>Kategori</th>
        <th style="text-align: center;">Stok Sisa</th>
        <th style="text-align: center;">Included</th>
        <th style="text-align: center;">Add-on</th>
        <th style="text-align: center;">Mutasi</th>
        <th style="text-align: center; background: #334155;">Total Qty</th>
        <th style="text-align: right;">HPP Modal</th>
        <th style="text-align: right;">Harga Jual</th>
        <th style="text-align: right;">Omzet Add-on</th>
        <th style="text-align: right;">Beban HPP</th>
        <th style="text-align: right;">Laba Kotor</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml || '<tr><td colspan="14" style="text-align: center; padding: 12px;">Tidak ada data barang keluar untuk filter ini</td></tr>'}
    </tbody>
    <tfoot>
      <tr class="tfoot-total">
        <td colspan="5" style="text-align: right; font-weight: bold;">TOTAL KESELURUHAN:</td>
        <td style="text-align: center;">${summary.totalQtyIncluded}</td>
        <td style="text-align: center;">${summary.totalQtyAddon}</td>
        <td style="text-align: center;">${summary.totalQtyManualOut || 0}</td>
        <td style="text-align: center; font-weight: 900; background: #cbd5e1;">${summary.totalQtyDisbursed}</td>
        <td colspan="2"></td>
        <td style="text-align: right; color: #0369a1;">${formatRupiahPrint(summary.totalRevenueAddons)}</td>
        <td style="text-align: right;">${formatRupiahPrint(summary.totalProductHpp)}</td>
        <td style="text-align: right; color: ${summary.totalGrossProfitAddons >= 0 ? '#15803d' : '#b91c1c'};">
          ${formatRupiahPrint(summary.totalGrossProfitAddons)}
        </td>
      </tr>
    </tfoot>
  </table>
  `
      : ''
  }

  ${
    scope === 'ALL' || scope === 'TRANSAKSI'
      ? `
  <div class="section-heading" style="margin-top: 14px;">
    II. Buku Log Rincian Transaksi Pengeluaran Barang • Total ${transactions.length} Transaksi Terdata
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">No</th>
        <th style="width: 70px;">Tanggal</th>
        <th>No. Booking</th>
        <th>No. Invoice</th>
        <th>Nama Pasien</th>
        <th>Paket Sunat</th>
        <th>Produk &amp; SKU</th>
        <th style="text-align: center;">Tipe</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Tarif Satuan</th>
        <th style="text-align: right;">Subtotal</th>
        <th style="text-align: center; width: 65px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${transactionsHtml || '<tr><td colspan="12" style="text-align: center; padding: 12px;">Tidak ada catatan transaksi log keluar untuk filter ini</td></tr>'}
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
</body>
</html>`;
};

/**
 * Bulletproof print executor:
 * Injects isolated HTML into an invisible iframe and triggers print().
 * Fallback to direct window.print() if blocked by browser sandbox.
 */
export const executeIframePrint = (htmlContent: string) => {
  try {
    let printFrame = document.getElementById('report-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'report-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error, falling back to window.print():', err);
          window.print();
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Failed to print via iframe, falling back to window.print():', err);
  }

  // Fallback to window.print()
  window.print();
};

/**
 * Opens standalone printable report in a new tab
 */
export const openReportInNewTab = (htmlContent: string) => {
  try {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.focus();
      return;
    }
  } catch (err) {
    console.warn('Direct document.write to new window failed:', err);
  }

  // Blob fallback
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 3000);
  } catch (err) {
    console.error('Blob open failed:', err);
  }
};
