'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Building2, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, MapPin, Globe, Users,
} from 'lucide-react';
import HeadquarterForm from '@/components/masters/HeadquarterForm';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function HeadquarterMasterPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['headquarters', search, page],
    queryFn: () =>
      api.get('/headquarters', { params: { search: search || undefined, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (hq: any) => {
    if (!confirm(`Delete headquarter "${hq.name}"? This cannot be undone.`)) return;
    try {
      setDeleting(hq.id);
      await api.delete(`/headquarters/${hq.id}`);
      qc.invalidateQueries({ queryKey: ['headquarters'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const hqs: any[] = data?.headquarters ?? [];

  return (
    <>
      {(showForm || editData) && (
        <HeadquarterForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" /> Headquarter Master
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all headquarters (territories) and their geographic coverage
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Headquarter
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total HQs', value: data?.total ?? 0, color: 'bg-indigo-50 text-indigo-700' },
            { label: 'Doctors Covered', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.doctors ?? 0), 0), color: 'bg-blue-50 text-blue-700' },
            { label: 'Retailers Covered', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.retailers ?? 0), 0), color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Employees Assigned', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.employees ?? 0), 0), color: 'bg-amber-50 text-amber-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[0]} border border-gray-100`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${s.color.split(' ')[1]}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code, district, state..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['HQ Code', 'Name', 'Location', 'Region / Zone', 'Employees', 'Doctors', 'Retailers', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-3" />Loading headquarters...
                  </td></tr>
                ) : hqs.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    {search ? 'No headquarters match your search.' : 'No headquarters found. Add your first one!'}
                  </td></tr>
                ) : hqs.map((hq: any) => (
                  <tr key={hq.id} className="hover:bg-indigo-50/20 transition-colors">
                    {/* HQ Code */}
                    <td className="px-5 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{hq.code}</td>

                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-semibold text-gray-900">{hq.name}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <div>
                          <div>{hq.district || '—'}</div>
                          <div className="text-xs text-gray-400">{hq.state}{hq.pinCode ? ` – ${hq.pinCode}` : ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* Region / Zone */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <div>
                          <div>{hq.region || '—'}</div>
                          {hq.zone && <div className="text-xs text-gray-400">{hq.zone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Employees */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>{hq._count?.employees ?? 0}</span>
                      </div>
                    </td>

                    {/* Doctors */}
                    <td className="px-5 py-4 text-gray-600">{hq._count?.doctors ?? 0}</td>

                    {/* Retailers */}
                    <td className="px-5 py-4 text-gray-600">{hq._count?.retailers ?? 0}</td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditData(hq)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(hq)}
                          disabled={deleting === hq.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === hq.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
              <p className="text-gray-500">
                Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">
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
