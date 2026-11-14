import React from 'react';

export interface IconProps {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
  src?: string | null;
}

/**
 * Nano Circumcision Official App Icon (Mascot & Roadster with NANO)
 */
export const NanoAppIcon: React.FC<IconProps> = ({ size = 32, className = '', alt = 'Nano Circumcision App Icon', src }) => {
  const localLogo = typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : null;
  const resolvedSrc = src || localLogo || '/branding/nano-app-icon.png';
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none rounded-lg ${className}`}
      onError={(e) => {
        // Fallback to PNG
        (e.target as HTMLImageElement).src = '/branding/nano-app-icon.png';
      }}
    />
  );
};

/**
 * Nano Circumcision Full Master Logo (SUNAT NANO CIRCUMCISION)
 * Menggunakan logo asli dari upload pengguna (prop src atau localStorage).
 * Ukuran terkontrol agar tidak terlalu besar saat dicetak di samping kop surat.
 */
export const NanoMasterLogo: React.FC<IconProps> = ({ 
  size, 
  width, 
  height, 
  className = '', 
  alt = 'Sunat Nano Circumcision Logo Resmi',
  src 
}) => {
  const localLogo = typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : null;
  const resolvedSrc = src || localLogo || '/branding/logo-nano-circumcision.png';

  const rawH = height ?? size ?? 52;
  const numH = typeof rawH === 'number' ? rawH : parseInt(String(rawH), 10) || 52;
  const rawW = width ?? 65;
  const numW = typeof rawW === 'number' ? rawW : parseInt(String(rawW), 10) || 65;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      style={{
        height: `${numH}px`,
        maxHeight: `${numH}px`,
        maxWidth: `${numW}px`,
        width: 'auto',
      }}
      className={`inline-block object-contain select-none print-kop-logo ${className}`}
      onError={(e) => {
        // Fallback to original PNG
        (e.target as HTMLImageElement).src = '/branding/logo-nano-circumcision.png';
      }}
    />
  );
};

/**
 * Icon: Cetak Struk (Receipt Printer)
 */
export const PrintReceiptIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Cetak Struk' }) => {
  return (
    <img
      src="/icons/icon-print-receipt.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-print-receipt.png';
      }}
    />
  );
};

/**
 * Icon: Cetak Invoice / Kwitansi
 */
export const PrintInvoiceIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Cetak Invoice' }) => {
  return (
    <img
      src="/icons/icon-print-invoice.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-print-invoice.png';
      }}
    />
  );
};

/**
 * Icon: Cetak Dokumen / Surat / Formulir / Informed Consent
 */
export const PrintDocumentIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Cetak Dokumen' }) => {
  return (
    <img
      src="/icons/icon-print-document.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-print-document.png';
      }}
    />
  );
};

/**
 * Icon: Cetak Laporan Keuangan / Rekapitulasi Pasien / Honor
 */
export const PrintReportIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Cetak Laporan' }) => {
  return (
    <img
      src="/icons/icon-print-report.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-print-report.png';
      }}
    />
  );
};

/**
 * Icon: Download / Simpan PDF
 */
export const PdfIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Export PDF' }) => {
  return (
    <img
      src="/icons/icon-pdf.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-pdf.png';
      }}
    />
  );
};

/**
 * Icon: Print Preview / Pratinjau Cetak
 */
export const PrintPreviewIcon: React.FC<IconProps> = ({ size = 20, className = '', alt = 'Pratinjau Cetak' }) => {
  return (
    <img
      src="/icons/icon-print-preview.svg"
      alt={alt}
      width={size}
      height={size}
      className={`inline-block object-contain select-none ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/icons/icon-print-preview.png';
      }}
    />
  );
};
