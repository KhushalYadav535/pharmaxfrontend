'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { FileText, Plus, Loader2, Pencil, Trash2, MapPin, Activity, Building2, Store, Package, Calendar } from 'lucide-react';
import DailyReportForm from '@/components/operations/DailyReportForm';

export default function DailyReportsPage() {
  const qc = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['daily-reports', page, typeFilter, dateFilter],
    queryFn: () => api.get('/daily-reports', { 
      params: { 
        page, 
        limit: 15,
        visitType: typeFilter || undefined,
        startDate: dateFilter || undefined,
        endDate: dateFilter || undefined // Exact date match for simple filtering
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this visit report?')) return;
    try {
      setDeleting(item.id);
      await api.delete(`/daily-reports/${item.id}`);
      qc.invalidateQueries({ queryKey: ['daily-reports'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const reports = data?.reports ?? [];

  const getTargetName = (r: any) => {
    if (r.visitType === 'DOCTOR') return r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'N/A';
    if (r.visitType === 'HOSPITAL') return r.hospital?.name || 'N/A';
    if (r.visitType === 'RETAILER') return r.retailer?.name || 'N/A';
    if (r.visitType === 'STOCKIST') return r.stockist?.name || 'N/A';
    return 'Other';
  };

  const getIcon = (type: string) => {
    if (type === 'DOCTOR') return <Activity className="w-4 h-4" />;
    if (type === 'HOSPITAL') return <Building2 className="w-4 h-4" />;
    if (type === 'RETAILER') return <Store className="w-4 h-4" />;
    if (type === 'STOCKIST') return <Package className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 pt-10 pb-24 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <DailyReportForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" /> Daily Visit Reporting
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Log, track, and manage your daily interactions with clients in the field.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Log Visit
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Type:</span>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50">
              <option value="">All Types</option>
              <option value="DOCTOR">Doctor</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="RETAILER">Retailer</option>
              <option value="STOCKIST">Stockist</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Date:</span>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50" />
            {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-red-500 font-medium">Clear</button>}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Visit Date & Target</th>
                  <th className="px-6 py-4">Purpose / Feedback</th>
                  <th className="px-6 py-4">GPS Loc</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />Loading reports...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />No daily reports found.</td></tr>
                ) : (
                  reports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="text-xs text-gray-500">Code: {r.employee?.employeeCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs mb-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" /> {new Date(r.visitDate).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`p-1 rounded-md ${r.visitType==='DOCTOR'?'bg-emerald-100 text-emerald-700':r.visitType==='HOSPITAL'?'bg-indigo-100 text-indigo-700':r.visitType==='RETAILER'?'bg-orange-100 text-orange-700':'bg-violet-100 text-violet-700'}`}>
                            {getIcon(r.visitType)}
                          </div>
                          <span className="font-bold text-gray-900">{getTargetName(r)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal min-w-[250px]">
                        {r.visitPurpose && <p className="text-xs font-semibold text-gray-700 mb-0.5">P: {r.visitPurpose}</p>}
                        {r.visitFeedback && <p className="text-[11px] text-gray-500 line-clamp-2">F: {r.visitFeedback}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {r.locationLat && r.locationLng ? (
                          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-mono bg-emerald-50 px-2 py-1 rounded w-max border border-emerald-100">
                            <MapPin className="w-3 h-3" /> {r.locationLat.toFixed(3)}, {r.locationLng.toFixed(3)}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No GPS</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditData(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r)} disabled={deleting === r.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
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
    </>
  );
}
