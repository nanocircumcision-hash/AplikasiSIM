import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Stethoscope, Briefcase, Plus, Edit2, Trash2, CheckCircle2, XCircle, 
  Search, History, ShieldCheck, X, Phone, Mail, Award, DollarSign,
  UserCheck, Clock, AlertCircle, FileText
} from 'lucide-react';
import { Doctor, Employee, AuditLog } from '../../types';

export const DoctorsAndStaffTab: React.FC = () => {
  const { 
    doctors, 
    employees, 
    packages,
    createDoctor, 
    updateDoctor, 
    toggleDoctorStatus, 
    deleteDoctor,
    createEmployee, 
    updateEmployee, 
    toggleEmployeeStatus, 
    deleteEmployee,
    fetchAuditLogs,
    saveDoctorFeeSettings,
    syncDoctorFeesWithMaster,
    currentUser,
    showToast
  } = useClinic();

  const [filterType, setFilterType] = useState<'ALL' | 'DOCTOR' | 'STAFF'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [entityType, setEntityType] = useState<'DOCTOR' | 'STAFF'>('DOCTOR');
  const [editingItem, setEditingItem] = useState<{ type: 'DOCTOR' | 'STAFF'; data: any } | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditList, setAuditList] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<UnifiedPerson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Doctor custom package fees state
  const [customPackageFees, setCustomPackageFees] = useState<{ packageId: number; packageName: string; regulerFee: number; vipFee: number }[]>([]);
  const [showPackageFeeCustom, setShowPackageFeeCustom] = useState(false);
  const [syncPendingFees, setSyncPendingFees] = useState(true);

  const isAdmin = !currentUser || currentUser.role === 'admin' || currentUser.role === 'owner';

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    title: 'dr.',
    specialization: 'Dokter Operator Khitan',
    position: 'Asisten Medis Khitan',
    sipNumber: '',
    phone: '',
    email: '',
    description: '',
    notes: '',
    regulerFee: 250000,
    vipFee: 350000,
    basicSalary: 3500000,
    closingFeePerPatient: 50000,
    overtimeHourlyRate: 25000,
    defaultPatientFee: 25000,
    isActive: true,
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Combine or filter items
  interface UnifiedPerson {
    id: number;
    type: 'DOCTOR' | 'STAFF';
    code: string;
    name: string;
    title?: string;
    roleLabel: string;
    specializationOrPosition: string;
    phone: string;
    email: string;
    sipNumber?: string;
    description: string;
    notes: string;
    isActive: boolean;
    regulerFee?: number;
    vipFee?: number;
    closingFee?: number;
    overtimeRate?: number;
    defaultPatientFee?: number;
    basicSalary?: number;
    raw: Doctor | Employee;
  }

  const unifiedList: UnifiedPerson[] = [
    ...doctors.map(d => ({
      id: d.id,
      type: 'DOCTOR' as const,
      code: d.code,
      name: d.name,
      title: d.title,
      roleLabel: 'Dokter Operator',
      specializationOrPosition: d.specialization || 'Dokter Khitan',
      phone: d.phone,
      email: d.email || '',
      sipNumber: d.sipNumber,
      description: d.description || '',
      notes: d.notes || '',
      isActive: d.isActive,
      regulerFee: d.regulerFee ?? 250000,
      vipFee: d.vipFee ?? 350000,
      raw: d,
    })),
    ...employees.map(e => ({
      id: e.id,
      type: 'STAFF' as const,
      code: e.employeeCode,
      name: e.name,
      title: '',
      roleLabel: 'Karyawan / Staf',
      specializationOrPosition: e.position || 'Staff',
      phone: e.phone || '',
      email: e.email || '',
      description: e.description || '',
      notes: e.notes || '',
      isActive: e.isActive,
      closingFee: e.closingFeePerPatient !== undefined && e.closingFeePerPatient !== null ? Number(e.closingFeePerPatient) : 0,
      overtimeRate: e.overtimeHourlyRate !== undefined && e.overtimeHourlyRate !== null ? Number(e.overtimeHourlyRate) : 0,
      defaultPatientFee: e.defaultPatientFee !== undefined && e.defaultPatientFee !== null ? Number(e.defaultPatientFee) : 0,
      basicSalary: e.basicSalary,
      raw: e,
    }))
  ];

  const filteredPeople = unifiedList.filter((p) => {
    const matchesType = 
      filterType === 'ALL' || 
      (filterType === 'DOCTOR' && p.type === 'DOCTOR') ||
      (filterType === 'STAFF' && p.type === 'STAFF');

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && p.isActive) ||
      (statusFilter === 'INACTIVE' && !p.isActive);

    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specializationOrPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.notes.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  const doctorCount = doctors.length;
  const staffCount = employees.length;
  const activeDoctors = doctors.filter(d => d.isActive).length;
  const activeStaff = employees.filter(e => e.isActive).length;

  const handleOpenAdd = (type: 'DOCTOR' | 'STAFF' = 'DOCTOR') => {
    setEntityType(type);
    setEditingItem(null);
    setCustomPackageFees([]);
    setShowPackageFeeCustom(false);
    setSyncPendingFees(true);
    setFormData({
      name: '',
      title: type === 'DOCTOR' ? 'dr.' : '',
      specialization: 'Dokter Operator Khitan',
      position: 'Asisten Medis Khitan',
      sipNumber: '',
      phone: '',
      email: '',
      description: '',
      notes: '',
      regulerFee: 250000,
      vipFee: 350000,
      basicSalary: 3500000,
      closingFeePerPatient: 50000,
      overtimeHourlyRate: 25000,
      defaultPatientFee: 25000,
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (person: UnifiedPerson) => {
    setEntityType(person.type);
    setEditingItem({ type: person.type, data: person.raw });

    if (person.type === 'DOCTOR') {
      const doc = person.raw as Doctor;
      const docFeeRules = doc.feeRules || [];
      const pkgFees = packages.map(pkg => {
        const rReg = docFeeRules.find(r => r.packageId === pkg.id && r.patientCategoryId === 1);
        const rVip = docFeeRules.find(r => r.packageId === pkg.id && r.patientCategoryId === 2);
        return {
          packageId: pkg.id,
          packageName: pkg.name,
          regulerFee: rReg ? rReg.feeAmount : (doc.regulerFee ?? 250000),
          vipFee: rVip ? rVip.feeAmount : (doc.vipFee ?? 350000),
        };
      });
      setCustomPackageFees(pkgFees);
      setShowPackageFeeCustom(false);
      setSyncPendingFees(true);

      setFormData({
        name: doc.name,
        title: doc.title || 'dr.',
        specialization: doc.specialization || 'Dokter Operator Khitan',
        position: '',
        sipNumber: doc.sipNumber || '',
        phone: doc.phone || '',
        email: doc.email || '',
        description: doc.description || '',
        notes: doc.notes || '',
        regulerFee: doc.regulerFee !== undefined ? doc.regulerFee : 250000,
        vipFee: doc.vipFee !== undefined ? doc.vipFee : 350000,
        basicSalary: 0,
        closingFeePerPatient: 0,
        overtimeHourlyRate: 0,
        defaultPatientFee: 0,
        isActive: doc.isActive,
      });
    } else {
      const emp = person.raw as Employee;
      setCustomPackageFees([]);
      setShowPackageFeeCustom(false);
      setFormData({
        name: emp.name,
        title: '',
        specialization: '',
        position: emp.position || 'Asisten Medis',
        sipNumber: '',
        phone: emp.phone || '',
        email: emp.email || '',
        description: emp.description || '',
        notes: emp.notes || '',
        regulerFee: 0,
        vipFee: 0,
        basicSalary: emp.basicSalary !== undefined && emp.basicSalary !== null ? Number(emp.basicSalary) : 3500000,
        closingFeePerPatient: emp.closingFeePerPatient !== undefined && emp.closingFeePerPatient !== null ? Number(emp.closingFeePerPatient) : 0,
        overtimeHourlyRate: emp.overtimeHourlyRate !== undefined && emp.overtimeHourlyRate !== null ? Number(emp.overtimeHourlyRate) : 0,
        defaultPatientFee: emp.defaultPatientFee !== undefined && emp.defaultPatientFee !== null ? Number(emp.defaultPatientFee) : 0,
        isActive: emp.isActive,
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama wajib diisi', 'error');
      return;
    }

    if (entityType === 'DOCTOR') {
      const regFeeNum = Number(formData.regulerFee) >= 0 ? Number(formData.regulerFee) : 250000;
      const vipFeeNum = Number(formData.vipFee) >= 0 ? Number(formData.vipFee) : 350000;

      const payload = {
        name: formData.name,
        title: formData.title,
        specialization: formData.specialization,
        phone: formData.phone,
        email: formData.email,
        sipNumber: formData.sipNumber,
        description: formData.description,
        notes: formData.notes,
        regulerFee: regFeeNum,
        vipFee: vipFeeNum,
        isActive: formData.isActive,
      };

      let docId: number | null = null;
      if (editingItem && editingItem.type === 'DOCTOR') {
        docId = editingItem.data.id;
        await updateDoctor(editingItem.data.id, payload);
      } else {
        const created = await createDoctor(payload);
        if (created && created.success && created.doctor) {
          docId = created.doctor.id;
        }
      }

      // Explicitly synchronize fee settings across all packages and pending transactions
      if (docId) {
        await saveDoctorFeeSettings(docId, {
          regulerFee: regFeeNum,
          vipFee: vipFeeNum,
          packageFees: showPackageFeeCustom ? customPackageFees : undefined,
          syncPendingFees,
        });
      }
    } else {
      const payload = {
        name: formData.name,
        position: formData.position,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        notes: formData.notes,
        basicSalary: Number(formData.basicSalary) || 0,
        closingFeePerPatient: formData.closingFeePerPatient !== undefined && formData.closingFeePerPatient !== '' ? Math.max(0, Number(formData.closingFeePerPatient)) : 0,
        overtimeHourlyRate: formData.overtimeHourlyRate !== undefined && formData.overtimeHourlyRate !== '' ? Math.max(0, Number(formData.overtimeHourlyRate)) : 0,
        defaultPatientFee: formData.defaultPatientFee !== undefined && formData.defaultPatientFee !== '' ? Math.max(0, Number(formData.defaultPatientFee)) : 0,
        isActive: formData.isActive,
      };

      if (editingItem && editingItem.type === 'STAFF') {
        await updateEmployee(editingItem.data.id, payload);
      } else {
        await createEmployee(payload);
      }
    }

    setIsFormModalOpen(false);
  };

  const handleToggleStatus = async (person: UnifiedPerson) => {
    if (person.type === 'DOCTOR') {
      await toggleDoctorStatus(person.id);
    } else {
      await toggleEmployeeStatus(person.id);
    }
  };

  const handleDelete = (person: UnifiedPerson) => {
    setPersonToDelete(person);
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;
    try {
      setIsDeleting(true);
      if (personToDelete.type === 'DOCTOR') {
        await deleteDoctor(personToDelete.id);
      } else {
        await deleteEmployee(personToDelete.id);
      }
      setPersonToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAudit = async () => {
    setIsLoadingAudit(true);
    setIsAuditModalOpen(true);
    const doctorLogs = await fetchAuditLogs('doctor');
    const employeeLogs = await fetchAuditLogs('employee');
    const all = [...doctorLogs, ...employeeLogs].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setAuditList(all);
    setIsLoadingAudit(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </span>
            Master Dokter, Karyawan & Staf
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Data tenaga medis dokter operator dan staf klinik dinamis (Dokter A, B, C, Asisten Medis, Pendaftaran) tanpa hard-code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAudit}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Lihat Riwayat Perubahan Dokter & Karyawan"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Riwayat Perubahan</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'owner') && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenAdd('DOCTOR')}
                className="px-3.5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Dokter</span>
              </button>
              <button
                onClick={() => handleOpenAdd('STAFF')}
                className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Staf / Karyawan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Dokter Operator
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {doctorCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">{activeDoctors} Dokter Aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Karyawan & Staf
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {staffCount}
            </span>
            <span className="text-[11px] text-purple-600 font-bold">{activeStaff} Staf Aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Fee Closing Pasien
            </span>
            <span className="text-lg font-black text-amber-700 mt-1 block">
              Tersedia di SDM
            </span>
            <span className="text-[11px] text-slate-400">Bonus pendaftaran langsung</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Fee Lembur (Per Jam)
            </span>
            <span className="text-lg font-black text-purple-700 mt-1 block">
              Dihitung Per Jam
            </span>
            <span className="text-[11px] text-slate-400">Terintegrasi di slip gaji</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({unifiedList.length})
          </button>
          <button
            onClick={() => setFilterType('DOCTOR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterType === 'DOCTOR'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Dokter ({doctorCount})
          </button>
          <button
            onClick={() => setFilterType('STAFF')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              filterType === 'STAFF'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Karyawan & Staf ({staffCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode, spesialisasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'ALL' ? 'Semua' : s === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPeople.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Tidak ditemukan data Dokter atau Staf</p>
            <p className="text-xs text-slate-400">
              {searchTerm ? 'Coba sesuaikan kata kunci pencarian Anda' : 'Klik tombol tambah dokter atau staf untuk mendaftarkan data baru'}
            </p>
          </div>
        ) : (
          filteredPeople.map((person) => (
            <div
              key={`${person.type}-${person.id}`}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                person.isActive 
                  ? 'border-slate-200 hover:border-orange-300 hover:shadow-md' 
                  : 'border-slate-200/60 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {person.code}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      person.type === 'DOCTOR' 
                        ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {person.roleLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(person)}
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                      person.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Klik untuk mengaktifkan / menonaktifkan status"
                  >
                    {person.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                    <span>{person.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>
                </div>

                {/* Person Name & Info */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    person.type === 'DOCTOR'
                      ? 'bg-gradient-to-tr from-orange-500 to-rose-600 text-white shadow-xs'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white shadow-xs'
                  }`}>
                    {person.type === 'DOCTOR' ? <Stethoscope className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                      {person.title ? `${person.title} ${person.name}` : person.name}
                    </h3>
                    <p className="text-xs text-orange-700 font-bold mt-0.5">
                      {person.specializationOrPosition}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {person.description && (
                  <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                    {person.description}
                  </p>
                )}

                {/* Details list */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {person.sipNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">SIP:</span>
                      <span className="font-mono font-bold text-slate-800">{person.sipNumber}</span>
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Telepon:
                      </span>
                      <span className="font-mono text-slate-800">{person.phone}</span>
                    </div>
                  )}
                  {person.type === 'DOCTOR' && (
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-sky-800 font-semibold flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-sky-600" /> Fee Pasien Reguler:
                        </span>
                        <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 font-mono">
                          {formatRupiah(person.regulerFee || 250000)} / pasien
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-600" /> Fee Pasien VIP:
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-mono">
                          {formatRupiah(person.vipFee || 350000)} / pasien
                        </span>
                      </div>
                    </div>
                  )}
                  {person.type === 'STAFF' && (
                    <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-emerald-600" /> Fee Pasien Tindakan:
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-mono">
                          {formatRupiah(person.defaultPatientFee !== undefined && person.defaultPatientFee !== null ? person.defaultPatientFee : 0)} / pasien
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-amber-600" /> Fee Closing:
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-mono">
                          {formatRupiah(person.closingFee !== undefined && person.closingFee !== null ? person.closingFee : 0)} / pasien
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-purple-800 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600" /> Fee Lembur:
                        </span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 font-mono">
                          {formatRupiah(person.overtimeRate !== undefined && person.overtimeRate !== null ? person.overtimeRate : 0)} / jam
                        </span>
                      </div>
                    </div>
                  )}
                  {person.notes && (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic">
                      Catatan: {person.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-medium">
                  {person.type === 'DOCTOR' ? 'Tenaga Medis' : 'Staf Operasional'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(person)}
                    className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Data"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(person)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={`Hapus Data ${person.roleLabel}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal (Tambah / Edit Dokter & Karyawan) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                  entityType === 'DOCTOR' 
                    ? 'bg-gradient-to-tr from-orange-500 to-rose-600' 
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-700'
                }`}>
                  {entityType === 'DOCTOR' ? <Stethoscope className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingItem 
                      ? `Edit ${entityType === 'DOCTOR' ? 'Dokter Operator' : 'Karyawan / Staf'}` 
                      : `Tambah ${entityType === 'DOCTOR' ? 'Dokter Baru' : 'Karyawan / Staf Baru'}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bebas disesuaikan tanpa data hard-code (Dokter A, B, C, staf klinik, dll)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector if adding new */}
            {!editingItem && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setEntityType('DOCTOR');
                    setFormData(prev => ({ ...prev, title: 'dr.', specialization: 'Dokter Operator Khitan' }));
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    entityType === 'DOCTOR' 
                      ? 'bg-white text-orange-700 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Dokter Operator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntityType('STAFF');
                    setFormData(prev => ({ ...prev, title: '', position: 'Asisten Medis Khitan' }));
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    entityType === 'STAFF' 
                      ? 'bg-white text-purple-700 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Karyawan & Staf
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {entityType === 'DOCTOR' ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Gelar:
                      </label>
                      <input
                        type="text"
                        placeholder="dr. / dr. Sp.B"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Nama Dokter <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Dokter A / dr. Budi Prakoso"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Spesialisasi:
                      </label>
                      <input
                        type="text"
                        placeholder="Dokter Operator Khitan"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Nomor SIP:
                      </label>
                      <input
                        type="text"
                        placeholder="SIP/503/XXX/2026"
                        value={formData.sipNumber}
                        onChange={(e) => setFormData({ ...formData, sipNumber: e.target.value })}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Section: Pengaturan Fee Dokter Berdasarkan Jenis Pasien (VIP & Reguler) */}
                  <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-amber-50 rounded-2xl border border-sky-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-sky-700" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Tarif Fee Dokter per Jenis Pasien (VIP &amp; Reguler)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                        Auto-Sync Payroll
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tentukan nominal fee yang diperoleh dokter per tindakan khitan berdasarkan jenis pasien VIP dan Reguler.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs">
                        <label className="block text-[11px] font-black text-sky-900 mb-1">
                          Fee Pasien Reguler (Rp):
                        </label>
                        <input
                          type="number"
                          step={5000}
                          min={0}
                          value={formData.regulerFee}
                          onChange={(e) => setFormData({ ...formData, regulerFee: Number(e.target.value) })}
                          className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                          {formatRupiah(formData.regulerFee)} / pasien
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                        <label className="block text-[11px] font-black text-amber-950 mb-1">
                          Fee Pasien VIP (Rp):
                        </label>
                        <input
                          type="number"
                          step={5000}
                          min={0}
                          value={formData.vipFee}
                          onChange={(e) => setFormData({ ...formData, vipFee: Number(e.target.value) })}
                          className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                          {formatRupiah(formData.vipFee)} / pasien
                        </div>
                      </div>
                    </div>

                    {/* Kustomisasi Fee Khusus Per Paket Khitan */}
                    <div className="pt-2 border-t border-sky-200/60">
                      <button
                        type="button"
                        onClick={() => setShowPackageFeeCustom(!showPackageFeeCustom)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{showPackageFeeCustom ? '▼ Sembunyikan Kustomisasi' : '▶ Kustomisasi Fee Khusus Per Paket Khitan (Opsional)'}</span>
                      </button>

                      {showPackageFeeCustom && (
                        <div className="mt-2.5 bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <p className="text-[10px] text-slate-500">
                            Secara umum tarif dasar di atas berlaku untuk semua paket. Jika ingin membedakan fee untuk paket tertentu, atur di bawah ini:
                          </p>
                          <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                            {packages.map((pkg) => {
                              const custom = customPackageFees.find(p => p.packageId === pkg.id);
                              const curReg = custom?.regulerFee !== undefined ? custom.regulerFee : formData.regulerFee;
                              const curVip = custom?.vipFee !== undefined ? custom.vipFee : formData.vipFee;

                              return (
                                <div key={pkg.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <span className="font-bold text-slate-800 sm:w-1/3 truncate" title={pkg.name}>
                                    {pkg.name}
                                  </span>
                                  <div className="flex items-center gap-2 sm:w-2/3">
                                    <div className="flex-1">
                                      <span className="text-[9px] text-sky-800 font-bold block">Reguler:</span>
                                      <input
                                        type="number"
                                        step={5000}
                                        value={curReg}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setCustomPackageFees(prev => {
                                            const filtered = prev.filter(p => p.packageId !== pkg.id);
                                            return [...filtered, { packageId: pkg.id, packageName: pkg.name, regulerFee: val, vipFee: curVip }];
                                          });
                                        }}
                                        className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-800"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-[9px] text-amber-800 font-bold block">VIP:</span>
                                      <input
                                        type="number"
                                        step={5000}
                                        value={curVip}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setCustomPackageFees(prev => {
                                            const filtered = prev.filter(p => p.packageId !== pkg.id);
                                            return [...filtered, { packageId: pkg.id, packageName: pkg.name, regulerFee: curReg, vipFee: val }];
                                          });
                                        }}
                                        className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-800"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        id="sync-pending-check"
                        checked={syncPendingFees}
                        onChange={(e) => setSyncPendingFees(e.target.checked)}
                        className="rounded text-sky-600 cursor-pointer"
                      />
                      <label htmlFor="sync-pending-check" className="cursor-pointer">
                        Otomatis sinkronkan fee tindakan berstatus <strong>PENDING</strong> dengan tarif baru ini.
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                      Nama Lengkap Karyawan / Staf <span className="text-rose-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Karyawan A / Siti Rahmawati, A.Md.Kep"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Jabatan / Posisi:
                      </label>
                      <input
                        type="text"
                        placeholder="Asisten Medis Khitan / Front Office"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                        Gaji Pokok (Rp):
                      </label>
                      <input
                        type="number"
                        value={formData.basicSalary}
                        onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Fee Pasien Tindakan, Fee Closing & Fee Lembur Rates */}
                  <div className="p-3 bg-gradient-to-r from-emerald-50 via-amber-50 to-purple-50 rounded-2xl border border-emerald-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block">
                        Tarif Komisi & Lembur Karyawan:
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        Bisa diisi 0 jika tidak ada
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">
                          Fee Tindakan (Rp / Pasien):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.defaultPatientFee}
                          onChange={(e) => setFormData({ ...formData, defaultPatientFee: Number(e.target.value) })}
                          className="w-full py-1.5 px-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[9px] text-emerald-600 block mt-0.5">Asisten medis tindakan</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 mb-0.5">
                          Fee Closing Pasien (Rp / Pasien):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.closingFeePerPatient}
                          onChange={(e) => setFormData({ ...formData, closingFeePerPatient: Number(e.target.value) })}
                          className="w-full py-1.5 px-2.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-[9px] text-amber-600 block mt-0.5">Pendaftaran front-office</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-800 mb-0.5">
                          Tarif Lembur (Rp / Jam):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.overtimeHourlyRate}
                          onChange={(e) => setFormData({ ...formData, overtimeHourlyRate: Number(e.target.value) })}
                          className="w-full py-1.5 px-2.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <span className="text-[9px] text-purple-600 block mt-0.5">Lembur per jam kerja</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Kontak WhatsApp & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    No. Telepon / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    placeholder="0812-XXXX-XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Alamat Email:
                  </label>
                  <input
                    type="email"
                    placeholder="nama@klinikkhitan.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Deskripsi & Catatan */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Deskripsi Profil / Keahlian:
                </label>
                <textarea
                  rows={2}
                  placeholder="Pengalaman kerja, sertifikasi klinis khitan, atau tugas utama..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Catatan Tambahan Klinik:
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan internal manajemen, jadwal shift, atau hal khusus..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Status Penugasan Aktif</span>
                  <span className="text-[10px] text-slate-500 block">
                    {formData.isActive ? 'Aktif bertugas dan dapat dipilih dalam pelayanan' : 'Status nonaktif / istirahat tugas'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    formData.isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Riwayat Perubahan Dokter & Staf
                  </h3>
                  <p className="text-xs text-slate-400">
                    Audit trail aktivitas penambahan, pengeditan, atau pengubahan status tenaga medis & staf
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {isLoadingAudit ? (
                <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                  Memuat riwayat audit trail...
                </div>
              ) : auditList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada catatan perubahan untuk dokter atau staf.
                </div>
              ) : (
                auditList.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase ${
                          log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                          log.action === 'UPDATE' ? 'bg-amber-100 text-amber-800' :
                          log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {log.entity === 'doctor' ? 'Dokter' : 'Karyawan'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800">
                      Oleh: <span className="text-purple-700 font-black">{log.actorName || 'Admin'}</span>
                    </div>
                    {log.details && (
                      <div className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Dokter / Karyawan */}
      {personToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Hapus Data {personToDelete.roleLabel}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Konfirmasi penghapusan data {personToDelete.type === 'DOCTOR' ? 'dokter operator' : 'karyawan/staf'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-bold text-slate-900">
                    {personToDelete.title ? `${personToDelete.title} ${personToDelete.name}` : personToDelete.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kode:</span>
                  <span className="font-mono font-bold text-orange-700">{personToDelete.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Jabatan / Spesialisasi:</span>
                  <span className="font-bold text-slate-800">{personToDelete.specializationOrPosition}</span>
                </div>
                {personToDelete.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">No. Telepon:</span>
                    <span className="text-slate-700">{personToDelete.phone}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <strong>Catatan Keamanan Rekam Medis:</strong> Jika {personToDelete.roleLabel.toLowerCase()} ini memiliki riwayat tindakan medis atau transaksi keuangan yang telah dibukukan sebelumnya, sistem akan mengarsipkan data secara aman tanpa merusak keabsahan rekam medis dan audit klinik.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPersonToDelete(null)}
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
                    <span>Ya, Hapus {personToDelete.roleLabel}</span>
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
