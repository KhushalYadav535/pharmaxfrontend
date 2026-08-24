'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ClipboardList, Plus, Loader2, Pencil, Trash2, Calendar, MapPin, Building2, Package, Tag, ArrowRight } from 'lucide-react';
import SurveyForm from '@/components/operations/SurveyForm';

export default function SurveysPage() {
  const qc = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['surveys', page],
    queryFn: () => api.get('/surveys', { 
      params: { page, limit: 15 } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this survey?')) return;
    try {
      setDeleting(item.id);
      await api.delete(`/surveys/${item.id}`);
      qc.invalidateQueries({ queryKey: ['surveys'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete survey');
    } finally {
      setDeleting(null);
    }
  };

  const surveys = data?.surveys ?? [];

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <SurveyForm
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
              <ClipboardList className="w-6 h-6 text-orange-600" /> Market Surveys
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track competitor products and pricing strategies.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Survey
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Survey Info</th>
                  <th className="px-6 py-4">Competitor Product</th>
                  <th className="px-6 py-4 text-center border-x border-gray-100 bg-orange-50/30">Competitor Pricing</th>
                  <th className="px-6 py-4 text-center bg-indigo-50/30">Our Pricing</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />Loading surveys...</td></tr>
                ) : surveys.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-200" />No surveys found.</td></tr>
                ) : (
                  surveys.map((s: any) => (
                    <tr key={s.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold mb-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          {new Date(s.surveyDate).toLocaleDateString('en-GB')}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.hq?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-gray-900">{s.competitorProductName}</p>
                            <p className="text-xs text-gray-600">{s.competitorCompanyName}</p>
                            {s.competitorProductComposition && (
                              <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[200px]">{s.competitorProductComposition}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Competitor Pricing (orange block) */}
                      <td className="px-6 py-4 text-center border-x border-gray-100 bg-orange-50/20">
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div><span className="block text-gray-400 uppercase font-bold text-[9px]">MRP</span><span className="font-bold text-orange-900">₹{s.maximumRetailPrice || '-'}</span></div>
                          <div><span className="block text-gray-400 uppercase font-bold text-[9px]">PTR</span><span className="font-bold text-orange-900">₹{s.priceToRetailer || '-'}</span></div>
                          <div><span className="block text-gray-400 uppercase font-bold text-[9px]">PTS</span><span className="font-bold text-orange-900">₹{s.priceToStockist || '-'}</span></div>
                        </div>
                      </td>

                      {/* Our Pricing (Indigo block) */}
                      <td className="px-6 py-4 text-center bg-indigo-50/20">
                        <div className="flex flex-col items-center mb-1.5">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">{s.product?.name || 'Unknown'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div><span className="block text-indigo-300 uppercase font-bold text-[9px]">MRP</span><span className="font-bold text-indigo-900">₹{s.product?.mrp || '-'}</span></div>
                          <div><span className="block text-indigo-300 uppercase font-bold text-[9px]">PTR</span><span className="font-bold text-indigo-900">₹{s.product?.ptr || '-'}</span></div>
                          <div><span className="block text-indigo-300 uppercase font-bold text-[9px]">PTS</span><span className="font-bold text-indigo-900">₹{s.product?.pts || '-'}</span></div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditData(s)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s)} disabled={deleting === s.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
