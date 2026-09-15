'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  DollarSign,
  Calendar,
  Map,
  RefreshCw,
  Eye,
  ShoppingCart,
  Building,
  UserCheck,
  Package,
  AlertCircle,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCheck
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useState } from 'react';

type TabKey = 'visits' | 'expenses' | 'tourplans' | 'leaves' | 'orders' | 'entities';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('visits');
  const [viewingEntity, setViewingEntity] = useState<{ id: string; type: string } | null>(null);
  const [rejectingItem, setRejectingItem] = useState<{ id: string; type: TabKey; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Summary counts
  const { data: summary, isLoading: sumLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: () => api.get('/approvals/summary').then((r) => r.data.data),
    refetchInterval: 15000,
  });

  // Tab data queries
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

  const { data: pendingTourPlans, isLoading: tLoading } = useQuery({
    queryKey: ['pending-tourplans'],
    queryFn: () => api.get('/approvals/pending-tourplans').then((r) => r.data.data),
    enabled: activeTab === 'tourplans',
  });

  const { data: pendingLeaves, isLoading: lLoading } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => api.get('/approvals/pending-leaves').then((r) => r.data.data),
    enabled: activeTab === 'leaves',
  });

  const { data: pendingOrdersData, isLoading: oLoading } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: () => api.get('/orders', { params: { status: 'PENDING', limit: 50 } }).then((r) => r.data.data),
    enabled: activeTab === 'orders',
  });

  const pendingOrders = pendingOrdersData?.orders || [];

  const { data: pendingEntities, isLoading: entLoading } = useQuery({
    queryKey: ['pending-entities'],
    queryFn: () => api.get('/approvals/pending-entities').then((r) => r.data.data),
    enabled: activeTab === 'entities',
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['approvals-summary'] });
    qc.invalidateQueries({ queryKey: ['pending-visits'] });
    qc.invalidateQueries({ queryKey: ['pending-expenses'] });
    qc.invalidateQueries({ queryKey: ['pending-tourplans'] });
    qc.invalidateQueries({ queryKey: ['pending-leaves'] });
    qc.invalidateQueries({ queryKey: ['pending-orders'] });
    qc.invalidateQueries({ queryKey: ['pending-entities'] });
  };

  // Mutations
  const approveVisitMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/visits/${id}/approve`),
    onSuccess: invalidateAll,
  });

  const rejectVisitMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.patch(`/visits/${id}/reject`, { reason }),
    onSuccess: invalidateAll,
  });

  // Expense: uses PATCH /expenses/:id/status
  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/status`, { status: 'APPROVED' }),
    onSuccess: invalidateAll,
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/expenses/${id}/status`, { status: 'REJECTED', reason }),
    onSuccess: invalidateAll,
  });

  // Tour Plan: uses PATCH /approvals/tourplans/:id/approve
  const approveTourPlanMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/approvals/tourplans/${id}/approve`),
    onSuccess: invalidateAll,
  });

  const rejectTourPlanMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/approvals/tourplans/${id}/reject`, { reason }),
    onSuccess: invalidateAll,
  });

  // Leaves
  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/leaves/${id}/approve`),
    onSuccess: invalidateAll,
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/leaves/${id}/reject`, { reason }),
    onSuccess: invalidateAll,
  });

  // Orders: uses PATCH /orders/:id/status
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: invalidateAll,
  });

  // Entities: uses POST /approvals/entities/:type/:id
  const updateEntityMutation = useMutation({
    mutationFn: ({ type, id, status }: { type: string; id: string; status: string }) =>
      api.post(`/approvals/entities/${type}/${id}`, { status }),
    onSuccess: invalidateAll,
  });

  // Rejection handler
  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    const { id, type } = rejectingItem;
    const reason = rejectionReason.trim() || 'Rejected by administrator';

    if (type === 'expenses') {
      rejectExpenseMutation.mutate({ id, reason });
    } else if (type === 'visits') {
      rejectVisitMutation.mutate({ id, reason });
    } else if (type === 'tourplans') {
      rejectTourPlanMutation.mutate({ id, reason });
    } else if (type === 'leaves') {
      rejectLeaveMutation.mutate({ id, reason });
    } else if (type === 'orders') {
      updateOrderStatusMutation.mutate({ id, status: 'CANCELLED' });
    }

    setRejectingItem(null);
    setRejectionReason('');
  };

  const TABS = [
    { key: 'visits' as TabKey, label: 'Visits', count: summary?.pendingVisits || 0, icon: ClipboardCheck, color: 'text-blue-600 bg-blue-50' },
    { key: 'expenses' as TabKey, label: 'Expenses', count: summary?.pendingExpenses || 0, icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
    { key: 'tourplans' as TabKey, label: 'Tour Plans', count: summary?.pendingTourPlans || 0, icon: Map, color: 'text-purple-600 bg-purple-50' },
    { key: 'leaves' as TabKey, label: 'Leaves', count: summary?.pendingLeaves || 0, icon: Calendar, color: 'text-rose-600 bg-rose-50' },
    { key: 'orders' as TabKey, label: 'Orders', count: summary?.pendingOrders || pendingOrders.length || 0, icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'entities' as TabKey, label: 'New Master Records', count: summary?.pendingEntities || pendingEntities?.length || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
            <UserCheck className="w-3.5 h-3.5" /> Operations Command Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Approvals & Audit Hub</h1>
          <p className="text-slate-300 text-sm mt-1">
            Review, audit, verify, and approve field activities, team claims, tour programs, orders, and newly registered doctors/entities.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => { refetchSummary(); invalidateAll(); }}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="Refresh All Queues"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-amber-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            <span className="text-sm font-bold tracking-wide">
              {summary?.total || 0} Pending Actions
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {TABS.map(({ key, label, count, icon: Icon, color }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearchQuery(''); }}
              className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {count > 0 && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
              <span className="text-base font-bold mt-0.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Filter Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing real-time pending approvals synced with Biocros ERP database.
        </div>
      </div>

      {/* ──────────────── TAB 1: VISITS ──────────────── */}
      {activeTab === 'visits' && (
        <div className="space-y-3">
          {vLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingVisits?.length === 0 ? (
            <EmptyState label="No pending field visit approvals" icon={<ClipboardCheck className="w-8 h-8" />} />
          ) : (
            pendingVisits
              ?.filter((v: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const userName = `${v.user?.firstName || ''} ${v.user?.lastName || ''}`.toLowerCase();
                const docName = `${v.doctor?.firstName || ''} ${v.doctor?.lastName || ''}`.toLowerCase();
                const clientName = (v.retailer?.name || v.distributor?.name || '').toLowerCase();
                return userName.includes(q) || docName.includes(q) || clientName.includes(q);
              })
              ?.map((v: any) => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-emerald-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                          {v.user?.firstName?.[0] || 'U'}{v.user?.lastName?.[0] || 'R'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {v.user?.firstName} {v.user?.lastName}
                          </p>
                          <span className="text-xs text-slate-400 font-medium">{v.user?.role || 'Medical Representative'}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Visit Target:{' '}
                          <span className="font-bold text-emerald-800">
                            {v.doctor
                              ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName} (${v.doctor.specialty || 'General'})`
                              : v.retailer?.name
                              ? `Chemist: ${v.retailer.name}`
                              : v.distributor?.name
                              ? `Distributor: ${v.distributor.name}`
                              : 'General Visit'}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(v.checkInTime || v.plannedDate)}
                          </span>
                          {v.visitType && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                              {v.visitType}
                            </span>
                          )}
                          {v.pobAmount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                              POB: {formatCurrency(v.pobAmount)}
                            </span>
                          )}
                        </div>
                        {v.visitNotes && (
                          <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                            "{v.visitNotes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() =>
                          setRejectingItem({
                            id: v.id,
                            type: 'visits',
                            title: `Visit by ${v.user?.firstName} to ${v.doctor?.firstName || v.retailer?.name || 'Customer'}`,
                          })
                        }
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-rose-200"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => approveVisitMutation.mutate(v.id)}
                        disabled={approveVisitMutation.isPending}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Visit
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: EXPENSES ──────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {eLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingExpenses?.length === 0 ? (
            <EmptyState label="No pending expense reimbursement claims" icon={<DollarSign className="w-8 h-8" />} />
          ) : (
            pendingExpenses
              ?.filter((e: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const userName = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.toLowerCase();
                const desc = (e.description || '').toLowerCase();
                const type = (e.expenseType || '').toLowerCase();
                return userName.includes(q) || desc.includes(q) || type.includes(q);
              })
              ?.map((e: any) => (
                <div key={e.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-amber-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {e.user?.firstName} {e.user?.lastName}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200/70">
                          {e.expenseType}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-emerald-700">
                          {formatCurrency(e.amount)}
                        </span>
                        <span className="text-xs text-slate-400">on {formatDate(e.expenseDate)}</span>
                      </div>
                      {e.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {e.description}
                        </p>
                      )}
                      {e.receiptUrl && (
                        <a
                          href={e.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline mt-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Attached Bill / Receipt
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() =>
                          setRejectingItem({
                            id: e.id,
                            type: 'expenses',
                            title: `Expense of ${formatCurrency(e.amount)} by ${e.user?.firstName} ${e.user?.lastName}`,
                          })
                        }
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-rose-200"
                      >
                        <XCircle className="w-4 h-4" /> Reject Claim
                      </button>
                      <button
                        onClick={() => approveExpenseMutation.mutate(e.id)}
                        disabled={approveExpenseMutation.isPending}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve {formatCurrency(e.amount)}
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ──────────────── TAB 3: TOUR PLANS ──────────────── */}
      {activeTab === 'tourplans' && (
        <div className="space-y-3">
          {tLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingTourPlans?.length === 0 ? (
            <EmptyState label="No pending monthly or weekly tour plan approvals" icon={<Map className="w-8 h-8" />} />
          ) : (
            pendingTourPlans
              ?.filter((t: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const userName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
                const hq = (t.hq?.name || '').toLowerCase();
                return userName.includes(q) || hq.includes(q);
              })
              ?.map((t: any) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-purple-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {t.user?.firstName} {t.user?.lastName}
                        </span>
                        {t.hq?.name && (
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                            HQ: {t.hq.name}
                          </span>
                        )}
                        {t.user?.employeeId && (
                          <span className="text-xs text-slate-400 font-mono">({t.user.employeeId})</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Planned Date: <span className="text-slate-900 font-bold">{formatDate(t.planDate)}</span>
                        {t.visitCount > 0 && ` · Planned Calls: ${t.visitCount}`}
                      </p>
                      {t.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{t.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() =>
                          setRejectingItem({
                            id: t.id,
                            type: 'tourplans',
                            title: `Tour Plan of ${formatDate(t.planDate)} by ${t.user?.firstName} ${t.user?.lastName}`,
                          })
                        }
                        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-rose-200"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => approveTourPlanMutation.mutate(t.id)}
                        disabled={approveTourPlanMutation.isPending}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve Plan
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ──────────────── TAB 4: LEAVES ──────────────── */}
      {activeTab === 'leaves' && (
        <div className="space-y-3">
          {lLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingLeaves?.length === 0 ? (
            <EmptyState label="No pending leave applications" icon={<Calendar className="w-8 h-8" />} />
          ) : (
            pendingLeaves
              ?.filter((l: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const userName = `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.toLowerCase();
                const reason = (l.reason || '').toLowerCase();
                return userName.includes(q) || reason.includes(q);
              })
              ?.map((l: any) => {
                const days =
                  Math.ceil(
                    (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1;
                return (
                  <div key={l.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-rose-200 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {l.user?.firstName} {l.user?.lastName}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 capitalize">
                            {l.leaveType} Leave
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {days} day{days !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-600">
                          Period: {formatDate(l.startDate)} &rarr; {formatDate(l.endDate)}
                        </p>
                        {l.reason && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            "{l.reason}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() =>
                            setRejectingItem({
                              id: l.id,
                              type: 'leaves',
                              title: `Leave request by ${l.user?.firstName} ${l.user?.lastName} (${days} days)`,
                            })
                          }
                          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-rose-200"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => approveLeaveMutation.mutate(l.id)}
                          disabled={approveLeaveMutation.isPending}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Grant Leave
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ──────────────── TAB 5: ORDERS APPROVAL ──────────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {oLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingOrders.length === 0 ? (
            <EmptyState label="No pending sales orders requiring approval" icon={<ShoppingCart className="w-8 h-8" />} />
          ) : (
            pendingOrders
              ?.filter((o: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const num = (o.orderNumber || '').toLowerCase();
                const ret = (o.retailer?.name || '').toLowerCase();
                const rep = `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.toLowerCase();
                return num.includes(q) || ret.includes(q) || rep.includes(q);
              })
              ?.map((o: any) => {
                const isExpanded = expandedOrder === o.id;
                return (
                  <div key={o.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-emerald-200 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                            {o.orderNumber || `#${o.id.slice(0, 8)}`}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                            PENDING APPROVAL
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                          <span>
                            Chemist / Retailer:{' '}
                            <strong className="text-slate-900 font-bold">
                              {o.retailer?.name || o.distributor?.name || 'Walk-in Retailer'}
                            </strong>
                          </span>
                          <span>
                            Booked By:{' '}
                            <strong className="text-slate-900">
                              {o.user?.firstName} {o.user?.lastName}
                            </strong>
                          </span>
                          <span>Date: {formatDate(o.orderDate)}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-lg font-black text-emerald-700">
                            {formatCurrency(o.totalAmount || 0)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {o.items?.length || 0} product item{(o.items?.length || 0) !== 1 ? 's' : ''}
                          </span>
                          {o.items?.length > 0 && (
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
                            >
                              {isExpanded ? (
                                <>Hide Items <ChevronUp className="w-3.5 h-3.5" /></>
                              ) : (
                                <>View Items <ChevronDown className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Expandable items breakdown */}
                        {isExpanded && o.items && (
                          <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              Order Line Items
                            </div>
                            <div className="divide-y divide-slate-200/70 text-xs">
                              {o.items.map((it: any, idx: number) => (
                                <div key={idx} className="py-1.5 flex items-center justify-between">
                                  <span className="font-medium text-slate-800">
                                    {it.product?.name || `Item ${idx + 1}`}
                                  </span>
                                  <div className="flex items-center gap-4 text-slate-600">
                                    <span>Qty: {it.quantity}</span>
                                    <span>Rate: {formatCurrency(it.unitPrice)}</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(it.totalPrice)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() =>
                            setRejectingItem({
                              id: o.id,
                              type: 'orders',
                              title: `Order ${o.orderNumber || o.id.slice(0, 8)} (${formatCurrency(o.totalAmount)})`,
                            })
                          }
                          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors border border-rose-200"
                        >
                          <XCircle className="w-4 h-4" /> Cancel Order
                        </button>
                        <button
                          onClick={() => updateOrderStatusMutation.mutate({ id: o.id, status: 'APPROVED' })}
                          disabled={updateOrderStatusMutation.isPending}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ──────────────── TAB 6: MASTER ENTITIES APPROVAL ──────────────── */}
      {activeTab === 'entities' && (
        <div className="space-y-3">
          {entLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : pendingEntities?.length === 0 ? (
            <EmptyState label="No pending master records (Doctors, Hospitals, Chemists, Stockists)" icon={<Users className="w-8 h-8" />} />
          ) : (
            pendingEntities
              ?.filter((ent: any) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const name = (ent.name || '').toLowerCase();
                const code = (ent.code || '').toLowerCase();
                const city = (ent.city || '').toLowerCase();
                const cat = (ent.category || '').toLowerCase();
                return name.includes(q) || code.includes(q) || city.includes(q) || cat.includes(q);
              })
              ?.map((ent: any) => (
                <div key={ent.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-indigo-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{ent.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {ent.type}
                        </span>
                        {ent.code && (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {ent.code}
                          </span>
                        )}
                        {ent.category && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            {ent.category}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {ent.specialty && <span>Specialty: <strong className="text-slate-700">{ent.specialty}</strong></span>}
                        {ent.qualification && <span>Qual: {ent.qualification}</span>}
                        {ent.headquarter && <span>HQ: <strong className="text-slate-800">{ent.headquarter}</strong></span>}
                        {ent.city && <span>City: {ent.city}</span>}
                        <span>Submitted: {formatDate(ent.submittedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setViewingEntity({ id: ent.id, type: ent.type })}
                        className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Profile
                      </button>
                      <button
                        onClick={() => updateEntityMutation.mutate({ type: ent.type, id: ent.id, status: 'REJECTED' })}
                        disabled={updateEntityMutation.isPending}
                        className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1 border border-rose-200"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => updateEntityMutation.mutate({ type: ent.type, id: ent.id, status: 'APPROVED' })}
                        disabled={updateEntityMutation.isPending}
                        className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve Record
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ──────────────── MODAL: REJECTION REASON ──────────────── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm Rejection</h3>
                  <p className="text-xs text-slate-500">Provide an audit note or reason</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium mb-4">
                {rejectingItem.title}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Rejection Reason (Optional / Recommended)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Bills not attached, visit outside designated territory, excess amount claimed..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6">
                <button
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL: ENTITY DETAILS ──────────────── */}
      {viewingEntity && (
        <EntityDetailsModal
          entity={viewingEntity}
          onClose={() => setViewingEntity(null)}
          onApprove={() => {
            updateEntityMutation.mutate({ type: viewingEntity.type, id: viewingEntity.id, status: 'APPROVED' });
            setViewingEntity(null);
          }}
          onReject={() => {
            updateEntityMutation.mutate({ type: viewingEntity.type, id: viewingEntity.id, status: 'REJECTED' });
            setViewingEntity(null);
          }}
          isPending={updateEntityMutation.isPending}
        />
      )}
    </div>
  );
}

function EntityDetailsModal({ entity, onClose, onApprove, onReject, isPending }: any) {
  const endpoint = `/${entity.type.toLowerCase()}s/${entity.id}`;
  const { data, isLoading } = useQuery({
    queryKey: ['entity-details', entity.type, entity.id],
    queryFn: () => api.get(endpoint).then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] h-full border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{entity.type} Verification & Audit</h3>
              <p className="text-xs text-slate-500">Review all master attributes before approving into active ERP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Fetching entity master details...</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data).map(([key, value]) => {
                if (
                  ['id', 'createdAt', 'updatedAt', 'deletedAt', 'approvalStatus', 'isActive', 'territoryId', 'areaId', 'stockistId', 'distributorId', 'cfaId', 'hospitalId'].includes(
                    key
                  )
                )
                  return null;
                if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                if (typeof value === 'object' && !Array.isArray(value)) return null;

                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                let displayValue = String(value);
                if (Array.isArray(value)) displayValue = value.join(', ');

                const isLongText = displayValue.length > 50;

                return (
                  <div key={key} className={isLongText ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {formattedKey}
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 shadow-sm min-h-[42px] flex items-center font-medium">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">Failed to load entity details</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            disabled={isPending || isLoading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 disabled:opacity-50"
          >
            Reject Record
          </button>
          <button
            onClick={onApprove}
            disabled={isPending || isLoading}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Approve Into Master
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm py-16 flex flex-col items-center justify-center gap-3 text-slate-300">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-semibold">
        <CheckCheck className="w-3.5 h-3.5" /> All caught up and verified!
      </div>
    </div>
  );
}
