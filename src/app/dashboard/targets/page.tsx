'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Target, Plus, Loader2, Pencil, Trash2, Calendar, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import TargetForm from '@/components/targets/TargetForm';

export default function TargetsPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  
  const [filterYear, setFilterYear] = useState<number | ''>(currentYear);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['targets', filterYear, page],
    queryFn: () => api.get('/targets', { 
      params: { 
        targetYear: filterYear || undefined,
        page, 
        limit: 15 
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (targetItem: any) => {
    if (!confirm(`Are you sure you want to delete the target for ${targetItem.hq?.name}?`)) return;
    try {
      setDeleting(targetItem.id);
      await api.delete(`/targets/${targetItem.id}`);
      qc.invalidateQueries({ queryKey: ['targets'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete target');
    } finally {
      setDeleting(null);
    }
  };

  const targetsList = data?.targets ?? [];

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <TargetForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); qc.invalidateQueries({ queryKey: ['targets'] }); }}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-red-600" /> Sales Targets
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage annual territory targets for Headquarters
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Set Target
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Filter by Year:</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={filterYear} 
                onChange={e => { setFilterYear(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-gray-50"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="ml-auto bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-3">
            <div className="text-xs text-red-600 font-semibold">Total Targets Set</div>
            <div className="text-lg font-bold text-red-700">{data?.total ?? 0}</div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Territory / Headquarter</th>
                  <th className="px-6 py-4">Target Year</th>
                  <th className="px-6 py-4">Target Amount (₹)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" /> Loading targets...
                    </td>
                  </tr>
                ) : targetsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <Target className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                      <p>No targets found for the selected year.</p>
                    </td>
                  </tr>
                ) : (
                  targetsList.map((t: any) => (
                    <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{t.hq?.name || 'Unknown HQ'}</p>
                            <p className="text-xs text-gray-500">HQ Code: {t.hq?.code || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Calendar className="w-3 h-3 mr-1" /> {t.targetYear}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[15px] font-bold text-gray-900">
                          ₹{t.targetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditData(t)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Target"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deleting === t.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Target"
                          >
                            {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {data?.totalPages > 1 && (
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between text-sm bg-gray-50/50">
              <p className="text-gray-500">
                Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)} 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white text-xs"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button 
                  disabled={page === data.totalPages} 
                  onClick={() => setPage(p => p + 1)} 
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white text-xs"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
