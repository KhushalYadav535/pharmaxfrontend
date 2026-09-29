'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  Activity, Users, Search, Filter, CheckCircle2, XCircle,
  MapPin, Clock, Stethoscope, Store, Building2, Truck,
  ChevronRight, Calendar, Package, ShoppingCart, RefreshCw,
  UserCheck, AlertCircle, Check, Ban, Eye, Phone, ShieldCheck,
  ArrowUpRight, ArrowLeft
} from 'lucide-react';

type VisitType = 'DOCTOR' | 'RETAILER' | 'HOSPITAL' | 'DISTRIBUTOR';
type VisitStatus = 'PLANNED' | 'CHECKED_IN' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const VISIT_TYPE_CONFIG: Record<VisitType, { icon: any; color: string; bg: string; text: string; label: string }> = {
  DOCTOR:      { icon: Stethoscope, color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Doctor Call' },
  HOSPITAL:    { icon: Building2,   color: '#0284C7', bg: 'bg-sky-50',     text: 'text-sky-700',     label: 'Hospital Visit' },
  RETAILER:    { icon: Store,       color: '#7C3AED', bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Retail Chemist' },
  DISTRIBUTOR: { icon: Truck,       color: '#D97706', bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Distributor' },
};

function getEntityName(visit: any): string {
  if (visit.doctor) return `${visit.doctor.salutation || 'Dr.'} ${visit.doctor.firstName} ${visit.doctor.lastName}`;
  if (visit.retailer) return visit.retailer.name;
  if (visit.hospital) return visit.hospital.name;
  if (visit.distributor) return visit.distributor.name;
  return 'Direct Call';
}

function getEntitySub(visit: any): string {
  if (visit.doctor) return `${visit.doctor.specialty || 'General'} · ${visit.doctor.city || 'Territory'}`;
  if (visit.retailer) return `${visit.retailer.city || 'Chemist'} · ${visit.retailer.area?.name || ''}`;
  if (visit.hospital) return `${visit.hospital.city || 'Hospital'}`;
  if (visit.distributor) return `${visit.distributor.city || 'Distributor'}`;
  return '';
}

function formatDuration(mins?: number) {
  if (!mins) return null;
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function FieldOperationsMonitorPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [repFilter, setRepFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Reject modal state
  const [rejectingVisit, setRejectingVisit] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Fetch live telemetry / team visits
  const { data: visitsData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['field-monitor-visits', dateFilter, repFilter, typeFilter, statusFilter, approvalFilter],
    queryFn: () =>
      api.get('/visits', {
        params: {
          fromDate: dateFilter,
          toDate: dateFilter,
          userId: repFilter || undefined,
          visitType: typeFilter !== 'ALL' ? typeFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          approvalStatus: approvalFilter !== 'ALL' ? approvalFilter : undefined,
          limit: 150,
        },
      }).then(r => r.data?.data?.visits || []),
    refetchInterval: 15000, // Live poll every 15s
  });

  // 2. Fetch today stats
  const { data: stats } = useQuery({
    queryKey: ['visits-today-stats'],
    queryFn: () => api.get('/visits/today-stats').then(r => r.data?.data),
    refetchInterval: 30000,
  });

  // 3. Fetch team members (MRs)
  const { data: employeesData } = useQuery({
    queryKey: ['field-monitor-employees'],
    queryFn: () => api.get('/employees', { params: { limit: 200 } }).then(r => r.data?.data?.employees || []),
  });

  const reps = useMemo(() => {
    return (employeesData || []).filter((e: any) =>
      ['MR', 'TRADE_REP', 'DISTRIBUTOR_REP', 'ASM'].includes(e.role)
    );
  }, [employeesData]);

  // Mutations for 1-click Approval & Rejection
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/visits/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['field-monitor-visits'] });
      qc.invalidateQueries({ queryKey: ['visits-today-stats'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/visits/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['field-monitor-visits'] });
      qc.invalidateQueries({ queryKey: ['visits-today-stats'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
      setRejectingVisit(null);
      setRejectReason('');
    },
  });

  const handleApprove = (visit: any) => {
    approveMutation.mutate(visit.id);
  };

  const handleRejectConfirm = () => {
    if (!rejectingVisit) return;
    rejectMutation.mutate({ id: rejectingVisit.id, reason: rejectReason || 'Incomplete field visit details.' });
  };

  // Filtered in-memory search
  const filteredVisits = useMemo(() => {
    if (!visitsData) return [];
    if (!search.trim()) return visitsData;
    const q = search.toLowerCase();
    return visitsData.filter((v: any) => {
      const entity = getEntityName(v).toLowerCase();
      const rep = `${v.user?.firstName || ''} ${v.user?.lastName || ''}`.toLowerCase();
      const notes = (v.notes || '').toLowerCase();
      return entity.includes(q) || rep.includes(q) || notes.includes(q);
    });
  }, [visitsData, search]);

  // Derived counts
  const totalCalls = filteredVisits.length;
  const inProgressCalls = filteredVisits.filter((v: any) => v.status === 'CHECKED_IN').length;
  const completedCalls = filteredVisits.filter((v: any) => v.status === 'COMPLETED').length;
  const pendingApprovals = filteredVisits.filter((v: any) => v.approvalStatus === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/visits"
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Back to Visits Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Activity className="w-6 h-6 text-emerald-600 animate-pulse" /> Live Field Operations Monitor
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Realtime
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Live tracking of medical representative field calls, GPS check-ins, detailing duration, and instant manager approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Field Calendar</span>
          </Link>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Calls Monitored</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCalls}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">On selected date</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Live In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">{inProgressCalls}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Currently inside clinic / pharmacy</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Completed Calls</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{completedCalls}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">DCR reports submitted</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Pending Approval</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700">{pendingApprovals}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Awaiting manager sign-off</p>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Field Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Rep / Employee Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Field Representative
            </label>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Representatives</option>
              {reps.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName} ({r.role}) {r.hq?.name ? `- ${r.hq.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Visit Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Entity Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Types</option>
              <option value="DOCTOR">Doctor Call</option>
              <option value="RETAILER">Retail Chemist</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Call Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="CHECKED_IN">Checked In (Live)</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNED">Planned</option>
              <option value="MISSED">Missed</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Text
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Doctor, Rep, Notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── FEED LIST ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Connecting to Live Field Telemetry...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No field visits matched your criteria</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Try selecting a different date or clearing the filters above to view active field representative visits.
            </p>
          </div>
        ) : (
          filteredVisits.map((visit: any) => {
            const vType = (visit.visitType || 'DOCTOR') as VisitType;
            const typeConf = VISIT_TYPE_CONFIG[vType] || VISIT_TYPE_CONFIG.DOCTOR;
            const TypeIcon = typeConf.icon;

            const isPendingApproval = visit.approvalStatus === 'PENDING';
            const isApproved = visit.approvalStatus === 'APPROVED';
            const isRejected = visit.approvalStatus === 'REJECTED';

            const duration = formatDuration(visit.durationMinutes);

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Accent top stripe */}
                <div style={{ height: 3, backgroundColor: typeConf.color }} />

                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: MR + Entity details */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${typeConf.bg} flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-2xs`}>
                      <TypeIcon className="w-6 h-6" style={{ color: typeConf.color }} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/visits/${visit.id}`}
                          className="text-base font-black text-slate-900 hover:text-emerald-700 transition-colors"
                        >
                          {getEntityName(visit)}
                        </Link>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeConf.bg} ${typeConf.text}`}>
                          {typeConf.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            visit.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : visit.status === 'CHECKED_IN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {visit.status === 'CHECKED_IN' ? 'Live: Inside Clinic' : visit.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {getEntitySub(visit)}
                      </p>

                      {/* MR Details row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {visit.user?.firstName} {visit.user?.lastName} ({visit.user?.role || 'MR'})
                        </span>

                        {visit.checkInTime && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            In: {new Date(visit.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        )}

                        {duration && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Duration: {duration}
                          </span>
                        )}

                        {visit.checkInLat && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> GPS Verified
                          </span>
                        )}

                        {visit.pobAmount > 0 && (
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" /> POB: ₹{visit.pobAmount}
                          </span>
                        )}

                        {visit.sampleDistributions?.length > 0 && (
                          <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Package className="w-3 h-3" /> Samples: {visit.sampleDistributions.length}
                          </span>
                        )}
                      </div>

                      {/* Products Discussed / Notes */}
                      {visit.productsDiscussed?.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Products:</span>
                          {visit.productsDiscussed.map((prod: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {prod}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Approval Status & Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end">
                    {/* Approval Badge */}
                    <div className="mr-2">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                      {isPendingApproval && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Pending Sign-off
                        </span>
                      )}
                    </div>

                    {/* Quick Approve / Reject for managers */}
                    {isPendingApproval && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setRejectingVisit(visit)}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(visit)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    )}

                    {/* View Dossier Button */}
                    <Link
                      href={`/dashboard/visits/${visit.id}`}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                    >
                      <span>Full Dossier</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: REJECT VISIT REMARKS ── */}
      {rejectingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Field Call</h3>
                  <p className="text-xs text-slate-500">{getEntityName(rejectingVisit)}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingVisit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection / Correction Instructions
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Call duration too short, missed POB order entry, GPS location mismatch..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectingVisit(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
