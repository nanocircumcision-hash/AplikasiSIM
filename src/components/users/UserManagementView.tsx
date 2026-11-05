import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Shield, UserCheck, UserPlus, Search, Edit, Trash2, 
  Lock, CheckCircle, XCircle, Mail, AlertTriangle, KeyRound,
  Eye, EyeOff, Phone, CheckSquare, Square, Info, ShieldAlert,
  Power, ListChecks, Building2, Crown, ShieldCheck
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { 
  AVAILABLE_MENU_PERMISSIONS, 
  MENU_CATEGORIES, 
  getDefaultPermissionsForRole, 
  ALL_MENU_IDS,
  getUserEffectivePermissions
} from '../../utils/permissionUtils';

export const UserManagementView: React.FC = () => {
  const { usersList, createUser, updateUser, deleteUser, currentUser, branches, activeBranchCode, showToast } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Delete Confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal State for View Permissions Preview
  const [previewUser, setPreviewUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff' as UserRole,
    branchCode: 'PUSAT',
    isActive: true,
  });

  // Selected Permissions State for Modal Form
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const filteredUsers = usersList.filter((u) => {
    const uname = u.username || (u.email ? u.email.split('@')[0] : '') || '';
    const fname = u.fullName || '';
    const email = u.email || '';
    const phone = u.phone || '';
    const search = (searchTerm || '').toLowerCase();

    const matchesSearch = 
      uname.toLowerCase().includes(search) ||
      fname.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      phone.toLowerCase().includes(search);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const userBranch = ((u as any).branchCode || 'PUSAT').toUpperCase();
    const matchesBranch = 
      branchFilter === 'ALL' || 
      userBranch === branchFilter.toUpperCase() ||
      userBranch === 'ALL';

    const isActive = (u as any).isActive ?? true;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && isActive) || 
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesRole && matchesBranch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'staff',
      branchCode: activeBranchCode && activeBranchCode !== 'ALL' ? activeBranchCode : 'PUSAT',
      isActive: true,
    });
    // Default permissions for staff
    setSelectedPermissions(getDefaultPermissionsForRole('staff'));
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({
      username: user.username || (user.email ? user.email.split('@')[0] : `user_${user.id}`),
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Leave blank unless changing
      role: user.role,
      branchCode: (user as any).branchCode || 'PUSAT',
      isActive: (user as any).isActive ?? true,
    });
    // Load effective permissions or fallback to role defaults
    const currentPerms = getUserEffectivePermissions(user);
    setSelectedPermissions(currentPerms);
    setIsFormModalOpen(true);
  };

  // Handle role change in form: auto-suggest permissions while allowing customization
  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => ({ 
      ...prev, 
      role: newRole,
      branchCode: newRole === 'admin' || newRole === 'owner' || newRole === 'super_admin' ? 'ALL' : (prev.branchCode === 'ALL' ? 'PUSAT' : prev.branchCode)
    }));
    setSelectedPermissions(getDefaultPermissionsForRole(newRole));
  };

  const handleTogglePermission = (menuId: string) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions([...ALL_MENU_IDS]);
  };

  const handleResetToRoleDefault = () => {
    setSelectedPermissions(getDefaultPermissionsForRole(formData.role));
  };

  const handleClearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim()) {
      showToast('Username dan Nama Lengkap wajib diisi', 'error');
      return;
    }

    if (selectedPermissions.length === 0) {
      showToast('Peringatan: Berikan setidaknya satu izin menu akses untuk akun ini.', 'info');
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = {
          username: formData.username.trim(),
          fullName: formData.fullName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          role: formData.role,
          branchCode: formData.branchCode,
          isActive: formData.isActive,
          permissions: selectedPermissions,
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await updateUser(editingUser.id as any, payload);
      } else {
        if (!formData.password.trim()) {
          showToast('Kata Sandi wajib diisi untuk pengguna baru', 'error');
          setIsSubmitting(false);
          return;
        }
        const finalEmail = formData.email.trim() || `${formData.username.trim().toLowerCase()}@clinic.local`;
        await createUser({
          username: formData.username.trim(),
          fullName: formData.fullName.trim(),
          email: finalEmail,
          phone: formData.phone.trim(),
          password: formData.password.trim(),
          role: formData.role,
          branchCode: formData.branchCode,
          isActive: formData.isActive,
          permissions: selectedPermissions,
        });
      }
      setIsFormModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status active/inactive
  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      showToast('Anda tidak dapat mengubah status akun Anda sendiri yang sedang aktif.', 'error');
      return;
    }
    const currentStatus = (user as any).isActive ?? true;
    await updateUser(user.id as any, { isActive: !currentStatus });
  };

  // Delete User Confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id as any);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
            <Crown className="w-3.5 h-3.5 text-purple-600" />
            Owner / Pemilik
          </span>
        );
      case 'super_admin':
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            Admin Operasional
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Dokter Operator
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Staff / Kasir
          </span>
        );
    }
  };

  // Check if current user is admin/owner/super_admin
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner' || currentUser?.role === 'super_admin';

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                Manajemen Pengguna & Hak Akses
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Kelola akun sistem, password, peran jabatan, dan penentuan akses menu per pengguna.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Tambah Pengguna Baru</span>
          </button>
        )}
      </div>

      {/* Role Matrix Explanation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-indigo-50/60 border border-indigo-100/80 rounded-2xl">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-600" />
            Super Admin / Owner
          </div>
          <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
            Akses menyeluruh: seluruh modul pelayanan khitan, keuangan kasir & laba rugi, SDM payroll, serta master konfigurasi & log audit.
          </p>
        </div>

        <div className="p-4 bg-emerald-50/60 border border-emerald-100/80 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Dokter Operator Khitan
          </div>
          <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
            Fokus pelayanan medis: rekam medis pasien khitan, jadwal booking, ruang tindakan, dan rekap fee dokter.
          </p>
        </div>

        <div className="p-4 bg-amber-50/60 border border-amber-100/80 rounded-2xl">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <KeyRound className="w-4 h-4 text-amber-600" />
            Staff Pegawai & Kasir
          </div>
          <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
            Operasional klinik: registrasi pasien & wali, booking khitan, ruang tindakan, kasir & nota pembayaran, serta stok barang.
          </p>
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari username, nama, email, hp..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Cabang (Global)</option>
              <option value="PUSAT">Klinik Pusat (PUSAT)</option>
              {branches?.filter(b => b.code !== 'PUSAT').map((b) => (
                <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Peran (Role)</option>
              <option value="owner">👑 Owner / Pemilik</option>
              <option value="super_admin">🛡️ Super Admin</option>
              <option value="admin">🔒 Admin Operasional</option>
              <option value="doctor">🩺 Dokter Operator</option>
              <option value="staff">💼 Staff / Kasir</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Hanya Aktif</option>
              <option value="INACTIVE">Hanya Nonaktif</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Akses Cabang</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Hak Akses Menu</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isSuperAdmin && (
                  <th className="py-3 px-4 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada akun pengguna yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = (user as any).isActive ?? true;
                  const perms = getUserEffectivePermissions(user);
                  const isSelf = user.id === currentUser?.id || user.email === currentUser?.email;
                  const isMasterAdmin = user.email === 'admin@nanocircumcision.com' || user.uid === 'user-admin';
                  const userBranch = ((user as any).branchCode || 'PUSAT').toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-sm uppercase">
                            {user.fullName ? user.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {user.fullName}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px]">
                              @{user.username || (user.email ? user.email.split('@')[0] : `user_${user.id}`)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Branch Access Badge */}
                      <td className="py-3.5 px-4">
                        {userBranch === 'ALL' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                            <Building2 className="w-3 h-3 text-purple-600" />
                            Semua Cabang
                          </span>
                        ) : userBranch === 'CABANG-01' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            Cabang Surabaya
                          </span>
                        ) : userBranch === 'CABANG-02' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            Cabang Sidoarjo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                            <Building2 className="w-3 h-3 text-blue-600" />
                            Klinik Pusat
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Menu Permissions Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewUser(user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 font-bold transition-colors cursor-pointer text-[11px]"
                            title="Klik untuk melihat rincian menu yang diizinkan"
                          >
                            <ListChecks className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              {perms.length >= ALL_MENU_IDS.length
                                ? 'Akses Penuh (Semua Menu)'
                                : `${perms.length} Menu Diizinkan`}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Pengguna & Hak Akses"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Toggle Status Button */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                                  : isActive
                                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={
                                isSelf
                                  ? 'Tidak dapat menonaktifkan akun sendiri'
                                  : isActive
                                  ? 'Nonaktifkan Akun'
                                  : 'Aktifkan Akun'
                              }
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setUserToDelete(user)}
                              disabled={isSelf || isMasterAdmin}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSelf || isMasterAdmin
                                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                                  : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                              title={
                                isSelf
                                  ? 'Tidak dapat menghapus akun sendiri'
                                  : isMasterAdmin
                                  ? 'Akun Super Admin Utama dilindungi'
                                  : 'Hapus Pengguna Permanen'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit User With Granular Menu Permissions */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-black">
                  {editingUser ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingUser ? `Edit Pengguna: ${editingUser.fullName}` : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur profil akun login dan tentukan pilihan hak akses menu yang diizinkan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* SECTION 1: Account Information */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Informasi Akun & Login
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Username Login *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Contoh: kasir.dina / dr.bambang"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap & Gelar *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Contoh: dr. Bambang Irawan, Sp.B"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="dina@nanocircumcision.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        No. WhatsApp / HP
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Peran Utama (Role Jabatan) *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                      >
                        <option value="staff">Staff Front Office & Kasir (Bisa Tambah Stok, Harga Obat Terkunci Aman)</option>
                        <option value="doctor">Dokter Operator Khitan (Tindakan EMR & Fee Medis)</option>
                        <option value="admin">Admin Operasional Klinik (Kelola Data & Tambah Stok, Harga Obat Terkunci Aman)</option>
                        <option value="super_admin">Super Administrator (Akses Penuh Sistem + Kuasa Mutlak Harga Obat)</option>
                        <option value="owner">Owner / Pemilik Klinik (Akses Tertinggi + Kuasa Mutlak Harga Obat & Payroll)</option>
                      </select>
                      <p className="text-[10px] mt-1.5">
                        {formData.role === 'owner' || formData.role === 'super_admin' ? (
                          <span className="text-purple-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            Role ini memiliki otoritas penuh mengatur &amp; mengubah harga jual serta modal obat/alkes.
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Keamanan: Role ini dapat mencatat penambahan stok, namun perubahan harga obat terkunci aman.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Branch Assignment */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Akses Wilayah Cabang *
                      </label>
                      <select
                        value={formData.branchCode}
                        onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                      >
                        <option value="PUSAT">Klinik Khitan Pusat (PUSAT)</option>
                        {branches?.filter(b => b.code !== 'PUSAT').map((b) => (
                          <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                        ))}
                        <option value="ALL">Semua Cabang (Global - Khusus Super Admin / Owner)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formData.branchCode === 'ALL' 
                          ? 'Pengguna dapat memantau dan berpindah ke semua cabang.'
                          : `Pengguna terkunci otomatis hanya dapat mengakses data cabang ${formData.branchCode}.`}
                      </p>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>
                          Kata Sandi {editingUser ? '(Kosongkan bila tidak diganti)' : '*'}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!editingUser}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? '••••••••' : 'Masukkan password'}
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle in Form */}
                  <div className="mt-3 flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                      />
                      <span className="text-xs font-bold text-slate-700">
                        Status Akun Aktif (Dapat Login ke Aplikasi)
                      </span>
                    </label>
                  </div>
                </div>

                {/* SECTION 2: Granular Menu Permissions */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Pilihan Hak Akses Menu Sistem
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Centang menu apa saja yang diizinkan untuk dibuka oleh pengguna ini.
                      </p>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Pilih Semua (19)
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToRoleDefault}
                        className="px-2.5 py-1 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Default Sesuai Peran
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  {/* Summary Pill */}
                  <div className="mb-4 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Menu Terpilih:</span>
                    <span className="font-mono font-black text-sky-800">
                      {selectedPermissions.length} dari {ALL_MENU_IDS.length} Menu
                    </span>
                  </div>

                  {/* Permissions by Category */}
                  <div className="space-y-4">
                    {MENU_CATEGORIES.map((category) => {
                      const categoryMenus = AVAILABLE_MENU_PERMISSIONS.filter(
                        (m) => m.category === category
                      );
                      const allSelectedInCat = categoryMenus.every((m) =>
                        selectedPermissions.includes(m.id)
                      );

                      return (
                        <div
                          key={category}
                          className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5"
                        >
                          {/* Category Header with batch toggle */}
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-xs font-black text-slate-800 tracking-tight">
                              {category}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (allSelectedInCat) {
                                  setSelectedPermissions((prev) =>
                                    prev.filter((id) => !categoryMenus.some((m) => m.id === id))
                                  );
                                } else {
                                  const toAdd = categoryMenus
                                    .map((m) => m.id)
                                    .filter((id) => !selectedPermissions.includes(id));
                                  setSelectedPermissions((prev) => [...prev, ...toAdd]);
                                }
                              }}
                              className="text-[10px] font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
                            >
                              {allSelectedInCat ? 'Batalkan Kategori Ini' : 'Pilih Semua Kategori Ini'}
                            </button>
                          </div>

                          {/* Menu Checkbox Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categoryMenus.map((menu) => {
                              const isChecked = selectedPermissions.includes(menu.id);
                              const isFinancialRestricted = menu.id === 'view_revenue_profit';
                              return (
                                <div
                                  key={menu.id}
                                  onClick={() => handleTogglePermission(menu.id)}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                    isChecked
                                      ? isFinancialRestricted
                                        ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400/50'
                                        : 'bg-sky-50/70 border-sky-400/90 shadow-xs'
                                      : isFinancialRestricted
                                      ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {isChecked ? (
                                      <CheckSquare className={`w-4 h-4 ${isFinancialRestricted ? 'text-amber-600' : 'text-sky-600'}`} />
                                    ) : (
                                      <Square className={`w-4 h-4 ${isFinancialRestricted ? 'text-amber-300' : 'text-slate-300'}`} />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className={`text-xs font-bold leading-tight flex items-center flex-wrap gap-1 ${
                                        isChecked 
                                          ? isFinancialRestricted ? 'text-amber-950 font-black' : 'text-sky-950' 
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      <span>{menu.label}</span>
                                      {isFinancialRestricted && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                          Khusus Owner / Izin Terbatas
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                                      {menu.description}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <div className="text-xs text-slate-500">
                  {selectedPermissions.length} menu aktif
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan...</span>
                    ) : editingUser ? (
                      <span>Simpan Perubahan</span>
                    ) : (
                      <span>Tambahkan Pengguna</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus akun pengguna berikut secara permanen?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1 my-2">
                <div className="font-bold text-slate-900">{userToDelete.fullName}</div>
                <div className="text-slate-500 font-mono text-[11px]">@{userToDelete.username || userToDelete.email}</div>
                <div className="pt-1">{getRoleBadge(userToDelete.role)}</div>
              </div>

              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 text-left">
                <strong>Peringatan:</strong> Pengguna tidak akan dapat login lagi ke dalam sistem Nano Circumcision. Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Permissions Preview */}
      {previewUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <ListChecks className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Hak Akses Menu Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewUser.fullName} (@{previewUser.username || previewUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {(() => {
                const perms = getUserEffectivePermissions(previewUser);
                return MENU_CATEGORIES.map((cat) => {
                  const catMenus = AVAILABLE_MENU_PERMISSIONS.filter((m) => m.category === cat);
                  const allowedMenusInCat = catMenus.filter((m) => perms.includes(m.id));

                  if (allowedMenusInCat.length === 0) return null;

                  return (
                    <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="font-black text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>{cat}</span>
                        <span className="text-sky-600 font-mono text-[10px]">
                          {allowedMenusInCat.length} menu
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {allowedMenusInCat.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold"
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = previewUser;
                  setPreviewUser(null);
                  handleOpenEdit(target);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Ubah Hak Akses Pengguna Ini
              </button>

              <button
                type="button"
                onClick={() => setPreviewUser(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
