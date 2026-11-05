import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

/**
 * Downloads a DOM element as a crisp, professional PDF file directly in the browser.
 */
export const downloadElementAsPdf = async (
  elementId: string,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> => {
  const element = document.getElementById(elementId);
  if (!element) {
    const msg = `Elemen dokumen #${elementId} tidak ditemukan untuk diunduh sebagai PDF.`;
    console.error(msg);
    return { success: false, error: msg };
  }

  // Clone element to prevent interfering with displayed UI and strip any .no-print elements
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  // Enforce white background and crisp styling on clone
  clone.style.background = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.width = '100%';
  clone.style.maxWidth = '210mm'; // Standard A4 width
  clone.style.margin = '0 auto';
  clone.style.boxSizing = 'border-box';

  const defaultFilename = `Dokumen_${new Date().toISOString().slice(0, 10)}.pdf`;
  const cleanFilename = options.filename
    ? options.filename.endsWith('.pdf')
      ? options.filename
      : `${options.filename}.pdf`
    : defaultFilename;

  const pdfConfig = {
    margin: options.margin ?? [8, 8, 8, 8],
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
    },
    jsPDF: {
      unit: 'mm',
      format: options.format ?? 'a4',
      orientation: options.orientation ?? 'portrait',
    },
  };

  try {
    // Generate and save directly to trigger browser file download
    await (html2pdf as any)().set(pdfConfig).from(clone).save();
    return { success: true };
  } catch (err: any) {
    console.error('Error generating PDF with html2pdf:', err);
    return { success: false, error: err?.message || String(err) };
  }
};
