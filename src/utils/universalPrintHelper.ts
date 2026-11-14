/**
 * Nano Circumcision Clinic Management System
 * Universal Bulletproof Document Print Engine
 * 
 * Solves document printing failure across:
 * - Informed Consent (1 Sheet & 3 Sheets A4)
 * - Official Invoices (1 Sheet A4 & Thermal POS 58/80mm)
 * - Official Circumcision Certificates (A4)
 * - Employee Payroll Slips (A4 / Half A4)
 * - Financial & Stock Reports
 * 
 * Supports:
 * 1. Isolated Iframe Print (clean, instant, zero background interference)
 * 2. Standalone New Tab with Auto-Print & PDF Download
 * 3. Direct In-Page Print Isolation with automatic cleanup
 */

export type PrintPaperSize = 'A4' | 'A4-Landscape' | 'POS-58' | 'POS-80';

export interface PrintOptions {
  title?: string;
  paperSize?: PrintPaperSize;
  clinicName?: string;
  autoPrint?: boolean;
}

/**
 * Universal Standalone Print CSS for all clinic documents.
 * Emulates Tailwind styles and enforces crisp print typography & exact paper margins.
 */
export const getUniversalPrintCss = (paperSize: PrintPaperSize = 'A4'): string => {
  const pageMarginRule = 
    paperSize === 'A4-Landscape'
      ? '@page { size: A4 landscape; margin: 8mm 10mm 8mm 10mm; }'
      : paperSize === 'POS-58'
      ? '@page { size: 58mm auto; margin: 2mm 2mm 2mm 2mm; }'
      : paperSize === 'POS-80'
      ? '@page { size: 80mm auto; margin: 3mm 3mm 3mm 3mm; }'
      : '@page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }';

  return `
    ${pageMarginRule}

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: ${paperSize.startsWith('POS') ? '11px' : '11px'};
      line-height: 1.35;
    }

    /* Screen UI for standalone view */
    @media screen {
      body {
        background: #f1f5f9 !important;
        padding: 20px;
        min-height: 100vh;
      }
      .screen-container {
        max-width: ${paperSize === 'A4-Landscape' ? '297mm' : paperSize.startsWith('POS') ? '82mm' : '210mm'};
        margin: 0 auto;
        background: #ffffff;
        box-shadow: none;
        border: none;
        border-radius: 0;
        overflow: visible;
      }
    }

    .no-print {
      display: none !important;
    }

    @media screen {
      .screen-toolbar {
        position: sticky;
        top: 0;
        z-index: 9999;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        margin-bottom: 20px;
        border-radius: 8px;
      }
      .screen-toolbar .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .btn-print {
        background: #0284c7;
        color: #ffffff;
      }
      .btn-print:hover {
        background: #0369a1;
      }
      .btn-close {
        background: #334155;
        color: #ffffff;
      }
      .btn-close:hover {
        background: #475569;
      }
    }

    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
      }
      .screen-toolbar {
        display: none !important;
      }
      .screen-container {
        max-width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        outline: none !important;
      }
    }

    /* Multi-page Sheet Pagination */
    .consent-sheet-page {
      display: block !important;
      background: #ffffff !important;
      color: #000000 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 3mm 6mm !important;
      box-sizing: border-box !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      border: none !important;
      box-shadow: none !important;
      position: relative !important;
    }

    .consent-sheet-page:not(:last-child) {
      page-break-after: always !important;
      break-after: page !important;
    }

    .consent-sheet-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    .consent-1page, .invoice-a4-page {
      display: block !important;
      background: #ffffff !important;
      color: #000000 !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      border: none !important;
      box-shadow: none !important;
      overflow: hidden !important;
    }

    /* POS Thermal Printing (58mm / 80mm) */
    .thermal-58, .thermal-80 {
      font-family: "Courier New", Courier, monospace !important;
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 auto !important;
      padding: 2mm !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      border: none !important;
      box-shadow: none !important;
    }
    .thermal-58 {
      width: 54mm !important;
      max-width: 54mm !important;
      font-size: 10px !important;
      line-height: 1.25 !important;
    }
    .thermal-80 {
      width: 76mm !important;
      max-width: 76mm !important;
      font-size: 11px !important;
      line-height: 1.3 !important;
    }

    /* Kop Surat & Clinic Logo */
    .print-kop-logo, img.print-kop-logo {
      max-height: 52px !important;
      max-width: 68px !important;
      height: 52px !important;
      width: auto !important;
      object-fit: contain !important;
      display: inline-block !important;
    }

    /* Common Layout & Grid Emulation */
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .items-end { align-items: flex-end !important; }
    .items-baseline { align-items: baseline !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-end { justify-content: flex-end !important; }
    .gap-1 { gap: 4px !important; }
    .gap-2 { gap: 8px !important; }
    .gap-3 { gap: 12px !important; }
    .gap-4 { gap: 16px !important; }
    .shrink-0 { flex-shrink: 0 !important; }

    .grid { display: grid !important; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
    .col-span-3 { grid-column: span 3 / span 3 !important; }
    .col-span-4 { grid-column: span 4 / span 4 !important; }
    .col-span-5 { grid-column: span 5 / span 5 !important; }
    .col-span-7 { grid-column: span 7 / span 7 !important; }
    .col-span-8 { grid-column: span 8 / span 8 !important; }
    .col-span-9 { grid-column: span 9 / span 9 !important; }
    .col-span-12 { grid-column: span 12 / span 12 !important; }

    /* Tables */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto !important;
      font-size: 10.5px !important;
    }
    tr {
      page-break-inside: avoid !important;
      page-break-after: auto !important;
    }
    th, td {
      padding: 4px 6px !important;
      vertical-align: middle !important;
    }
    thead {
      display: table-header-group !important;
    }
    tfoot {
      display: table-footer-group !important;
    }

    /* Text Formatting */
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .text-justify { text-align: justify !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black { font-weight: 900 !important; }
    .font-semibold { font-weight: 600 !important; }
    .font-mono { font-family: "Courier New", Courier, monospace !important; }
    .uppercase { text-transform: uppercase !important; }
    .lowercase { text-transform: lowercase !important; }
    .capitalize { text-transform: capitalize !important; }
    .tracking-wider { letter-spacing: 0.05em !important; }
    .tracking-tight { letter-spacing: -0.025em !important; }
    .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
    .whitespace-pre-line { white-space: pre-line !important; }
    .leading-none { line-height: 1 !important; }
    .leading-tight { line-height: 1.25 !important; }
    .leading-snug { line-height: 1.375 !important; }
    .leading-normal { line-height: 1.5 !important; }

    /* Borders & Lines */
    .border { border: 1px solid #0f172a !important; }
    .border-2 { border: 2px solid #0f172a !important; }
    .border-b { border-bottom: 1px solid #0f172a !important; }
    .border-b-2 { border-bottom: 2px solid #0f172a !important; }
    .border-t { border-top: 1px solid #0f172a !important; }
    .border-t-2 { border-top: 2px solid #0f172a !important; }
    .border-l { border-left: 1px solid #0f172a !important; }
    .border-r { border-right: 1px solid #0f172a !important; }
    .border-dashed { border-style: dashed !important; }
    .border-dotted { border-style: dotted !important; }
    .border-slate-900, .border-slate-950, .border-black { border-color: #000000 !important; }
    .border-slate-400 { border-color: #94a3b8 !important; }
    .border-slate-300 { border-color: #cbd5e1 !important; }
    .border-slate-200 { border-color: #e2e8f0 !important; }
    .rounded-xs { border-radius: 2px !important; }
    .rounded-sm { border-radius: 4px !important; }
    .rounded { border-radius: 4px !important; }
    .rounded-lg { border-radius: 6px !important; }
    .rounded-xl { border-radius: 8px !important; }
    .rounded-full { border-radius: 9999px !important; }

    /* Doctor Prescription Box Print Enforcement */
    .prescription-box,
    .resep-box {
      border: 2.5px solid #000000 !important;
      border-radius: 4px !important;
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      background-color: #ffffff !important;
    }

    /* Force outer page containers to never have outline borders in print */
    .consent-sheet-page, .consent-1page, .invoice-a4-page, .screen-container {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }

    /* Colors: High Contrast Print Mode */
    .bg-white { background-color: #ffffff !important; }
    .bg-slate-50 { background-color: #f8fafc !important; }
    .bg-slate-100 { background-color: #f1f5f9 !important; }
    .bg-slate-900 { background-color: #0f172a !important; color: #ffffff !important; }
    .text-white { color: #ffffff !important; }
    .text-slate-950 { color: #020617 !important; }
    .text-slate-900 { color: #0f172a !important; }
    .text-slate-800 { color: #1e293b !important; }
    .text-slate-700 { color: #334155 !important; }
    .text-slate-600 { color: #475569 !important; }
    .text-slate-500 { color: #64748b !important; }
    .text-sky-800 { color: #075985 !important; }
    .text-sky-900 { color: #0c4a6e !important; }
    .text-emerald-800 { color: #065f46 !important; }
    .text-emerald-900 { color: #064e3b !important; }

    /* Checkbox & Radio boxes in print */
    input[type="checkbox"], input[type="radio"] {
      accent-color: #0f172a !important;
    }
  `;
};

/**
 * Builds a complete standalone HTML document with embedded styles and optional toolbar.
 */
export const buildStandaloneDocumentHtml = (
  contentHtml: string,
  options: PrintOptions = {}
): string => {
  const {
    title = 'Dokumen Resmi Nano Circumcision',
    paperSize = 'A4',
    clinicName = 'Nano Circumcision Clinic',
  } = options;

  const css = getUniversalPrintCss(paperSize);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - ${clinicName}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <!-- Screen Navigation / Control Toolbar (Hidden when printing) -->
  <div class="screen-toolbar no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 16px;">🖨️</span>
      <div>
        <strong style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${title}</strong>
        <div style="font-size: 10px; color: #94a3b8;">Format: ${paperSize} • Siap Cetak Langsung / Simpan PDF</div>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="btn btn-print" onclick="window.print()">
        <span>Cetak Dokumen / Simpan PDF</span>
      </button>
      <button class="btn btn-close" onclick="window.close()">
        <span>Tutup Halaman</span>
      </button>
    </div>
  </div>

  <div class="screen-container">
    ${contentHtml}
  </div>

  <script>
    // Automatic print trigger if requested
    window.addEventListener('load', function() {
      // Small timeout to allow images (like clinic logo) to fully render
      setTimeout(function() {
        if (${options.autoPrint !== false}) {
          try {
            window.print();
          } catch(e) {
            console.warn('Auto print trigger error:', e);
          }
        }
      }, 400);
    });
  </script>
</body>
</html>`;
};

/**
 * Executes bulletproof printing via isolated hidden iframe.
 * If iframe printing fails (due to strict browser sandbox), falls back to direct new tab/window print.
 */
export const executeIsolatedPrint = (
  htmlDocument: string,
  onFallback?: () => void
): boolean => {
  try {
    let printFrame = document.getElementById('nano-universal-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'nano-universal-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      printFrame.setAttribute('aria-hidden', 'true');
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlDocument);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error, activating fallback:', err);
          if (onFallback) {
            onFallback();
          } else {
            openHtmlInNewTab(htmlDocument);
          }
        }
      }, 400);
      return true;
    }
  } catch (err) {
    console.warn('Failed to access print iframe, activating fallback:', err);
  }

  // Fallback if iframe fails
  if (onFallback) {
    onFallback();
  } else {
    openHtmlInNewTab(htmlDocument);
  }
  return false;
};

/**
 * Opens document in a clean standalone browser tab and invokes print dialog.
 */
export const openHtmlInNewTab = (htmlDocument: string): void => {
  try {
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.open();
      newTab.document.write(htmlDocument);
      newTab.document.close();
      return;
    }
  } catch (err) {
    console.warn('Failed to open tab directly, trying Blob URL:', err);
  }

  // Blob fallback for strict pop-up blockers
  try {
    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank');
    if (!tab) {
      // Last resort: standard window.print
      window.print();
    }
  } catch (blobErr) {
    console.warn('Blob fallback failed:', blobErr);
    window.print();
  }
};

/**
 * Clean clone of an element removing any buttons or no-print elements.
 */
export const getCleanElementHtml = (elementId: string): string | null => {
  const elem = document.getElementById(elementId);
  if (!elem) return null;

  const clone = elem.cloneNode(true) as HTMLElement;
  const noPrints = clone.querySelectorAll('.no-print');
  noPrints.forEach((el) => el.remove());

  return clone.innerHTML;
};

/**
 * Master print function:
 * Prints any DOM element (by elementId) cleanly using isolated iframe.
 */
export const printElementById = (
  elementId: string,
  options: PrintOptions = {}
): boolean => {
  const contentHtml = getCleanElementHtml(elementId);
  if (!contentHtml) {
    console.error(`Print element #${elementId} not found`);
    // Fallback to window.print()
    window.print();
    return false;
  }

  const standaloneHtml = buildStandaloneDocumentHtml(contentHtml, options);
  return executeIsolatedPrint(standaloneHtml, () => {
    openHtmlInNewTab(standaloneHtml);
  });
};

/**
 * Master preview / open in new tab function:
 * Opens any DOM element in a standalone tab with print button & auto-print.
 */
export const openElementInNewTab = (
  elementId: string,
  options: PrintOptions = {}
): void => {
  const contentHtml = getCleanElementHtml(elementId);
  if (!contentHtml) {
    console.error(`Print element #${elementId} not found`);
    window.print();
    return;
  }

  const standaloneHtml = buildStandaloneDocumentHtml(contentHtml, {
    ...options,
    autoPrint: true,
  });
  openHtmlInNewTab(standaloneHtml);
};
