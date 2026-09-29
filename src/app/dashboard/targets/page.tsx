'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Target, Plus, Loader2, Pencil, Trash2, Calendar, MapPin, Search,
  TrendingUp, Award, AlertCircle, ArrowUpRight, BarChart3, CheckCircle2,
  ChevronLeft, ChevronRight, Percent, Building2
} from 'lucide-react';
import TargetForm from '@/components/targets/TargetForm';

export default function TargetsPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [filterYear, setFilterYear] = useState<number | ''>(currentYear);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Targets query
  const { data, isLoading } = useQuery({
    queryKey: ['targets', filterYear, page],
    queryFn: () =>
      api
        .get('/targets', {
          params: {
            targetYear: filterYear || undefined,
            page,
            limit: 20,
          },
        })
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Fetch actual sales metrics from analytics & orders
  const { data: teamProductivity } = useQuery({
    queryKey: ['team-productivity-for-targets'],
    queryFn: () => api.get('/analytics/team-productivity').then((r) => r.data.data),
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats-for-targets'],
    queryFn: () => api.get('/analytics/order-stats').then((r) => r.data.data),
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

  // Total sales achieved across the company
  const totalAchievedRevenue = orderStats?.totalRevenue || teamProductivity?.totalRevenue || 0;
  const totalTargetQuota = targetsList.reduce((sum: number, t: any) => sum + (t.targetAmount || 0), 0);
  const overallPercentage = totalTargetQuota > 0 ? Math.min(100, Math.round((totalAchievedRevenue / totalTargetQuota) * 100)) : 0;

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <TargetForm
            editData={editData ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditData(null);
              qc.invalidateQueries({ queryKey: ['targets'] });
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-4 px-2 sm:px-4 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-rose-600" /> Sales Quotas & Achievement Leaderboard
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Annual revenue targets vs actual secondary sales fulfillment across Headquarters
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Set New Target
          </button>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales Target</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{totalTargetQuota.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{targetsList.length} Headquarter quotas</p>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Actual Secondary Sales</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              ₹{totalAchievedRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Delivered commercial orders</p>
          </div>

          <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Company Achievement</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-1">{overallPercentage}%</p>
            <div className="w-full bg-blue-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 p-5 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Target Deficit / Surplus</span>
            <p className="text-2xl font-black text-amber-800 mt-1">
              ₹{Math.max(0, totalTargetQuota - totalAchievedRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Remaining to reach 100%</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Year:</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value ? Number(e.target.value) : '');
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-slate-50 text-slate-900"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing targets for {targetsList.length} territory headquarters
          </div>
        </div>

        {/* Target vs Actual Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Territory / Headquarter</th>
                  <th className="px-6 py-4">Target Year</th>
                  <th className="px-6 py-4">Annual Target (₹)</th>
                  <th className="px-6 py-4">Estimated Progress</th>
                  <th className="px-6 py-4">Achievement Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                      Loading targets and quota fulfillment...
                    </td>
                  </tr>
                ) : targetsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <Target className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700">No targets configured for this year</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Set New Target" to define territory quotas</p>
                    </td>
                  </tr>
                ) : (
                  targetsList.map((t: any, index: number) => {
                    // Estimated progress per HQ based on total orders
                    const hqTarget = t.targetAmount || 1;
                    const distributedShare = totalAchievedRevenue > 0 && targetsList.length > 0 ? (totalAchievedRevenue / targetsList.length) : 0;
                    const pct = Math.min(100, Math.round((distributedShare / hqTarget) * 100));

                    const isTop = pct >= 80;
                    const isModerate = pct >= 40 && pct < 80;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                {t.hq?.name || 'Assigned HQ'}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                HQ Code: {t.hq?.code || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" /> {t.targetYear}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-black text-slate-900 text-sm">
                          ₹{t.targetAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className={isTop ? 'text-emerald-700' : isModerate ? 'text-amber-700' : 'text-slate-600'}>
                                {pct}%
                              </span>
                              <span className="text-slate-400 font-normal">
                                ₹{Math.round(distributedShare).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isTop ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isTop
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isModerate
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isTop ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {isTop ? 'On Track' : isModerate ? 'Moderate' : 'Under Target'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditData(t)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Target"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(t)}
                              disabled={deleting === t.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Target"
                            >
                              {deleting === t.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
