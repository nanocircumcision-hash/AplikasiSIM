import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Building2, Phone, Mail, Globe, Server, ShieldCheck, CheckCircle2, 
  Download, Upload, HardDrive, FileJson, FileCode, AlertTriangle, 
  RefreshCw, Layers, Database, Clock, Sparkles, FolderDown, ShieldAlert,
  Info, Image as ImageIcon, Trash2, Terminal, Copy, Check, ChevronRight, XCircle
} from 'lucide-react';
import { NanoMasterLogo } from '../common/PrintIcons';
import { BranchManagementView } from '../branches/BranchManagementView';

export const ClinicSettingsView: React.FC = () => {
  const { settings, updateClinicSettings, currentUser, showToast, refreshAllData } = useClinic();
  const [activeTab, setActiveTab] = useState<'profile' | 'database' | 'branches'>('branches');
  
  const [formData, setFormData] = useState({
    clinicName: settings.clinicName || 'NANO CIRCUMCISION CLINIC',
    tagline: (settings.tagline && settings.tagline !== 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit' && settings.tagline !== 'Pusat Sunat Canggih & Modern Tanpa Jahit') ? settings.tagline : 'Sunat Canggih & Modern',
    address: settings.address || 'Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan',
    phone: settings.phone || '0812-8888-9999',
    email: settings.email || 'info@nanocircumcision.com',
    website: settings.website || 'www.nanocircumcision.com',
    logoUrl: settings.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : '') || '',
    invoiceHeader: settings.invoiceHeader || '',
    invoiceFooter: settings.invoiceFooter || '',
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || 'NANO CIRCUMCISION CLINIC',
        tagline: (settings.tagline && settings.tagline !== 'Pusat Khitan Modern, Aman & Nyaman Tanpa Jahit' && settings.tagline !== 'Pusat Sunat Canggih & Modern Tanpa Jahit') ? settings.tagline : 'Sunat Canggih & Modern',
        address: settings.address || 'Jl. Kesehatan No. 88, Kebayoran Baru, Jakarta Selatan',
        phone: settings.phone || '0812-8888-9999',
        email: settings.email || 'info@nanocircumcision.com',
        website: settings.website || 'www.nanocircumcision.com',
        logoUrl: settings.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem('clinic_logo_url') : '') || '',
        invoiceHeader: settings.invoiceHeader || '',
        invoiceFooter: settings.invoiceFooter || '',
      });
    }
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Mohon pilih file gambar (PNG, JPG, SVG, WebP)', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
      showToast('Logo asli berhasil dimuat! Klik "Simpan Profil Klinik" untuk menyimpan permanen.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
    showToast('Logo kustom dihapus. Kembali menggunakan logo bawaan.', 'info');
  };

  // Database Backup State
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingSql, setIsExportingSql] = useState(false);
  const [isExportingMysql, setIsExportingMysql] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<{
    name: string;
    size: string;
    data: any;
  } | null>(null);
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Operational Transaction Reset State
  const [isResettingTransactions, setIsResettingTransactions] = useState(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);
  const [confirmResetKeyword, setConfirmResetKeyword] = useState('');

  // Native PostgreSQL & MySQL Backup State
  const [backupType, setBackupType] = useState<'full' | 'data' | 'structure'>('full');
  const [backupFormat, setBackupFormat] = useState<'custom' | 'plain' | 'mysql'>('plain');
  const [isExecutingNativeBackup, setIsExecutingNativeBackup] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<any>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [showPgPathHelp, setShowPgPathHelp] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Database Schema Repair & Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[] | null>(null);
  const [showSqlMigrationGuide, setShowSqlMigrationGuide] = useState(false);

  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await fetch('/api/database/migrate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menjalankan migrasi struktur database');
      }
      setMigrationLogs(data.logs || []);
      showToast('Struktur kolom database (termasuk branch_code pada produk & karyawan) berhasil disinkronkan!', 'success');
      await fetchDatabaseInfo();
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan migrasi database', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    showToast(`Perintah ${label} disalin ke clipboard!`, 'info');
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleExecuteNativeBackup = async () => {
    setIsExecutingNativeBackup(true);
    setBackupError(null);
    setLastBackupResult(null);

    try {
      const res = await fetch('/api/backup/native', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
        body: JSON.stringify({
          type: backupType,
          format: backupFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengeksekusi pg_dump.');
      }

      setLastBackupResult(data.backup);
      showToast(`Backup ${backupType.toUpperCase()} berhasil dibuat dan divalidasi!`, 'success');

      if (data.downloadUrl) {
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.backup.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      fetchDatabaseInfo();
    } catch (err: any) {
      console.error('Native backup error:', err);
      setBackupError(err.message || 'Gagal membuat native PostgreSQL backup.');
      showToast(err.message || 'Gagal membuat backup', 'error');
    } finally {
      setIsExecutingNativeBackup(false);
    }
  };

  const fetchDatabaseInfo = async () => {
    setIsFetchingInfo(true);
    try {
      const res = await fetch('/api/backup', {
        headers: {
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDbInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch db info:', err);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, [currentUser]);

  const handleExecuteResetTransactions = async () => {
    if (confirmResetKeyword.trim().toUpperCase() !== 'RESET') {
      showToast('Ketik kata "RESET" untuk mengonfirmasi pembersihan data transaksi.', 'error');
      return;
    }

    setIsResettingTransactions(true);
    try {
      const res = await fetch('/api/database/reset-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mereset data transaksi.');
      }

      showToast(data.message || 'Data transaksi berhasil dibersihkan! Aplikasi siap dipakai.', 'success');
      setShowConfirmResetModal(false);
      setConfirmResetKeyword('');
      await refreshAllData();
      await fetchDatabaseInfo();
    } catch (err: any) {
      console.error('Reset error:', err);
      showToast(err.message || 'Gagal membersihkan data transaksi.', 'error');
    } finally {
      setIsResettingTransactions(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'owner') {
      showToast('Hanya Administrator / Owner yang berwenang mengubah profil klinik.', 'error');
      return;
    }
    const res = await updateClinicSettings(formData);
    if (res.success) {
      showToast('Profil dan identitas klinik berhasil diperbarui!', 'success');
    }
  };

  // Download Backup JSON ke Komputer Lokal
  const handleDownloadBackupJson = async () => {
    setIsExportingJson(true);
    try {
      const res = await fetch('/api/backup/export', {
        headers: {
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
      });
      if (!res.ok) throw new Error('Gagal mengekspor file backup database');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      a.href = url;
      a.download = `nano_clinic_backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('File backup database (.JSON) berhasil diunduh dan tersimpan di komputer Anda!', 'success');
      fetchDatabaseInfo();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh backup database', 'error');
    } finally {
      setIsExportingJson(false);
    }
  };

  // Download Dump SQL ke Komputer Lokal
  const handleDownloadBackupSql = async () => {
    setIsExportingSql(true);
    try {
      const res = await fetch('/api/backup/sql', {
        headers: {
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
      });
      if (!res.ok) throw new Error('Gagal mengekspor script SQL dump');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      a.href = url;
      a.download = `nano_clinic_dump_${dateStr}_${timeStr}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('File dump database PostgreSQL (.SQL) berhasil diunduh ke komputer Anda!', 'success');
      fetchDatabaseInfo();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh dump database', 'error');
    } finally {
      setIsExportingSql(false);
    }
  };

  // Unduh Dump SQL Khusus Format MySQL / MariaDB (phpMyAdmin & MySQL Workbench Compatible)
  const handleDownloadBackupMysql = async () => {
    setIsExportingMysql(true);
    try {
      const res = await fetch('/api/backup/mysql', {
        headers: {
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat dump format MySQL');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nano_clinic_mysql_dump_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('File dump format MySQL / MariaDB (.SQL) berhasil diunduh ke komputer Anda!', 'success');
      fetchDatabaseInfo();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh dump MySQL database', 'error');
    } finally {
      setIsExportingMysql(false);
    }
  };

  // Pemilihan File Restore dari Komputer Lokal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Mohon pilih file cadangan dengan ekstensi .json', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.data && !parsed.tables) {
          throw new Error('File tidak memiliki struktur cadangan database Nano Circumcision yang valid.');
        }
        setSelectedBackupFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          data: parsed,
        });
      } catch (err: any) {
        showToast(err.message || 'Format file JSON tidak dapat dibaca', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Eksekusi Pemulihan Database
  const handleExecuteRestore = async () => {
    if (!selectedBackupFile) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-clinic-role': currentUser?.role || 'admin',
          'x-clinic-user': currentUser?.username || 'admin',
        },
        body: JSON.stringify({ backupData: selectedBackupFile.data }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal memulihkan database');
      }

      showToast(result.message || 'Database berhasil dipulihkan dari file lokal!', 'success');
      setShowConfirmRestoreModal(false);
      setSelectedBackupFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshAllData();
      await fetchDatabaseInfo();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat memulihkan database', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Pengaturan Profil & Database Klinik
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
            Kelola konfigurasi identitas klinik, kop dokumen resmi, dan pencadangan database ke komputer lokal.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Cabang Klinik</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & Backup Lokal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Profil & Kop Dokumen</span>
          </button>
        </div>
      </div>

      {/* TAB 0: MASTER & PENGATURAN CABANG KLINIK */}
      {activeTab === 'branches' && (
        <BranchManagementView />
      )}

      {/* TAB 1: DATABASE & BACKUP KE KOMPUTER LOKAL */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Banner Status PostgreSQL & Deteksi Tools */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Database PostgreSQL Aktif
                  </span>
                  {dbInfo?.pgTools?.available ? (
                    <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-400" />
                      pg_dump Native Siap ({dbInfo.pgTools.version || 'Detected'})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPgPathHelp(!showPgPathHelp)}
                      className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-amber-500/30 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      pg_dump Belum di PATH Windows (Klik Bantuan)
                    </button>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Pencadangan Penuh Database PostgreSQL (Full Backup)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Menghasilkan backup utuh berstandar resmi PostgreSQL menggunakan <code className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-200 font-mono font-bold">pg_dump -Fc</code>. Mencakup seluruh tabel, data, relasi (foreign keys), sequences, indexes, dan constraints yang siap direstore ke database baru via pgAdmin 4.
                </p>
              </div>

              {/* Tombol Aksi Cepat / Refresh */}
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button
                  type="button"
                  onClick={fetchDatabaseInfo}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider border border-white/10 transition-all cursor-pointer"
                  title="Perbarui Status Database"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingInfo ? 'animate-spin' : ''}`} />
                  <span>Cek Status</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupSql}
                  disabled={isExportingSql}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh SQL Full Script PostgreSQL (DDL Struktur + Data)"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>{isExportingSql ? 'Menyusun PG SQL...' : 'Unduh Full PostgreSQL SQL'}</span>
                  <Download className="w-3.5 h-3.5 ml-1" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupMysql}
                  disabled={isExportingMysql}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-950/70 hover:bg-amber-900 text-amber-200 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider border border-amber-800/60 transition-all cursor-pointer disabled:opacity-50"
                  title="Unduh Format MySQL / MariaDB (phpMyAdmin & MySQL Workbench Compatible)"
                >
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span>{isExportingMysql ? 'Menyusun MySQL...' : 'Unduh MySQL Dump (.sql)'}</span>
                  <Download className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Bantuan Deteksi pg_dump Windows jika belum terdeteksi */}
            {showPgPathHelp && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="font-black text-amber-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    Panduan Deteksi pg_dump.exe pada Komputer Lokal Windows
                  </strong>
                  <button 
                    onClick={() => setShowPgPathHelp(false)}
                    className="text-amber-300/70 hover:text-amber-200 font-bold text-xs"
                  >
                    Tutup [✕]
                  </button>
                </div>
                <p className="leading-relaxed">
                  Jika aplikasi berjalan pada komputer Windows lokal, <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">pg_dump.exe</code> biasanya terpasang di:
                  <span className="block font-mono bg-black/40 p-1.5 rounded mt-1 text-amber-200 text-[11px]">
                    C:\Program Files\PostgreSQL\16\bin\pg_dump.exe (atau versi 17, 15, 14, 13)
                  </span>
                </p>
                <div className="pt-1 text-[11px] space-y-1">
                  <p>1. Buka <strong>Environment Variables</strong> di Windows, cari variabel <strong>Path</strong> pada User atau System Variables.</p>
                  <p>2. Tambahkan baris baru: <code className="font-mono bg-black/40 px-1 text-white">C:\Program Files\PostgreSQL\16\bin</code> (sesuaikan versi PostgreSQL Anda).</p>
                  <p>3. Restart server aplikasi agar PATH terbaca. Sebagai alternatif cepat, Anda tetap dapat mengunduh <strong>Full SQL (.sql)</strong> yang sudah dilengkapi struktur tabel DDL lengkap!</p>
                </div>
              </div>
            )}

            {/* Statistik Tabel Database Terproteksi */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pasien Terdaftar</span>
                <span className="text-lg font-black text-white mt-1 block">
                  {dbInfo?.patientsCount ?? '...'} Data
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Booking & Jadwal</span>
                <span className="text-lg font-black text-white mt-1 block">
                  {dbInfo?.bookingsCount ?? '...'} Jadwal
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tindakan Medis</span>
                <span className="text-lg font-black text-white mt-1 block">
                  {dbInfo?.proceduresCount ?? '...'} Tindakan
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Invoice Kasir</span>
                <span className="text-lg font-black text-white mt-1 block">
                  {dbInfo?.invoicesCount ?? '...'} Tagihan
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Katalog & Stok</span>
                <span className="text-lg font-black text-white mt-1 block">
                  {dbInfo?.productsCount ?? '...'} Item
                </span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Baris Data</span>
                <span className="text-lg font-black text-emerald-400 mt-1 block">
                  {dbInfo?.totalRecords ? `${dbInfo.totalRecords} Records` : 'Terlindungi'}
                </span>
              </div>
            </div>
          </div>

          {/* KARTU KHUSUS: SINKRONISASI STRUKTUR & REPARASI DATABASE LOKAL */}
          <div className="bg-white rounded-3xl border-2 border-indigo-100 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">SINKRONISASI STRUKTUR DATABASE (MIGRASI OTOMATIS)</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Self-Healing
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Solusi instan untuk mengatasi kendala kolom <code className="px-1 py-0.5 rounded bg-slate-100 text-indigo-600 font-mono font-bold">branch_code</code> atau kolom master baru yang belum ada pada PostgreSQL lokal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSqlMigrationGuide(!showSqlMigrationGuide)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-slate-500" />
                  <span>{showSqlMigrationGuide ? 'Tutup Script SQL' : 'Lihat Script pgAdmin'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={isMigrating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Menyelaraskan Kolom...' : 'Sinkronkan Struktur Database'}</span>
                </button>
              </div>
            </div>

            {/* Hasil Migrasi / Log */}
            {migrationLogs && migrationLogs.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Laporan Hasil Sinkronisasi Database ({migrationLogs.length} pemeriksaan):</span>
                </div>
                <div className="max-h-40 overflow-y-auto font-mono text-[11px] text-emerald-950 space-y-1 bg-white/70 p-3 rounded-xl border border-emerald-100">
                  {migrationLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panduan Manual SQL untuk pgAdmin */}
            {showSqlMigrationGuide && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                      Script SQL Langsung untuk Query Tool pgAdmin 4 / psql
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(
`-- Nano Circumcision Clinic: Sinkronisasi Kolom Multi-Cabang & Master Data
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "cost_price" integer DEFAULT 0;
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "min_stock" integer DEFAULT 5;
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "description" text;

ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "start_date" text DEFAULT '2026-01-01';
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "basic_salary" integer DEFAULT 0;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "default_patient_fee" integer DEFAULT 20000;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "closing_fee_per_patient" integer DEFAULT 25000;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "overtime_hourly_rate" integer DEFAULT 35000;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "notes" text;

ALTER TABLE IF EXISTS "doctors" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "doctors" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
ALTER TABLE IF EXISTS "doctors" ADD COLUMN IF NOT EXISTS "sip_number" text;

ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "patients" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "guardians" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "bookings" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "queues" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "circumcision_procedures" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "informed_consents" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "certificates" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "invoices" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "payments" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "doctor_fee_transactions" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "expense_transactions" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "employee_fee_transactions" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "payrolls" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';

CREATE TABLE IF NOT EXISTS "branches" (
  "id" SERIAL PRIMARY KEY,
  "code" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "address" text,
  "phone" text,
  "manager_name" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" SERIAL PRIMARY KEY,
  "movement_number" text NOT NULL UNIQUE,
  "product_id" integer NOT NULL,
  "movement_type" text NOT NULL,
  "quantity" integer NOT NULL,
  "previous_stock" integer NOT NULL,
  "current_stock" integer NOT NULL,
  "unit_cost" integer,
  "unit_price" integer,
  "reference_type" text,
  "reference_id" integer,
  "notes" text,
  "performed_by" text,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);`,
                      'Script SQL Migrasi'
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all cursor-pointer"
                  >
                    {copiedCmd === 'Script SQL Migrasi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === 'Script SQL Migrasi' ? 'Tersalin!' : 'Salin Script SQL'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300">
                  Jika Anda menggunakan pgAdmin 4 di komputer lokal: Buka pgAdmin &gt; Pilih Database Anda &gt; Buka <strong>Query Tool</strong> &gt; Tempel (Paste) script di atas &gt; Klik <strong>Execute (F5)</strong>.
                </p>
                <pre className="p-3 rounded-xl bg-black/60 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48 border border-white/10">
{`ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "employees" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "doctors" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
ALTER TABLE IF EXISTS "patients" ADD COLUMN IF NOT EXISTS "branch_code" text DEFAULT 'PUSAT';
... (Klik 'Salin Script SQL' untuk skrip lengkap 17 tabel)`}
                </pre>
              </div>
            )}
          </div>

          {/* 2 Kolom Utama: KONTROL NATIVE BACKUP & PANDUAN RESTORE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* KARTU 1: BACKUP DATABASE (KONTROL UTAMA NATIVE PG_DUMP) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">BACKUP DATABASE</h3>
                      <p className="text-xs text-slate-500 font-medium">PostgreSQL Native Dump Utility (pg_dump)</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
                    Native CLI
                  </span>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Pilihan Backup Type */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
                      Pilih Tipe Backup (Backup Type):
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* Opsi 1: Full Backup */}
                      <label 
                        onClick={() => setBackupType('full')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          backupType === 'full' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupType" 
                          checked={backupType === 'full'} 
                          onChange={() => setBackupType('full')}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black">Full Backup (Direkomendasikan)</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white uppercase">Lengkap</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Mencakup struktur schema lengkap (CREATE TABLE), data (INSERT), relasi foreign key, sequences, constraints, dan indexes.
                          </p>
                        </div>
                      </label>

                      {/* Opsi 2: Data Only */}
                      <label 
                        onClick={() => setBackupType('data')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          backupType === 'data' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupType" 
                          checked={backupType === 'data'} 
                          onChange={() => setBackupType('data')}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black">Data Only (--data-only)</span>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Hanya mengekspor baris data tabel tanpa struktur DDL. Digunakan jika struktur tabel di database tujuan sudah dibuat sebelumnya.
                          </p>
                        </div>
                      </label>

                      {/* Opsi 3: Structure Only */}
                      <label 
                        onClick={() => setBackupType('structure')}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          backupType === 'structure' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupType" 
                          checked={backupType === 'structure'} 
                          onChange={() => setBackupType('structure')}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black">Structure Only (--schema-only)</span>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Hanya mengekspor kerangka DDL skema, tabel, indexes, sequences, dan relasi tanpa menyertakan baris isi data klinis.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Pilihan Format Output */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
                      Pilih Format Output (Format):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Format Custom */}
                      <label 
                        onClick={() => setBackupFormat('custom')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                          backupFormat === 'custom' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupFormat" 
                          checked={backupFormat === 'custom'} 
                          onChange={() => setBackupFormat('custom')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <span className="text-xs font-black block">PostgreSQL Custom (-Fc)</span>
                          <span className="text-[10px] text-indigo-600 font-bold block">Ekstensi .backup</span>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Format biner terkompresi resmi PostgreSQL. Kompatibel penuh dengan menu Restore pgAdmin 4.
                          </p>
                        </div>
                      </label>

                      {/* Format Plain SQL */}
                      <label 
                        onClick={() => setBackupFormat('plain')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                          backupFormat === 'plain' 
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupFormat" 
                          checked={backupFormat === 'plain'} 
                          onChange={() => setBackupFormat('plain')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500" 
                        />
                        <div>
                          <span className="text-xs font-black block">PostgreSQL Plain SQL (-Fp)</span>
                          <span className="text-[10px] text-slate-600 font-bold block">Ekstensi .sql</span>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Script teks SQL standar PostgreSQL yang dapat dibuka di teks editor atau pgAdmin Query Tool.
                          </p>
                        </div>
                      </label>

                      {/* Format MySQL / MariaDB */}
                      <label 
                        onClick={() => setBackupFormat('mysql')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                          backupFormat === 'mysql' 
                            ? 'border-amber-600 bg-amber-50/50 text-amber-950 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="backupFormat" 
                          checked={backupFormat === 'mysql'} 
                          onChange={() => setBackupFormat('mysql')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500" 
                        />
                        <div>
                          <span className="text-xs font-black block">MySQL / MariaDB Format</span>
                          <span className="text-[10px] text-amber-600 font-bold block">phpMyAdmin & Workbench</span>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                            Script SQL sintaks MySQL (backtick, ENGINE=InnoDB utf8mb4, AUTO_INCREMENT, DDL & DML).
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Tombol Eksekusi Backup Utama */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleExecuteNativeBackup}
                      disabled={isExecutingNativeBackup}
                      className={`w-full py-4 px-6 ${
                        backupFormat === 'mysql'
                          ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 shadow-amber-600/30'
                          : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 shadow-indigo-600/30'
                      } text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50`}
                    >
                      {isExecutingNativeBackup ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>{backupFormat === 'mysql' ? 'Menyusun Backup MySQL...' : 'Menjalankan pg_dump & Validasi...'}</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-5 h-5 text-indigo-200" />
                          <span>
                            {backupFormat === 'mysql' 
                              ? 'BACKUP SEKARANG (FORMAT MYSQL / MARIADB)' 
                              : 'BACKUP SEKARANG (POSTGRESQL PG_DUMP)'}
                          </span>
                          <Download className="w-4 h-4 ml-1 text-indigo-200" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Notifikasi Error jika Gagal */}
                  {backupError && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-rose-800">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Eksekusi Backup Gagal:</span>
                      </div>
                      <p className="font-mono text-[11px] bg-rose-100/70 p-2 rounded-xl text-rose-950 break-words">
                        {backupError}
                      </p>
                      <div className="text-[11px] text-rose-700">
                        <strong>Solusi Cepat:</strong> Anda dapat menggunakan tombol <strong>"Unduh Full SQL"</strong> di bagian atas yang menyertakan DDL struktur tabel lengkap secara langsung tanpa bergantung pada binary eksternal.
                      </div>
                    </div>
                  )}

                  {/* Panel Hasil Backup Sukses */}
                  {lastBackupResult && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-black text-xs uppercase tracking-wider text-emerald-900">
                            Backup Berhasil & Terverifikasi!
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                          STATUS: VALID
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Database:</span>
                          <span className="font-mono font-bold text-emerald-950">{lastBackupResult.database}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Format:</span>
                          <span className="font-bold text-emerald-950">
                            {lastBackupResult.format === 'custom'
                              ? 'PostgreSQL Custom (-Fc .backup)'
                              : lastBackupResult.format === 'mysql'
                              ? 'MySQL / MariaDB Format (.sql)'
                              : 'PostgreSQL Plain SQL (.sql)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Ukuran File:</span>
                          <span className="font-bold text-emerald-950">{lastBackupResult.sizeHuman}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 uppercase font-bold block">Waktu Selesai:</span>
                          <span className="font-mono text-[11px] text-emerald-950">{lastBackupResult.timestamp}</span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Nama File:</span>
                        <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100/80 px-2 py-1 rounded block truncate">
                          {lastBackupResult.filename}
                        </span>
                      </div>

                      {lastBackupResult.warning && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{lastBackupResult.warning}</span>
                        </div>
                      )}

                      {lastBackupResult.validationMessage && (
                        <div className="text-[11px] text-emerald-800 bg-white/70 p-2 rounded-xl border border-emerald-200 flex items-start gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{lastBackupResult.validationMessage}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700">Tersimpan di komputer & server</span>
                        <a
                          href={`/api/backup/download/${encodeURIComponent(lastBackupResult.filename)}`}
                          download={lastBackupResult.filename}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh Ulang File
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Info Keamanan Credential */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Standar Keamanan Credential & Privasi:</span>
                    </div>
                    <p className="leading-relaxed text-slate-500">
                      Password database PostgreSQL tidak pernah dipassing pada parameter baris perintah (CLI args), melainkan diinjeksikan secara aman via child process memory environment (<code className="font-mono text-slate-700 font-bold">PGPASSWORD</code>) tanpa pernah terekspos ke riwayat proses Windows.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Koneksi Database Ringkas */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-700">Host:</span>
                  <span className="font-mono">{dbInfo?.databaseConfig?.host || 'localhost'}:{dbInfo?.databaseConfig?.port || '5432'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">Database:</span>
                  <span className="font-mono font-bold text-indigo-700">{dbInfo?.databaseConfig?.database || 'nano_clinic'}</span>
                </div>
              </div>
            </div>

            {/* KARTU 2: PANDUAN RESTORE LENGKAP (PGADMIN 4 & CLI) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">PANDUAN RESTORE DATABASE</h3>
                    <p className="text-xs text-slate-500 font-medium">Cara memulihkan backup ke database baru PostgreSQL</p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Cara 1: Restore menggunakan pgAdmin 4 (GUI) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                        Cara Restore via pgAdmin 4 (File .backup):
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Paling Praktis
                      </span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1.5 pl-5 list-decimal font-medium leading-relaxed">
                      <li>Buka <strong>pgAdmin 4</strong> pada komputer lokal Windows Anda.</li>
                      <li>Buat database baru (misal: <code className="font-mono bg-white px-1.5 py-0.5 rounded border text-slate-800">nano_clinic_baru</code>) dengan encoding <strong>UTF8</strong>.</li>
                      <li>Klik kanan pada nama database baru tersebut, pilih menu <strong>Restore...</strong></li>
                      <li>Pada tab <strong>General</strong>, ubah Format ke <strong>Custom or tar</strong>.</li>
                      <li>Di bagian <strong>Filename</strong>, klik ikon folder lalu pilih file hasil backup yang telah diunduh (<code className="font-mono text-indigo-700">*.backup</code>).</li>
                      <li>Klik tombol <strong>Restore</strong> di pojok kanan bawah. Seluruh tabel, data, index, dan sequence akan otomatis terbangun lengkap!</li>
                    </ol>
                  </div>

                  {/* Cara 2: Restore menggunakan Command Line (pg_restore) */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        Command CLI: pg_restore
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('pg_restore -h localhost -p 5432 -U postgres -d nama_database_baru -v "nama_file.backup"', 'pg_restore')}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        {copiedCmd === 'pg_restore' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCmd === 'pg_restore' ? 'Tersalin' : 'Salin Perintah'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Jalankan perintah ini di Command Prompt (cmd) Windows untuk restore file Custom Format:
                    </p>
                    <pre className="font-mono text-[11px] bg-black/50 p-2.5 rounded-xl text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      pg_restore -h localhost -p 5432 -U postgres -d nama_database_baru -v &quot;nama_file.backup&quot;
                    </pre>
                  </div>

                  {/* Cara 3: Restore File Plain SQL */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-slate-700" />
                        Jika Menggunakan File Plain SQL (.sql):
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('psql -h localhost -p 5432 -U postgres -d nama_database_baru -f "nama_file.sql"', 'psql')}
                        className="text-[10px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {copiedCmd === 'psql' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCmd === 'psql' ? 'Tersalin' : 'Salin psql'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Buka <strong>Query Tool</strong> di pgAdmin 4 pada database target, buka file <code className="font-mono text-slate-800">.sql</code>, lalu tekan tombol <strong>Execute (F5)</strong>. Atau via psql:
                    </p>
                    <code className="block font-mono text-[10px] bg-slate-200/80 p-2 rounded text-slate-900 overflow-x-auto">
                      psql -h localhost -p 5432 -U postgres -d nama_database_baru -f &quot;nama_file.sql&quot;
                    </code>
                  </div>

                  {/* Restore JSON Bawaan (Web In-App Restore) */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <FileJson className="w-4 h-4 text-indigo-600" />
                        Pemulihan Cepat dari Aplikasi (File JSON)
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        In-App
                      </span>
                    </div>
                    
                    {/* Dropzone JSON */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl bg-white text-center cursor-pointer transition-all"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                      />
                      <span className="text-xs font-bold text-indigo-700 block">
                        {selectedBackupFile ? selectedBackupFile.name : 'Pilih File Backup JSON untuk Restore Langsung'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {selectedBackupFile ? `Ukuran: ${selectedBackupFile.size} • Siap Dipulihkan` : 'Klik untuk memilih dari komputer'}
                      </span>
                    </div>

                    {selectedBackupFile && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmRestoreModal(true)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
                      >
                        Proses Pemulihan Data JSON Sekarang
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Dukungan Versi: PostgreSQL 12, 13, 14, 15, 16, 17+</span>
                <span className="text-slate-600 font-bold">pgAdmin 4 Ready</span>
              </div>
            </div>

          </div>

          {/* DAFTAR FILE BACKUP YANG TERSIMPAN DI SERVER LOCAL DISK */}
          {dbInfo?.savedBackups && dbInfo.savedBackups.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Arsip File Backup di Penyimpanan Server Lokal ({dbInfo.savedBackups.length} File)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Folder: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">./backups</code>
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {dbInfo.savedBackups.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.isCustomFormat 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : item.isSqlFormat 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.isCustomFormat ? <Database className="w-4 h-4" /> : item.isSqlFormat ? <FileCode className="w-4 h-4" /> : <FileJson className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                          {item.filename}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Ukuran: <strong>{item.sizeHuman}</strong> • Dibuat: {new Date(item.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`/api/backup/download/${encodeURIComponent(item.filename)}`}
                      download={item.filename}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Unduh File</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel Pembersihan & Reset Transaksi Operasional Klinik */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Pembersihan & Reset Transaksi Operasional (Mulai Baru)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Menghapus data simulasi/lama dan menyiapkan sistem agar siap digunakan langsung secara bersih.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                Status: Bersih & Siap Digunakan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Data yang Dibersihkan / Dihapus:</span>
                </div>
                <ul className="text-[11px] text-rose-800/90 space-y-1 pl-5 list-disc font-medium">
                  <li>Seluruh Data Pasien, Wali & Rekam Medis (EMR)</li>
                  <li>Jadwal Booking Khitan & Antrean Pelayanan</li>
                  <li>Invoice, Pembayaran Kasir, Kuitansi & Transaksi Beban</li>
                  <li>Tindakan Medis, Informed Consent Digital & E-Sertifikat</li>
                  <li>Rekapitulasi Fee Dokter & Bagi Hasil Operasional</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data Penting yang TETAP DIJAGA & UTUH:</span>
                </div>
                <ul className="text-[11px] text-emerald-800/90 space-y-1 pl-5 list-disc font-medium">
                  <li><strong>Stok Barang & Alkes:</strong> Master produk, kuantitas stok & kartu stok awal baru.</li>
                  <li><strong>Data Login & Akun:</strong> Seluruh user & password login tetap aman.</li>
                  <li><strong>Data Dokter & Nakes:</strong> Profil dokter operator & tim nakes tetap utuh.</li>
                  <li><strong>Manajemen Pengguna & Profil:</strong> Pengaturan klinik & hak akses tetap aktif.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500 font-medium">
                Gunakan fungsi ini jika Anda ingin mengosongkan kembali transaksi klinis saat memulai operasional sesungguhnya.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmResetKeyword('');
                  setShowConfirmResetModal(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Data Transaksi</span>
              </button>
            </div>
          </div>

          {/* Info Teknis Database Engine & Fitur Keselamatan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Detail Arsitektur PostgreSQL & Skema Relasional 32+ Tabel</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">RDBMS Engine:</span>
                <span className="font-black text-slate-800 mt-0.5 block">PostgreSQL (Drizzle ORM + pg)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Native Utility:</span>
                <span className="font-black text-indigo-600 mt-0.5 block">
                  {dbInfo?.pgTools?.available ? 'pg_dump -Fc Aktif' : 'Auto DDL + DML Generator'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Integritas Foreign Key:</span>
                <span className="font-black text-emerald-600 mt-0.5 block">Cascade & Constraints Terjaga</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sinkronisasi Sequence:</span>
                <span className="font-black text-slate-800 mt-0.5 block">Auto-Increment ID Preserved</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL KLINIK & KOP DOKUMEN */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Profil Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Profil Klinik & Kop Dokumen Resmi
                </h2>
                <p className="text-xs text-slate-500 font-medium">Informasi ini dicetak pada Invoice Kasir, Kwitansi, E-Sertifikat, dan Surat Persetujuan Tindakan (Informed Consent).</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Logo Asli Klinik (Bukan AI) */}
              <div className="p-4 sm:p-5 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-700" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Logo Asli Klinik (Bukan AI)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                    Posisi: Di Samping Kop Surat
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Unggah file logo asli klinik Anda (format PNG, JPG, SVG, atau WebP). Sistem akan menggunakan file logo asli ini secara langsung untuk semua pencetakan dokumen resmi tanpa rekayasa AI.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {/* Preview Logo */}
                  <div className="w-20 h-16 bg-white rounded-xl border-2 border-dashed border-sky-300 flex items-center justify-center p-2 shadow-xs shrink-0">
                    <NanoMasterLogo 
                      src={formData.logoUrl} 
                      height={48} 
                      width={64} 
                      className="max-h-[48px] max-w-[64px] object-contain" 
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Unggah Logo Asli
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Gunakan Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Nama Resmi Klinik Khitan:
                </label>
                <input
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Slogan / Tagline Layanan:
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / Hotline:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Email Operasional:
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap Klinik:
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Kaki Invoice (Footer):
                </label>
                <textarea
                  rows={2}
                  value={formData.invoiceFooter}
                  onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Simpan Profil Klinik
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Pratinjau Kop Surat & Ringkasan Pengguna Aktif */}
          <div className="space-y-6">
            {/* Live Pratinjau Kop Dokumen Resmi (Logo di Samping Kop) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-sky-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Pratinjau Kop Dokumen
                  </h3>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Logo di Samping
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Simulasi tampilan kop resmi pada cetak Kwitansi, Informed Consent, dan Sertifikat:
              </p>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  {/* Kop Layout: Logo di samping Kop Surat */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
                    <div className="shrink-0 flex items-center justify-center">
                      <NanoMasterLogo 
                        src={formData.logoUrl} 
                        height={48} 
                        width={60} 
                        className="max-h-[48px] max-w-[60px] object-contain print-kop-logo" 
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-tight leading-tight truncate">
                        {formData.clinicName || 'NANO CIRCUMCISION CLINIC'}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">
                        {formData.tagline || 'Sunat Canggih & Modern'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
                        {formData.address || 'Ruko Khayangan Nomor RB-16 Bangkalan'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono truncate">
                        Telp: {formData.phone || '0812-8888-9999'} • {formData.email || 'info@nanocircumcision.com'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                    — CONTOH ISI DOKUMEN —
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Status Otorisasi Pengguna
                </h3>
              </div>

              <div className="text-xs space-y-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengguna Aktif:</span>
                  <span className="font-black text-slate-900 text-sm mt-0.5 block">{currentUser?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Level Hak Akses:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-[10px] font-black uppercase mt-1 inline-block">
                    {currentUser?.role === 'admin' ? 'Super Admin' : currentUser?.role === 'doctor' ? 'Dokter' : 'Staff'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  Perubahan identitas klinik dan pemulihan database dibatasi khusus untuk Super Admin guna mencegah kesalahan operasional.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Restore Database */}
      {showConfirmRestoreModal && selectedBackupFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Konfirmasi Pemulihan Database</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Apakah Anda yakin ingin memulihkan database dari file cadangan lokal ini?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">File:</span>
                <span className="font-bold text-slate-900 truncate max-w-[220px]">{selectedBackupFile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ukuran:</span>
                <span className="font-bold text-slate-900">{selectedBackupFile.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Sinkronisasi:</span>
                <span className="font-bold text-indigo-700">Cloud SQL PostgreSQL</span>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
              <strong>Catatan:</strong> Data akan disinkronkan ke seluruh tabel database (pasien, booking, tindakan, kasir, invoice, stok & SDM). Tindakan ini akan dicatat dalam Audit Trail sistem.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmRestoreModal(false)}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Ya, Pulihkan Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pembersihan Data Transaksi (Reset Operasional) */}
      {showConfirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Konfirmasi Pembersihan Transaksi</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tindakan ini akan mengosongkan seluruh riwayat pasien, booking, antrean, invoice, dan rekam medis EMR agar sistem siap dipakai secara baru.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Dihapus: Pasien, Booking, Kasir, EMR, Invoice</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tetap Utuh: Stok Barang, Akun Login, Dokter & Nakes</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Ketik kata <span className="text-rose-600 font-black">RESET</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmResetKeyword}
                onChange={(e) => setConfirmResetKeyword(e.target.value)}
                placeholder="Ketik RESET di sini"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white text-center uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmResetModal(false);
                  setConfirmResetKeyword('');
                }}
                disabled={isResettingTransactions}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteResetTransactions}
                disabled={isResettingTransactions || confirmResetKeyword.trim().toUpperCase() !== 'RESET'}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isResettingTransactions ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <span>Konfirmasi Reset</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
