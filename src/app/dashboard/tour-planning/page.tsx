'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, Plus, Loader2, Pencil, Trash2, MapPin, CheckCircle, XCircle, Clock, Users, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import TourPlanForm from '@/components/operations/TourPlanForm';
import { useAuth } from '@/lib/auth-context';

export default function TourPlanningPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tour-plans', page, statusFilter],
    queryFn: () => api.get('/tour-plans', { 
      params: { 
        page, 
        limit: 15,
        status: statusFilter || undefined
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this tour plan?')) return;
    try {
      setProcessing(item.id);
      await api.delete(`/tour-plans/${item.id}`);
      qc.invalidateQueries({ queryKey: ['tour-plans'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete plan');
    } finally {
      setProcessing(null);
    }
  };

  const handleStatusUpdate = async (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessing(item.id + newStatus);
      await api.patch(`/tour-plans/${item.id}/status`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ['tour-plans'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const plans = data?.tourPlans ?? [];
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <TourPlanForm
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
              <Calendar className="w-6 h-6 text-amber-500" /> Tour Planning
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Plan and manage upcoming field visits and territories
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create Tour Plan
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-gray-50"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Tour Dates</th>
                  <th className="px-6 py-4">Location & Scope</th>
                  <th className="px-6 py-4">Joint Visit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />Loading plans...</td></tr>
                ) : plans.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />No tour plans found.</td></tr>
                ) : (
                  plans.map((t: any) => (
                    <tr key={t.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/tour-planning/${t.id}`} className="font-bold text-gray-900 hover:text-amber-600 transition-colors">
                          {t.user?.firstName} {t.user?.lastName}
                        </Link>
                        <p className="text-xs text-gray-500">Code: {t.user?.employeeCode || t.userId?.slice(-6)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/tour-planning/${t.id}`} className="block">
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                            {new Date(t.tourFromDate).toLocaleDateString('en-GB')}
                            {t.tourToDate && (
                              <>
                                <ArrowRight className="w-3 h-3 text-gray-400 mx-1" />
                                {new Date(t.tourToDate).toLocaleDateString('en-GB')}
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 max-w-[150px] truncate" title={t.tourPurpose}>{t.tourPurpose}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{t.hq?.name || 'N/A'}</p>
                            {(t.location?.name || t.area?.name) && (
                              <p className="text-xs text-gray-500">{t.location?.name} {t.area?.name && `> ${t.area.name}`}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.jointVisit ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                            <Users className="w-3 h-3" /> Yes ({t.jointVisitWith})
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {t.approvalStatus === 'APPROVED' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Approved</span>}
                        {t.approvalStatus === 'REJECTED' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>}
                        {t.approvalStatus === 'PENDING' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          <Link
                            href={`/dashboard/tour-planning/${t.id}`}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Inspect MTP Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Approval Actions for Managers */}
                          {isAdminOrManager && t.approvalStatus === 'PENDING' && (
                            <>
                              <button onClick={() => handleStatusUpdate(t, 'APPROVED')} disabled={processing === t.id + 'APPROVED'} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                {processing === t.id + 'APPROVED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleStatusUpdate(t, 'REJECTED')} disabled={processing === t.id + 'REJECTED'} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                {processing === t.id + 'REJECTED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </button>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                            </>
                          )}

                          {/* Standard Actions */}
                          <button onClick={() => setEditData(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(t)} disabled={processing === t.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {processing === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
