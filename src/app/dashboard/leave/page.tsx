'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, Plus, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDate, APPROVAL_STATUS_COLORS } from '@/lib/utils';

const LEAVE_TYPES = ['casual', 'sick', 'earned'];
const LEAVE_LABELS: Record<string, string> = { casual: 'Casual Leave', sick: 'Sick Leave', earned: 'Earned Leave' };
const LEAVE_TOTAL: Record<string, number> = { casual: 12, sick: 12, earned: 21 };

export default function LeavePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/leaves').then((r) => r.data.data),
  });

  const { data: balance } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/leaves/balance').then((r) => r.data.data),
  });

  const applyMutation = useMutation({
    mutationFn: (body: any) => api.post('/leaves', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      setShowForm(false);
      setForm({ leaveType: 'casual', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), reason: '' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-leaves'] }); qc.invalidateQueries({ queryKey: ['leave-balance'] }); },
  });

  const calcDays = () => {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Leave Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Apply for leaves and track your leave balance</p>
        </div>
        <button onClick={() => setShowForm(true)} id="apply-leave-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      {balance && (
        <div className="grid grid-cols-3 gap-4">
          {LEAVE_TYPES.map((type) => {
            const b = balance[type];
            const pct = b ? Math.round((b.remaining / LEAVE_TOTAL[type]) * 100) : 100;
            return (
              <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{LEAVE_LABELS[type]}</p>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{b?.remaining ?? LEAVE_TOTAL[type]}</p>
                    <p className="text-xs text-gray-400">of {LEAVE_TOTAL[type]} remaining</p>
                  </div>
                  <p className="text-sm text-red-500 font-medium">{b?.taken || 0} taken</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Leave History</h2>
          <span className="text-xs text-gray-400">{leaves?.length || 0} total</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : leaves?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No leave requests yet</p>
            <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Apply for leave →</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaves?.map((leave: any) => {
              const days = Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
              return (
                <div key={leave.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${leave.approvalStatus === 'APPROVED' ? 'bg-emerald-50' : leave.approvalStatus === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'}`}>
                    {leave.approvalStatus === 'APPROVED' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : leave.approvalStatus === 'REJECTED' ? <X className="w-5 h-5 text-red-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{LEAVE_LABELS[leave.leaveType] || leave.leaveType}</p>
                      <span className="text-xs font-medium text-gray-500">{days} day{days !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(leave.startDate)} → {formatDate(leave.endDate)}</p>
                    {leave.reason && <p className="text-xs text-gray-400 italic mt-0.5">"{leave.reason}"</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${APPROVAL_STATUS_COLORS[leave.approvalStatus]}`}>{leave.approvalStatus}</span>
                    {leave.approvalStatus === 'PENDING' && (
                      <button onClick={() => cancelMutation.mutate(leave.id)} disabled={cancelMutation.isPending} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Cancel</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); applyMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEAVE_TYPES.map((t) => (
                    <button type="button" key={t} onClick={() => setForm(f => ({ ...f, leaveType: t }))} className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${form.leaveType === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value > f.endDate ? e.target.value : f.endDate }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              {calcDays() > 0 && (
                <div className="bg-emerald-50 rounded-xl px-4 py-2.5 text-sm font-medium text-emerald-700 text-center">
                  {calcDays()} working day{calcDays() !== 1 ? 's' : ''} requested
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Brief reason for leave..." className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={applyMutation.isPending || calcDays() === 0} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {applyMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Applying...</> : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
