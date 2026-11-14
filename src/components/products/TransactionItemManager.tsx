import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { TransactionItem, Product, CelanaSize, DrugType, DrugClassification } from '../../types';
import {
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Droplets,
  HelpCircle,
  X,
  Sparkles,
  ShieldCheck,
  Pill,
  Check,
  RefreshCw,
  Info,
  ChevronRight,
} from 'lucide-react';

interface TransactionItemManagerProps {
  bookingId: number;
  patientName: string;
  categoryName?: string; // 'Reguler' or 'VIP'
  packageName?: string;
  isReadOnly?: boolean;
  onItemsChanged?: () => void;
}

const ALL_CELANA_SIZES: CelanaSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CELANA_SIZE_INFO: Record<CelanaSize, { label: string; color: string; badgeColor: string }> = {
  XS: { label: 'XS', color: 'border-purple-300 bg-purple-50 text-purple-900', badgeColor: 'bg-purple-100 text-purple-800' },
  S: { label: 'S', color: 'border-sky-300 bg-sky-50 text-sky-900', badgeColor: 'bg-sky-100 text-sky-800' },
  M: { label: 'M', color: 'border-emerald-300 bg-emerald-50 text-emerald-900', badgeColor: 'bg-emerald-100 text-emerald-800' },
  L: { label: 'L', color: 'border-amber-300 bg-amber-50 text-amber-900', badgeColor: 'bg-amber-100 text-amber-800' },
  XL: { label: 'XL', color: 'border-rose-300 bg-rose-50 text-rose-900', badgeColor: 'bg-rose-100 text-rose-800' },
  XXL: { label: 'XXL', color: 'border-indigo-300 bg-indigo-50 text-indigo-900', badgeColor: 'bg-indigo-100 text-indigo-800' },
};

export const TransactionItemManager: React.FC<TransactionItemManagerProps> = ({
  bookingId,
  patientName,
  categoryName = 'Reguler',
  packageName = 'Smart Klamp',
  isReadOnly = false,
  onItemsChanged,
}) => {
  const {
    products,
    getTransactionItems,
    addTransactionItem,
    deleteTransactionItem,
    updatePackageSelections,
    showToast,
  } = useClinic();

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingSelection, setIsUpdatingSelection] = useState(false);
  const [showDropsConfirm, setShowDropsConfirm] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Filter tabs for 3 drug cards (Sirup vs Pil)
  const [antiNyeriTypeFilter, setAntiNyeriTypeFilter] = useState<'ALL' | 'Sirup' | 'Pil / Kapsul'>('ALL');
  const [antiBengkakTypeFilter, setAntiBengkakTypeFilter] = useState<'ALL' | 'Sirup' | 'Pil / Kapsul'>('ALL');
  const [antiBiotikTypeFilter, setAntiBiotikTypeFilter] = useState<'ALL' | 'Sirup' | 'Pil / Kapsul'>('ALL');

  // Add Product Form State
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const isVip = (categoryName || '').toUpperCase().includes('VIP');

  // Load items from database
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await getTransactionItems(bookingId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      loadItems();
    }
  }, [bookingId]);

  // Master variants of Celana Sunat
  const celanaProducts = useMemo(() => {
    return products.filter((p) => (p.category === 'CELANA_SUNAT' || (p.category as any) === 'CELANA' || p.name.toLowerCase().includes('celana')) && p.isActive);
  }, [products]);

  // Master variants of Obat
  const obatProducts = useMemo(() => {
    return products.filter((p) => (p.category === 'OBAT' || p.category === 'OBAT_ORAL') && p.isActive);
  }, [products]);

  // Helper to extract drug metadata (brand, drugType, drugClassification)
  const getDrugMeta = (itemOrProd: TransactionItem | Product) => {
    let brand: string | undefined = (itemOrProd as any).selectedBrand || (itemOrProd as any).brand;
    let drugType: DrugType | undefined = (itemOrProd as any).selectedDrugType || (itemOrProd as any).drugType;
    let drugClassification: DrugClassification | undefined = (itemOrProd as any).selectedDrugClassification || (itemOrProd as any).drugClassification;

    const name = ((itemOrProd as any).productName || (itemOrProd as any).name || '').toLowerCase();
    const notes = ((itemOrProd as any).notes || '').toLowerCase();
    const sku = ((itemOrProd as any).productSku || (itemOrProd as any).sku || '').toUpperCase();
    const desc = ((itemOrProd as any).description || '').toLowerCase();

    if (!drugType) {
      if (name.includes('sirup') || notes.includes('sirup') || desc.includes('sirup')) drugType = 'Sirup';
      else if (name.includes('pil') || name.includes('tablet') || name.includes('kapsul') || notes.includes('pil') || desc.includes('pil')) drugType = 'Pil / Kapsul';
    }

    if (!drugClassification) {
      if (sku.includes('NYR') || notes.includes('anti nyeri') || name.includes('nyeri') || name.includes('paracetamol') || name.includes('sanmol') || name.includes('tempra') || name.includes('analgetik') || name.includes('ibuprofen') || name.includes('ponstan')) {
        drugClassification = 'ANTI_NYERI';
      } else if (sku.includes('BGK') || notes.includes('anti bengkak') || name.includes('bengkak') || name.includes('danzen') || name.includes('lasonil') || name.includes('inflam') || name.includes('dexamethasone')) {
        drugClassification = 'ANTI_BENGKAK';
      } else if (sku.includes('ATB') || notes.includes('antibiotik') || name.includes('antibiotik') || name.includes('amoxicillin') || name.includes('cefixime') || name.includes('cefadroxil')) {
        drugClassification = 'ANTI_BIOTIK';
      } else {
        drugClassification = 'LAINNYA';
      }
    }

    if (!brand) {
      if (name.includes('sanmol')) brand = 'Sanmol';
      else if (name.includes('tempra')) brand = 'Tempra';
      else if (name.includes('ponstan')) brand = 'Ponstan';
      else if (name.includes('paracetamol')) brand = 'Paracetamol';
      else if (name.includes('danzen')) brand = 'Danzen';
      else if (name.includes('lasonil')) brand = 'Lasonil';
      else if (name.includes('amoxicillin')) brand = 'Amoxicillin';
      else if (name.includes('cefixime')) brand = 'Cefixime';
      else brand = (itemOrProd as any).productName || (itemOrProd as any).name;
    }

    return { brand, drugType, drugClassification };
  };

  // Find currently selected celana in transaction
  const currentIncludedCelanaItems = useMemo(() => {
    return items.filter((i) => i.itemType === 'INCLUDED' && (i.category === 'CELANA_SUNAT' || (i.category as any) === 'CELANA' || i.productName.toLowerCase().includes('celana')));
  }, [items]);

  // Find currently selected 3 medications in transaction
  const currentAntiNyeriItem = useMemo(() => {
    return items.find((i) => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && getDrugMeta(i).drugClassification === 'ANTI_NYERI');
  }, [items]);

  const currentAntiBengkakItem = useMemo(() => {
    return items.find((i) => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && getDrugMeta(i).drugClassification === 'ANTI_BENGKAK');
  }, [items]);

  const currentAntiBiotikItem = useMemo(() => {
    return items.find((i) => i.itemType === 'INCLUDED' && (i.category === 'OBAT' || i.category === 'OBAT_ORAL') && getDrugMeta(i).drugClassification === 'ANTI_BIOTIK');
  }, [items]);

  // Group obat products by classification
  const antiNyeriProducts = useMemo(() => {
    return obatProducts.filter((p) => getDrugMeta(p).drugClassification === 'ANTI_NYERI');
  }, [obatProducts]);

  const antiBengkakProducts = useMemo(() => {
    return obatProducts.filter((p) => getDrugMeta(p).drugClassification === 'ANTI_BENGKAK');
  }, [obatProducts]);

  const antiBiotikProducts = useMemo(() => {
    return obatProducts.filter((p) => getDrugMeta(p).drugClassification === 'ANTI_BIOTIK');
  }, [obatProducts]);

  // Find Obat Tetes Product from Master Data
  const dropsProduct = products.find(
    (p) => p.category === 'OBAT_TETES' || p.name.toLowerCase().includes('tetes')
  ) || {
    id: 2,
    name: 'Obat Tetes Khitan Spesial',
    sellPrice: 90000,
    costPrice: 40000,
    stock: 50,
  };

  // Check if Obat Tetes already added as ADDON
  const hasAddedDrops = items.some(
    (i) =>
      i.itemType === 'ADDON' &&
      (i.category === 'OBAT_TETES' || i.productName.toLowerCase().includes('tetes'))
  );

  const addonItems = items.filter((i) => i.itemType === 'ADDON');
  const totalAddonAmount = addonItems.reduce((acc, i) => acc + i.totalAmount, 0);

  // Helper to accurately extract size from an item or product without false substring matches
  const extractCelanaSize = (it?: TransactionItem | null): CelanaSize => {
    if (!it) return 'M';
    if (it.selectedSize && (['XS', 'S', 'M', 'L', 'XL'] as string[]).includes(it.selectedSize)) {
      return it.selectedSize as CelanaSize;
    }
    const p = products.find(prod => prod.id === it.productId);
    if (p?.size && (['XS', 'S', 'M', 'L', 'XL'] as string[]).includes(p.size as string)) {
      return p.size as CelanaSize;
    }
    const sku = (it.productSku || p?.sku || '').toUpperCase();
    for (const s of ['XXL', 'XS', 'XL', 'S', 'M', 'L'] as CelanaSize[]) {
      if (sku === `PRD-CLN-${s}` || sku.endsWith(`-${s}`) || sku.includes(`-${s}-`)) {
        return s;
      }
    }
    const text = `${it.productName || ''} ${p?.name || ''} ${it.notes || ''}`.toUpperCase();
    for (const s of ['XXL', 'XS', 'XL', 'S', 'M', 'L'] as CelanaSize[]) {
      if (text.includes(`(${s})`) || text.includes(`UKURAN ${s}`) || text.includes(`UKURAN: ${s}`) || text.includes(`SIZE ${s}`)) {
        return s;
      }
    }
    const match = text.match(/\b(XXL|XS|XL|S|M|L)\b/);
    if (match && ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(match[1])) {
      return match[1] as CelanaSize;
    }
    return 'M';
  };

  // Helper to find a product by size
  const getProductBySize = (size: CelanaSize): Product | undefined => {
    // 1. Direct match on size property in celanaProducts
    const direct = celanaProducts.find((p) => p.size === size);
    if (direct) return direct;

    // 2. Exact SKU match: PRD-CLN-${size}
    const exactSku = celanaProducts.find((p) => p.sku?.toUpperCase() === `PRD-CLN-${size}`);
    if (exactSku) return exactSku;

    // 3. Suffix SKU match
    const bySku = celanaProducts.find((p) => p.sku?.toUpperCase().endsWith(`-${size}`));
    if (bySku) return bySku;

    // 4. Name pattern match
    const byName = celanaProducts.find((p) => {
      const u = (p.name || '').toUpperCase();
      return u.includes(`(${size})`) || u.includes(`UKURAN ${size}`) || u.includes(`SIZE ${size}`);
    });
    if (byName) return byName;

    // 5. Fallback in all products list
    const anyInProducts = products.find((p) => {
      const isCelana = p.category === 'CELANA_SUNAT' || (p.category as any) === 'CELANA' || p.name.toLowerCase().includes('celana');
      if (!isCelana) return false;
      if (p.size === size) return true;
      if (p.sku?.toUpperCase() === `PRD-CLN-${size}` || p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
      const u = (p.name || '').toUpperCase();
      return u.includes(`(${size})`) || u.includes(`UKURAN ${size}`);
    });
    if (anyInProducts) return anyInProducts;

    return celanaProducts[0] || products.find(p => p.category === 'CELANA_SUNAT');
  };

  // Determine current active size(s) accurately
  const currentSelectedSize1: CelanaSize = useMemo(() => {
    if (currentIncludedCelanaItems.length > 0) {
      return extractCelanaSize(currentIncludedCelanaItems[0]);
    }
    return 'M';
  }, [currentIncludedCelanaItems, products]);

  const currentSelectedSize2: CelanaSize = useMemo(() => {
    if (currentIncludedCelanaItems.length > 1) {
      return extractCelanaSize(currentIncludedCelanaItems[1]);
    } else if (currentIncludedCelanaItems.length === 1 && currentIncludedCelanaItems[0].quantity > 1) {
      return extractCelanaSize(currentIncludedCelanaItems[0]);
    }
    return 'M';
  }, [currentIncludedCelanaItems, products]);

  // Handle Changing Celana Size (Single or VIP dual)
  const handleSelectCelanaSize = async (index: 1 | 2, size: CelanaSize) => {
    if (isReadOnly || isUpdatingSelection) return;

    try {
      setIsUpdatingSelection(true);
      let targetProductIds: number[] = [];

      if (!isVip) {
        // Reguler: 1 pcs
        const prod = getProductBySize(size);
        if (!prod) {
          showToast(`Produk celana sunat ukuran ${size} belum tersedia di master data`, 'error');
          return;
        }
        targetProductIds = [prod.id];
      } else {
        // VIP: 2 pcs
        const size1 = index === 1 ? size : currentSelectedSize1;
        const size2 = index === 2 ? size : currentSelectedSize2;
        const prod1 = getProductBySize(size1);
        const prod2 = getProductBySize(size2);
        if (!prod1 || !prod2) {
          showToast('Produk celana sunat untuk ukuran yang dipilih belum tersedia', 'error');
          return;
        }
        targetProductIds = [prod1.id, prod2.id];
      }

      const res = await updatePackageSelections(bookingId, { celanaProductIds: targetProductIds });
      if (res.success) {
        await loadItems();
        if (onItemsChanged) onItemsChanged();
      }
    } finally {
      setIsUpdatingSelection(false);
    }
  };

  // Handle Changing one of the 3 medications (Anti Nyeri, Anti Bengkak, Antibiotik)
  const handleSelectDrug = async (classification: DrugClassification, productId: number) => {
    if (isReadOnly || isUpdatingSelection) return;

    try {
      setIsUpdatingSelection(true);
      const payload: any = {};
      if (classification === 'ANTI_NYERI') {
        payload.antiNyeriId = productId;
        payload.antiBengkakId = currentAntiBengkakItem?.productId;
        payload.antiBiotikId = currentAntiBiotikItem?.productId;
      } else if (classification === 'ANTI_BENGKAK') {
        payload.antiNyeriId = currentAntiNyeriItem?.productId;
        payload.antiBengkakId = productId;
        payload.antiBiotikId = currentAntiBiotikItem?.productId;
      } else if (classification === 'ANTI_BIOTIK') {
        payload.antiNyeriId = currentAntiNyeriItem?.productId;
        payload.antiBengkakId = currentAntiBengkakItem?.productId;
        payload.antiBiotikId = productId;
      }

      const res = await updatePackageSelections(bookingId, { obatSelection: payload });
      if (res.success) {
        await loadItems();
        if (onItemsChanged) onItemsChanged();
      }
    } finally {
      setIsUpdatingSelection(false);
    }
  };

  // Handle Adding Drops with Confirmation
  const handleConfirmAddDrops = async () => {
    setShowDropsConfirm(false);
    const res = await addTransactionItem(bookingId, {
      productId: dropsProduct.id,
      quantity: 1,
      itemType: 'ADDON',
      sellPrice: dropsProduct.sellPrice || 90000,
      notes: 'Penambahan Obat Tetes Khitan Khusus Pasien Reguler',
    });

    if (res.success) {
      await loadItems();
      if (onItemsChanged) onItemsChanged();
    }
  };

  // Handle Adding Arbitrary Product
  const handleAddCustomProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Pilih produk yang ingin ditambahkan', 'error');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const res = await addTransactionItem(bookingId, {
      productId: prod.id,
      quantity,
      itemType: 'ADDON',
      sellPrice: prod.sellPrice,
      notes: notes || `Penambahan ${prod.name}`,
    });

    if (res.success) {
      setShowAddProductModal(false);
      setSelectedProductId(0);
      setQuantity(1);
      setNotes('');
      await loadItems();
      if (onItemsChanged) onItemsChanged();
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (itemId: number) => {
    const res = await deleteTransactionItem(bookingId, itemId);
    if (res.success) {
      await loadItems();
      if (onItemsChanged) onItemsChanged();
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
      {/* HEADER: Kategori, Paket, dan Ringkasan Fasilitas Paket */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-700" />
              Perlengkapan & Obat Tindakan
            </h4>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isVip
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-sky-100 text-sky-900 border border-sky-300'
              }`}
            >
              Paket {categoryName}
            </span>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {packageName}
            </span>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Tambah Obat Tetes */}
              {hasAddedDrops ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ✓ Obat Tetes (Rp {dropsProduct.sellPrice.toLocaleString('id-ID')})
                </span>
              ) : (
                <button
                  type="button"
                  id="btn-add-drops"
                  onClick={() => setShowDropsConfirm(true)}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  + Obat Tetes
                </button>
              )}

              {/* Tombol Tambah Produk Lain */}
              <button
                type="button"
                id="btn-add-other-product"
                onClick={() => setShowAddProductModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add-on
              </button>
            </div>
          )}
        </div>

        {/* Ringkasan Fasilitas Paket Khitan (Goodiebag, Mainan, Sertifikat terintegrasi ke paket tanpa card terpisah) */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-wrap">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Termasuk Paket {categoryName} (Rp 0):
          </span>
          <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium">
            Celana Sunat ({isVip ? '2 pcs' : '1 pcs'})
          </span>
          <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium">
            3 Macam Obat Oral (Anti Nyeri, Anti Bengkak, Antibiotik)
          </span>
          <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-medium text-slate-500">
            Goodiebag, Mainan & Sertifikat Resmi
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-medium animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          Memuat rincian paket & stok varian...
        </div>
      ) : (
        <div className="space-y-4">
          {/* SECTION 1: 3 MACAM OBAT ORAL KHITAN (ANTI NYERI, ANTI BENGKAK, ANTIBIOTIK) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">💊</span>
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    3 Macam Obat Minum Khitan (Anti Nyeri, Anti Bengkak & Antibiotik)
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Setiap pasien berhak mendapatkan 3 obat minum pasca tindakan sesuai stok (Pilihan Merek & Tipe Sirup/Pil).
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded shrink-0 self-start sm:self-auto">
                3 Item Termasuk (Rp 0)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* CARD 1: 🟣 ANTI NYERI / ANALGETIK */}
              <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-200/80 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1">
                      <span>🟣</span> 1. Anti Nyeri (Analgetik)
                    </span>
                    <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                      Rp 0
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-900/70 mt-0.5">
                    Meredakan rasa sakit & penurun panas pasca khitan.
                  </p>

                  {/* Active selection badge */}
                  <div className="mt-2 p-2 bg-white rounded-lg border border-purple-200 text-xs">
                    <div className="text-[10px] text-purple-600 font-bold uppercase">Terpilih untuk Pasien:</div>
                    <div className="font-bold text-slate-900 truncate">
                      {currentAntiNyeriItem?.productName || 'Belum dipilih'}
                    </div>
                    {currentAntiNyeriItem && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded font-semibold border border-purple-100">
                          {getDrugMeta(currentAntiNyeriItem).drugType || 'Sirup'}
                        </span>
                        {getDrugMeta(currentAntiNyeriItem).brand && (
                          <span>Merek: {getDrugMeta(currentAntiNyeriItem).brand}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Roll / Dropdown for Anti Nyeri */}
                <div className="space-y-1.5 pt-1 border-t border-purple-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Pilih dari Stok:</label>
                    <div className="flex items-center gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setAntiNyeriTypeFilter('ALL')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiNyeriTypeFilter === 'ALL' ? 'bg-purple-700 text-white font-bold' : 'text-slate-500 hover:bg-purple-100'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiNyeriTypeFilter('Sirup')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiNyeriTypeFilter === 'Sirup' ? 'bg-purple-700 text-white font-bold' : 'text-slate-500 hover:bg-purple-100'
                        }`}
                      >
                        Sirup
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiNyeriTypeFilter('Pil / Kapsul')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiNyeriTypeFilter === 'Pil / Kapsul' ? 'bg-purple-700 text-white font-bold' : 'text-slate-500 hover:bg-purple-100'
                        }`}
                      >
                        Pil
                      </button>
                    </div>
                  </div>

                  <select
                    id="select-anti-nyeri"
                    disabled={isReadOnly || isUpdatingSelection}
                    value={currentAntiNyeriItem?.productId || ''}
                    onChange={(e) => handleSelectDrug('ANTI_NYERI', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled>-- Pilih Obat Anti Nyeri --</option>
                    {antiNyeriProducts
                      .filter((p) => {
                        if (antiNyeriTypeFilter === 'ALL') return true;
                        return getDrugMeta(p).drugType === antiNyeriTypeFilter;
                      })
                      .map((prod, idx) => {
                        const meta = getDrugMeta(prod);
                        return (
                          <option key={`nyeri-prod-${prod.id}-${idx}`} value={prod.id} disabled={prod.stock <= 0 && currentAntiNyeriItem?.productId !== prod.id}>
                            [{meta.drugType || 'Sirup'}] {prod.name} (Stok: {prod.stock})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* CARD 2: 🟠 ANTI BENGKAK / ANTI-INFLAMASI */}
              <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                      <span>🟠</span> 2. Anti Bengkak (Inflamasi)
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      Rp 0
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-900/70 mt-0.5">
                    Mempercepat penyembuhan edema & luka khitan.
                  </p>

                  {/* Active selection badge */}
                  <div className="mt-2 p-2 bg-white rounded-lg border border-amber-200 text-xs">
                    <div className="text-[10px] text-amber-600 font-bold uppercase">Terpilih untuk Pasien:</div>
                    <div className="font-bold text-slate-900 truncate">
                      {currentAntiBengkakItem?.productName || 'Belum dipilih'}
                    </div>
                    {currentAntiBengkakItem && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded font-semibold border border-amber-100">
                          {getDrugMeta(currentAntiBengkakItem).drugType || 'Pil / Kapsul'}
                        </span>
                        {getDrugMeta(currentAntiBengkakItem).brand && (
                          <span>Merek: {getDrugMeta(currentAntiBengkakItem).brand}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Roll / Dropdown for Anti Bengkak */}
                <div className="space-y-1.5 pt-1 border-t border-amber-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Pilih dari Stok:</label>
                    <div className="flex items-center gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setAntiBengkakTypeFilter('ALL')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBengkakTypeFilter === 'ALL' ? 'bg-amber-700 text-white font-bold' : 'text-slate-500 hover:bg-amber-100'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiBengkakTypeFilter('Sirup')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBengkakTypeFilter === 'Sirup' ? 'bg-amber-700 text-white font-bold' : 'text-slate-500 hover:bg-amber-100'
                        }`}
                      >
                        Sirup
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiBengkakTypeFilter('Pil / Kapsul')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBengkakTypeFilter === 'Pil / Kapsul' ? 'bg-amber-700 text-white font-bold' : 'text-slate-500 hover:bg-amber-100'
                        }`}
                      >
                        Pil
                      </button>
                    </div>
                  </div>

                  <select
                    id="select-anti-bengkak"
                    disabled={isReadOnly || isUpdatingSelection}
                    value={currentAntiBengkakItem?.productId || ''}
                    onChange={(e) => handleSelectDrug('ANTI_BENGKAK', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-400 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled>-- Pilih Obat Anti Bengkak --</option>
                    {antiBengkakProducts
                      .filter((p) => {
                        if (antiBengkakTypeFilter === 'ALL') return true;
                        return getDrugMeta(p).drugType === antiBengkakTypeFilter;
                      })
                      .map((prod, idx) => {
                        const meta = getDrugMeta(prod);
                        return (
                          <option key={`bengkak-prod-${prod.id}-${idx}`} value={prod.id} disabled={prod.stock <= 0 && currentAntiBengkakItem?.productId !== prod.id}>
                            [{meta.drugType || 'Pil'}] {prod.name} (Stok: {prod.stock})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              {/* CARD 3: 🔵 ANTIBIOTIK */}
              <div className="p-3.5 bg-sky-50/40 rounded-xl border border-sky-200/80 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-sky-950 flex items-center gap-1">
                      <span>🔵</span> 3. Antibiotik (Pencegah Infeksi)
                    </span>
                    <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                      Rp 0
                    </span>
                  </div>
                  <p className="text-[10px] text-sky-900/70 mt-0.5">
                    Mencegah infeksi bakteri pada area tindakan khitan.
                  </p>

                  {/* Active selection badge */}
                  <div className="mt-2 p-2 bg-white rounded-lg border border-sky-200 text-xs">
                    <div className="text-[10px] text-sky-600 font-bold uppercase">Terpilih untuk Pasien:</div>
                    <div className="font-bold text-slate-900 truncate">
                      {currentAntiBiotikItem?.productName || 'Belum dipilih'}
                    </div>
                    {currentAntiBiotikItem && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="bg-sky-50 text-sky-800 px-1.5 py-0.2 rounded font-semibold border border-sky-100">
                          {getDrugMeta(currentAntiBiotikItem).drugType || 'Sirup'}
                        </span>
                        {getDrugMeta(currentAntiBiotikItem).brand && (
                          <span>Merek: {getDrugMeta(currentAntiBiotikItem).brand}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selection Roll / Dropdown for Antibiotik */}
                <div className="space-y-1.5 pt-1 border-t border-sky-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Pilih dari Stok:</label>
                    <div className="flex items-center gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setAntiBiotikTypeFilter('ALL')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBiotikTypeFilter === 'ALL' ? 'bg-sky-700 text-white font-bold' : 'text-slate-500 hover:bg-sky-100'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiBiotikTypeFilter('Sirup')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBiotikTypeFilter === 'Sirup' ? 'bg-sky-700 text-white font-bold' : 'text-slate-500 hover:bg-sky-100'
                        }`}
                      >
                        Sirup
                      </button>
                      <button
                        type="button"
                        onClick={() => setAntiBiotikTypeFilter('Pil / Kapsul')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          antiBiotikTypeFilter === 'Pil / Kapsul' ? 'bg-sky-700 text-white font-bold' : 'text-slate-500 hover:bg-sky-100'
                        }`}
                      >
                        Pil
                      </button>
                    </div>
                  </div>

                  <select
                    id="select-anti-biotik"
                    disabled={isReadOnly || isUpdatingSelection}
                    value={currentAntiBiotikItem?.productId || ''}
                    onChange={(e) => handleSelectDrug('ANTI_BIOTIK', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-400 cursor-pointer disabled:opacity-60"
                  >
                    <option value="" disabled>-- Pilih Obat Antibiotik --</option>
                    {antiBiotikProducts
                      .filter((p) => {
                        if (antiBiotikTypeFilter === 'ALL') return true;
                        return getDrugMeta(p).drugType === antiBiotikTypeFilter;
                      })
                      .map((prod, idx) => {
                        const meta = getDrugMeta(prod);
                        return (
                          <option key={`biotik-prod-${prod.id}-${idx}`} value={prod.id} disabled={prod.stock <= 0 && currentAntiBiotikItem?.productId !== prod.id}>
                            [{meta.drugType || 'Sirup'}] {prod.name} (Stok: {prod.stock})
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PILIHAN CELANA SUNAT (TINGGAL KLIK BEBAS SEMUA UKURAN) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🩲</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                      Ukuran Celana Sunat ({isVip ? '2 Pcs Paket VIP' : '1 Pcs Paket Reguler'})
                    </h5>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                      Hak Pasien (Rp 0)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bebas memilih semua ukuran tanpa batasan apapun — admin / operator tinggal klik ukuran yang ingin diberikan.
                  </p>
                </div>
              </div>
            </div>

            {/* Celana #1 */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">
                    {isVip ? 'Celana #1 (Utama):' : 'Pilih Ukuran Celana Pasien:'}
                  </span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-black text-xs rounded-md border border-sky-300">
                    Ukuran Terpilih: {currentSelectedSize1}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Klik tombol ukuran langsung di bawah:
                </div>
              </div>

              {/* Direct Clickable Button Grid: All sizes XS - XXL */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ALL_CELANA_SIZES.map((size) => {
                  const prod = getProductBySize(size);
                  const isSelected = currentSelectedSize1 === size;
                  const stock = prod?.stock ?? 0;

                  return (
                    <button
                      key={`btn-celana-1-${size}`}
                      type="button"
                      disabled={isReadOnly || isUpdatingSelection}
                      onClick={() => handleSelectCelanaSize(1, size)}
                      className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border shadow-2xs active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-sky-600 to-indigo-700 text-white border-sky-600 ring-2 ring-sky-400/50 shadow-sm'
                          : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-sm font-black">
                        {isSelected && <span className="text-xs">✓</span>}
                        <span>{size}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : stock > 0
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Stok: {stock}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Celana #2 (Hanya untuk Paket VIP) */}
            {isVip && (
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-950">
                      Celana #2 (Bonus Pasien VIP):
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-black text-xs rounded-md border border-amber-300">
                      Ukuran Terpilih: {currentSelectedSize2}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    Bisa sama atau beda ukuran dengan celana #1:
                  </div>
                </div>

                {/* Direct Clickable Button Grid for Celana #2 */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ALL_CELANA_SIZES.map((size) => {
                    const prod = getProductBySize(size);
                    const isSelected = currentSelectedSize2 === size;
                    const stock = prod?.stock ?? 0;

                    return (
                      <button
                        key={`btn-celana-2-${size}`}
                        type="button"
                        disabled={isReadOnly || isUpdatingSelection}
                        onClick={() => handleSelectCelanaSize(2, size)}
                        className={`p-2.5 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border shadow-2xs active:scale-95 ${
                          isSelected
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white border-amber-600 ring-2 ring-amber-300 shadow-sm'
                            : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-sm font-black">
                          {isSelected && <span className="text-xs">✓</span>}
                          <span>{size}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : stock > 0
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Stok: {stock}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ADD-ON / TAMBAHAN BERBAYAR (MASUK KE INVOICE KASIR) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🛒</span>
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Item Tambahan / Add-on Tagihan Pasien
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Produk di luar paket standar (misal: Obat Tetes atau Celana Ekstra) otomatis masuk ke kasir.
                  </p>
                </div>
              </div>

              {addonItems.length > 0 && (
                <span className="text-xs font-black text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                  Total Add-on: Rp {totalAddonAmount.toLocaleString('id-ID')}
                </span>
              )}
            </div>

            {addonItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                Belum ada produk add-on berbayar untuk pasien ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {addonItems.map((item, idx) => (
                  <div key={`addon-item-${item.id || item.productId}-${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {item.productName}
                        </span>
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                          {item.quantity} {item.unit || 'pcs'}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-slate-800">
                        Rp {item.totalAmount.toLocaleString('id-ID')}
                      </span>

                      {!isReadOnly && !item.isStockDeducted && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Hapus Add-on"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: TAMBAH OBAT TETES REGULER */}
      {showDropsConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900">
                Konfirmasi Tambah Obat Tetes
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Pasien <span className="font-bold text-slate-800">{patientName}</span> ({categoryName}) akan ditambahkan 1 botol <span className="font-bold text-slate-800">{dropsProduct.name}</span>.
              </p>
              <div className="mt-3 p-2.5 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between text-xs font-bold text-sky-950">
                <span>Biaya Add-on Tambahan:</span>
                <span className="text-sm font-black text-sky-800">
                  Rp {(dropsProduct.sellPrice || 90000).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDropsConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-add-drops"
                onClick={handleConfirmAddDrops}
                className="px-4 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Ya, Tambahkan ke Tagihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH PRODUK CUSTOM ADD-ON */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-700" />
                Tambah Produk Add-on Pasien
              </h4>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Produk dari Stok Master <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-custom-addon-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value={0}>-- Pilih Produk --</option>
                  {products
                    .filter((p) => p.isActive && p.stock > 0)
                    .map((p, idx) => (
                      <option key={`custom-add-prod-${p.id}-${idx}`} value={p.id}>
                        {p.name} (Stok: {p.stock} | Rp {p.sellPrice.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah / Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Khusus
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Tambahan celana cadangan"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-custom-addon"
                  className="px-4 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Simpan Tambahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
