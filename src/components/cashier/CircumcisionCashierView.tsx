import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Receipt, DollarSign, Search, Filter, CreditCard, 
  CheckCircle2, AlertCircle, Clock, X, ShieldAlert, ArrowDownRight, Sparkles, ExternalLink, Printer
} from 'lucide-react';
import { Invoice, TransactionItem } from '../../types';
import { NanoMasterLogo, PrintReceiptIcon, PrintInvoiceIcon } from '../common/PrintIcons';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';
import { hasMenuPermission } from '../../utils/permissionUtils';
import { DpReceiptPrintModal, DpReceiptData } from './DpReceiptPrintModal';

interface CircumcisionCashierViewProps {
  initialInvoiceId?: number | null;
  autoOpenPayment?: boolean;
  onClearInitial?: () => void;
}

export const CircumcisionCashierView: React.FC<CircumcisionCashierViewProps> = ({
  initialInvoiceId,
  autoOpenPayment = false,
  onClearInitial,
}) => {
  const { invoices, payInvoice, cancelInvoice, voidInvoice, getTransactionItems, currentUser, settings, branches, activeBranchCode, showToast } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<TransactionItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<'A4' | 'POS'>('A4');
  const [dpReceiptData, setDpReceiptData] = useState<DpReceiptData | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS' | 'DEBIT'>('CASH');
  const [refNumber, setRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Auto-focus and open invoice if navigated from procedure room
  useEffect(() => {
    if (initialInvoiceId && invoices.length > 0) {
      const inv = invoices.find(
        (i) => i.id === initialInvoiceId || i.bookingId === initialInvoiceId
      );
      if (inv) {
        setSelectedInvoice(inv);
        setPaymentAmount(inv.remainingAmount);
        setSearchTerm(inv.patientName || inv.invoiceNumber);
        if (autoOpenPayment && inv.remainingAmount > 0) {
          setIsPaymentModalOpen(true);
        }
      }
    }
  }, [initialInvoiceId, invoices, autoOpenPayment]);

  const isAuthorized = hasMenuPermission(currentUser, 'cashier');
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white rounded-2xl border border-red-200 shadow-sm space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase">Akses Terbatas: Menu Kasir &amp; Pembayaran</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Menu Kasir dan fungsi penerimaan pembayaran khusus diperuntukkan bagi petugas <strong>Kasir</strong> atau pengguna dengan otoritas berwenang (seperti <strong>Owner / Admin</strong>).
        </p>
        <p className="text-xs text-slate-500">
          Anda saat ini masuk sebagai <strong>{currentUser?.fullName || currentUser?.name || currentUser?.email} ({currentUser?.role})</strong>. Jika Anda memerlukan akses kasir, silakan hubungi Administrator untuk mengaktifkan izin &quot;Kasir &amp; Invoice Pembayaran&quot; pada menu Manajemen Pengguna.
        </p>
      </div>
    );
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDateIndonesian = (dateStr?: string) => {
    if (!dateStr) return '............................';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${d} ${months[m - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.rmNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.remainingAmount);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDpReceipt = (inv: Invoice) => {
    const latestDpPayment = inv.payments && inv.payments.length > 0
      ? inv.payments[inv.payments.length - 1]
      : undefined;
    setDpReceiptData({
      receiptNumber: inv.invoiceNumber,
      patientName: inv.patientName,
      rmNumber: inv.rmNumber,
      date: inv.invoiceDate,
      packageName: inv.packageName || 'Paket Khitan',
      packageCategory: inv.categoryCode,
      subtotal: inv.subtotal,
      discount: inv.discount,
      totalAmount: inv.totalAmount,
      dpAmount: inv.paidAmount,
      remainingAmount: inv.remainingAmount,
      paymentMethod: latestDpPayment?.paymentMethod || 'TRANSFER',
      notes: inv.notes || undefined,
      branchCode: inv.branchCode || activeBranchCode || 'PUSAT',
      cashierName: currentUser?.fullName || currentUser?.name || currentUser?.username || 'Kasir / Admin',
    });
  };

  const handleOpenPrint = async (inv: Invoice, format: 'A4' | 'POS' = 'A4') => {
    setSelectedInvoice(inv);
    setPrintFormat(format);
    setIsPrintModalOpen(true);
    try {
      const items = await getTransactionItems(inv.bookingId);
      setInvoiceItems(items);
    } catch (err) {
      console.error(err);
      setInvoiceItems([]);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      showToast('Nominal pembayaran harus lebih dari 0', 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await payInvoice(selectedInvoice.id, {
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: refNumber,
        notes: paymentNotes,
      });

      if (res.success) {
        // Immediate local state update for seamless UX without page refresh
        const newPaid = (selectedInvoice.paidAmount || 0) + paymentAmount;
        const newRemaining = Math.max(0, (selectedInvoice.totalAmount || 0) - newPaid);
        setSelectedInvoice({
          ...selectedInvoice,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? 'PAID' : 'PARTIAL',
        });
        setIsPaymentModalOpen(false);
        setRefNumber('');
        setPaymentNotes('');
        if (onClearInitial) {
          onClearInitial();
        }
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancelInvoice = async (inv: Invoice) => {
    if (currentUser?.role === 'staff') {
      showToast('Hanya Administrator yang memiliki hak akses membatalkan invoice.', 'error');
      return;
    }
    const reason = window.prompt ? window.prompt('Masukkan alasan pembatalan invoice:') : 'Dibatalkan oleh admin';
    if (reason) {
      await cancelInvoice(inv.id, reason);
    }
  };

  const handleVoidInvoice = async (inv: Invoice) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'owner') {
      showToast('Hanya Super Admin / Owner yang berwenang melakukan VOID pembatalan invoice.', 'error');
      return;
    }
    const reason = window.prompt ? window.prompt(`Masukkan alasan wajib VOID pembatalan invoice ${inv.invoiceNumber}:`) : 'VOID oleh super admin';
    if (!reason || !reason.trim()) {
      showToast('Alasan pembatalan VOID wajib diisi.', 'error');
      return;
    }
    await voidInvoice(inv.id, reason.trim());
  };

  return (
    <div className={`space-y-6 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Invoice &amp; Kasir Khitan
            </h1>
            <span className="hidden sm:inline-flex text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Billing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Pengelolaan invoice otomatis, pelunasan sisa biaya tindakan, dan pencatatan kas riil klinik.
          </p>
        </div>
      </div>

      {/* Direct Arrival from Procedure Room Banner */}
      {initialInvoiceId && selectedInvoice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                  Pasien dari Ruang Tindakan Selesai
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mt-0.5">
                {selectedInvoice.patientName} (No. RM: {selectedInvoice.rmNumber})
              </h4>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Total Biaya: <span className="font-bold text-slate-900">{formatRupiah(selectedInvoice.totalAmount)}</span> • Sudah Dibayar: <span className="font-bold text-emerald-700">{formatRupiah(selectedInvoice.paidAmount)}</span> • Sisa: <span className="font-bold text-rose-600">{formatRupiah(selectedInvoice.remainingAmount)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {selectedInvoice.remainingAmount > 0 ? (
              <button
                type="button"
                onClick={() => handleOpenPayment(selectedInvoice)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar / Lunasi Sekarang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenPrint(selectedInvoice, 'A4')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PrintInvoiceIcon size={16} />
                <span>Cetak Invoice (A4)</span>
              </button>
            )}
            {onClearInitial && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onClearInitial();
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor invoice (e.g. INV-20260902-0001), nama pasien, no. RM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status Invoice</option>
            <option value="PAID">PAID (Lunas)</option>
            <option value="PARTIAL">PARTIAL (Ada Sisa Tagihan)</option>
            <option value="UNPAID">UNPAID (Belum Bayar)</option>
            <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">No. Invoice &amp; Tanggal</th>
                <th className="py-3.5 px-4">Pasien &amp; Booking</th>
                <th className="py-3.5 px-4">Paket Khitan</th>
                <th className="py-3.5 px-4">Total Biaya</th>
                <th className="py-3.5 px-4">Telah Dibayar</th>
                <th className="py-3.5 px-4">Sisa Tagihan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    Tidak ada data invoice yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={`cashier-inv-${inv.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{inv.invoiceDate}</div>
                      <span className="inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                        {inv.branchCode || 'PUSAT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-xs">{inv.patientName}</div>
                      <div className="font-mono text-[11px] text-sky-700 font-bold">{inv.rmNumber}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Wali: {inv.guardianName}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.categoryCode === 'VIP' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.categoryCode}
                      </span>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">{inv.packageName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-xs">
                      {formatRupiah(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 text-xs">
                      {formatRupiah(inv.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-xs">
                      {inv.remainingAmount > 0 ? (
                        <span className="text-rose-600">{formatRupiah(inv.remainingAmount)}</span>
                      ) : (
                        <span className="text-slate-400">Rp 0 (Lunas)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        inv.status === 'UNPAID' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'VOID' && (
                        <>
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap shrink-0"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pelunasan</span>
                          </button>
                          <button
                            onClick={() => handleOpenDpReceipt(inv)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                            title="Cetak Kwitansi DP / Nota Sementara (sebelum pelunasan)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Nota DP</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenPrint(inv, 'A4')}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
                        title="Cetak Invoice Resmi (1 Lembar A4)"
                      >
                        <PrintInvoiceIcon size={14} />
                        <span>Invoice A4</span>
                      </button>
                      {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && inv.status !== 'CANCELLED' && inv.status !== 'VOID' && (
                        <button
                          onClick={() => handleVoidInvoice(inv)}
                          className="px-2.5 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          title="Batalkan Invoice (VOID) & Kembalikan Stok"
                        >
                          VOID
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Pembayaran / Pelunasan */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[94vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Proses Pembayaran Kasir
                </h3>
                <p className="text-xs text-slate-500 font-mono">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pasien:</span>
                    <span className="font-bold text-slate-900">{selectedInvoice.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Tagihan:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sudah Dibayar:</span>
                    <span className="font-bold text-emerald-600">{formatRupiah(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                    <span className="text-slate-900">Sisa Tagihan:</span>
                    <span className="text-amber-700">{formatRupiah(selectedInvoice.remainingAmount)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Nominal Pembayaran (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CASH">Tunai / Kasir Front Office</option>
                    <option value="TRANSFER">Transfer Bank (BCA / Mandiri)</option>
                    <option value="QRIS">QRIS Dinamis</option>
                    <option value="DEBIT">Debit EDC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Nomor Referensi Transaksi (Opsional):
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. TRX-BCA-98124 / Struk EDC"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Catatan:
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Pelunasan di hari tindakan khitan"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenDpReceipt(selectedInvoice)}
                  className="px-3 py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  title="Cetak Kwitansi Pembayaran DP / Nota Sementara"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Nota DP</span>
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    disabled={isSubmittingPayment}
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      'Catat Pembayaran'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Struk / Invoice Resmi (1 Lembar A4 & POS) */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
          <div className={`bg-white rounded-2xl w-full ${printFormat === 'A4' ? 'max-w-4xl' : 'max-w-md'} max-h-[96vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto print-modal-card`}>
            {/* Modal Header (No Print) */}
            <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0 bg-slate-50 gap-3 no-print">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Cetak Bukti Pembayaran Khitan
                </span>
                {/* Format Selector Tabs */}
                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintFormat('A4')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      printFormat === 'A4'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Invoice Resmi (1 Lembar A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('POS')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      printFormat === 'POS'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧾 Struk Kasir (POS)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-transparent">
              {/* ========================================================================= */}
              {/* OPSI 1: INVOICE RESMI 1 LEMBAR A4 (PAS TANPA LEBIH KE HALAMAN 2) */}
              {/* ========================================================================= */}
              {(() => {
                const currentInvoiceBranch = branches?.find(b => b.code.toUpperCase() === (selectedInvoice?.branchCode || activeBranchCode || 'PUSAT').toUpperCase());
                const printClinicName = currentInvoiceBranch?.name || settings.clinicName || 'NANO CIRCUMCISION CLINIC';
                const printAddress = currentInvoiceBranch?.address || settings.address || 'Ruko Khayangan Nomor RB-16 Bangkalan';
                const printPhone = currentInvoiceBranch?.phone || settings.phone || '085236069788';
                const printCity = currentInvoiceBranch?.name?.includes('(')
                  ? currentInvoiceBranch.name.split('(')[1]?.replace(')', '').trim()
                  : (currentInvoiceBranch?.address?.toLowerCase().includes('surabaya') ? 'Surabaya'
                    : currentInvoiceBranch?.address?.toLowerCase().includes('sidoarjo') ? 'Sidoarjo'
                    : currentInvoiceBranch?.address?.toLowerCase().includes('malang') ? 'Malang'
                    : 'Bangkalan');

                return printFormat === 'A4' ? (
                <div id="invoice-print-document" className="invoice-a4-page mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 text-slate-950 font-sans text-[11px] leading-tight select-text print:shadow-none print:border-none print:rounded-none">
                  {/* Kop Surat Klinik Resmi */}
                  <div className="flex items-center justify-between pb-3 border-b-2 border-slate-950 gap-4">
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
                          {printClinicName}
                        </h2>
                        <p className="text-[11px] font-bold text-sky-800 mt-0.5">
                          {(settings.tagline && settings.tagline !== 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit' && settings.tagline !== 'Pusat Sunat Canggih & Modern Tanpa Jahit') ? settings.tagline : 'Sunat Canggih & Modern'}
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                          {printAddress} • Telp/WA: {printPhone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 border-2 border-slate-950 rounded px-2.5 py-1 bg-slate-50 block">
                        INVOICE RESMI
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                        BUKTI PEMBAYARAN SAH
                      </span>
                    </div>
                  </div>

                  {/* Header Metadata Grid (2 Kolom Bersih) */}
                  <div className="grid grid-cols-2 gap-4 my-3 text-[10.5px]">
                    {/* Kolom Kiri: Tagihan Kepada */}
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        TAGIHAN KEPADA:
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline pt-0.5">
                        <span className="col-span-4 text-slate-500">Nama Pasien</span>
                        <span className="col-span-8 font-bold text-slate-950">: An. {selectedInvoice.patientName}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 text-slate-500">No. Rekam Medis</span>
                        <span className="col-span-8 font-mono font-bold text-slate-900">: {selectedInvoice.rmNumber || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 text-slate-500">Orang Tua / Wali</span>
                        <span className="col-span-8 text-slate-900">: Tn./Ny. {selectedInvoice.guardianName || '-'}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-4 text-slate-500">Dokter Operator</span>
                        <span className="col-span-8 text-slate-900">: {selectedInvoice.doctorName || '-'}</span>
                      </div>
                    </div>

                    {/* Kolom Kanan: Rincian Transaksi */}
                    <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        RINCIAN TRANSAKSI:
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline pt-0.5">
                        <span className="col-span-5 text-slate-500">No. Invoice</span>
                        <span className="col-span-7 font-mono font-black text-slate-950">: {selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-5 text-slate-500">Tanggal Tagihan</span>
                        <span className="col-span-7 font-mono text-slate-900">: {formatDateIndonesian(selectedInvoice.invoiceDate)}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-5 text-slate-500">Kategori Paket</span>
                        <span className="col-span-7 font-semibold text-slate-900">: {selectedInvoice.categoryCode}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <span className="col-span-5 text-slate-500">Status Bayar</span>
                        <span className="col-span-7">
                          : <span className={`inline-block px-2 py-0.2 rounded text-[9.5px] font-black uppercase tracking-wider border ${
                              selectedInvoice.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                : 'bg-amber-100 text-amber-900 border-amber-400'
                            }`}>
                              {selectedInvoice.status === 'PAID' ? 'LUNAS' : 'BELUM LUNAS'}
                            </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Rincian Biaya & Item Layanan */}
                  <div className="border border-slate-900 rounded-xs overflow-hidden my-2">
                    <table className="w-full border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold">
                          <th className="py-1.5 px-2 text-center w-8 border-r border-slate-800">No</th>
                          <th className="py-1.5 px-3 text-left">Deskripsi Layanan &amp; Produk Khitan</th>
                          <th className="py-1.5 px-2 text-left w-32 border-l border-slate-800">Kategori</th>
                          <th className="py-1.5 px-2 text-center w-16 border-l border-slate-800">Qty</th>
                          <th className="py-1.5 px-2.5 text-right w-28 border-l border-slate-800">Tarif Satuan</th>
                          <th className="py-1.5 px-2.5 text-right w-28 border-l border-slate-800">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* Baris Paket Khitan */}
                        <tr className="bg-slate-50/60">
                          <td className="py-2 px-2 text-center font-mono border-r border-slate-200">1</td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-950">
                              Tindakan Medis: {selectedInvoice.packageName}
                            </div>
                            <div className="text-[9.5px] text-slate-500 mt-0.5">
                              Paket Layanan Khitan Modern Nano Circumcision Clinic
                            </div>
                          </td>
                          <td className="py-2 px-2 border-l border-slate-200 text-slate-600">
                            Paket Utama
                          </td>
                          <td className="py-2 px-2 text-center border-l border-slate-200 font-mono">
                            1 Paket
                          </td>
                          <td className="py-2 px-2.5 text-right border-l border-slate-200 font-mono">
                            {formatRupiah(selectedInvoice.subtotal)}
                          </td>
                          <td className="py-2 px-2.5 text-right border-l border-slate-200 font-mono font-bold text-slate-950">
                            {formatRupiah(selectedInvoice.subtotal)}
                          </td>
                        </tr>

                        {/* Baris Perlengkapan & Obat Tambahan */}
                        {invoiceItems && invoiceItems.length > 0 && invoiceItems.map((item, idx) => (
                          <tr key={`inv-row-item-${item.id || item.productId}-${idx}`} className="text-slate-800">
                            <td className="py-1.5 px-2 text-center font-mono border-r border-slate-200">{idx + 2}</td>
                            <td className="py-1.5 px-3">
                              <span className="font-medium">{item.productName}</span>
                            </td>
                            <td className="py-1.5 px-2 border-l border-slate-200">
                              {item.itemType === 'INCLUDED' ? (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
                                  Termasuk Paket
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1 py-0.2 rounded">
                                  Tambahan (Add-on)
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center border-l border-slate-200 font-mono">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-1.5 px-2.5 text-right border-l border-slate-200 font-mono text-slate-600">
                              {item.itemType === 'INCLUDED' ? 'Rp 0' : formatRupiah(item.unitPrice)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right border-l border-slate-200 font-mono font-semibold">
                              {item.itemType === 'INCLUDED' ? 'Rp 0' : formatRupiah(item.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Rekap Finansial & Pengesahan Kasir (2 Kolom Bawah) */}
                  <div className="grid grid-cols-12 gap-4 mt-2 pt-1">
                    {/* Kolom Kiri: Riwayat Transaksi & Catatan Legal */}
                    <div className="col-span-7 flex flex-col justify-between">
                      <div>
                        {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/70 mb-2">
                            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                              Catatan Riwayat Pembayaran:
                            </span>
                            <div className="space-y-0.5 text-[10px]">
                              {selectedInvoice.payments.map((p, idx) => (
                                <div key={`inv-pay-${p.id}-${idx}`} className="flex justify-between text-slate-600">
                                  <span>• {p.paymentType} via {p.paymentMethod} ({p.paymentDate})</span>
                                  <span className="font-mono font-bold text-slate-800">{formatRupiah(p.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-[9.5px] text-slate-500 italic leading-snug">
                          {settings.invoiceFooter || 'Terima kasih atas kepercayaan Bapak/Ibu mempercayakan tindakan khitan putra tercinta di Nano Circumcision Clinic. Kwitansi ini sah sebagai bukti pembayaran resmi.'}
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 font-mono mt-2">
                        Dicetak otomatis oleh Sistem Manajemen Klinik Nano Circumcision • ID Transaksi: #{selectedInvoice.id}
                      </div>
                    </div>

                    {/* Kolom Kanan: Rincian Angka & Tanda Tangan */}
                    <div className="col-span-5 space-y-2 text-[10.5px]">
                      <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 space-y-1">
                        <div className="flex justify-between text-slate-700">
                          <span>Subtotal Biaya:</span>
                          <span className="font-mono font-bold">{formatRupiah(selectedInvoice.subtotal)}</span>
                        </div>
                        {selectedInvoice.discount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Diskon Khusus:</span>
                            <span className="font-mono">- {formatRupiah(selectedInvoice.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-black text-slate-950 pt-1 border-t border-slate-300">
                          <span>TOTAL TAGIHAN:</span>
                          <span className="font-mono">{formatRupiah(selectedInvoice.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800">
                          <span>Jumlah Dibayar:</span>
                          <span className="font-mono">{formatRupiah(selectedInvoice.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black pt-1 border-t border-slate-300">
                          <span>SISA TAGIHAN:</span>
                          <span className={selectedInvoice.remainingAmount > 0 ? 'text-amber-800 font-mono' : 'text-emerald-800 font-mono'}>
                            {selectedInvoice.remainingAmount > 0 ? formatRupiah(selectedInvoice.remainingAmount) : 'LUNAS (Rp 0)'}
                          </span>
                        </div>
                      </div>

                      {/* Kolom Tanda Tangan Kasir */}
                      <div className="text-center pt-1 text-[10px]">
                        <div className="text-slate-600">{printCity}, {formatDateIndonesian(selectedInvoice.invoiceDate)}</div>
                        <div className="font-bold text-slate-900 mt-0.5">Petugas Kasir / Administrasi</div>
                        <div className="h-10" /> {/* Area TTD / Cap Stempel */}
                        <div className="font-bold text-slate-950 border-t border-dotted border-slate-400 pt-0.5 inline-block px-4">
                          ( {currentUser?.fullName || 'Kasir Nano Circumcision'} )
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* OPSI 2: STRUK THERMAL POS (UNTUK PRINTER KASIR GULUNGAN 58/80MM) */
                /* ========================================================================= */
                <div id="invoice-pos-document" className="max-w-[80mm] mx-auto p-4 bg-white text-slate-950 font-mono text-[11px] leading-tight select-text rounded-xl shadow-lg border border-slate-300 print:shadow-none print:border-none print:rounded-none print:p-0">
                  <div className="text-center pb-3 border-b border-dashed border-slate-400">
                    <div className="font-black text-sm uppercase tracking-tight">
                      {printClinicName}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {printAddress}
                    </div>
                    <div className="text-[10px] text-slate-600">
                      WA/Telp: {printPhone}
                    </div>
                    <div className="mt-2 text-[10px] font-bold border border-slate-900 py-0.5 px-2 inline-block">
                      STRUK BUKTI PEMBAYARAN
                    </div>
                  </div>

                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10.5px]">
                    <div className="flex justify-between">
                      <span>No. Inv</span>
                      <span className="font-bold">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal</span>
                      <span>{selectedInvoice.invoiceDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pasien</span>
                      <span className="font-bold truncate max-w-[140px]">{selectedInvoice.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No. RM</span>
                      <span>{selectedInvoice.rmNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dokter</span>
                      <span className="truncate max-w-[140px]">{selectedInvoice.doctorName || '-'}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10.5px]">
                    <div className="flex justify-between font-bold">
                      <span className="truncate max-w-[150px]">{selectedInvoice.packageName}</span>
                      <span>{formatRupiah(selectedInvoice.subtotal)}</span>
                    </div>
                    {invoiceItems && invoiceItems.length > 0 && invoiceItems.map((item, idx) => (
                      <div key={`thermal-item-${item.id || item.productId}-${idx}`} className="flex justify-between text-[10px] text-slate-700">
                        <span className="truncate max-w-[150px]">
                          + {item.productName} ({item.quantity} {item.unit})
                        </span>
                        <span>{item.itemType === 'INCLUDED' ? 'Rp 0' : formatRupiah(item.totalAmount)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Diskon:</span>
                        <span>- {formatRupiah(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-xs pt-1">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>DIBAYAR:</span>
                      <span>{formatRupiah(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-black">
                      <span>SISA:</span>
                      <span>{selectedInvoice.remainingAmount > 0 ? formatRupiah(selectedInvoice.remainingAmount) : 'LUNAS (Rp 0)'}</span>
                    </div>
                  </div>

                  {/* Riwayat Transaksi POS */}
                  {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                    <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                      <span className="font-bold block">Riwayat Transaksi:</span>
                      {selectedInvoice.payments.map((p, idx) => (
                        <div key={`thermal-pay-${p.id}-${idx}`} className="flex justify-between text-slate-600">
                          <span>• {p.paymentType} ({p.paymentMethod})</span>
                          <span>{formatRupiah(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center pt-3 text-[9.5px] text-slate-600 space-y-1">
                    <p className="font-bold">*** TERIMA KASIH ***</p>
                    <p className="italic">{settings.invoiceFooter || 'Semoga Ananda lekas pulih dan sehat selalu.'}</p>
                    <p className="text-[8.5px] text-slate-400">Kasir: {currentUser?.fullName || 'Admin'}</p>
                  </div>
                </div>
              );
              })()}
            </div>

            {/* Action Footer (No Print) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0 no-print">
              <div className="text-xs font-medium">
                {printFormat === 'A4' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Format A4 Dioptimalkan: 1 Lembar Pas
                  </span>
                ) : (
                  <span className="text-sky-700 font-bold flex items-center gap-1">
                    ✓ Format Struk Kasir Thermal (POS 58/80mm)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedInvoice) return;
                    const elemId = printFormat === 'A4' ? 'invoice-print-document' : 'invoice-pos-document';
                    openElementInNewTab(elemId, {
                      title: printFormat === 'A4' 
                        ? `Invoice #${selectedInvoice.invoiceNumber} - ${selectedInvoice.patientName}`
                        : `Struk POS #${selectedInvoice.invoiceNumber} - ${selectedInvoice.patientName}`,
                      paperSize: printFormat === 'A4' ? 'A4' : 'POS-80',
                      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
                    });
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-sky-700 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Buka pratinjau di tab baru untuk cetak mandiri atau simpan PDF"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tab Baru / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedInvoice) return;
                    setPrintFormat('A4');
                    setTimeout(() => {
                      printElementById('invoice-print-document', {
                        title: `Invoice #${selectedInvoice.invoiceNumber} - ${selectedInvoice.patientName}`,
                        paperSize: 'A4',
                        clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
                      });
                    }, 50);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                    printFormat === 'A4'
                      ? 'bg-slate-900 hover:bg-slate-800 text-white ring-2 ring-slate-900 ring-offset-1'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <PrintInvoiceIcon size={16} />
                  Cetak Invoice (1 Lembar A4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedInvoice) return;
                    setPrintFormat('POS');
                    setTimeout(() => {
                      printElementById('invoice-pos-document', {
                        title: `Struk POS #${selectedInvoice.invoiceNumber} - ${selectedInvoice.patientName}`,
                        paperSize: 'POS-80',
                        clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
                      });
                    }, 50);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                    printFormat === 'POS'
                      ? 'bg-sky-600 hover:bg-sky-500 text-white ring-2 ring-sky-600 ring-offset-1'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                  }`}
                >
                  <PrintReceiptIcon size={16} />
                  Cetak Struk POS
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DpReceiptPrintModal
        isOpen={Boolean(dpReceiptData)}
        onClose={() => setDpReceiptData(null)}
        data={dpReceiptData}
      />
    </div>
  );
};
