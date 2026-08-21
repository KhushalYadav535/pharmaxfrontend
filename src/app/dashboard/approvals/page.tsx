'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ClipboardCheck, CheckCircle, XCircle, Loader2, Users, DollarSign, Calendar, Map, RefreshCw, Eye } from 'lucide-react';
import { formatDate, formatCurrency, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import { useState } from 'react';

type TabKey = 'visits' | 'expenses' | 'leaves' | 'tourplans' | 'entities';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('visits');
  const [viewingEntity, setViewingEntity] = useState<{ id: string, type: string } | null>(null);

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

  const { data: pendingEntities, isLoading: entLoading } = useQuery({
    queryKey: ['pending-entities'],
    queryFn: () => api.get('/approvals/pending-entities').then((r) => r.data.data),
    enabled: activeTab === 'entities',
  });

  const updateEntityMutation = useMutation({
    mutationFn: ({ type, id, status }: { type: string, id: string, status: string }) => api.post(`/approvals/entities/${type}/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-entities'] }); qc.invalidateQueries({ queryKey: ['approvals-summary'] }); },
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
    { key: 'entities' as TabKey, label: 'New Records', count: pendingEntities?.length || 0, icon: Users },
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

      {/* New Entities */}
      {activeTab === 'entities' && (
        <div className="space-y-3">
          {entLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
          ) : pendingEntities?.length === 0 ? (
            <EmptyState label="No pending new records to approve" icon={<Users className="w-8 h-8" />} />
          ) : pendingEntities?.map((ent: any) => (
            <div key={ent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{ent.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium">{ent.type}</span>
                </div>
                <p className="text-xs text-gray-500">Submitted {formatDate(ent.submittedAt)} {ent.city ? ` · ${ent.city}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setViewingEntity({ id: ent.id, type: ent.type })} className="text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => updateEntityMutation.mutate({ type: ent.type, id: ent.id, status: 'REJECTED' })} disabled={updateEntityMutation.isPending} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => updateEntityMutation.mutate({ type: ent.type, id: ent.id, status: 'APPROVED' })} disabled={updateEntityMutation.isPending} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingEntity && (
        <EntityDetailsModal
          entity={viewingEntity}
          onClose={() => setViewingEntity(null)}
          onApprove={() => { updateEntityMutation.mutate({ type: viewingEntity.type, id: viewingEntity.id, status: 'APPROVED' }); setViewingEntity(null); }}
          onReject={() => { updateEntityMutation.mutate({ type: viewingEntity.type, id: viewingEntity.id, status: 'REJECTED' }); setViewingEntity(null); }}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"><Users className="w-5 h-5 text-gray-500" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{entity.type} Details</h3>
              <p className="text-sm text-gray-500">Review information before approval</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading details...</p>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
              {Object.entries(data).map(([key, value]) => {
                if (['id', 'createdAt', 'updatedAt', 'deletedAt', 'approvalStatus', 'isActive', 'territoryId', 'areaId', 'stockistId', 'distributorId', 'cfaId', 'hospitalId'].includes(key)) return null;
                if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
                if (typeof value === 'object' && !Array.isArray(value)) return null;
                
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                let displayValue = String(value);
                if (Array.isArray(value)) displayValue = value.join(', ');
                
                const isLongText = displayValue.length > 60;
                
                return (
                  <div key={key} className={isLongText ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{formattedKey}</p>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 text-sm text-gray-800 shadow-sm min-h-[46px] flex items-center">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">Failed to load details</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onReject} disabled={isPending || isLoading} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 transition-colors disabled:opacity-50">Reject</button>
          <button onClick={onApprove} disabled={isPending || isLoading} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Approve Record
          </button>
        </div>
      </div>
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
