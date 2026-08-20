'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ClipboardCheck, CheckCircle, XCircle, Loader2, Users, DollarSign, Calendar, Map, RefreshCw } from 'lucide-react';
import { formatDate, formatCurrency, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import { useState } from 'react';

type TabKey = 'visits' | 'expenses' | 'leaves' | 'tourplans';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('visits');

  const { data: summary } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: () => api.get('/approvals/summary').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: pendingVisits, isLoading: vLoading } = useQuery({
    queryKey: ['pending-visits'],
    queryFn: () => api.get('/approvals/pending-visits').then((r) => r.data.data),
    enabled: activeTab === 'visits',
  });

  const { data: pendingExpenses, isLoading: eLoading } = useQuery({
    queryKey: ['pending-expenses'],
    queryFn: () => api.get('/approvals/pending-expenses').then((r) => r.data.data),
    enabled: activeTab === 'expenses',
  });

  const { data: pendingLeaves, isLoading: lLoading } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => api.get('/approvals/pending-leaves').then((r) => r.data.data),
    enabled: activeTab === 'leaves',
  });

  const { data: pendingTourPlans, isLoading: tLoading } = useQuery({
    queryKey: ['pending-tourplans'],
    queryFn: () => api.get('/approvals/pending-tourplans').then((r) => r.data.data),
    enabled: activeTab === 'tourplans',
  });

  const approveVisitMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/visits/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-visits'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-expenses'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/reject`, { reason: 'Rejected by manager' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-expenses'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-leaves'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-leaves'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const approveTourPlanMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tour-plans/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-tourplans'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
  });

  const TABS = [
    { key: 'visits' as TabKey, label: 'Visits', count: summary?.pendingVisits, icon: ClipboardCheck },
    { key: 'expenses' as TabKey, label: 'Expenses', count: summary?.pendingExpenses, icon: DollarSign },
    { key: 'leaves' as TabKey, label: 'Leaves', count: summary?.pendingLeaves, icon: Calendar },
    { key: 'tourplans' as TabKey, label: 'Tour Plans', count: summary?.pendingTourPlans, icon: Map },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" /> Approval Queue
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve team submissions</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-bold text-amber-700">{summary?.total || 0} pending</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${activeTab === key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-200'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${activeTab === key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Visits */}
      {activeTab === 'visits' && (
        <div className="space-y-3">
          {vLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : pendingVisits?.length === 0 ? (
            <EmptyState label="No pending visit approvals" icon={<ClipboardCheck className="w-8 h-8" />} />
          ) : pendingVisits?.map((v: any) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{v.user?.firstName[0]}{v.user?.lastName[0]}</div>
                    <p className="font-semibold text-gray-900 text-sm">{v.user?.firstName} {v.user?.lastName}</p>
                    <span className="text-xs text-gray-400">{v.user?.role}</span>
                  </div>
                  <p className="text-sm text-gray-700">Visit to <span className="font-medium">{v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : v.retailer?.name || v.distributor?.name || 'Unknown'}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(v.checkInTime || v.plannedDate)}{v.visitType && ` · ${v.visitType}`}</p>
                  {v.visitNotes && <p className="text-xs text-gray-500 mt-1 italic">"{v.visitNotes}"</p>}
                </div>
                <button
                  onClick={() => approveVisitMutation.mutate(v.id)}
                  disabled={approveVisitMutation.isPending}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {eLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : pendingExpenses?.length === 0 ? (
            <EmptyState label="No pending expense approvals" icon={<DollarSign className="w-8 h-8" />} />
          ) : pendingExpenses?.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{e.user?.firstName} {e.user?.lastName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-medium">{e.expenseType}</span>
                </div>
                <p className="text-sm text-gray-700 font-bold text-emerald-700">{formatCurrency(e.amount)}</p>
                <p className="text-xs text-gray-400">{formatDate(e.expenseDate)}{e.description ? ` · ${e.description}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => rejectExpenseMutation.mutate(e.id)} disabled={rejectExpenseMutation.isPending} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => approveExpenseMutation.mutate(e.id)} disabled={approveExpenseMutation.isPending} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaves */}
      {activeTab === 'leaves' && (
        <div className="space-y-3">
          {lLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : pendingLeaves?.length === 0 ? (
            <EmptyState label="No pending leave requests" icon={<Calendar className="w-8 h-8" />} />
          ) : pendingLeaves?.map((l: any) => {
            const days = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{l.user?.firstName} {l.user?.lastName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-medium capitalize">{l.leaveType} Leave</span>
                    <span className="text-xs font-bold text-gray-700">{days} day{days !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(l.startDate)} → {formatDate(l.endDate)}</p>
                  {l.reason && <p className="text-xs text-gray-400 mt-0.5 italic">"{l.reason}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => rejectLeaveMutation.mutate(l.id)} disabled={rejectLeaveMutation.isPending} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => approveLeaveMutation.mutate(l.id)} disabled={approveLeaveMutation.isPending} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tour Plans */}
      {activeTab === 'tourplans' && (
        <div className="space-y-3">
          {tLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : pendingTourPlans?.length === 0 ? (
            <EmptyState label="No pending tour plan approvals" icon={<Map className="w-8 h-8" />} />
          ) : pendingTourPlans?.map((t: any) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{t.user?.firstName} {t.user?.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(t.planDate)}{t.notes ? ` · ${t.notes}` : ''}</p>
              </div>
              <button onClick={() => approveTourPlanMutation.mutate(t.id)} disabled={approveTourPlanMutation.isPending} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-gray-300">
      {icon}
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xs text-emerald-500 font-medium">All caught up! ✓</p>
    </div>
  );
}
