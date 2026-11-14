import React, { useState, useEffect } from 'react';
import { 
  X, CheckSquare, Square, Edit2, ChevronDown, 
  ChevronUp, User, FileText, Check, Sparkles, AlertCircle, ExternalLink 
} from 'lucide-react';
import { CircumcisionBooking, CircumcisionPatient } from '../../types';
import { NanoMasterLogo, PrintDocumentIcon } from '../common/PrintIcons';
import { useClinic } from '../../context/ClinicContext';
import { printElementById, openElementInNewTab } from '../../utils/universalPrintHelper';

interface InformedConsentModalProps {
  booking: CircumcisionBooking;
  patient?: CircumcisionPatient;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePatient?: (patientId: number, data: any) => Promise<any>;
}

export const InformedConsentModal: React.FC<InformedConsentModalProps> = ({
  booking,
  patient,
  isOpen,
  onClose,
  onUpdatePatient,
}) => {
  const { settings, branches, activeBranchCode, circumcisionMethods, packages } = useClinic();
  const [activeTab, setActiveTab] = useState<'CONSENT_1PAGE' | 'PAGE1' | 'PAGE2' | 'PAGE3' | 'ALL'>('CONSENT_1PAGE');
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to extract city from branch
  const extractCity = (branch?: any) => {
    if (!branch) return 'Bangkalan';
    if (branch.name?.includes('(')) {
      return branch.name.split('(')[1]?.replace(')', '').trim();
    }
    const addr = (branch.address || '').toLowerCase();
    if (addr.includes('surabaya')) return 'Surabaya';
    if (addr.includes('sidoarjo')) return 'Sidoarjo';
    if (addr.includes('malang')) return 'Malang';
    if (addr.includes('bangkalan')) return 'Bangkalan';
    return branch.name?.replace('Klinik Khitan ', '').replace('Klinik ', '').trim() || 'Bangkalan';
  };

  const initialBranchCode = booking?.branchCode || patient?.branchCode || activeBranchCode || 'PUSAT';
  const initialBranch = branches?.find(b => b.code.toUpperCase() === initialBranchCode.toUpperCase());
  const initialCity = extractCity(initialBranch);

  const activeMethods = (circumcisionMethods || []).filter(m => m.isActive && !m.isDeleted);
  const methodOptions = activeMethods.length > 0 
    ? activeMethods.map(m => m.name)
    : (packages && packages.length > 0 ? packages.map(p => p.name) : ['Metode Glans Pro Bipolar Pensealer', 'Metode Tindakan Nano Klemp']);

  const resolveTagline = () => {
    if (!settings?.tagline || 
        settings.tagline.includes('Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit') || 
        settings.tagline.includes('Pusat Sunat Canggih & Modern Tanpa Jahit')) {
      return 'Sunat Canggih & Modern';
    }
    return settings.tagline;
  };

  // Form State initialized from booking, patient, and branch data
  const [formData, setFormData] = useState({
    // Cabang & Kop Surat
    branchCode: initialBranchCode,
    kopClinicName: initialBranch?.name || settings?.clinicName || 'NANO CIRCUMCISION CLINIC',
    kopTagline: resolveTagline(),
    kopAddress: initialBranch?.address || settings?.address || 'Ruko Khayangan Nomor RB-16 Bangkalan',
    kopPhone: initialBranch?.phone || settings?.phone || '085236069788',

    // Page 1 & 2
    city: initialCity,
    date: booking.bookingDate || new Date().toISOString().split('T')[0],
    guardianName: patient?.guardianName || patient?.fatherName || booking.guardianName || '',
    patientName: patient?.fullName || booking.patientName || '',
    patientAge: String(patient?.ageYears || booking.patientAge || ''),
    address: patient?.address || '',
    religion: 'Islam',
    doctorName: booking.doctorName || '',
    nurseName: '',
    socialMediaConsent: 'BERSEDIA' as 'BERSEDIA' | 'TIDAK',

    // Page 3 - Status Pasien
    birthDate: patient?.birthDate || '',
    weightKg: patient?.weightKg || '',
    heightCm: patient?.heightCm || '',
    schoolGrade: patient?.grade ? `${patient?.grade} - ${patient?.school || ''}` : (patient?.school || ''),
    medicineType: 'Sirup' as 'Tablet' | 'Sirup' | 'Drop',
    guardianJob: '',
    phone: patient?.phone || booking.guardianPhone || '',
    instagram: '',
    facebook: '',
    methodType: booking.methodType || booking.packageName || methodOptions[0] || 'Metode Glans Pro Bipolar Pensealer',

    // Riwayat Pribadi
    personalAllergy: patient?.allergies || 'Tidak ada',
    personalMimisan: false,
    personalGusiBerdarah: false,
    personalLukaSulitSembuh: false,
    personalFimosis: false,
    personalKelainanLubang: false,
    personalKelainanBentuk: false,

    // Riwayat Keluarga
    familyAllergy: 'Tidak ada',
    familyMimisan: false,
    familyGusiBerdarah: false,
    familyLukaSulitSembuh: false,

    // Terapi
    doctorNotes: '',
  });

  // Sync state when props change
  useEffect(() => {
    if (booking) {
      const curBranchCode = booking?.branchCode || patient?.branchCode || activeBranchCode || 'PUSAT';
      const curBranch = branches?.find(b => b.code.toUpperCase() === curBranchCode.toUpperCase());
      const curCity = extractCity(curBranch);

      setFormData((prev) => ({
        ...prev,
        branchCode: curBranchCode,
        kopClinicName: curBranch?.name || prev.kopClinicName || settings?.clinicName || 'NANO CIRCUMCISION CLINIC',
        kopAddress: curBranch?.address || prev.kopAddress || settings?.address || 'Ruko Khayangan Nomor RB-16 Bangkalan',
        kopPhone: curBranch?.phone || prev.kopPhone || settings?.phone || '085236069788',
        city: curCity,
        date: booking.bookingDate || new Date().toISOString().split('T')[0],
        guardianName: patient?.guardianName || patient?.fatherName || booking.guardianName || '',
        patientName: patient?.fullName || booking.patientName || '',
        patientAge: String(patient?.ageYears || booking.patientAge || ''),
        address: patient?.address || '',
        doctorName: booking.doctorName || '',
        birthDate: patient?.birthDate || '',
        weightKg: patient?.weightKg || '',
        heightCm: patient?.heightCm || '',
        schoolGrade: patient?.grade ? `${patient?.grade} - ${patient?.school || ''}` : (patient?.school || ''),
        phone: patient?.phone || booking.guardianPhone || '',
        methodType: booking.methodType || booking.packageName || methodOptions[0] || 'Metode Glans Pro Bipolar Pensealer',
        personalAllergy: patient?.allergies || 'Tidak ada',
      }));
    }
  }, [booking, patient, branches, activeBranchCode, settings]);

  if (!isOpen) return null;

  const formatDateIndonesian = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const dObj = new Date(y, m - 1, d);
      return dObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSaveToPatient = async () => {
    if (!patient?.id || !onUpdatePatient) return;
    setIsSaving(true);
    try {
      await onUpdatePatient(patient.id, {
        weightKg: formData.weightKg,
        heightCm: formData.heightCm,
        allergies: formData.personalAllergy,
        address: formData.address,
        guardianName: formData.guardianName,
      });
      setShowEditForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const getDocTitle = () => {
    const pName = formData.patientName || booking.patientName || 'Pasien';
    if (activeTab === 'ALL') return `Informed Consent Lengkap (3 Lembar) - ${pName}`;
    if (activeTab === 'PAGE1') return `Informed Consent Lembar 1 (T&C) - ${pName}`;
    if (activeTab === 'PAGE2') return `Surat Persetujuan Tindakan - ${pName}`;
    if (activeTab === 'PAGE3') return `Status Pasien & Riwayat Medis - ${pName}`;
    return `Informed Consent 1 Lembar - ${pName}`;
  };

  const handlePrint = () => {
    printElementById('consent-print-document', {
      title: getDocTitle(),
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  const handleOpenNewTab = () => {
    openElementInNewTab('consent-print-document', {
      title: getDocTitle(),
      paperSize: 'A4',
      clinicName: settings?.clinicName || 'Nano Circumcision Clinic'
    });
  };

  // Clinic Header Component (Shared across official pages - Logo di Samping Kop Surat)
  const ClinicKopHeader = () => (
    <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-900">
      {/* Clinic Logo Emblem (Logo Asli di samping Kop Surat) */}
      <div className="shrink-0 flex items-center justify-center">
        <NanoMasterLogo 
          src={settings?.logoUrl} 
          height={52} 
          width={65} 
          className="max-h-[52px] max-w-[65px] object-contain print-kop-logo" 
        />
      </div>

      {/* Clinic Header Text (Teks Kop Surat di samping Logo) */}
      <div className="flex-1 text-left">
        <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wide leading-tight">
          {formData.kopClinicName || settings?.clinicName || 'NANO CIRCUMCISION'}
        </h1>
        <h2 className="text-xs font-bold text-slate-800 tracking-wide mt-0.5 uppercase">
          {formData.kopTagline || resolveTagline()}
        </h2>
        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
          {formData.kopAddress || settings?.address || 'Ruko Khayangan Nomor RB-16 Bangkalan'}
        </p>
        <p className="text-[11px] text-slate-600 font-medium">
          Hotline/WA: {formData.kopPhone || settings?.phone || '085236069788'} • Email: {settings?.email || 'Nanocircumcision@gmail.com'}
        </p>
      </div>

      {/* Right Balance / Meta */}
      <div className="shrink-0 hidden sm:block text-right">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-300 rounded px-2 py-0.5 bg-slate-50">
          DOKUMEN RESMI
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-between overflow-hidden print-modal-overlay">
      {/* Top Navbar Modal (Hidden when printing) */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Cetak Informed Consent &amp; Status Pasien
              </h2>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                activeTab === 'ALL'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                  : activeTab === 'CONSENT_1PAGE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {activeTab === 'ALL'
                  ? '📄 3 Lembar A4 (1 Halaman = 1 Lembar)'
                  : activeTab === 'PAGE1'
                  ? 'Lembar 1: T&C (1 Lembar A4)'
                  : activeTab === 'PAGE2'
                  ? 'Lembar 2: Persetujuan (1 Lembar A4)'
                  : activeTab === 'PAGE3'
                  ? 'Lembar 3: Status Pasien (1 Lembar A4)'
                  : 'Format Ringkas (1 Lembar A4)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {booking.bookingNumber} • {formData.patientName} (RM: {booking.rmNumber})
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('CONSENT_1PAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'CONSENT_1PAGE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-400 hover:text-white'
            }`}
          >
            ⭐ Ringkas (Pas 1 Lembar A4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAGE1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'PAGE1'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lembar 1: T&amp;C
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAGE2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'PAGE2'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lembar 2: Persetujuan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAGE3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'PAGE3'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lembar 3: Status Pasien
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📄 Semua (3 Lembar A4)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEditForm(!showEditForm)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
              showEditForm 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Ubah data sebelum mencetak"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{showEditForm ? 'Sembunyikan Form' : 'Sesuaikan / Edit Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Buka pratinjau di tab baru untuk cetak mandiri atau simpan PDF"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Baru / PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30 transition-all"
            title="Cetak langsung ke printer yang terhubung"
          >
            <PrintDocumentIcon size={16} />
            <span>{activeTab === 'ALL' ? 'Cetak Semua (3 Lembar A4)' : 'Cetak Dokumen'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto bg-slate-200/90 flex flex-col md:flex-row items-start justify-center p-3 sm:p-6 gap-6 print-modal-card print:p-0 print:bg-transparent">
        {/* Optional Data Editor Drawer (Left or Top) */}
        {showEditForm && (
          <div className="w-full md:w-80 bg-white rounded-2xl shadow-xl border border-slate-300 p-4 shrink-0 space-y-4 max-h-[85vh] overflow-y-auto no-print">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Sesuaikan Isian Dokumen</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Kop Surat & Tempat TTD Cabang */}
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-2.5">
                <span className="font-black text-sky-900 uppercase text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Kop Surat &amp; Tempat TTD Cabang
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Cabang (Auto-Fill)</label>
                  <select
                    value={formData.branchCode}
                    onChange={(e) => {
                      const selCode = e.target.value;
                      const b = branches?.find(x => x.code.toUpperCase() === selCode.toUpperCase());
                      if (b) {
                        const detectedCity = extractCity(b);
                        setFormData(prev => ({
                          ...prev,
                          branchCode: b.code,
                          kopClinicName: b.name,
                          kopAddress: b.address || prev.kopAddress,
                          kopPhone: b.phone || prev.kopPhone,
                          city: detectedCity,
                        }));
                      } else {
                        setFormData(prev => ({ ...prev, branchCode: selCode }));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {branches && branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={`consent-br-${b.id}`} value={b.code}>
                          {b.name} ({b.code})
                        </option>
                      ))
                    ) : (
                      <option value="PUSAT">Klinik Pusat (Surabaya)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Klinik di Kop</label>
                  <input
                    type="text"
                    value={formData.kopClinicName}
                    onChange={(e) => setFormData({ ...formData, kopClinicName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs"
                    placeholder="Nama Klinik / Cabang"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slogan / Tagline di Kop</label>
                  <input
                    type="text"
                    value={formData.kopTagline}
                    onChange={(e) => setFormData({ ...formData, kopTagline: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs"
                    placeholder="Contoh: Sunat Canggih & Modern"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat di Kop Surat</label>
                  <textarea
                    rows={2}
                    value={formData.kopAddress}
                    onChange={(e) => setFormData({ ...formData, kopAddress: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs"
                    placeholder="Alamat Lengkap Cabang"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hotline / WA</label>
                    <input
                      type="text"
                      value={formData.kopPhone}
                      onChange={(e) => setFormData({ ...formData, kopPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs"
                      placeholder="No. Telp Cabang"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tempat / Kota TTD</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-bold text-slate-900"
                      placeholder="Contoh: Surabaya"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Surat / Tindakan</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Orangtua / Wali (Tn.)</label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  placeholder="Contoh: Tn. Bambang"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pekerjaan Orangtua</label>
                <input
                  type="text"
                  value={formData.guardianJob}
                  onChange={(e) => setFormData({ ...formData, guardianJob: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  placeholder="Contoh: Wiraswasta / PNS"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Pasien</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usia (Tahun)</label>
                  <input
                    type="text"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Agama</label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Berat Badan (kg)</label>
                  <input
                    type="text"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="Contoh: 24"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tinggi Badan (cm)</label>
                  <input
                    type="text"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="Contoh: 125"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kelas &amp; Nama Sekolah</label>
                <input
                  type="text"
                  value={formData.schoolGrade}
                  onChange={(e) => setFormData({ ...formData, schoolGrade: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  placeholder="Contoh: Kelas 3 - SDN Demangan"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bisa Minum Obat</label>
                <div className="flex items-center gap-3">
                  {(['Tablet', 'Sirup', 'Drop'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="medicineType"
                        checked={formData.medicineType === m}
                        onChange={() => setFormData({ ...formData, medicineType: m })}
                        className="text-sky-600"
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Izin Dokumentasi Medsos</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="socialMediaConsent"
                      checked={formData.socialMediaConsent === 'BERSEDIA'}
                      onChange={() => setFormData({ ...formData, socialMediaConsent: 'BERSEDIA' })}
                      className="text-emerald-600"
                    />
                    <span>Bersedia</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="socialMediaConsent"
                      checked={formData.socialMediaConsent === 'TIDAK'}
                      onChange={() => setFormData({ ...formData, socialMediaConsent: 'TIDAK' })}
                      className="text-rose-600"
                    />
                    <span>Tidak Bersedia</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator/Dokter</label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perawat</label>
                  <input
                    type="text"
                    value={formData.nurseName}
                    onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="Nama Perawat"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sosial Media</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="IG: @"
                  />
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="FB: "
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Metode Sunat (Data Master)</span>
                </label>
                <select
                  value={formData.methodType}
                  onChange={(e) => setFormData({ ...formData, methodType: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  {methodOptions.map((m, idx) => (
                    <option key={`consent-mopt-${idx}`} value={m}>
                      {m}
                    </option>
                  ))}
                  {formData.methodType && !methodOptions.includes(formData.methodType) && (
                    <option value={formData.methodType}>{formData.methodType} (Tersimpan)</option>
                  )}
                </select>
              </div>

              {/* Checklist Riwayat Medis */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Riwayat Pribadi Pasien</span>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <label className="text-slate-600 block">Alergi Obat/Makanan:</label>
                    <input
                      type="text"
                      value={formData.personalAllergy}
                      onChange={(e) => setFormData({ ...formData, personalAllergy: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalMimisan}
                        onChange={(e) => setFormData({ ...formData, personalMimisan: e.target.checked })}
                      />
                      <span>Mimisan</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalGusiBerdarah}
                        onChange={(e) => setFormData({ ...formData, personalGusiBerdarah: e.target.checked })}
                      />
                      <span>Gusi berdarah</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalLukaSulitSembuh}
                        onChange={(e) => setFormData({ ...formData, personalLukaSulitSembuh: e.target.checked })}
                      />
                      <span>Luka sulit sembuh</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalFimosis}
                        onChange={(e) => setFormData({ ...formData, personalFimosis: e.target.checked })}
                      />
                      <span>Fimosis</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalKelainanLubang}
                        onChange={(e) => setFormData({ ...formData, personalKelainanLubang: e.target.checked })}
                      />
                      <span>Kelainan lubang</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.personalKelainanBentuk}
                        onChange={(e) => setFormData({ ...formData, personalKelainanBentuk: e.target.checked })}
                      />
                      <span>Kelainan bentuk</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Resep Dokter (Terapi) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="font-serif italic font-black text-amber-600 text-sm">R/</span>
                    <span>Terapi / Resep Obat Dokter</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Ketik atau tulis tangan</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.doctorNotes}
                  onChange={(e) => setFormData({ ...formData, doctorNotes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  placeholder="Contoh:&#10;Amoxicillin syr 125mg/5ml No. I (S. 3 dd cth 1)&#10;Paracetamol syr 120mg/5ml No. I (S. 3 dd cth 1 prn)&#10;Salep gentamycin / bioplacenton tube No. I"
                />
              </div>

              {patient && onUpdatePatient && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToPatient}
                    disabled={isSaving}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isSaving ? 'Menyimpan ke Rekam Medis...' : 'Simpan ke Profil Pasien'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Printable Sheets Container */}
        <div id="consent-print-document" className="w-full max-w-[210mm] space-y-6 print:space-y-0 print:max-w-none print:w-full print:block">
          {/* ========================================================================= */}
          {/* INFORMED CONSENT RESMI: 1 LEMBAR A4 KHUSUS (PAS DI CETAK 1 LEMBAR) */}
          {/* ========================================================================= */}
          {activeTab === 'CONSENT_1PAGE' && (
            <div className="consent-1page bg-white shadow-xl rounded-xl p-5 sm:p-6 border border-slate-300 text-slate-950 font-sans text-[9.5px] leading-snug select-text print:p-0 print:border-none print:shadow-none print:rounded-none">
              <ClinicKopHeader />

              {/* Title Dokumen */}
              <div className="text-center my-1.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950 underline underline-offset-2">
                  SURAT PERSETUJUAN TINDAKAN MEDIS KHITAN (INFORMED CONSENT)
                </h3>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                  No. Registrasi: <span className="font-bold text-slate-900">{booking.bookingNumber}</span> • No. Rekam Medis: <span className="font-bold text-slate-900">{booking.rmNumber || patient?.rmNumber || '-'}</span>
                </p>
              </div>

              {/* Identitas Ringkas 2 Kolom */}
              <div className="border border-slate-900 rounded-xs p-2 my-1.5 text-[9.5px]">
                <div className="grid grid-cols-2 gap-3 divide-x divide-slate-300">
                  {/* Kolom 1: Orang Tua / Wali */}
                  <div className="space-y-0.5 pr-1">
                    <div className="font-black uppercase text-[9px] text-slate-950 border-b border-slate-300 pb-0.5 mb-1">
                      I. IDENTITAS ORANG TUA / WALI (PEMBERI PERSETUJUAN)
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Nama Lengkap</span>
                      <span className="col-span-8 font-bold text-slate-950">: Tn./Ny. {formData.guardianName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Alamat</span>
                      <span className="col-span-8 text-slate-950 truncate">: {formData.address || '-'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">No. HP / WA</span>
                      <span className="col-span-8 text-slate-950">: {formData.phone || booking.guardianPhone || '-'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Agama</span>
                      <span className="col-span-8 text-slate-950">: {formData.religion || 'Islam'}</span>
                    </div>
                  </div>

                  {/* Kolom 2: Pasien Anak */}
                  <div className="space-y-0.5 pl-2">
                    <div className="font-black uppercase text-[9px] text-slate-950 border-b border-slate-300 pb-0.5 mb-1">
                      II. IDENTITAS PASIEN (PENERIMA TINDAKAN KHITAN)
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Nama Pasien</span>
                      <span className="col-span-8 font-bold text-slate-950">: An. {formData.patientName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Usia / Tgl Lahir</span>
                      <span className="col-span-8 text-slate-950">
                        : {formData.patientAge ? `${formData.patientAge} Tahun` : '-'} {formData.birthDate ? `(${formatDateIndonesian(formData.birthDate)})` : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">BB / TB</span>
                      <span className="col-span-8 text-slate-950">
                        : {formData.weightKg ? `${formData.weightKg} kg` : '-'} / {formData.heightCm ? `${formData.heightCm} cm` : '-'}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1 items-baseline">
                      <span className="col-span-4 text-slate-600">Paket &amp; Metode</span>
                      <span className="col-span-8 font-bold text-slate-950">: {formData.methodType || booking.circumcisionMethod || 'Glans Pro Bipolar'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Poin Informed Consent & Persetujuan Medis */}
              <div className="my-1.5 space-y-1 text-[9.5px] leading-snug text-slate-900 text-justify">
                <div className="font-black uppercase text-[9px] text-slate-950 border-b border-slate-300 pb-0.5 mb-1">
                  III. PERNYATAAN INFORMED CONSENT &amp; PERSETUJUAN TINDAKAN MEDIS
                </div>
                <p>
                  Saya yang bertanda tangan di bawah ini selaku Orang Tua / Wali sah dari pasien, dengan ini menyatakan telah memperoleh edukasi medis menyeluruh, memahami, dan menyetujui ketentuan berikut:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-900">
                  <li>
                    <strong>Edukasi Prosedur &amp; Pembiusan:</strong> Telah mendapatkan penjelasan lengkap mengenai indikasi medis, prosedur khitan modern, pembiusan lokal (pengecekan respon anestesi menggunakan standar klinis khusus bukan sekadar tangisan anak), serta risiko/komplikasi yang dapat timbul.
                  </li>
                  <li>
                    <strong>Fase Fisiologis Penyembuhan Luka:</strong> Memahami bahwa respon biologis penyembuhan setiap anak berbeda dan tidak ada metode khitan instan tanpa melalui proses penyembuhan jaringan (Hemostasis 0-24 jam, Inflamasi 1-5 hari, Proliferasi 3-14 hari, Remodelling 14 hari - 2 tahun).
                  </li>
                  <li>
                    <strong>Persetujuan Penuh Tindakan:</strong> Memberikan izin dan persetujuan penuh kepada dokter operator dan tim medis Nano Circumcision untuk melakukan tindakan medis khitan sesuai protokol klinis standar.
                  </li>
                  <li>
                    <strong>Kepatuhan Perawatan &amp; Kontrol:</strong> Berkomitmen mematuhi seluruh instruksi perawatan pasca khitan di rumah dan jadwal kontrol evaluasi luka demi penyembuhan optimal anak.
                  </li>
                  <li>
                    <strong>Dokumentasi Edukasi Medis Media Sosial:</strong>
                    <span className="inline-flex items-center gap-4 ml-2 font-bold">
                      <label className="inline-flex items-center gap-1">
                        <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs text-center leading-3 text-[9px] font-black">
                          {formData.socialMediaConsent === 'BERSEDIA' ? '✓' : ''}
                        </span>
                        <span>Bersedia</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs text-center leading-3 text-[9px] font-black">
                          {formData.socialMediaConsent === 'TIDAK' ? '✓' : ''}
                        </span>
                        <span>Tidak Bersedia</span>
                      </label>
                    </span>
                  </li>
                </ol>
                <p className="pt-0.5 italic text-slate-700">
                  Demikian surat persetujuan tindakan medis khitan ini saya buat dengan sadar dan sukarela tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Tanggal & Kolom Tanda Tangan 3 Pihak */}
              <div className="mt-2 pt-1 border-t border-slate-300">
                <div className="text-right text-[9.5px] font-medium mb-1">
                  {formData.city}, {formatDateIndonesian(formData.date)}
                </div>
                {/* 3 Signature Columns (Clean minimalist borderless with elegant signature lines) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '80px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Orang Tua / Wali Pasien
                        </div>
                        <div style={{ height: '42px' }}></div>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '3px', margin: '0 8px' }}>
                          ( {formData.guardianName ? `Tn./Ny. ${formData.guardianName}` : 'Nama Terang Wali'} )
                        </div>
                      </td>
                      <td style={{ width: '3.5%', border: 'none' }}></td>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '80px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Dokter Operator Khitan
                        </div>
                        <div style={{ height: '42px' }}></div>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '3px', margin: '0 8px' }}>
                          ( {formData.doctorName ? `dr. ${formData.doctorName.replace(/^dr\.\s*/i, '')}` : 'dr. Operator Medis'} )
                        </div>
                      </td>
                      <td style={{ width: '3.5%', border: 'none' }}></td>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '80px' }}>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Perawat / Saksi Medis
                        </div>
                        <div style={{ height: '42px' }}></div>
                        <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '3px', margin: '0 8px' }}>
                          ( {formData.nurseName || 'Perawat Saksi'} )
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* HALAMAN 1: TERM & CONDITION : */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'PAGE1') && (
            <>
              <div
                className="consent-sheet-page bg-white shadow-xl rounded-xl p-8 sm:p-10 border border-slate-300 text-slate-950 font-sans text-[11px] sm:text-[11.5px] leading-relaxed select-text print:p-0 print:border-none print:shadow-none print:rounded-none"
                style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  pageBreakAfter: activeTab === 'ALL' ? 'always' : 'avoid',
                  breakAfter: activeTab === 'ALL' ? 'page' : 'avoid',
                }}
              >
                <ClinicKopHeader />

                {/* Title */}
                <div className="text-center my-3">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                    TERM &amp; CONDITION :
                  </h3>
                </div>

                {/* Numbered Terms and Conditions */}
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-900 leading-normal text-justify">
                  <li>
                    Tidak ada metode sunat yang dapat langsung sembuh dan langsung rapi hasilnya
                  </li>
                  <li>
                    Penyembuhan luka sunat tetap mengikuti fase penyembuhan luka
                  </li>
                  <li>
                    Fase penyembuhan luka terdiri dari :
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-800 font-medium">
                      <li>Fase Hemostasis (pemberhentian pendarahan) 0-24 jam</li>
                      <li>Fase Inflamasi (peradangan) 1-5 hari</li>
                      <li>Fase Proliferasi (pertumbuhan jaringan baru) 3-14 hari</li>
                      <li>Fase Remodelling (penyempurnaan luka) 14 hari-2 tahun</li>
                    </ul>
                  </li>
                  <li>
                    Proses penyembuhan setiap anak berbeda
                  </li>
                  <li>
                    Bius yang digunakan adalah bius lokal
                  </li>
                  <li>
                    Dokter akan memulai proses sunat jika bius lokal sudah berefek
                  </li>
                  <li>
                    Cara mengecek bius sudah berefek atau belum bukan dari tangisan atau pertanyaan, tetapi ada cara khusus, sehingga jika anak menangis walaupun bius sdh berefek, maka sunat akan dilanjutkan
                  </li>
                  <li>
                    Sunat akan diberhentikan jika orang tua memberhentikan atau dokter merasa ada ketidaksesuaian pendapat antara dokter dan orangtua yang menjadikan batalnya perjanjian teurapetik
                  </li>
                  <li>
                    Dokter berhak memberhentikan kegiatan sunat jika dirasa ada tindakan anak yang berbahaya yang dikhawatirkan sangat menganggu proses sunat
                  </li>
                  <li>
                    Jadwal dapat berubah sewaktu-waktu atau mundur dari seharusnya tanpa pemberitahuan menyesuaikan kondisi saat hari sunat
                  </li>
                  <li>
                    Tindakan sunat dapat di batalkan secara sepihak oleh dokter atau tim jika terjadi hal- hal diluar kendali dengan alasan medis, teknis ataupun non teknis, walaupun pihak keluarga pasien sudah atau akan melaksanakan ACARA SYUKURAN SUNAT.
                  </li>
                  <li>
                    Kami tidak bisa / tidak akan memberikan surat keterangan apapun untuk keperluan KLAIM ASURANSI.
                  </li>
                  <li>
                    <div>
                      Apakah bersedia apabila tim Nano Circumcision MENDOKUMENTASIKAN dan MEMPUBLIKASIKAN foto/video ke media sosial?
                    </div>
                    <div className="flex items-center gap-6 mt-1.5 pl-2 font-bold">
                      <label className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border border-slate-900 rounded-xs text-center leading-3 text-xs font-black">
                          {formData.socialMediaConsent === 'BERSEDIA' ? '✓' : ''}
                        </span>
                        <span>Bersedia</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border border-slate-900 rounded-xs text-center leading-3 text-xs font-black">
                          {formData.socialMediaConsent === 'TIDAK' ? '✓' : ''}
                        </span>
                        <span>Tidak</span>
                      </label>
                    </div>
                  </li>
                </ol>

                {/* Date */}
                <div className="text-right mt-3 pr-4">
                  <span className="text-xs font-medium">
                    {formData.city}, {formatDateIndonesian(formData.date)}
                  </span>
                </div>

                {/* 3 Signature Boxes side by side (Clean minimalist borderless with signature line) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '88px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Orangtua / Wali Pasien
                        </div>
                        <div style={{ height: '48px' }}></div>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '4px', margin: '0 8px' }}>
                          ( {formData.guardianName ? `Tn. ${formData.guardianName}` : 'Nama Terang Wali'} )
                        </div>
                      </td>
                      <td style={{ width: '3.5%', border: 'none' }}></td>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '88px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Operator / Dokter
                        </div>
                        <div style={{ height: '48px' }}></div>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '4px', margin: '0 8px' }}>
                          ( {formData.doctorName ? `dr. ${formData.doctorName.replace(/^dr\.\s*/i, '')}` : 'dr. Operator Medis'} )
                        </div>
                      </td>
                      <td style={{ width: '3.5%', border: 'none' }}></td>
                      <td style={{ width: '31%', verticalAlign: 'top', border: 'none', padding: '6px 4px', textAlign: 'center', height: '88px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                          Perawat
                        </div>
                        <div style={{ height: '48px' }}></div>
                        <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '4px', margin: '0 8px' }}>
                          ( {formData.nurseName || 'Perawat Khitan'} )
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* HALAMAN 2: SURAT PERSETUJUAN TINDAKAN MEDIS KHITAN */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'PAGE2') && (
            <>
              <div
                className="consent-sheet-page bg-white shadow-xl rounded-xl p-8 sm:p-10 border border-slate-300 text-slate-950 font-sans text-[11.5px] sm:text-[12px] leading-relaxed select-text print:p-0 print:border-none print:shadow-none print:rounded-none"
                style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  pageBreakAfter: activeTab === 'ALL' ? 'always' : 'avoid',
                  breakAfter: activeTab === 'ALL' ? 'page' : 'avoid',
                }}
              >
                <ClinicKopHeader />

                {/* Title */}
                <div className="text-center my-4">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                    SURAT PERSETUJUAN TINDAKAN MEDIS KHITAN
                  </h3>
                </div>

                {/* Opening Paragraph */}
                <p className="text-slate-900 mb-3">
                  Saya yang bertanda tangan di bawah ini,
                </p>

                {/* Patient and Parent Details Grid */}
                <div className="space-y-1.5 pl-2 mb-4 font-medium text-slate-900">
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <span className="col-span-4 sm:col-span-3 text-slate-800">Nama Orangtua / wali</span>
                    <span className="col-span-8 sm:col-span-9 font-bold">
                      : Tn. {formData.guardianName || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <span className="col-span-4 sm:col-span-3 text-slate-800">Nama pasien</span>
                    <span className="col-span-8 sm:col-span-9 font-bold">
                      : {formData.patientName || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <span className="col-span-4 sm:col-span-3 text-slate-800">Usia Pasien</span>
                    <span className="col-span-8 sm:col-span-9">
                      : {formData.patientAge ? `${formData.patientAge} Tahun` : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <span className="col-span-4 sm:col-span-3 text-slate-800">Alamat</span>
                    <span className="col-span-8 sm:col-span-9">
                      : {formData.address || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1 items-baseline">
                    <span className="col-span-4 sm:col-span-3 text-slate-800">Agama</span>
                    <span className="col-span-8 sm:col-span-9">
                      : {formData.religion || 'Islam'}
                    </span>
                  </div>
                </div>

                {/* Legal Statements */}
                <div className="space-y-3 text-justify text-slate-900 leading-relaxed">
                  <p>
                    Dengan ini menyatakan telah memperoleh informasi yang sejelas-jelasnya terhadap tindakan medis khitan yang akan dilakukan kepada Anak saya, dan menyatakan memberikan persetujuan atau izin atas tindakan tersebut kepada yang mengkhitan.
                  </p>

                  <p>
                    Saya menyatakan paham dan mengerti mengenai khitan, keuntungan, prosesnya, apa yang dilakukan sebelum dan setelahnya, resiko-resiko dan komplikasi serta segala sesuatu yang mungkin terjadi akibat dari tindakan tersebut. Saya juga menyadari bahwa ilmu kedokteran bukanlah ilmu pasti maka keberhasilan dari tindakan kedokteran bukanlah keniscayaan, melainkan sangat tergantung kepada izin Tuhan Yang Maha Esa dan saya tidak akan menyalahkan/menuntut pihak dokter dan Nano Circumcision dikemudian hari.
                  </p>

                  <p>
                    Demikian surat persetujuan ini saya buat tanpa ada paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.
                  </p>
                </div>

                {/* Signature Section - Clean Borderless with elegant signature underline */}
                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', paddingRight: '24px' }}>
                  <div style={{ width: '220px', textAlign: 'center', background: 'transparent' }}>
                    <div style={{ fontSize: '11px', color: '#1e293b', marginBottom: '4px', fontWeight: '500' }}>
                      {formData.city}, {formatDateIndonesian(formData.date)}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                      Orangtua / Wali Pasien
                    </div>
                    <div style={{ height: '58px' }}></div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '4px' }}>
                      ( {formData.guardianName ? `Tn. ${formData.guardianName}` : 'Nama Terang Wali'} )
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                      Tanda Tangan &amp; TTD
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* HALAMAN 3: STATUS PASIEN KHITAN */}
          {/* ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'PAGE3') && (
            <div
              className="consent-sheet-page bg-white shadow-xl rounded-xl p-6 sm:p-8 border border-slate-300 text-slate-950 font-sans text-[10.5px] sm:text-[11px] leading-snug select-text print:p-0 print:border-none print:shadow-none print:rounded-none"
              style={{
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
                pageBreakAfter: 'avoid',
                breakAfter: 'avoid',
              }}
            >
              <ClinicKopHeader />

              {/* Title */}
              <div className="text-center my-3">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-950">
                  STATUS PASIEN KHITAN
                </h3>
              </div>

              {/* SECTION I: IDENTITAS */}
              <div className="space-y-1">
                <h4 className="font-black text-xs uppercase tracking-wide text-slate-950 mb-1">
                  I. &nbsp; IDENTITAS
                </h4>

                <div className="grid grid-cols-12 gap-x-2 gap-y-1 pl-4 text-slate-900 items-baseline">
                  <span className="col-span-4 sm:col-span-3">Nama anak/Pasien</span>
                  <span className="col-span-8 sm:col-span-9 font-bold">
                    : {formData.patientName || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Tanggal lahir</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.birthDate ? formatDateIndonesian(formData.birthDate) : '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Berat Badan</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.weightKg ? `${formData.weightKg} kg` : '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Tinggi Badan</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.heightCm ? `${formData.heightCm} cm` : '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Kelas &amp; Nama Sekolah</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.schoolGrade || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Bisa Minum Obat</span>
                  <div className="col-span-8 sm:col-span-9 flex items-center gap-4">
                    <span>:</span>
                    <label className="flex items-center gap-1.5">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs text-center leading-3 text-[10px] font-black">
                        {formData.medicineType === 'Tablet' ? '✓' : ''}
                      </span>
                      <span>Tablet</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs text-center leading-3 text-[10px] font-black">
                        {formData.medicineType === 'Sirup' ? '✓' : ''}
                      </span>
                      <span>Sirup</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs text-center leading-3 text-[10px] font-black">
                        {formData.medicineType === 'Drop' ? '✓' : ''}
                      </span>
                      <span>Drop</span>
                    </label>
                    <span className="text-[10px] text-slate-500 italic pl-1">(Ceklis Salahsatu)</span>
                  </div>

                  <span className="col-span-4 sm:col-span-3">Nama Orangtua</span>
                  <span className="col-span-8 sm:col-span-9 font-bold">
                    : Tn. {formData.guardianName || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Pekerjaan</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.guardianJob || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Alamat</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.address || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">No.HP</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.phone || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">Media social IG</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.instagram || '-'}
                  </span>

                  <span className="col-span-4 sm:col-span-3">FB</span>
                  <span className="col-span-8 sm:col-span-9">
                    : {formData.facebook || '-'}
                  </span>
                </div>
              </div>

              {/* ANAMNESIS */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <h4 className="font-black text-xs uppercase tracking-wide text-slate-950 mb-1">
                  ANAMNESIS
                </h4>
                <div className="grid grid-cols-12 gap-x-2 pl-4 text-slate-900 items-baseline mb-2">
                  <span className="col-span-4 sm:col-span-3 font-semibold">Metode Sunat</span>
                  <span className="col-span-8 sm:col-span-9 font-bold">
                    : {formData.methodType || 'Glans Pro Bipolar Pen Sealer'}
                  </span>
                </div>

                {/* Riwayat Pribadi Table */}
                <div className="pl-4 mt-2">
                  <div className="text-[11px] font-bold text-slate-900 mb-1">Riwayat pribadi</div>
                  <table className="w-full border-collapse border border-slate-900 text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold w-36 bg-slate-50">
                          Alergi
                        </td>
                        <td colSpan={3} className="border border-slate-900 p-1.5">
                          {formData.personalAllergy || ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">
                          Perdarahan
                        </td>
                        <td className="border border-slate-900 p-1.5 w-32">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalMimisan ? '✓' : ''}
                          </span>
                          Mimisan
                        </td>
                        <td className="border border-slate-900 p-1.5 w-36">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalGusiBerdarah ? '✓' : ''}
                          </span>
                          Gusi berdarah
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalLukaSulitSembuh ? '✓' : ''}
                          </span>
                          Luka sulit sembuh
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">
                          Kelainan kemaluan
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalFimosis ? '✓' : ''}
                          </span>
                          Fimosis
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalKelainanLubang ? '✓' : ''}
                          </span>
                          Kelainan lubang
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.personalKelainanBentuk ? '✓' : ''}
                          </span>
                          Kelainan bentuk
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Riwayat Keluarga Table */}
                <div className="pl-4 mt-3">
                  <div className="text-[11px] font-bold text-slate-900 mb-1">Riwayat keluarga</div>
                  <table className="w-full border-collapse border border-slate-900 text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold w-36 bg-slate-50">
                          Alergi
                        </td>
                        <td colSpan={3} className="border border-slate-900 p-1.5">
                          {formData.familyAllergy || ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">
                          Perdarahan
                        </td>
                        <td className="border border-slate-900 p-1.5 w-32">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.familyMimisan ? '✓' : ''}
                          </span>
                          Mimisan
                        </td>
                        <td className="border border-slate-900 p-1.5 w-36">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.familyGusiBerdarah ? '✓' : ''}
                          </span>
                          Gusi berdarah
                        </td>
                        <td className="border border-slate-900 p-1.5">
                          <span className="inline-block w-3.5 h-3.5 border border-slate-900 rounded-xs mr-1.5 text-center leading-3 text-[9px] font-bold">
                            {formData.familyLukaSulitSembuh ? '✓' : ''}
                          </span>
                          Luka sulit sembuh
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION II: TERAPI (RESEP DOKTER ) */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-black text-xs uppercase tracking-wide text-slate-950 flex items-center gap-1.5">
                    <span>II. &nbsp; TERAPI (RESEP DOKTER)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 italic">
                    Lembar Resep &amp; Terapi Pasca Khitan
                  </span>
                </div>

                {/* Table-enforced bordered box for doctor prescription with R/ symbol */}
                <table
                  className="prescription-box resep-box"
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    border: '2.5px solid #000000',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    marginTop: '4px',
                    marginBottom: '8px',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          border: 'none',
                          padding: '10px 14px',
                          verticalAlign: 'top',
                          height: '145px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', height: '100%' }}>
                          {/* Prescription Recipe Sign (R/) */}
                          <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                            <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '26px', color: '#000000', lineHeight: 1, userSelect: 'none' }}>
                              R/
                            </span>
                          </div>

                          {/* Prescription Content or Clean Ruled Lines (No unclear dots) */}
                          <div style={{ flex: 1, minHeight: '125px', color: '#0f172a' }}>
                            {formData.doctorNotes ? (
                              <div style={{ fontSize: '11px', lineHeight: '1.5', whiteSpace: 'pre-line', fontWeight: 500, color: '#000000' }}>
                                {formData.doctorNotes}
                              </div>
                            ) : (
                              /* Clean crisp ruled lines - solid, sharp, never fuzzy dots */
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingTop: '16px' }}>
                                <div style={{ borderBottom: '1px solid #94a3b8', width: '100%' }}></div>
                                <div style={{ borderBottom: '1px solid #94a3b8', width: '100%' }}></div>
                                <div style={{ borderBottom: '1px solid #94a3b8', width: '100%' }}></div>
                                <div style={{ borderBottom: '1px solid #94a3b8', width: '100%' }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Dokter Penanggung Jawab Signature */}
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', paddingRight: '16px' }}>
                  <div style={{ width: '220px', textAlign: 'center', background: 'transparent' }}>
                    <div style={{ fontSize: '10px', color: '#1e293b', marginBottom: '2px', fontWeight: '500' }}>
                      {formData.city}, {formatDateIndonesian(formData.date)}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                      Dokter Operator Khitan
                    </div>
                    <div style={{ height: '44px' }}></div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#000', borderTop: '1.5px solid #000000', paddingTop: '3px' }}>
                      ( {formData.doctorName ? `dr. ${formData.doctorName.replace(/^dr\.\s*/i, '')}` : 'dr. Operator Medis'} )
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>
                      Tanda Tangan &amp; Cap Medis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
