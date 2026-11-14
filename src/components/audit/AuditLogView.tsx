import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  History, Search, Filter, RefreshCw, User, Calendar, 
  ShieldAlert, Activity, FileText, Database, Shield
} from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const { auditLogs, fetchAuditLogs } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAuditLogs();
    setIsRefreshing(false);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('VOID') || act.includes('CANCEL')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('COMPLETE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (act.includes('LOGIN') || act.includes('LOGOUT')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-sky-100 text-sky-800 border-sky-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Pencatatan riwayat kronologis seluruh tindakan operasional, pembatalan invoice, rekonsiliasi data, dan modifikasi master.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : 'text-slate-400'}`} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Immutable Audit Standard</div>
            <div className="text-xs text-slate-400">
              Setiap transaksi finansial, pembatalan invoice, dan soft-delete pasien disimpan permanen bersama timestamp server Cloud SQL.
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
          {auditLogs.length} Total Rekaman
        </span>
      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aksi, entitas, pengguna, keterangan..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Entitas</option>
              <option value="AUTH">Autentikasi (AUTH)</option>
              <option value="PATIENT">Pasien (PATIENT)</option>
              <option value="BOOKING">Booking & Jadwal</option>
              <option value="PROCEDURE">Tindakan Khitan</option>
              <option value="INVOICE">Invoice & Pembayaran</option>
              <option value="EMPLOYEE">Karyawan</option>
              <option value="PAYROLL">Payroll Gaji</option>
              <option value="USER">User Akun</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Keterangan / Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Tidak ada aktivitas audit yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">
                      {log.entity} #{log.entityId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {log.performedBy}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-md">
                      <div className="line-clamp-2 font-mono text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {log.details || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
