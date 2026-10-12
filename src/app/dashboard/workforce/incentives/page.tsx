'use client';

import React, { useState, useEffect } from 'react';
import {
  Award, TrendingUp, DollarSign, Target, CheckCircle2,
  Calendar, RefreshCw, Plus, Play, Check, X, Building2,
  ChevronRight, Filter, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function FieldIncentivesPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-09');
  const [calculating, setCalculating] = useState(false);

  // New Scheme Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    periodType: 'MONTHLY',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    minTargetAchievementPct: 80,
    minCallCoveragePct: 85,
    baseIncentiveRate: 5,
    superIncentiveRate: 10,
    applicableRole: 'MR',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, calcsRes, summaryRes] = await Promise.all([
        api.get('/hrms/incentives/plans'),
        api.get('/hrms/incentives/calculations', { params: { period: selectedPeriod } }),
        api.get('/hrms/incentives/summary', { params: { period: selectedPeriod } }),
      ]);

      if (plansRes.data?.success) setPlans(plansRes.data.data);
      if (calcsRes.data?.success) setCalculations(calcsRes.data.data);
      if (summaryRes.data?.success) setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Error fetching incentives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/hrms/incentives/calculate', { period: selectedPeriod });
      if (res.data?.success) {
        alert(`Calculation complete! ${res.data.data.calculatedCount} representatives processed.`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run calculation');
    } finally {
      setCalculating(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/hrms/incentives/plans', planForm);
      if (res.data?.success) {
        setIsPlanModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'PAID' | 'REJECTED') => {
    try {
      const res = await api.patch(`/hrms/incentives/calculations/${id}/status`, { status });
      if (res.data?.success) {
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Commercial Incentive & Performance Engine</h1>
              <p className="text-sm text-slate-500">
                Rule-based incentive settlement tied to sales target achievements and doctor visit coverage
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Scheme
          </button>
          <button
            onClick={handleRunCalculation}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Computing Scorecards...' : 'Run Engine'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Incentive Payout</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary?.totalPayout ? summary.totalPayout.toLocaleString() : 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Calculated for period {selectedPeriod}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Eligible Field Reps</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{summary?.totalCalculated || 0}</div>
          <div className="text-xs text-amber-600 mt-1">Met eligibility criteria</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Target Achieved</span>
            <Target className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{summary?.avgAchievement || 0}%</div>
          <div className="text-xs text-indigo-600 mt-1">Across primary orders</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved & Paid</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {summary?.approvedCount || 0} / {summary?.totalCalculated || 0}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Ready for finance disbursal</div>
        </div>
      </div>

      {/* Active Incentive Schemes Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Commercial Schemes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-5 bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/60 rounded-xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {plan.code}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{plan.periodType}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Min Target</span>
                  <span className="font-semibold text-slate-800">{plan.minTargetAchievementPct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Min Coverage</span>
                  <span className="font-semibold text-slate-800">{plan.minCallCoveragePct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Base / Super</span>
                  <span className="font-bold text-amber-700">
                    {plan.baseIncentiveRate}% / {plan.superIncentiveRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period Filter & Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 uppercase">Calculation Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>
          <div className="text-xs text-slate-500">
            Showing {calculations.length} calculations for {selectedPeriod}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Field Representative</th>
                <th className="py-3 px-4">Sales Target vs Achieved</th>
                <th className="py-3 px-4">Call Coverage</th>
                <th className="py-3 px-4">Scheme Code</th>
                <th className="py-3 px-4">Incentive Calculated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
                    Loading performance calculations...
                  </td>
                </tr>
              ) : calculations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Award className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No calculations found for {selectedPeriod}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click &quot;Run Engine&quot; above to calculate scores from visits and orders.
                    </p>
                  </td>
                </tr>
              ) : (
                calculations.map((calc) => {
                  const targetHit = calc.achievementPercent >= 100;
                  return (
                    <tr key={calc.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          {calc.user?.firstName} {calc.user?.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {calc.user?.employeeId || 'ID: -'} • {calc.user?.role}
                          {calc.user?.hq?.name ? ` • HQ: ${calc.user.hq.name}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          ₹{calc.achievedAmount?.toLocaleString()} / ₹{calc.targetAmount?.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                              targetHit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {calc.achievementPercent}% Achieved
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {calc.callsCompleted} / {calc.callsPlanned} Visits
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {calc.callCoveragePercent}% Coverage
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {calc.plan?.code || 'STANDARD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">
                        ₹{calc.finalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            calc.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : calc.status === 'APPROVED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {calc.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {calc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {calc.status !== 'PAID' && (
                            <button
                              onClick={() => handleUpdateStatus(calc.id, 'PAID')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                            >
                              Mark Paid
                            </button>
                          )}
                          {calc.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(calc.id, 'APPROVED')}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded"
                            >
                              Approve
                            </button>
                          )}
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

      {/* New Scheme Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Define New Commercial Incentive Scheme</h3>
                <p className="text-xs text-slate-500">Configure target thresholds and tiered commission %</p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheme Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Flagship Cardiovascular Drive"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheme Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4_CARDIO_2026"
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periodicity</label>
                  <select
                    value={planForm.periodType}
                    onChange={(e) => setPlanForm({ ...planForm, periodType: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Target Achievement %
                  </label>
                  <input
                    type="number"
                    value={planForm.minTargetAchievementPct}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, minTargetAchievementPct: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Call Coverage %
                  </label>
                  <input
                    type="number"
                    value={planForm.minCallCoveragePct}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, minCallCoveragePct: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Incentive %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={planForm.baseIncentiveRate}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, baseIncentiveRate: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Super Incentive % (&gt;=100% Target)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={planForm.superIncentiveRate}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, superIncentiveRate: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Rules</label>
                <textarea
                  rows={2}
                  placeholder="Details on doctor targets and product lines included..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Create Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
