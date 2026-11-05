import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, 
  AlertCircle, Loader2, Building2, Shield, Sparkles
} from 'lucide-react';
import { NanoAppIcon } from '../common/PrintIcons';

export const LoginView: React.FC = () => {
  const { login, settings, branches } = useClinic();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('PUSAT');

  const availableBranches = branches && branches.length > 0 ? branches : [
    { id: 1, code: 'PUSAT', name: 'Klinik Khitan Pusat', isActive: true },
    { id: 2, code: 'CABANG-01', name: 'Klinik Khitan Cabang Surabaya', isActive: true },
    { id: 3, code: 'CABANG-02', name: 'Klinik Khitan Cabang Sidoarjo', isActive: true },
  ];

  // Pastikan form login selalu bersih saat dimuat
  useEffect(() => {
    setUsername('');
    setPassword('');
    setErrorMsg('');
  }, []);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMsg('Silakan masukkan username atau email resmi Anda.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(cleanUser, password, selectedBranch);
      if (!res.success) {
        setErrorMsg(res.error || 'Username atau kata sandi tidak sesuai. Akses ditolak.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk ke sistem. Periksa koneksi server database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Ambient Radial Medical Background Highlights (Harmonious Orange, Ungu, Merah & Kuning) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Single Login Box */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Subtle Top Gradient Accent Strip (Orange, Rose/Merah, Ungu, Amber/Kuning) */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600" />

        <div className="p-7 sm:p-9 space-y-6">
          
          {/* Header Branding Klinik */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-orange-50 via-amber-50 to-purple-50 border border-slate-200/80 shadow-xs mb-1">
              <NanoAppIcon size={52} className="drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {settings.clinicName || 'NANO CIRCUMCISION CLINIC'}
              </h1>
              <p className="text-[11px] font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-rose-600 to-purple-700 mt-0.5">
                Sistem Informasi Manajemen Khitan Modern
              </p>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto pt-1 leading-relaxed">
              Silakan masukkan kredensial akun resmi Anda untuk mengakses sistem rekam medis &amp; kasir operasional.
            </p>
          </div>

          {/* Alert Error Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleStandardLogin} autoComplete="off" className="space-y-4">
            
            {/* Pilihan Cabang Operasional */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cabang Klinik
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  {availableBranches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Username / Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  autoComplete="off"
                  placeholder="Masukkan username atau email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  autoComplete="new-password"
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tombol Submit Masuk ke Sistem */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 via-rose-600 to-purple-700 hover:from-orange-600 hover:via-rose-700 hover:to-purple-800 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Catatan Kaki Keamanan & RME */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1 text-slate-500">
              <Shield className="w-3.5 h-3.5 text-orange-500" />
              Sistem Khusus Staf Medis
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Terenkripsi &amp; Aman
            </span>
          </div>

        </div>
      </div>

      {/* Footer Branding Text */}
      <div className="mt-6 text-center text-xs text-slate-500 space-y-1 z-10">
        <p className="font-medium text-[11px] text-slate-400">
          Nano Circumcision Clinic Management • Protected Medical System
        </p>
      </div>
    </div>
  );
};
