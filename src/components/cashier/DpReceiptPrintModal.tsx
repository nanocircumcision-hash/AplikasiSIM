import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Receipt } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { NanoMasterLogo } from '../common/PrintIcons';

export interface DpReceiptData {
  receiptNumber?: string;
  patientName: string;
  rmNumber?: string;
  date?: string;
  packageName: string;
  packageCategory?: string;
  subtotal: number;
  discount?: number;
  totalAmount: number;
  dpAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  notes?: string;
  branchCode?: string;
  cashierName?: string;
}

interface DpReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DpReceiptData | null;
}

export const DpReceiptPrintModal: React.FC<DpReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { settings, branches, activeBranchCode, currentUser } = useClinic();
  const [paperMode, setPaperMode] = useState<'NOTA' | 'THERMAL'>('NOTA');

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-dp-modal');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-dp-modal');
    };
  }, []);

  if (!isOpen || !data) return null;

  const targetBranchCode = (data.branchCode || activeBranchCode || 'PUSAT').toUpperCase();
  const activeBranch = branches?.find(b => b.code.toUpperCase() === targetBranchCode);

  const clinicName = activeBranch?.name || settings.clinicName || 'NANO CIRCUMCISION CLINIC';
  const clinicAddress = activeBranch?.address || settings.address || 'Ruko Khayangan Nomor RB-16 Bangkalan';
  const clinicPhone = activeBranch?.phone || settings.phone || '085236069788';
  const city = activeBranch?.name?.includes('(')
    ? activeBranch.name.split('(')[1]?.replace(')', '').trim()
    : (clinicAddress.toLowerCase().includes('surabaya')
        ? 'Surabaya'
        : clinicAddress.toLowerCase().includes('sidoarjo')
          ? 'Sidoarjo'
          : clinicAddress.toLowerCase().includes('malang')
            ? 'Malang'
            : 'Bangkalan');

  const cashierName =
    data.cashierName ||
    currentUser?.fullName ||
    currentUser?.name ||
    currentUser?.username ||
    'Kasir / Admin';

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Math.max(0, Number(val || 0)));

  const formatDateIndo = (dateStr?: string) => {
    const raw = dateStr || new Date().toISOString().split('T')[0];
    try {
      const [y, m, d] = raw.split('-').map(Number);
      if (!y || !m || !d) return raw;
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${d} ${months[m - 1]} ${y}`;
    } catch {
      return raw;
    }
  };

  const paymentMethodLabel = (method?: string) => {
    switch ((method || '').toUpperCase()) {
      case 'TRANSFER':
        return 'Transfer Bank (BCA / Mandiri)';
      case 'QRIS':
        return 'QRIS Dinamis';
      case 'DEBIT':
        return 'Debit EDC';
      case 'CASH':
        return 'Tunai / Kasir';
      default:
        return method || 'Transfer / Tunai';
    }
  };

  const isPaidFull = data.remainingAmount <= 0 && data.totalAmount > 0;
  const hasDp = Number(data.dpAmount || 0) > 0;
  const paymentStatusLabel = isPaidFull
    ? 'STATUS: LUNAS'
    : hasDp
      ? 'STATUS: DP (BELUM LUNAS)'
      : 'STATUS: BELUM LUNAS';

  const handlePrint = () => {
    document.body.classList.add('is-printing-dp-modal');
    setTimeout(() => {
      window.print();
      // Fallback cleanup if browser doesn't fire afterprint cleanly
      setTimeout(() => {
        document.body.classList.remove('is-printing-dp-modal');
      }, 1000);
    }, 60);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[70] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto dp-print-modal-overlay">
      <div
        className={`bg-white rounded-2xl w-full ${
          paperMode === 'NOTA' ? 'max-w-2xl' : 'max-w-md'
        } max-h-[95vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto dp-print-modal-card`}
      >
        {/* Toolbar Atas (Tidak ikut tercetak) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0 no-print">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Pratinjau Nota Sementara / DP
            </span>
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-[11px]">
              <button
                type="button"
                onClick={() => setPaperMode('NOTA')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  paperMode === 'NOTA'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nota A5 / A4</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperMode('THERMAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  paperMode === 'THERMAL'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Struk 80mm</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area Konten Nota */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-transparent">
          {paperMode === 'NOTA' ? (
            <div
              id="dp-receipt-print-document"
              className="dp-receipt-sheet mx-auto bg-white p-6 sm:p-7 rounded-xl shadow-md border border-slate-300 text-slate-950 font-sans text-xs leading-snug select-text"
            >
              {/* Header Klinik */}
              <div className="flex items-center justify-between pb-3.5 border-b-2 border-slate-950 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="shrink-0 flex items-center justify-center">
                    <NanoMasterLogo
                      src={settings.logoUrl}
                      height={50}
                      width={65}
                      className="max-h-[50px] max-w-[65px] object-contain print-kop-logo"
                    />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-none">
                      {clinicName}
                    </h2>
                    <p className="text-[11px] text-slate-700 font-medium mt-1">
                      {clinicAddress}
                    </p>
                    <p className="text-[11px] text-slate-700 font-semibold">
                      Telp / WA: {clinicPhone}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-950 border-2 border-slate-950 px-2.5 py-1 rounded">
                    KWITANSI PEMBAYARAN DP
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                    NOTA SEMENTARA
                  </div>
                </div>
              </div>

              {/* Informasi Pasien & Nota (TANPA Nama Dokter) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3.5 border-b border-slate-300 text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-24 shrink-0">Nama Pasien</span>
                    <span className="font-black text-slate-950">: {data.patientName || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-24 shrink-0">No. Rekam Medis</span>
                    <span className="font-mono font-bold text-slate-900">
                      : {data.rmNumber || 'Menunggu Penerbitan RM'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 sm:text-right">
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-slate-500">Tanggal Nota:</span>
                    <span className="font-bold text-slate-900">{formatDateIndo(data.date)}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="text-slate-500">No. Referensi:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {data.receiptNumber || 'NOTA-DP-SEMENTARA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Rincian Biaya */}
              <div className="py-3.5">
                <table className="w-full border-collapse text-[11.5px]">
                  <thead>
                    <tr className="border-y border-slate-950 bg-slate-50">
                      <th className="py-2 px-2.5 text-left font-black uppercase text-slate-900">
                        Keterangan Layanan / Paket
                      </th>
                      <th className="py-2 px-2.5 text-right font-black uppercase text-slate-900 w-40">
                        Nominal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-2.5">
                        <div className="font-bold text-slate-950">{data.packageName}</div>
                        {data.packageCategory && (
                          <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                            Kategori Paket: {data.packageCategory}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-950">
                        {formatRupiah(data.subtotal)}
                      </td>
                    </tr>

                    {Number(data.discount || 0) > 0 && (
                      <tr>
                        <td className="py-2 px-2.5 text-slate-700 font-medium">
                          Diskon / Potongan Promo
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                          - {formatRupiah(data.discount || 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Ringkasan Pembayaran DP & Sisa Tagihan */}
                <div className="mt-3 pt-3 border-t-2 border-slate-950 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <div
                      className={`inline-block px-3 py-1.5 rounded border-2 font-black text-xs uppercase tracking-wider ${
                        isPaidFull
                          ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                          : 'border-amber-800 bg-amber-50 text-amber-950'
                      }`}
                    >
                      {paymentStatusLabel}
                    </div>
                    {hasDp && (
                      <div className="text-[10.5px] text-slate-600 mt-1.5 font-medium">
                        Metode DP: <span className="font-bold text-slate-900">{paymentMethodLabel(data.paymentMethod)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-[11.5px]">
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-semibold">Total Tagihan:</span>
                      <span className="font-mono tabular-nums font-bold text-slate-950">
                        {formatRupiah(data.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-semibold">Uang Muka / DP Masuk:</span>
                      <span className="font-mono tabular-nums font-black text-emerald-800">
                        {formatRupiah(data.dpAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-300 text-xs font-black">
                      <span className="text-slate-950">Sisa Tagihan Pelunasan:</span>
                      <span className="font-mono tabular-nums text-amber-900">
                        {data.remainingAmount > 0 ? formatRupiah(data.remainingAmount) : 'LUNAS (Rp 0)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Catatan & Tanda Tangan Kasir/Admin Bertugas (TANPA Nama Dokter) */}
              <div className="pt-4 mt-2 border-t border-dashed border-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[10.5px]">
                <div className="max-w-xs space-y-1 text-slate-600">
                  <p className="font-bold text-slate-800">Catatan:</p>
                  <p>
                    1. Nota ini merupakan bukti pembayaran uang muka (DP) / nota sementara sebelum pelunasan.
                  </p>
                  <p>
                    2. Harap tunjukkan nota ini kepada petugas kasir saat proses pelunasan di hari tindakan.
                  </p>
                  {data.notes && (
                    <p className="text-slate-800 font-medium pt-0.5">Ket: {data.notes}</p>
                  )}
                </div>

                <div className="text-center min-w-[190px] self-end">
                  <div className="text-slate-600">
                    {city}, {formatDateIndo(data.date)}
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">Kasir / Admin Bertugas</div>
                  <div className="h-12" />
                  <div className="font-black text-slate-950 border-t border-dotted border-slate-500 pt-1 px-3">
                    ( {cashierName} )
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Format Struk Kasir Thermal 80mm */
            <div
              id="dp-receipt-print-document"
              className="dp-receipt-sheet thermal-80 max-w-[80mm] mx-auto p-4 bg-white text-slate-950 font-mono text-[11px] leading-tight select-text rounded-xl shadow-md border border-slate-300"
            >
              <div className="text-center pb-2.5 border-b border-dashed border-slate-400">
                <div className="font-black text-xs uppercase">{clinicName}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{clinicAddress}</div>
                <div className="text-[10px] text-slate-600">Telp/WA: {clinicPhone}</div>
                <div className="mt-2 border border-slate-950 py-0.5 px-2 inline-block font-black text-[10px]">
                  KWITANSI PEMBAYARAN DP
                </div>
                <div className="text-[9.5px] font-bold mt-0.5">NOTA SEMENTARA</div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10.5px]">
                <div className="flex justify-between gap-2">
                  <span>Tanggal</span>
                  <span>{formatDateIndo(data.date)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Pasien</span>
                  <span className="font-bold text-right">{data.patientName || '-'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>No. RM</span>
                  <span className="text-right">{data.rmNumber || 'Menunggu RM'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>No. Ref</span>
                  <span className="text-right">{data.receiptNumber || 'NOTA-DP'}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10.5px]">
                <div className="flex justify-between gap-2 font-bold">
                  <span>{data.packageName}</span>
                  <span className="tabular-nums">{formatRupiah(data.subtotal)}</span>
                </div>
                {Number(data.discount || 0) > 0 && (
                  <div className="flex justify-between gap-2">
                    <span>Diskon</span>
                    <span className="tabular-nums">- {formatRupiah(data.discount || 0)}</span>
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">{formatRupiah(data.totalAmount)}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>DP MASUK:</span>
                  <span className="tabular-nums">{formatRupiah(data.dpAmount)}</span>
                </div>
                <div className="flex justify-between font-black pt-0.5 border-t border-dotted border-slate-400">
                  <span>SISA TAGIHAN:</span>
                  <span className="tabular-nums">
                    {data.remainingAmount > 0 ? formatRupiah(data.remainingAmount) : 'LUNAS'}
                  </span>
                </div>
              </div>

              <div className="py-2 text-center border-b border-dashed border-slate-400">
                <div className="font-black text-[10.5px]">{paymentStatusLabel}</div>
                {hasDp && (
                  <div className="text-[9.5px] text-slate-600 mt-0.5">
                    Via: {paymentMethodLabel(data.paymentMethod)}
                  </div>
                )}
              </div>

              <div className="pt-2.5 text-center text-[9.5px] space-y-1">
                <p>Simpan nota ini sebagai bukti DP sebelum pelunasan.</p>
                <p className="font-bold pt-1">Kasir: {cashierName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer (Tidak ikut tercetak) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0 no-print">
          <div className="text-[11px] font-medium text-slate-600">
            Menampilkan kasir bertugas: <strong className="text-slate-900">{cashierName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase cursor-pointer whitespace-nowrap shrink-0"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
