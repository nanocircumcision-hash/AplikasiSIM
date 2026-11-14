import { UserRole, User } from '../types';

export interface MenuPermissionItem {
  id: string;
  label: string;
  category: 'Utama' | 'Pelayanan Khitan' | 'Keuangan' | 'SDM' | 'Pengaturan & Audit';
  description: string;
  defaultRoles: UserRole[];
}

export const AVAILABLE_MENU_PERMISSIONS: MenuPermissionItem[] = [
  // 1. Utama
  {
    id: 'dashboard',
    label: 'Dashboard Khitan',
    category: 'Utama',
    description: 'Ringkasan operasional, jadwal hari ini, statistik & antrean klinik.',
    defaultRoles: ['owner', 'admin', 'doctor', 'staff'],
  },

  // 2. Pelayanan Khitan
  {
    id: 'patients',
    label: 'Data Pasien & Wali',
    category: 'Pelayanan Khitan',
    description: 'Registrasi data pasien khitan, kartu rekam medis, dan informasi wali.',
    defaultRoles: ['owner', 'admin', 'doctor', 'staff'],
  },
  {
    id: 'bookings',
    label: 'Booking Jadwal Khitan',
    category: 'Pelayanan Khitan',
    description: 'Jadwal janji temu khitan, kalender booking, antrean dan alokasi dokter.',
    defaultRoles: ['owner', 'admin', 'doctor', 'staff'],
  },
  {
    id: 'procedures',
    label: 'Ruang Tindakan Medis',
    category: 'Pelayanan Khitan',
    description: 'Pemeriksaan tindakan khitan, rekam medis EMR, checklist anestesi & sertifikat.',
    defaultRoles: ['owner', 'admin', 'doctor', 'staff'],
  },

  // 3. Keuangan
  {
    id: 'cashier',
    label: 'Kasir & Invoice Pembayaran',
    category: 'Keuangan',
    description: 'Pelunasan tagihan khitan, kasir, invoice pembayaran dan cetak kuitansi.',
    defaultRoles: ['owner', 'admin', 'staff'],
  },
  {
    id: 'doctor-fees',
    label: 'Fee & Jasa Medis Dokter',
    category: 'Keuangan',
    description: 'Rekapitulasi komisi dokter per tindakan khitan dan rincian klaim jasa.',
    defaultRoles: ['owner', 'admin', 'doctor'],
  },
  {
    id: 'expenses',
    label: 'Beban & Pengeluaran Operasional',
    category: 'Keuangan',
    description: 'Catatan pengeluaran klinik (sewa, listrik, konsumsi, ATK, operasional).',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'products',
    label: 'Stok Obat, Celana Sunat & Alkes',
    category: 'Keuangan',
    description: 'Katalog stok obat, celana sunat, dan alkes. Staff/Admin dapat input penambahan stok (+ Stok Masuk). Pengaturan harga terkunci khusus Owner/Super Admin.',
    defaultRoles: ['owner', 'super_admin', 'admin', 'staff', 'doctor'],
  },
  {
    id: 'stock_reduction',
    label: 'Pengurangan & Koreksi Stok Obat',
    category: 'Keuangan',
    description: 'Izin sensitif untuk mengurangi stok obat/produk manual (Barang Keluar, Rusak, Kadaluwarsa, atau Opname Turun). Khusus Owner & pengguna yang diberi akses.',
    defaultRoles: ['owner', 'super_admin'],
  },
  {
    id: 'product-reports',
    label: 'Laporan Pengeluaran Stok',
    category: 'Keuangan',
    description: 'Laporan arus pengeluaran fisik barang, pemakaian paket khitan, penjualan add-on, dan mutasi keluar.',
    defaultRoles: ['owner', 'admin', 'staff'],
  },
  {
    id: 'reports',
    label: 'Laba Rugi & Laporan Keuangan',
    category: 'Keuangan',
    description: 'Laporan laba rugi komprehensif, total omzet, beban, dan margin klinis.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'view_revenue_profit',
    label: 'Lihat Omset & Keuntungan Finansial',
    category: 'Keuangan',
    description: 'Hak akses sensitif melihat nominal omzet kas klinik, keuntungan/laba bersih, dan margin. Khusus Owner & pengguna tertentu yang diizinkan di Manajemen Pengguna.',
    defaultRoles: ['owner'],
  },

  // 4. SDM (Sumber Daya Manusia)
  {
    id: 'employees',
    label: 'Data Karyawan & Staff',
    category: 'SDM',
    description: 'Biodata tenaga medis, perawat, kasir, admin klinik dan data kontrak.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'master-staff',
    label: 'Master Dokter & Nakes',
    category: 'SDM',
    description: 'Konfigurasi tarif jasa dokter, bagi hasil nakes, dan spesialisasi tim medis.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'payroll',
    label: 'Penggajian & Komisi Payroll',
    category: 'SDM',
    description: 'Perhitungan gaji pokok, tunjangan, komisi tindakan & cetak slip gaji.',
    defaultRoles: ['owner', 'admin'],
  },

  // 5. Pengaturan & Audit
  {
    id: 'master-methods',
    label: 'Metode & Tarif Khitan',
    category: 'Pengaturan & Audit',
    description: 'Katalog metode khitan (Laser, Ring, Stapler, Lem, dll) serta tarif paket.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'master',
    label: 'Master Konfigurasi Paket',
    category: 'Pengaturan & Audit',
    description: 'Pengaturan komposisi item include paket (celana, obat, mainan, suvenir).',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'users',
    label: 'Manajemen Pengguna & Akses',
    category: 'Pengaturan & Audit',
    description: 'Kelola akun login, peran, password, serta kustomisasi izin akses menu pengguna.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'audit-log',
    label: 'Audit Trail & Rekam Jejak',
    category: 'Pengaturan & Audit',
    description: 'Riwayat rekam jejak aktivitas login, perubahan data dan aksi penting.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'settings',
    label: 'Pengaturan Klinik & Database',
    category: 'Pengaturan & Audit',
    description: 'Identitas klinik, logo kuitansi, kop surat, backup & pembersihan data.',
    defaultRoles: ['owner', 'admin'],
  },
  {
    id: 'branches',
    label: 'Pengaturan & Master Cabang',
    category: 'Pengaturan & Audit',
    description: 'Kelola unit kerja cabang klinik, tambah cabang baru, edit alamat, nomor telepon, dan status aktif.',
    defaultRoles: ['owner', 'admin'],
  },
];

export const ALL_MENU_IDS = AVAILABLE_MENU_PERMISSIONS.map((m) => m.id);

export const MENU_CATEGORIES = [
  'Utama',
  'Pelayanan Khitan',
  'Keuangan',
  'SDM',
  'Pengaturan & Audit',
] as const;

export function getDefaultPermissionsForRole(role: UserRole): string[] {
  if (role === 'owner' || role === 'super_admin') {
    return ALL_MENU_IDS;
  }
  if (role === 'admin') {
    return ALL_MENU_IDS.filter((id) => id !== 'stock_reduction');
  }
  if (role === 'doctor') {
    return ['dashboard', 'patients', 'bookings', 'procedures', 'doctor-fees', 'products'];
  }
  if (role === 'staff') {
    return ['dashboard', 'patients', 'bookings', 'procedures', 'cashier', 'products', 'product-reports'];
  }
  return ['dashboard'];
}

export function getUserEffectivePermissions(user: User | null): string[] {
  if (!user) return [];

  // Owner always gets full permissions including Omset & Keuntungan
  if (user.role === 'owner') {
    return ALL_MENU_IDS;
  }

  // Super users (admin, super_admin)
  if (user.role === 'super_admin' || user.role === 'admin') {
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      const merged = new Set([...user.permissions, 'branches', 'settings', 'dashboard']);
      return Array.from(merged);
    }
    return getDefaultPermissionsForRole('admin');
  }

  // If user has custom explicit permissions defined and non-empty
  if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  // Fallback to role defaults
  return getDefaultPermissionsForRole(user.role);
}

export function canViewRevenueAndProfit(user: User | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  // Owner and Super Admin / Admin have full access to view financial revenue & profit
  if (role === 'owner' || role === 'admin' || role === 'super_admin' || role === 'super admin' || role === 'master') {
    return true;
  }
  // Other roles (staff, doctor) can see if explicitly granted in User Management
  const permissions = user.permissions || [];
  return (
    permissions.includes('view_revenue_profit') || 
    permissions.includes('view_financials') ||
    permissions.includes('reports.view') ||
    permissions.includes('reports')
  );
}

export function canReduceStock(user: User | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'owner' || role === 'super_admin' || role === 'superadmin' || role === 'master') {
    return true;
  }
  const permissions = user.permissions || [];
  return (
    permissions.includes('stock_reduction') ||
    permissions.includes('products.reduce')
  );
}

export function hasMenuPermission(user: User | null, menuId: string): boolean {
  if (!user) return false;

  // If checking financial revenue & profit access specifically
  if (menuId === 'view_revenue_profit') {
    return canViewRevenueAndProfit(user);
  }

  // If checking manual stock reduction access specifically
  if (menuId === 'stock_reduction') {
    return canReduceStock(user);
  }

  // Super Admin & Owner always have access to branches and core admin modules
  if (user.role === 'admin' || user.role === 'owner') {
    if (menuId === 'branches' || menuId === 'settings' || menuId === 'dashboard') {
      return true;
    }
  }

  const permissions = getUserEffectivePermissions(user);
  if (permissions.includes(menuId)) return true;

  // Support legacy dot-notation permissions (e.g., 'patients.view' matches 'patients')
  if (permissions.some((p) => p === menuId || p.startsWith(`${menuId}.`))) {
    return true;
  }

  // Admin and owner with empty custom array get full access
  if ((user.role === 'admin' || user.role === 'owner') && (!user.permissions || user.permissions.length === 0)) {
    return true;
  }

  return false;
}

