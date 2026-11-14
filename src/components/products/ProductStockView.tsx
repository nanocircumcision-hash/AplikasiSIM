import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Product, ProductCategory, StockMovement, CelanaSize, DrugType, DrugClassification } from '../../types';
import { canReduceStock } from '../../utils/permissionUtils';
import {
  Package,
  Plus,
  MinusCircle,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  FileSpreadsheet,
  History,
  TrendingUp,
  Tag,
  Edit2,
  Trash2,
  DollarSign,
  AlertCircle,
  X,
  Check,
  FileBarChart,
  Layers,
  Sparkles,
  Pill,
  Building2,
} from 'lucide-react';

const CATEGORIES: { key: ProductCategory | 'ALL'; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Semua Kategori', icon: '📦' },
  { key: 'OBAT', label: 'Obat Oral & Salep', icon: '💊' },
  { key: 'OBAT_TETES', label: 'Obat Tetes Khitan', icon: '💧' },
  { key: 'CELANA_SUNAT', label: 'Celana Sunat (XS - XXL)', icon: '🩲' },
  { key: 'AKSESORIS', label: 'Aksesoris & Medali', icon: '🎖️' },
  { key: 'MAINAN', label: 'Mainan Anak', icon: '🚗' },
  { key: 'LAINNYA', label: 'Lainnya & Dressing', icon: '🩹' },
];

const CELANA_SIZE_INFO: Record<CelanaSize, { label: string; ageRange: string; color: string }> = {
  XS: { label: 'XS', ageRange: '1 - 3 th (Balita)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  S: { label: 'S', ageRange: '4 - 6 th (TK/PAUD)', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  M: { label: 'M', ageRange: '7 - 9 th (SD Kecil)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  L: { label: 'L', ageRange: '10 - 12 th (SD Besar)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  XL: { label: 'XL', ageRange: '> 12 th (Remaja)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  XXL: { label: 'XXL', ageRange: 'Dewasa / Jumbo', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
};

interface ProductStockViewProps {
  onNavigate?: (view: string) => void;
}

export const ProductStockView: React.FC<ProductStockViewProps> = ({ onNavigate }) => {
  const {
    products,
    inventorySummary,
    createProduct,
    updateProduct,
    adjustStock,
    batchSetCelanaSizes,
    refreshAllData,
    currentUser,
    showToast,
    activeBranchCode,
    branches,
  } = useClinic();

  const currentBranch = branches.find(b => b.code.toUpperCase() === (activeBranchCode || 'PUSAT').toUpperCase()) || {
    id: 0,
    code: activeBranchCode || 'PUSAT',
    name: activeBranchCode === 'PUSAT' ? 'Klinik Khitan Pusat' : (activeBranchCode || 'PUSAT'),
    isActive: true,
  };

  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);

  const handleSyncBranchCatalog = async () => {
    try {
      setIsSyncingCatalog(true);
      const res = await fetch('/api/products/sync-branch-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-branch-code': activeBranchCode || 'PUSAT',
        },
        body: JSON.stringify({ branchCode: activeBranchCode || 'PUSAT' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Katalog varian berhasil disinkronkan', 'success');
        await refreshAllData();
      } else {
        showToast(data.error || 'Gagal sinkronisasi katalog cabang', 'error');
      }
    } catch (e: any) {
      showToast('Gagal sinkronisasi: ' + e.message, 'error');
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);

  // Strict Security: Only Owner and Super Admin can edit product prices
  const userRole = (currentUser?.role || '').toLowerCase();
  const isOwnerOrSuper = userRole === 'owner' || userRole === 'super_admin' || userRole === 'superadmin';
  // Restricted Permission: Only Owner, Super Admin, or users explicitly granted 'stock_reduction' can reduce stock
  const canReduceStockAccess = canReduceStock(currentUser);

  // Quick Restock (+ Tambah Stok Obat) Modal State (Bisa diakses Staff & Admin)
  const [isQuickRestockModalOpen, setIsQuickRestockModalOpen] = useState(false);
  const [quickRestockData, setQuickRestockData] = useState({
    productId: '',
    quantity: 20,
    notes: 'Penerimaan stok obat / alkes baru dari supplier',
  });
  const [isSubmittingQuickRestock, setIsSubmittingQuickRestock] = useState(false);

  // Quick Stock Reduction (- Kurangi Stok Obat) Modal State (Khusus pengguna yang diberi akses)
  const [isQuickReduceModalOpen, setIsQuickReduceModalOpen] = useState(false);
  const [quickReduceData, setQuickReduceData] = useState({
    productId: '',
    quantity: 1,
    reasonType: 'EXPIRED' as 'EXPIRED' | 'DAMAGED' | 'INTERNAL_USE' | 'OPNAME_MINUS' | 'OTHER',
    notes: '',
  });
  const [isSubmittingQuickReduce, setIsSubmittingQuickReduce] = useState(false);

  // Celana Batch Modal State
  const [isCelanaBatchModalOpen, setIsCelanaBatchModalOpen] = useState(false);
  const [celanaBatchStocks, setCelanaBatchStocks] = useState<Record<CelanaSize, number>>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Filter for Golongan Obat when category is OBAT
  const [selectedDrugClassFilter, setSelectedDrugClassFilter] = useState<DrugClassification | 'ALL'>('ALL');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'OBAT' as ProductCategory,
    unit: 'pcs',
    sellPrice: 0,
    costPrice: 0,
    stock: 0,
    minStock: 10,
    description: '',
    size: undefined as CelanaSize | undefined,
    brand: '',
    drugType: undefined as DrugType | undefined,
    drugClassification: 'ANTI_NYERI' as DrugClassification | undefined,
  });

  // Form State for Stock Adjustment
  const [adjustmentData, setAdjustmentData] = useState({
    movementType: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 1,
    notes: '',
  });

  // Extract metadata helper
  const getProductMeta = (p: Product) => {
    let size = p.size;
    let brand = p.brand;
    let drugType = p.drugType;
    let drugClassification = p.drugClassification;

    if (!size && p.category === 'CELANA_SUNAT') {
      for (const s of ['XXL', 'XS', 'XL', 'S', 'M', 'L'] as CelanaSize[]) {
        if (p.sku?.toUpperCase().endsWith(`-${s}`) || p.name?.toUpperCase().includes(`(${s})`) || p.name?.toUpperCase().includes(`UKURAN ${s}`) || p.name?.toUpperCase().endsWith(` ${s}`)) {
          size = s;
          break;
        }
      }
    }

    if (p.category === 'OBAT') {
      if (!drugType) {
        if (p.name.toLowerCase().includes('sirup')) drugType = 'Sirup';
        else if (p.name.toLowerCase().includes('pil') || p.name.toLowerCase().includes('kapsul')) drugType = 'Pil / Kapsul';
      }
      if (!drugClassification) {
        const n = (p.name || '').toLowerCase();
        const s = (p.sku || '').toUpperCase();
        if (s.includes('NYR') || n.includes('nyeri') || n.includes('paracetamol') || n.includes('sanmol') || n.includes('tempra') || n.includes('ibuprofen') || n.includes('ponstan') || n.includes('analgetik')) {
          drugClassification = 'ANTI_NYERI';
        } else if (s.includes('BGK') || n.includes('bengkak') || n.includes('danzen') || n.includes('lasonil') || n.includes('inflam') || n.includes('dexamethasone')) {
          drugClassification = 'ANTI_BENGKAK';
        } else if (s.includes('ATB') || n.includes('biotik') || n.includes('amoxicillin') || n.includes('cefixime') || n.includes('cefadroxil')) {
          drugClassification = 'ANTI_BIOTIK';
        } else {
          drugClassification = 'LAINNYA';
        }
      }
    }

    return { size, brand, drugType, drugClassification };
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const meta = getProductMeta(p);

      // Drug classification filter when OBAT is chosen
      if (selectedCategory === 'OBAT' && selectedDrugClassFilter !== 'ALL') {
        if (meta.drugClassification !== selectedDrugClassFilter) return false;
      }

      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (meta.brand && meta.brand.toLowerCase().includes(q)) ||
        (meta.drugClassification && meta.drugClassification.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, selectedDrugClassFilter, searchQuery]);

  // Load current celana sizes into batch modal
  const handleOpenCelanaBatchModal = () => {
    const newStocks: Record<CelanaSize, number> = {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    };

    for (const size of ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as CelanaSize[]) {
      const prod = products.find((p) => {
        if (p.category !== 'CELANA_SUNAT') return false;
        if (p.size === size) return true;
        if (p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
        if (p.name?.toUpperCase().includes(`(${size})`)) return true;
        return false;
      });
      if (prod) {
        newStocks[size] = prod.stock;
      }
    }

    setCelanaBatchStocks(newStocks);
    setIsCelanaBatchModalOpen(true);
  };

  const handleSaveCelanaBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReduceStockAccess) {
      for (const size of ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as CelanaSize[]) {
        const prod = products.find((p) => {
          if (p.category !== 'CELANA_SUNAT') return false;
          if (p.size === size) return true;
          if (p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
          if (p.name?.toUpperCase().includes(`(${size})`)) return true;
          return false;
        });
        const prevStock = prod?.stock ?? 0;
        const targetQty = Number(celanaBatchStocks[size] || 0);
        if (targetQty < prevStock) {
          showToast(`Akses Ditolak: Pengurangan stok ukuran ${size} (${prevStock} → ${targetQty}) memerlukan izin "Pengurangan & Koreksi Stok Obat".`, 'error');
          return;
        }
      }
    }
    try {
      setIsSavingBatch(true);
      const sizesArray = (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as CelanaSize[]).map((sz) => ({
        size: sz,
        stock: Number(celanaBatchStocks[sz] || 0),
      }));
      const res = await batchSetCelanaSizes(sizesArray);
      if (res.success) {
        setIsCelanaBatchModalOpen(false);
        await refreshAllData();
      }
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleQuickAddCelanaStock = async (size: CelanaSize, amount: number) => {
    const prod = products.find((p) => {
      if (p.category !== 'CELANA_SUNAT') return false;
      if (p.size === size) return true;
      if (p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
      if (p.name?.toUpperCase().includes(`(${size})`)) return true;
      return false;
    });

    if (prod) {
      const res = await adjustStock(prod.id, {
        movementType: 'IN',
        quantity: amount,
        notes: `Restock cepat celana sunat ukuran ${size} (+${amount}) di ${currentBranch.name}`,
      });
      if (res.success) {
        await refreshAllData();
      }
    } else {
      const current = celanaBatchStocks[size] || 0;
      const res = await batchSetCelanaSizes([{ size, stock: current + amount }]);
      if (res.success) {
        await refreshAllData();
      }
    }
  };

  // Load Stock Movements
  const fetchMovements = async (productId?: number) => {
    try {
      setIsMovementsLoading(true);
      const url = productId ? `/api/stock-movements?productId=${productId}` : '/api/stock-movements';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStockMovements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMovementsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: 'OBAT',
      unit: 'pcs',
      sellPrice: 50000,
      costPrice: 25000,
      stock: 20,
      minStock: 10,
      description: '',
      size: undefined,
      brand: '',
      drugType: 'Sirup',
      drugClassification: 'ANTI_NYERI',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    const meta = getProductMeta(product);
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      sellPrice: product.sellPrice,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || '',
      size: meta.size,
      brand: meta.brand || '',
      drugType: meta.drugType || 'Sirup',
      drugClassification: meta.drugClassification || 'ANTI_NYERI',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }

    // Embed metadata into description if not already in schema
    let cleanDesc = formData.description || '';
    if (formData.category === 'CELANA_SUNAT' && formData.size) {
      if (!cleanDesc.includes('"size"')) {
        cleanDesc = `Celana Sunat Ukuran ${formData.size}. ${cleanDesc}`;
      }
    } else if (formData.category === 'OBAT') {
      const parts = [];
      if (formData.drugClassification) {
        const cLabel = formData.drugClassification === 'ANTI_NYERI' ? 'Anti Nyeri' : formData.drugClassification === 'ANTI_BENGKAK' ? 'Anti Bengkak' : formData.drugClassification === 'ANTI_BIOTIK' ? 'Antibiotik' : 'Lainnya';
        parts.push(`Golongan: ${cLabel}`);
      }
      if (formData.brand) parts.push(`Merek: ${formData.brand}`);
      if (formData.drugType) parts.push(`Tipe: ${formData.drugType}`);
      if (parts.length > 0 && !cleanDesc.includes(parts[0])) {
        cleanDesc = `${parts.join(' - ')}. ${cleanDesc}`;
      }
    }

    if (editingProduct) {
      // Keamanan Harga: Jika bukan Owner / Super Admin, pertahankan harga asli obat/produk
      const finalSellPrice = isOwnerOrSuper ? formData.sellPrice : editingProduct.sellPrice;
      const finalCostPrice = isOwnerOrSuper ? formData.costPrice : editingProduct.costPrice;

      if (!isOwnerOrSuper && (formData.sellPrice !== editingProduct.sellPrice || formData.costPrice !== editingProduct.costPrice)) {
        showToast('Peringatan: Harga obat tidak dapat diubah oleh staf/admin biasa. Perubahan harga dikunci khusus untuk Owner / Super Admin.', 'info');
      }

      const res = await updateProduct(editingProduct.id, {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        sellPrice: finalSellPrice,
        costPrice: finalCostPrice,
        minStock: formData.minStock,
        description: cleanDesc,
        size: formData.size,
        brand: formData.brand,
        drugType: formData.drugType,
        drugClassification: formData.drugClassification,
      });
      if (res.success) setIsAddModalOpen(false);
    } else {
      if (!isOwnerOrSuper && (formData.sellPrice > 0 || formData.costPrice > 0)) {
        showToast('Akses Ditolak: Hanya Owner atau Super Admin yang dapat menetapkan harga jual dan modal obat/produk baru.', 'error');
        return;
      }
      const res = await createProduct({
        ...formData,
        sellPrice: isOwnerOrSuper ? formData.sellPrice : 0,
        costPrice: isOwnerOrSuper ? formData.costPrice : 0,
        description: cleanDesc,
      });
      if (res.success) setIsAddModalOpen(false);
    }
  };

  const handleOpenAdjustmentModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustmentData({
      movementType: 'IN',
      quantity: 10,
      notes: 'Penerimaan stok obat / alkes baru dari supplier',
    });
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjustmentData.movementType === 'ADJUSTMENT') {
      if (adjustmentData.quantity < 0) {
        showToast('Stok opname fisik tidak boleh negatif', 'error');
        return;
      }
    } else if (adjustmentData.quantity <= 0) {
      showToast('Jumlah mutasi harus lebih dari 0', 'error');
      return;
    }

    if (
      !canReduceStockAccess &&
      (adjustmentData.movementType === 'OUT' ||
        (adjustmentData.movementType === 'ADJUSTMENT' && adjustmentData.quantity < adjustingProduct.stock))
    ) {
      showToast('Akses Ditolak: Pengurangan stok hanya dapat dilakukan oleh pengguna yang diberi izin "Pengurangan & Koreksi Stok Obat".', 'error');
      return;
    }

    const res = await adjustStock(adjustingProduct.id, adjustmentData);
    if (res.success) {
      setAdjustingProduct(null);
      await refreshAllData();
    }
  };

  const handleOpenQuickRestockModal = () => {
    setQuickRestockData({
      productId: products[0]?.id ? String(products[0].id) : '',
      quantity: 20,
      notes: 'Penerimaan stok obat / alkes baru dari supplier',
    });
    setIsQuickRestockModalOpen(true);
  };

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockData.productId) {
      showToast('Pilih obat atau produk yang ingin ditambah stoknya', 'error');
      return;
    }
    if (quickRestockData.quantity <= 0) {
      showToast('Jumlah tambah stok harus lebih dari 0', 'error');
      return;
    }
    try {
      setIsSubmittingQuickRestock(true);
      const res = await adjustStock(Number(quickRestockData.productId), {
        movementType: 'IN',
        quantity: Number(quickRestockData.quantity),
        notes: quickRestockData.notes.trim() || 'Restock obat/alkes masuk gudang',
      });
      if (res.success) {
        setIsQuickRestockModalOpen(false);
        await refreshAllData();
      }
    } finally {
      setIsSubmittingQuickRestock(false);
    }
  };

  const handleOpenQuickReduceModal = (preselectedProduct?: Product) => {
    if (!canReduceStockAccess) {
      showToast('Akses Ditolak: Fitur pengurangan stok hanya tersedia bagi pengguna yang diberi izin khusus.', 'error');
      return;
    }
    const defaultProd =
      preselectedProduct ||
      products.find((p) => (p.category === 'OBAT' || p.category === 'OBAT_TETES') && p.stock > 0) ||
      products.find((p) => p.stock > 0) ||
      products[0];

    setQuickReduceData({
      productId: defaultProd?.id ? String(defaultProd.id) : '',
      quantity: 1,
      reasonType: 'EXPIRED',
      notes: '',
    });
    setIsQuickReduceModalOpen(true);
  };

  const handleQuickReduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReduceStockAccess) {
      showToast('Akses Ditolak: Anda tidak memiliki izin pengurangan stok.', 'error');
      return;
    }
    const targetProd = products.find((p) => String(p.id) === String(quickReduceData.productId));
    if (!targetProd) {
      showToast('Pilih obat atau produk yang ingin dikurangi stoknya', 'error');
      return;
    }
    const qty = Number(quickReduceData.quantity);
    if (!qty || qty <= 0) {
      showToast('Jumlah pengurangan stok harus lebih dari 0', 'error');
      return;
    }
    if (qty > targetProd.stock) {
      showToast(`Jumlah pengurangan (${qty}) melebihi stok tersedia (${targetProd.stock} ${targetProd.unit})`, 'error');
      return;
    }
    if (!quickReduceData.notes.trim()) {
      showToast('Alasan / catatan pengurangan stok wajib diisi untuk audit trail', 'error');
      return;
    }

    const reasonLabelMap: Record<string, string> = {
      EXPIRED: 'Obat Kadaluwarsa',
      DAMAGED: 'Kemasan Rusak / Pecah',
      INTERNAL_USE: 'Pemakaian Internal / Non-Pasien',
      OPNAME_MINUS: 'Selisih Opname Fisik (Kurang)',
      OTHER: 'Pengurangan Stok Lainnya',
    };
    const prefix = reasonLabelMap[quickReduceData.reasonType] || 'Pengurangan Stok';

    try {
      setIsSubmittingQuickReduce(true);
      const res = await adjustStock(targetProd.id, {
        movementType: 'OUT',
        quantity: qty,
        referenceType: quickReduceData.reasonType,
        notes: `[${prefix}] ${quickReduceData.notes.trim()}`,
      });
      if (res.success) {
        setIsQuickReduceModalOpen(false);
        await refreshAllData();
      }
    } finally {
      setIsSubmittingQuickReduce(false);
    }
  };

  const handleOpenHistoryModal = () => {
    fetchMovements();
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
              Modul Inventaris & Varian Khitan
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Connected
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Gudang Cabang: <strong>{currentBranch.name}</strong> ({currentBranch.code})</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Produk & Inventaris Perlengkapan Khitan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola stok nyata varian ukuran celana sunat (XS–XL), obat khitan (sirup/pil), dan perlengkapan paket di <strong>{currentBranch.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Sinkronisasi Katalog Cabang */}
          <button
            id="btn-sync-branch-catalog"
            type="button"
            disabled={isSyncingCatalog}
            onClick={handleSyncBranchCatalog}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title={`Sinkronkan master varian celana & obat standar ke cabang ${currentBranch.name}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncingCatalog ? 'animate-spin' : ''}`} />
            <span>{isSyncingCatalog ? 'Sinkronisasi...' : 'Sinkronkan Katalog Cabang'}</span>
          </button>

          {/* Tombol Cepat Tambah Stok Obat (Bisa diakses Staff & Admin) */}
          <button
            id="btn-quick-add-stock"
            type="button"
            onClick={handleOpenQuickRestockModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Tambah stok fisik obat & barang (Barang Masuk / Restock)"
          >
            <Boxes className="w-4 h-4 text-emerald-100" />
            <span>+ Tambah Stok Obat (Restock)</span>
          </button>

          {/* Tombol Cepat Kurangi Stok Obat (Hanya Pengguna Dengan Izin Pengurangan Stok) */}
          {canReduceStockAccess && (
            <button
              id="btn-quick-reduce-stock"
              type="button"
              onClick={() => handleOpenQuickReduceModal()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              title="Kurangi stok fisik obat/produk (Kadaluwarsa, Rusak, Opname Turun) — Khusus Izin Terbatas"
            >
              <MinusCircle className="w-4 h-4 text-rose-100" />
              <span>- Kurangi Stok Obat</span>
            </button>
          )}

          {/* Tombol Khusus: Atur Stok Varian Celana Sunat (XS - XL) */}
          <button
            id="btn-open-celana-batch"
            type="button"
            onClick={handleOpenCelanaBatchModal}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="text-sm">🩲</span>
            Atur Stok Ukuran Celana (XS - XL)
          </button>

          {onNavigate && (
            <button
              id="btn-goto-product-reports"
              onClick={() => onNavigate('product-reports')}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <FileBarChart className="w-4 h-4 text-emerald-700" />
              Laporan Pengeluaran Stok
            </button>
          )}

          <button
            id="btn-stock-history"
            onClick={handleOpenHistoryModal}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-600" />
            Riwayat Mutasi
          </button>

          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            title={!isOwnerOrSuper ? 'Tambah produk baru (Penetapan harga oleh Owner/Super Admin)' : 'Tambah Produk Baru'}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Nilai Persediaan & Kuantitas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Produk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Master Produk</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">
              {inventorySummary?.totalProducts || products.length} <span className="text-xs font-semibold text-slate-400">item</span>
            </h3>
          </div>
        </div>

        {/* Total Kuantitas Stok */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stok Fisik</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">
              {inventorySummary?.totalStockQuantity ?? products.reduce((acc, p) => acc + p.stock, 0)}{' '}
              <span className="text-xs font-semibold text-slate-400">unit</span>
            </h3>
          </div>
        </div>

        {/* Total Nilai Aset Gudang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valuasi Aset Modal (HPP)</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">
              Rp {(inventorySummary?.totalCostValuation ?? products.reduce((acc, p) => acc + p.stock * p.costPrice, 0)).toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Potensi Nilai Jual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Potensi Omzet Add-on</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">
              Rp {(inventorySummary?.totalSellValuation ?? products.reduce((acc, p) => acc + p.stock * p.sellPrice, 0)).toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      </div>

      {/* QUICK SUMMARY: STOK CELANA SUNAT PER UKURAN */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-sky-50 rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🩲</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Monitoring Varian Celana Sunat (Integrasi Ruang Tindakan)
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Cabang: {currentBranch.name} ({currentBranch.code})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Stok fisik di bawah adalah milik cabang <strong>{currentBranch.name}</strong> dan otomatis terpotong saat dokter/medis memilih ukuran di ruang tindakan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCelanaBatchModal}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              Update Semua Ukuran
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
          {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as CelanaSize[]).map((size, idx) => {
            const prod = products.find((p) => {
              if (p.category !== 'CELANA_SUNAT') return false;
              if (p.size === size) return true;
              if (p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
              if (p.name?.toUpperCase().includes(`(${size})`)) return true;
              return false;
            });
            const info = CELANA_SIZE_INFO[size];
            const stock = prod?.stock ?? 0;

            return (
              <div
                key={`top-size-${size}-${idx}`}
                className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs font-black border ${info.color}`}>
                    {size}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {prod?.sku || `CLN-${size}`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {info.ageRange}
                </div>
                <div className="mt-2 pt-1 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-400">Tersedia:</span>
                  <span
                    className={`text-sm font-black ${
                      stock <= 0 ? 'text-rose-600' : stock <= 5 ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {stock} pcs
                  </span>
                </div>

                {/* Quick Add Stock Buttons */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Tambah:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAddCelanaStock(size, 5)}
                      className="px-1.5 py-0.5 text-[10px] font-black bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded transition-all active:scale-95 cursor-pointer"
                      title={`Tambah 5 pcs stok ukuran ${size}`}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddCelanaStock(size, 10)}
                      className="px-1.5 py-0.5 text-[10px] font-black bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded transition-all active:scale-95 cursor-pointer"
                      title={`Tambah 10 pcs stok ukuran ${size}`}
                    >
                      +10
                    </button>
                    {prod && (
                      <button
                        type="button"
                        onClick={() => handleOpenAdjustmentModal(prod)}
                        className="p-1 text-[10px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all cursor-pointer"
                        title="Mutasi Detail"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Kategori & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat, idx) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={`cat-filter-btn-${cat.key}-${idx}`}
                id={`cat-filter-${cat.key}`}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  if (cat.key !== 'OBAT') setSelectedDrugClassFilter('ALL');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-filter Golongan Obat (Anti Nyeri, Anti Bengkak, Antibiotik) */}
        {selectedCategory === 'OBAT' && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Golongan Obat:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDrugClassFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDrugClassFilter === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Golongan
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrugClassFilter('ANTI_NYERI')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedDrugClassFilter === 'ANTI_NYERI'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <span>🟣</span> Anti Nyeri (Analgetik)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrugClassFilter('ANTI_BENGKAK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedDrugClassFilter === 'ANTI_BENGKAK'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>🟠</span> Anti Bengkak (Anti-inflamasi)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrugClassFilter('ANTI_BIOTIK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedDrugClassFilter === 'ANTI_BIOTIK'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              <span>🔵</span> Antibiotik
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-products-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan SKU, nama obat, celana sunat, merek, tipe..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between sm:justify-end gap-2">
            <span>Menampilkan <strong className="text-slate-800">{filteredProducts.length}</strong> produk</span>
            <button
              onClick={() => refreshAllData()}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer"
              title="Muat ulang data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">SKU / Kode</th>
                <th className="py-3.5 px-4">Nama Produk & Varian</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                <th className="py-3.5 px-4 text-right">Nilai Persediaan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-sm text-slate-600">Tidak ada produk ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isLowStock = p.stock <= p.minStock;
                  const isOutStock = p.stock === 0;
                  const inventoryVal = p.stock * p.costPrice;
                  const margin = p.sellPrice - p.costPrice;
                  const meta = getProductMeta(p);

                  return (
                    <tr key={`prod-row-${p.id}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-900">
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[11px]">
                          {p.sku}
                        </span>
                      </td>

                      {/* Name & Varian Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>

                          {/* Celana Sunat Size Badge */}
                          {p.category === 'CELANA_SUNAT' && meta.size && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                CELANA_SIZE_INFO[meta.size]?.color || 'bg-purple-100 text-purple-800 border-purple-300'
                              }`}
                            >
                              Ukuran {meta.size}
                            </span>
                          )}

                          {/* Golongan Obat Badge */}
                          {p.category === 'OBAT' && meta.drugClassification && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                meta.drugClassification === 'ANTI_NYERI'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : meta.drugClassification === 'ANTI_BENGKAK'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : meta.drugClassification === 'ANTI_BIOTIK'
                                  ? 'bg-sky-100 text-sky-900 border-sky-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {meta.drugClassification === 'ANTI_NYERI'
                                ? '🟣 Anti Nyeri'
                                : meta.drugClassification === 'ANTI_BENGKAK'
                                ? '🟠 Anti Bengkak'
                                : meta.drugClassification === 'ANTI_BIOTIK'
                                ? '🔵 Antibiotik'
                                : 'Obat Lainnya'}
                            </span>
                          )}

                          {/* Obat Brand Badge */}
                          {p.category === 'OBAT' && meta.brand && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Merek: {meta.brand}
                            </span>
                          )}

                          {/* Obat DrugType Badge */}
                          {p.category === 'OBAT' && meta.drugType && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                meta.drugType === 'Sirup'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {meta.drugType === 'Sirup' ? '🥄 Sirup' : '💊 Pil/Kapsul'}
                            </span>
                          )}
                        </div>

                        {p.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        Rp {p.costPrice.toLocaleString('id-ID')}
                      </td>

                      {/* Sell Price */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900">
                          Rp {p.sellPrice.toLocaleString('id-ID')}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          +Rp {margin.toLocaleString('id-ID')} margin
                        </div>
                      </td>

                      {/* Stock with Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-black text-xs flex items-center gap-1.5 ${
                              isOutStock
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Min: {p.minStock}</span>
                        </div>
                      </td>

                      {/* Inventory Value */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        Rp {inventoryVal.toLocaleString('id-ID')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-mutate-${p.id}`}
                            onClick={() => handleOpenAdjustmentModal(p)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                            title="Tambah Stok Masuk / Penyesuaian Fisik"
                          >
                            <Plus className="w-3 h-3 text-emerald-700" />
                            <span>+ Stok</span>
                          </button>
                          {canReduceStockAccess && (
                            <button
                              id={`btn-reduce-${p.id}`}
                              type="button"
                              disabled={p.stock <= 0}
                              onClick={() => handleOpenQuickReduceModal(p)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-800 border border-rose-200 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                              title={p.stock <= 0 ? 'Stok sudah 0' : 'Kurangi stok produk/obat ini (Khusus Izin Pengurangan Stok)'}
                            >
                              <MinusCircle className="w-3 h-3 text-rose-700" />
                              <span>Kurangi</span>
                            </button>
                          )}
                          <button
                            id={`btn-edit-${p.id}`}
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-all cursor-pointer shrink-0"
                            title={isOwnerOrSuper ? 'Edit Data Produk & Harga (Owner/Super)' : 'Edit Info Produk (Harga Terkunci)'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ATUR STOK BATCH CELANA SUNAT (XS, S, M, L, XL) */}
      {isCelanaBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/70">
              <h3 className="font-black text-sm sm:text-base text-purple-950 flex items-center gap-2">
                <span className="text-lg">🩲</span>
                Atur Stok Ukuran Celana Sunat (XS, S, M, L, XL, XXL)
              </h3>
              <button
                onClick={() => setIsCelanaBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCelanaBatch} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Atur atau sesuaikan jumlah stok fisik untuk setiap ukuran celana sunat. Data ini terintegrasi langsung saat dokter/perawat memilih ukuran di ruang tindakan.
              </p>

              {!canReduceStockAccess && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Anda hanya dapat menambah stok. Pengurangan stok terkunci untuk akun yang diberi izin khusus.</span>
                </div>
              )}

              <div className="space-y-3">
                {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as CelanaSize[]).map((size, idx) => {
                  const info = CELANA_SIZE_INFO[size];
                  const currentQty = celanaBatchStocks[size] ?? 0;
                  const existingProd = products.find((p) => {
                    if (p.category !== 'CELANA_SUNAT') return false;
                    if (p.size === size) return true;
                    if (p.sku?.toUpperCase().endsWith(`-${size}`)) return true;
                    if (p.name?.toUpperCase().includes(`(${size})`)) return true;
                    return false;
                  });
                  const minAllowedQty = canReduceStockAccess ? 0 : (existingProd?.stock ?? 0);

                  return (
                    <div
                      key={`batch-size-${size}-${idx}`}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${info.color}`}>
                          {size}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            Celana Sunat ({size})
                          </div>
                          <div className="text-[10px] text-slate-500">{info.ageRange}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quick -5, -1, +1, +5 */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!canReduceStockAccess}
                            onClick={() =>
                              setCelanaBatchStocks((prev) => ({
                                ...prev,
                                [size]: Math.max(minAllowedQty, (prev[size] || 0) - 5),
                              }))
                            }
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!canReduceStockAccess ? 'Terkunci: Butuh izin Pengurangan Stok' : 'Kurangi 5'}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            disabled={!canReduceStockAccess}
                            onClick={() =>
                              setCelanaBatchStocks((prev) => ({
                                ...prev,
                                [size]: Math.max(minAllowedQty, (prev[size] || 0) - 1),
                              }))
                            }
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!canReduceStockAccess ? 'Terkunci: Butuh izin Pengurangan Stok' : 'Kurangi 1'}
                          >
                            -1
                          </button>
                        </div>

                        <input
                          type="number"
                          min={minAllowedQty}
                          required
                          value={currentQty}
                          onChange={(e) =>
                            setCelanaBatchStocks((prev) => ({
                              ...prev,
                              [size]: Math.max(minAllowedQty, Number(e.target.value)),
                            }))
                          }
                          className="w-16 px-2 py-1 text-center font-black text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none tabular-nums"
                        />

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCelanaBatchStocks((prev) => ({
                                ...prev,
                                [size]: (prev[size] || 0) + 1,
                              }))
                            }
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCelanaBatchStocks((prev) => ({
                                ...prev,
                                [size]: (prev[size] || 0) + 5,
                              }))
                            }
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCelanaBatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingBatch}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingBatch ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan Stok...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Seluruh Stok Ukuran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Produk */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[94vh] flex flex-col overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-700" />
                {editingProduct ? 'Edit Master Data Produk' : 'Tambah Produk Khitan Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Produk / Perlengkapan Khitan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-product-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Sanmol Paracetamol Sirup 120mg / 5ml"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-product-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="OBAT">Obat (Oral / Salep)</option>
                      <option value="OBAT_TETES">Obat Tetes</option>
                      <option value="CELANA_SUNAT">Celana Sunat</option>
                      <option value="AKSESORIS">Aksesoris & Sertifikat</option>
                      <option value="MAINAN">Mainan Anak</option>
                      <option value="LAINNYA">Produk Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Satuan Unit
                    </label>
                    <select
                      id="select-product-unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="pcs">pcs</option>
                      <option value="botol">botol</option>
                      <option value="tube">tube</option>
                      <option value="paket">paket</option>
                      <option value="lembar">lembar</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields: Celana Sunat Size */}
                {formData.category === 'CELANA_SUNAT' && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1.5">
                    <label className="block text-xs font-bold text-purple-950">
                      Ukuran Celana Sunat <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['XS', 'S', 'M', 'L', 'XL'] as CelanaSize[]).map((sz, idx) => (
                        <button
                          key={`setup-sz-${sz}-${idx}`}
                          type="button"
                          onClick={() => setFormData({ ...formData, size: sz })}
                          className={`py-1.5 text-xs font-black rounded-lg border text-center transition-all cursor-pointer ${
                            formData.size === sz
                              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditional Fields: Obat Brand & Drug Type */}
                {formData.category === 'OBAT' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-emerald-950 mb-1">
                        Golongan / Klasifikasi Obat Khitan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.drugClassification || 'ANTI_NYERI'}
                        onChange={(e) => setFormData({ ...formData, drugClassification: e.target.value as DrugClassification })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                      >
                        <option value="ANTI_NYERI">🟣 Anti Nyeri / Analgetik / Penurun Panas (Termasuk Paket)</option>
                        <option value="ANTI_BENGKAK">🟠 Anti Bengkak / Anti-inflamasi (Termasuk Paket)</option>
                        <option value="ANTI_BIOTIK">🔵 Antibiotik Pencegah Infeksi (Termasuk Paket)</option>
                        <option value="LAINNYA">⚪ Obat Khitan Lainnya</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          Merek / Brand Obat
                        </label>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="Contoh: Sanmol / Tempra / Ponstan"
                          className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          Tipe Sediaan
                        </label>
                        <select
                          value={formData.drugType || 'Sirup'}
                          onChange={(e) => setFormData({ ...formData, drugType: e.target.value as DrugType })}
                          className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="Sirup">🥄 Sirup (Anak)</option>
                          <option value="Pil / Kapsul">💊 Pil / Tablet / Kapsul</option>
                          <option value="Salep">🧴 Salep / Gel</option>
                          <option value="Drops / Tetes">💧 Tetes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kebijakan Keamanan Harga Khusus Owner / Super Admin */}
                {!isOwnerOrSuper && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Keamanan Sistem:</span> Anda login sebagai <strong>{currentUser?.role || 'Staff'}</strong>. Pengaturan dan perubahan harga jual serta modal (HPP) dikunci khusus untuk <strong>Owner / Super Admin</strong> guna mencegah manipulasi kasir.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Harga Modal (HPP) <span className="text-rose-500">*</span></span>
                      {!isOwnerOrSuper && (
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                          🔒 Terkunci
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        id="input-product-cost"
                        type="number"
                        min="0"
                        disabled={!isOwnerOrSuper}
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                        className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-bold ${
                          !isOwnerOrSuper
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500'
                        }`}
                        title={!isOwnerOrSuper ? 'Terkunci: Hanya Owner / Super Admin yang dapat mengubah harga modal' : ''}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Harga Jual (Add-on) <span className="text-rose-500">*</span></span>
                      {!isOwnerOrSuper && (
                        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                          🔒 Terkunci
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        id="input-product-sell"
                        type="number"
                        min="0"
                        disabled={!isOwnerOrSuper}
                        value={formData.sellPrice}
                        onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                        className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs font-bold ${
                          !isOwnerOrSuper
                            ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            : 'border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500'
                        }`}
                        title={!isOwnerOrSuper ? 'Terkunci: Hanya Owner / Super Admin yang dapat mengubah harga jual' : ''}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {!editingProduct && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Stok Awal Fisik
                      </label>
                      <input
                        id="input-product-stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  <div className={editingProduct ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stok Minimum (Alert Restock)
                    </label>
                    <input
                      id="input-product-minstock"
                      type="number"
                      min="1"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Catatan Pemakaian Khitan
                  </label>
                  <textarea
                    id="input-product-desc"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Keterangan aturan pakai atau informasi produk..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-product"
                  type="submit"
                  className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mutasi / Penyesuaian Stok */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-700" />
                Mutasi Stok: {adjustingProduct.name}
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Stok Saat Ini</p>
                  <p className="font-black text-lg text-slate-800">
                    {adjustingProduct.stock} {adjustingProduct.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Harga Modal</p>
                  <p className="font-bold text-slate-800">Rp {adjustingProduct.costPrice.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipe Mutasi Stok <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentData({ ...adjustmentData, movementType: 'IN' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      adjustmentData.movementType === 'IN'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>Barang Masuk</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canReduceStockAccess}
                    onClick={() => {
                      if (canReduceStockAccess) {
                        setAdjustmentData({ ...adjustmentData, movementType: 'OUT' });
                      }
                    }}
                    title={!canReduceStockAccess ? 'Terkunci: Memerlukan izin Pengurangan & Koreksi Stok Obat' : 'Barang Keluar / Pengurangan Stok'}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      !canReduceStockAccess
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                        : adjustmentData.movementType === 'OUT'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 cursor-pointer'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    {canReduceStockAccess ? (
                      <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{canReduceStockAccess ? 'Barang Keluar' : 'Keluar (Terkunci)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentData({ ...adjustmentData, movementType: 'ADJUSTMENT' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      adjustmentData.movementType === 'ADJUSTMENT'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Opname Fisik</span>
                  </button>
                </div>
                {!canReduceStockAccess && (
                  <p className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Pengurangan stok terkunci. Anda hanya dapat menambah stok ({'≥'} {adjustingProduct.stock} {adjustingProduct.unit}).</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {adjustmentData.movementType === 'ADJUSTMENT'
                    ? 'Total Stok Hasil Opname Fisik'
                    : 'Jumlah Unit'} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-mutation-qty"
                  type="number"
                  min={
                    adjustmentData.movementType === 'ADJUSTMENT'
                      ? canReduceStockAccess
                        ? 0
                        : adjustingProduct.stock
                      : 1
                  }
                  required
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Mutasi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="input-mutation-notes"
                  rows={2}
                  required
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  placeholder="Contoh: Penerimaan stok supplier batch Sep-2026 atau barang rusak"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-mutation"
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Konfirmasi Mutasi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Stok Obat Cepat (Restock) */}
      {isQuickRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70">
              <h3 className="font-black text-base text-emerald-950 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-700" />
                Tambah Stok Obat / Barang Masuk
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Obat / Produk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={quickRestockData.productId}
                  onChange={(e) => setQuickRestockData({ ...quickRestockData, productId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={`restock-opt-${p.id}`} value={p.id}>
                      [{p.category}] {p.name} (Stok: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Tambah Stok Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quickRestockData.quantity}
                  onChange={(e) => setQuickRestockData({ ...quickRestockData, quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Penerimaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={quickRestockData.notes}
                  onChange={(e) => setQuickRestockData({ ...quickRestockData, notes: e.target.value })}
                  placeholder="Contoh: Pembelian batch baru dari apotek/supplier"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickRestockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickRestock}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSubmittingQuickRestock ? 'Menyimpan...' : 'Simpan Stok Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kurangi Stok Obat (Khusus Pengguna Yang Diberi Akses) */}
      {isQuickReduceModalOpen && canReduceStockAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/80">
              <div>
                <h3 className="font-black text-base text-rose-950 flex items-center gap-2">
                  <MinusCircle className="w-5 h-5 text-rose-600" />
                  Pengurangan Stok Obat & Produk
                </h3>
                <p className="text-[11px] font-semibold text-rose-700 mt-0.5">
                  Akses Terproteksi • Tercatat di Audit Trail
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickReduceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickReduceSubmit} className="p-6 space-y-4">
              {(() => {
                const selectedProd = products.find((p) => String(p.id) === String(quickReduceData.productId));
                const currentStock = selectedProd?.stock ?? 0;
                const reduceQty = Number(quickReduceData.quantity || 0);
                const afterStock = currentStock - reduceQty;
                const isOverStock = reduceQty > currentStock;

                return (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pilih Obat / Produk yang Dikurangi <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="select-reduce-product"
                        value={quickReduceData.productId}
                        onChange={(e) => setQuickReduceData({ ...quickReduceData, productId: e.target.value })}
                        required
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">-- Pilih Produk --</option>
                        {products.map((p) => (
                          <option key={`reduce-opt-${p.id}`} value={p.id} disabled={p.stock <= 0}>
                            [{p.category}] {p.name} (Stok: {p.stock} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProd && (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Stok Saat Ini</p>
                          <p className="font-black text-lg text-slate-900 tabular-nums">
                            {currentStock} {selectedProd.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Sisa Setelah Dikurangi</p>
                          <p className={`font-black text-lg tabular-nums ${isOverStock ? 'text-rose-600' : afterStock <= selectedProd.minStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {isOverStock ? 'Melebihi Stok!' : `${afterStock} ${selectedProd.unit}`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jumlah Pengurangan <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="input-reduce-qty"
                          type="number"
                          min={1}
                          max={Math.max(1, currentStock)}
                          required
                          value={quickReduceData.quantity}
                          onChange={(e) => setQuickReduceData({ ...quickReduceData, quantity: Number(e.target.value) })}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kategori Alasan <span className="text-rose-500">*</span>
                        </label>
                        <select
                          id="select-reduce-reason"
                          value={quickReduceData.reasonType}
                          onChange={(e) => setQuickReduceData({ ...quickReduceData, reasonType: e.target.value as any })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="EXPIRED">Obat Kadaluwarsa</option>
                          <option value="DAMAGED">Rusak / Pecah / Bocor</option>
                          <option value="INTERNAL_USE">Pemakaian Internal / Non-Pasien</option>
                          <option value="OPNAME_MINUS">Selisih Opname Fisik (Kurang)</option>
                          <option value="OTHER">Alasan Lainnya</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Keterangan / Alasan Rinci (Wajib) <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="input-reduce-notes"
                        rows={2}
                        required
                        value={quickReduceData.notes}
                        onChange={(e) => setQuickReduceData({ ...quickReduceData, notes: e.target.value })}
                        placeholder="Contoh: 2 botol sirup kadaluwarsa batch Nov 2026 dimusnahkan"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsQuickReduceModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        id="btn-submit-reduce-stock"
                        type="submit"
                        disabled={isSubmittingQuickReduce || !selectedProd || currentStock <= 0 || isOverStock}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        {isSubmittingQuickReduce ? 'Memproses...' : 'Konfirmasi Pengurangan Stok'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Riwayat Mutasi Stok (Audit Trail) */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-sky-700" />
                Riwayat Perubahan Stok (Audit Trail Inventaris)
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isMovementsLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                  <p className="text-xs font-bold">Memuat log mutasi stok dari Cloud SQL...</p>
                </div>
              ) : stockMovements.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p className="text-sm font-bold text-slate-600">Belum ada riwayat mutasi stok tercatat</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">No. Mutasi</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Produk</th>
                        <th className="py-2.5 px-3">Tipe</th>
                        <th className="py-2.5 px-3 text-right">Kuantitas</th>
                        <th className="py-2.5 px-3 text-right">Stok Akhir</th>
                        <th className="py-2.5 px-3">Petugas</th>
                        <th className="py-2.5 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {stockMovements.map((m, idx) => (
                        <tr key={`movement-${m.id}-${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-600">{m.movementNumber}</td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(m.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{m.productName || `Produk #${m.productId}`}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                m.movementType === 'IN'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : m.movementType === 'OUT'
                                  ? 'bg-rose-50 text-rose-800'
                                  : 'bg-indigo-50 text-indigo-800'
                              }`}
                            >
                              {m.movementType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black tabular-nums">
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity < 0 ? `${m.quantity}` : '0'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">{m.currentStock}</td>
                          <td className="py-2.5 px-3 text-slate-500">{m.performedBy || 'Staff'}</td>
                          <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">{m.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
