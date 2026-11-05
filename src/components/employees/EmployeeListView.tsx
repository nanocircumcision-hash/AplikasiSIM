import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Users, UserPlus, Search, DollarSign, Briefcase, Phone, Mail, 
  Calendar, CheckCircle, XCircle, AlertCircle, Edit, Trash2, Award,
  Clock, UserCheck
} from 'lucide-react';
import { Employee } from '../../types';

export const EmployeeListView: React.FC = () => {
  const { employees, employeeFees, createEmployee, updateEmployee, toggleEmployeeStatus, deleteEmployee, currentUser, showToast } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'FEES'>('EMPLOYEES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = !currentUser || currentUser?.role === 'admin' || currentUser?.role === 'owner';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    position: 'Asisten Medis Khitan',
    phone: '',
    email: '',
    startDate: new Date().toISOString().split('T')[0],
    basicSalary: 3500000,
    defaultPatientFee: 25000,
    closingFeePerPatient: 50000,
    overtimeHourlyRate: 25000,
    notes: '',
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && emp.isActive) ||
      (statusFilter === 'INACTIVE' && !emp.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      position: 'Asisten Medis Khitan',
      phone: '',
      email: '',
      startDate: new Date().toISOString().split('T')[0],
      basicSalary: 3500000,
      defaultPatientFee: 25000,
      closingFeePerPatient: 50000,
      overtimeHourlyRate: 25000,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      position: emp.position || 'Staff',
      phone: emp.phone || '',
      email: emp.email || '',
      startDate: emp.startDate || new Date().toISOString().split('T')[0],
      basicSalary: emp.basicSalary || 0,
      defaultPatientFee: emp.defaultPatientFee || 0,
      closingFeePerPatient: emp.closingFeePerPatient ?? 50000,
      overtimeHourlyRate: emp.overtimeHourlyRate ?? 25000,
      notes: emp.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama karyawan wajib diisi', 'error');
      return;
    }

    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, formData);
    } else {
      await createEmployee(formData);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (emp: Employee) => {
    if (toggleEmployeeStatus) {
      await toggleEmployeeStatus(emp.id);
    } else {
      await updateEmployee(emp.id, { isActive: !emp.isActive });
    }
  };

  const handleDelete = (emp: Employee) => {
    setEmployeeToDelete(emp);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      setIsDeleting(true);
      await deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const activeCount = employees.filter(e => e.isActive).length;
  const pendingFeesTotal = employeeFees
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + (f.feeAmount || 0), 0);
  const totalPaidFees = employeeFees
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + (f.feeAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Data Karyawan & Kompensasi Staf
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manajemen master staf operasional, struktur gaji pokok, komisi asisten, fee closing pasien klinik, dan tarif lembur per jam.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-orange-200" />
            <span>Tambah Karyawan</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{activeCount} Orang</div>
          <p className="text-xs text-slate-400 mt-1">Total staf operasional terdaftar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Asisten Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{formatRupiah(pendingFeesTotal)}</div>
          <p className="text-xs text-amber-600 mt-1">Siap diproses pada siklus payroll</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fee Terealisasi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{formatRupiah(totalPaidFees)}</div>
          <p className="text-xs text-slate-400 mt-1">Telah dibayarkan via slip payroll</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'EMPLOYEES'
              ? 'border-orange-500 text-rose-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Staf Karyawan ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('FEES')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'FEES'
              ? 'border-orange-500 text-rose-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Riwayat Fee Tindakan Asisten ({employeeFees.length})
        </button>
      </div>

      {activeTab === 'EMPLOYEES' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari kode, nama, jabatan..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Hanya Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Karyawan</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4 text-right">Gaji Pokok</th>
                  <th className="py-3 px-4 text-right">Fee Asisten</th>
                  <th className="py-3 px-4 text-right">Fee Closing Pasien</th>
                  <th className="py-3 px-4 text-right">Lembur / Jam</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {currentUser?.role === 'admin' && (
                    <th className="py-3 px-4 text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada data karyawan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-orange-700 font-mono font-semibold">{emp.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {emp.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 space-y-0.5">
                        {emp.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {emp.phone}</div>}
                        {emp.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(emp.basicSalary || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatRupiah(emp.defaultPatientFee || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-orange-600">
                        {formatRupiah(emp.closingFeePerPatient || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700">
                        {formatRupiah(emp.overtimeHourlyRate || 0)}/jam
                      </td>
                      <td className="py-3 px-4 text-center">
                        {emp.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Karyawan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                emp.isActive 
                                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' 
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={emp.isActive ? 'Nonaktifkan Status' : 'Aktifkan Status'}
                            >
                              {emp.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(emp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Karyawan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Employee Fee Transactions Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Fee Otomatis per Tindakan Asisten Khitan
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Otomatis tercatat setiap tindakan khitan diselesaikan
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">No. Transaksi Fee</th>
                  <th className="py-3 px-4">Nama Asisten</th>
                  <th className="py-3 px-4">Pasien & No. RM</th>
                  <th className="py-3 px-4">Tanggal Tindakan</th>
                  <th className="py-3 px-4 text-right">Nominal Fee</th>
                  <th className="py-3 px-4 text-center">Status Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employeeFees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada transaksi komisi tindakan asisten yang tercatat.
                    </td>
                  </tr>
                ) : (
                  employeeFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-sky-800">
                        {fee.feeNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {fee.employeeName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{fee.patientName}</div>
                        <div className="text-xs text-slate-400 font-mono">{fee.patientRm}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {fee.procedureDate}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        {formatRupiah(fee.feeAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          fee.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fee.status === 'INCLUDED_IN_PAYROLL'
                            ? 'bg-sky-100 text-sky-800'
                            : fee.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan data pokok, kompensasi gaji, dan komisi tindakan khitan.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Karyawan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ns. Ahmad Fauzi, S.Kep"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan / Posisi *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium"
                  >
                    <option value="Asisten Medis Khitan">Asisten Medis Khitan</option>
                    <option value="Perawat Sirkumsisi">Perawat Sirkumsisi</option>
                    <option value="Staff Pendaftaran & Kasir">Staff Pendaftaran & Kasir</option>
                    <option value="Administrasi & Logistik">Administrasi & Logistik</option>
                    <option value="Koordinator Lapangan">Koordinator Lapangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Kompensasi Gaji & Komisi Header */}
              <div className="pt-2 pb-1 border-t border-slate-100">
                <span className="text-xs font-black uppercase text-rose-700 tracking-wider">
                  Struktur Gaji & Kompensasi Karyawan
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gaji Pokok Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fee Asisten / Pasien Khitan (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultPatientFee}
                    onChange={(e) => setFormData({ ...formData, defaultPatientFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Tambahan: Fee Closing & Fee Lembur */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gradient-to-br from-orange-50/70 to-rose-50/70 rounded-2xl border border-orange-100">
                <div>
                  <label className="block text-xs font-bold text-orange-950 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                    Fee Closing Pasien (Rp / Pasien)
                  </label>
                  <input
                    type="number"
                    value={formData.closingFeePerPatient}
                    onChange={(e) => setFormData({ ...formData, closingFeePerPatient: Number(e.target.value) })}
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-800"
                  />
                  <p className="text-[10px] text-orange-600 mt-1">
                    Bonus pasien daftar langsung ke klinik (Walk-in / closing staff)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-950 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    Tarif Lembur (Rp / Jam)
                  </label>
                  <input
                    type="number"
                    value={formData.overtimeHourlyRate}
                    onChange={(e) => setFormData({ ...formData, overtimeHourlyRate: Number(e.target.value) })}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-800"
                  />
                  <p className="text-[10px] text-rose-600 mt-1">
                    Dihitung per jam saat karyawan lembur operasional
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Karyawan
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Kualifikasi STR, riwayat sertifikasi sunat, dsb."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 transition-colors cursor-pointer"
                >
                  {editingEmployee ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Karyawan */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Hapus Data Karyawan
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Konfirmasi penghapusan master staf operasional
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama Karyawan:</span>
                  <span className="font-bold text-slate-900">{employeeToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kode Staf:</span>
                  <span className="font-mono font-bold text-orange-700">{employeeToDelete.employeeCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Jabatan:</span>
                  <span className="font-bold text-slate-800">{employeeToDelete.position}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gaji Pokok:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(employeeToDelete.basicSalary)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <strong>Catatan Keamanan Payroll:</strong> Jika karyawan ini memiliki catatan fee tindakan asisten atau slip penggajian yang telah diterbitkan sebelumnya, sistem akan mengarsipkan data dengan aman tanpa merusak riwayat transaksi keuangan klinik.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Karyawan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
