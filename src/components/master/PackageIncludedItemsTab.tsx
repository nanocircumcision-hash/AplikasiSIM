import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { PackageIncludedItem, ProductCategory } from '../../types';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  Boxes,
} from 'lucide-react';

export const PackageIncludedItemsTab: React.FC = () => {
  const {
    packages,
    categories,
    products,
    packageItems,
    savePackageItem,
    deletePackageItem,
    showToast,
  } = useClinic();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<PackageIncludedItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    packageId: packages[0]?.id || 1,
    patientCategoryId: 1, // 1: REG, 2: VIP
    productId: products[0]?.id || 1,
    quantity: 1,
  });

  const handleOpenAdd = (pkgId?: number, catId?: number) => {
    // Find celana sunat product if possible
    const celana = products.find((p) => p.category === 'CELANA_SUNAT');
    setFormData({
      packageId: pkgId || packages[0]?.id || 1,
      patientCategoryId: catId || 1,
      productId: celana ? celana.id : products[0]?.id || 1,
      quantity: catId === 2 ? 2 : 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await savePackageItem(formData);
    if (res.success) {
      setIsModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      setIsDeleting(true);
      await deletePackageItem(ruleToDelete.id);
      setRuleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Pengaturan Dinamis (No Hard-code)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Konfigurasi Isi Paket Khitan (Perlengkapan Included Rp 0)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur barang/produk yang otomatis menjadi hak pasien tanpa biaya tambahan (Included). Contoh: Celana Sunat 2 pcs untuk VIP, 1 pcs untuk Reguler.
          </p>
        </div>

        <button
          id="btn-add-package-rule"
          onClick={() => handleOpenAdd()}
          className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Aturan Isi Paket
        </button>
      </div>

      {/* Package Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const pkgRules = packageItems.filter((i) => i.packageId === pkg.id);

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">{pkg.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{pkg.description}</p>
                </div>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[11px] font-mono font-bold">
                  {pkg.code}
                </span>
              </div>

              {/* Rules categorized by REGULER and VIP */}
              <div className="space-y-3">
                {categories.map((cat) => {
                  const catRules = pkgRules.filter(
                    (r) => r.patientCategoryId === cat.id || !r.patientCategoryId
                  );
                  const isVip = cat.code === 'VIP';

                  return (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-xl border ${
                        isVip
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-black uppercase tracking-wider ${
                            isVip ? 'text-amber-900' : 'text-slate-700'
                          }`}
                        >
                          Kategori: {cat.name} ({cat.code})
                        </span>
                        <button
                          onClick={() => handleOpenAdd(pkg.id, cat.id)}
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah Item
                        </button>
                      </div>

                      {catRules.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          Belum ada item default yang diatur.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {catRules.map((rule) => {
                            const prod = products.find((p) => p.id === rule.productId);
                            return (
                              <div
                                key={rule.id}
                                className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <span className="font-bold text-slate-800">
                                      {rule.productName || prod?.name || 'Produk'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                      ({rule.productSku || prod?.sku})
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-black text-xs">
                                    {rule.quantity} {rule.unit || prod?.unit || 'pcs'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRuleToDelete(rule)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                    title="Hapus aturan isi paket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Aturan Isi Paket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-700" />
                Tambah Aturan Barang Included Paket
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Paket Khitan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.packageId}
                  onChange={(e) => setFormData({ ...formData, packageId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pasien <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.patientCategoryId}
                  onChange={(e) => setFormData({ ...formData, patientCategoryId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produk / Perlengkapan Khitan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.category}] (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah / Kuantitas Yang Didapatkan Pasien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Contoh: Pasien VIP mendapatkan 2 pcs celana sunat, Reguler 1 pcs.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Simpan Aturan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Aturan */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 text-base">Hapus Aturan Isi Paket?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <strong>{ruleToDelete.productName || 'produk ini'}</strong> ({ruleToDelete.quantity} {ruleToDelete.unit || 'pcs'}) dari aturan paket khitan?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setRuleToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
