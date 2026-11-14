import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ExpenseTransaction } from '../../types';
import { 
  TrendingDown, Plus, Search, Filter, Calendar, DollarSign, 
  Tag, FileText, CheckCircle2, X, Pencil, Trash2, AlertTriangle
} from 'lucide-react';

export const ExpenseListView: React.FC = () => {
  const { expenses, expenseCategories, addExpense, updateExpense, deleteExpense, showToast } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseTransaction | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseTransaction | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [expenseCategoryId, setExpenseCategoryId] = useState<number>(expenseCategories[0]?.id || 1);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredExpenses = expenses.filter((e) => {
    const titleText = e.title || e.description || '';
    const transText = e.transactionNumber || '';
    const vendorText = e.vendor || '';

    const matchesSearch = 
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorText.toLowerCase().includes(searchTerm.toLowerCase());
    
    const catId = e.expenseCategoryId || (e as any).categoryId;
    const matchesCat = categoryFilter === 'ALL' || String(catId) === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setExpenseCategoryId(expenseCategories[0]?.id || 1);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setTitle('');
    setAmount(0);
    setPaymentMethod('TRANSFER');
    setVendor('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseTransaction) => {
    setEditingExpense(exp);
    const catId = exp.expenseCategoryId || (exp as any).categoryId || expenseCategories[0]?.id || 1;
    setExpenseCategoryId(Number(catId));
    setExpenseDate(exp.expenseDate || new Date().toISOString().split('T')[0]);
    setTitle(exp.title || exp.description || '');
    setAmount(Number(exp.amount) || 0);
    setPaymentMethod(exp.paymentMethod === 'CASH' ? 'CASH' : 'TRANSFER');
    setVendor(exp.vendor || '');
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (exp: ExpenseTransaction) => {
    setDeletingExpense(exp);
    setDeleteReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      showToast('Judul/rincian pengeluaran dan nominal (lebih besar dari 0) wajib diisi', 'error');
      return;
    }

    const cat = expenseCategories.find(c => c.id === Number(expenseCategoryId));
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, {
          expenseCategoryId: Number(expenseCategoryId),
          categoryId: Number(expenseCategoryId),
          categoryName: cat?.name || 'Operasional',
          expenseDate,
          title: title.trim(),
          description: title.trim(),
          amount: Number(amount),
          paymentMethod,
          vendor: vendor.trim(),
          notes: notes.trim(),
        });
        if (res.success) {
          setIsModalOpen(false);
          setEditingExpense(null);
        }
      } else {
        const res = await addExpense({
          expenseCategoryId: Number(expenseCategoryId),
          categoryId: Number(expenseCategoryId),
          categoryName: cat?.name || 'Operasional',
          expenseDate,
          title: title.trim(),
          description: title.trim(),
          amount: Number(amount),
          paymentMethod,
          vendor: vendor.trim(),
          notes: notes.trim(),
        });
        if (res.success) {
          setIsModalOpen(false);
          setTitle('');
          setAmount(0);
          setVendor('');
          setNotes('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      const res = await deleteExpense(deletingExpense.id, deleteReason.trim() || 'Dihapus dari menu beban operasional');
      if (res.success) {
        setDeletingExpense(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Beban & Pengeluaran Operasional Klinik
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Pencatatan biaya alat khitan steril (klem/ring/sealer), obat-obatan, sewa gedung, listrik, dan utilitas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          + Catat Pengeluaran
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran Tercatat</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatRupiah(totalFiltered)}</div>
        </div>
        <div className="text-xs text-slate-500 font-medium max-w-sm sm:text-right">
          Beban operasional ini langsung mengurangi omzet dalam perhitungan Laba Bersih di laporan keuangan.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengeluaran, vendor, no. transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="ALL">Semua Kategori Beban</option>
            {expenseCategories.map((c, idx) => (
              <option key={`exp-cat-opt-${c.id}-${idx}`} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">No. Transaksi & Tgl</th>
                <th className="py-3.5 px-4">Kategori Beban</th>
                <th className="py-3.5 px-4">Keterangan / Item</th>
                <th className="py-3.5 px-4">Vendor / Toko</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4 text-right">Nominal Beban</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Belum ada data pengeluaran operasional.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={`exp-row-${exp.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-black text-slate-900 text-xs">{exp.transactionNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{exp.expenseDate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{exp.title || exp.description || 'Pengeluaran'}</div>
                      {exp.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">{exp.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {exp.vendor || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-600">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600 text-sm">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-sky-200"
                          title="Edit Pengeluaran"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  {editingExpense ? 'Edit Pengeluaran Klinik' : 'Catat Pengeluaran Klinik'}
                </h3>
                {editingExpense && (
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    No: <span className="font-bold text-rose-600">{editingExpense.transactionNumber}</span>
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingExpense(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Kategori Pengeluaran:
                </label>
                <select
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {expenseCategories.map((c, idx) => (
                    <option key={`modal-cat-opt-${c.id}-${idx}`} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Tanggal Pengeluaran:
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Nama / Rincian Pengeluaran:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pembelian 50 pcs Klem Nano Sealer Steril"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Nominal Pengeluaran (Rp):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Metode Bayar:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="TRANSFER">Transfer Kas Operasional</option>
                    <option value="CASH">Kas Kecil (Petty Cash)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                    Vendor / Supplier:
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. PT Medika Mandiri"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                  Catatan Tambahan:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan pendukung"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : (editingExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pengeluaran */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Hapus Pengeluaran Operasional?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan ini akan menghapus catatan beban dari pembukuan klinik dan laporan laba rugi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info ringkas expense */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">No. Transaksi:</span>
                <span className="font-mono font-bold text-slate-800">{deletingExpense.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tanggal:</span>
                <span className="font-semibold text-slate-800">{deletingExpense.expenseDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Kategori:</span>
                <span className="font-semibold text-rose-700">{deletingExpense.categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Rincian:</span>
                <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                  {deletingExpense.title || deletingExpense.description}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700">Nominal:</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  {formatRupiah(deletingExpense.amount)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
                Alasan Penghapusan (Opsional):
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Salah input nominal / duplikat"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
