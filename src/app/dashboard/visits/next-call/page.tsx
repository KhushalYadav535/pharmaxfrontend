'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle2, MapPin, Clock, Stethoscope, Store,
  Building2, Truck, ChevronRight, Calendar, Sparkles, Flag,
  Plus, MessageSquare, Target, Package, ArrowRight,
  User, Check, X, AlertTriangle, CalendarClock, RotateCcw,
  Presentation, Phone, Navigation, ArrowLeft, Play, AlertCircle
} from 'lucide-react';

const VISIT_TYPE_ICONS: Record<string, any> = {
  DOCTOR: Stethoscope,
  HOSPITAL: Building2,
  RETAILER: Store,
  DISTRIBUTOR: Truck,
  STOCKIST: Truck,
};

const VISIT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DOCTOR: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  HOSPITAL: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  RETAILER: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  DISTRIBUTOR: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  STOCKIST: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const RESCHEDULE_TIME_PRESETS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

const RESCHEDULE_REASONS = [
  'Doctor requested visit later today',
  'Doctor in surgery / emergency case',
  'Clinic closed during morning hours',
  'Doctor called out of station',
  'Patient rush - doctor requested evening follow-up',
  'Territory traffic delay / rerouted'
];

const CANCEL_REASONS = [
  'Doctor unavailable / on leave',
  'Clinic closed today',
  'Emergency surgical duty',
  'Time constraint / end of shift',
  'Excessive patient queue',
  'MR health indisposition'
];

function getVisitDisplayName(v: any): string {
  if (!v) return '';
  if (v.visitType === 'DOCTOR') {
    const sal = v.doctor?.salutation || 'Dr.';
    return `${sal} ${v.doctor?.firstName || ''} ${v.doctor?.lastName || ''}`.trim() || 'Physician';
  }
  return v.retailer?.name || v.hospital?.name || v.distributor?.name || 'Field Account';
}

function getVisitDisplaySub(v: any): string {
  if (!v) return '';
  if (v.visitType === 'DOCTOR') {
    return v.doctor?.specialty || v.doctor?.specialization || 'General Practice';
  }
  return v.retailer?.city || v.hospital?.city || v.distributor?.city || (v.visitType ? v.visitType.charAt(0) + v.visitType.slice(1).toLowerCase() : 'Account');
}

function formatVisitTime(d: Date | string | null | undefined): string {
  if (!d) return '--:--';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (!date || isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function NextCallConsolePage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [rescheduleTime, setRescheduleTime] = useState('05:00 PM');
  const [rescheduleReason, setRescheduleReason] = useState(RESCHEDULE_REASONS[0]);
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  // Cancel / Missed state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNotes, setCancelNotes] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  // Fetch today's visits
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['today-visits', today],
    queryFn: () =>
      api
        .get('/visits', { params: { limit: 50, fromDate: today, toDate: today } })
        .then((r) =>
          ((r.data.data.visits as any[]) || []).sort((a, b) => {
            const timeA = new Date(a.checkInTime || a.plannedDate || a.createdAt).getTime();
            const timeB = new Date(b.checkInTime || b.plannedDate || b.createdAt).getTime();
            return timeA - timeB;
          })
        ),
  });

  // Check In Mutation
  const checkInMutation = useMutation({
    mutationFn: ({ id, lat, lng }: { id: string; lat: number; lng: number }) =>
      api.patch(`/visits/${id}/check-in`, { lat, lng, address: 'Live field GPS' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-visits'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  // Reschedule Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate, reason }: { id: string; newDate: string; reason: string }) => {
      return api.patch(`/visits/${id}/reschedule`, { newDate, reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-visits'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      setRescheduleModalOpen(false);
      setRescheduleTarget(null);
    },
  });

  // Cancel / Missed Mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.patch(`/visits/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-visits'] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      setCancelModalOpen(false);
      setCancelTarget(null);
    },
  });

  const handleTriggerCheckIn = (v: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => checkInMutation.mutate({ id: v.id, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => checkInMutation.mutate({ id: v.id, lat: 19.076, lng: 72.877 })
      );
    } else {
      checkInMutation.mutate({ id: v.id, lat: 19.076, lng: 72.877 });
    }
  };

  const handleOpenReschedule = (v: any) => {
    setRescheduleTarget(v);
    setRescheduleDate(today);
    setRescheduleTime('05:00 PM');
    setRescheduleReason(RESCHEDULE_REASONS[0]);
    setRescheduleNotes('');
    setRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget) return;
    const combinedReason = rescheduleNotes ? `${rescheduleReason} - ${rescheduleNotes}` : rescheduleReason;
    rescheduleMutation.mutate({
      id: rescheduleTarget.id,
      newDate: `${rescheduleDate}T${rescheduleTime}`,
      reason: combinedReason,
    });
  };

  const handleOpenCancel = (v: any) => {
    setCancelTarget(v);
    setCancelReason(CANCEL_REASONS[0]);
    setCancelNotes('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    const combinedReason = cancelNotes ? `${cancelReason} - ${cancelNotes}` : cancelReason;
    cancelMutation.mutate({
      id: cancelTarget.id,
      reason: combinedReason,
    });
  };

  // Filtered visits
  const filteredVisits = useMemo(() => {
    if (filterType === 'ALL') return visits;
    return visits.filter((v: any) => (v.visitType || '').toUpperCase() === filterType);
  }, [visits, filterType]);

  // Next call candidate: the first planned or checked-in call
  const activeCall = useMemo(() => {
    return visits.find((v: any) => v.status === 'CHECKED_IN') ||
           visits.find((v: any) => v.status === 'PLANNED') ||
           null;
  }, [visits]);

  // Statistics
  const stats = useMemo(() => {
    const total = visits.length;
    const completed = visits.filter((v: any) => v.status === 'COMPLETED').length;
    const checkedIn = visits.filter((v: any) => v.status === 'CHECKED_IN').length;
    const planned = visits.filter((v: any) => v.status === 'PLANNED').length;
    const cancelled = visits.filter((v: any) => ['CANCELLED', 'MISSED'].includes(v.status)).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, checkedIn, planned, cancelled, pct };
  }, [visits]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/visits"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Smart Call Console</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Active Itinerary
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live sequential field call dispatch, GPS check-in & instant detailing launcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits/plan-new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Batch Day Planner
          </Link>
          <Link
            href="/dashboard/visits/unplanned"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Unplanned Call
          </Link>
        </div>
      </div>

      {/* ── KPI PROGRESS DECK ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" className="text-slate-100" fill="transparent" />
              <circle
                cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4"
                className="text-emerald-500 transition-all duration-500"
                fill="transparent"
                strokeDasharray={113.1}
                strokeDashoffset={113.1 - (113.1 * stats.pct) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-800">{stats.pct}%</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completion</div>
            <div className="text-lg font-black text-slate-900">{stats.completed} / {stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Planned Today</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Scheduled in tour route</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed Calls</div>
          <div className="text-xl font-black text-emerald-700 mt-1">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5 font-medium">Detailing & reporting done</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">In Progress</div>
          <div className="text-xl font-black text-amber-700 mt-1">{stats.checkedIn}</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5 font-medium">Checked-in on field</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining</div>
          <div className="text-xl font-black text-slate-800 mt-1">{stats.planned}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">To be visited today</div>
        </div>
      </div>

      {/* ── HERO NEXT-CALL SPOTLIGHT ── */}
      {activeCall ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  Up Next · Action Required
                </span>
                <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Planned: {formatVisitTime(activeCall.plannedDate)}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {getVisitDisplayName(activeCall)}
                </h2>
                <p className="text-sm text-emerald-300 font-semibold mt-0.5">
                  {getVisitDisplaySub(activeCall)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                {activeCall.doctor?.clinicAddress && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {activeCall.doctor.clinicAddress}
                  </span>
                )}
                {activeCall.doctor?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    {activeCall.doctor.phone}
                  </span>
                )}
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 font-medium text-[11px]">
                  Status: {activeCall.status}
                </span>
              </div>
            </div>

            {/* Quick Actions for Next Call */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[200px]">
              {activeCall.status === 'PLANNED' ? (
                <button
                  onClick={() => handleTriggerCheckIn(activeCall)}
                  disabled={checkInMutation.isPending}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-lg active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  GPS Check-In & Start
                </button>
              ) : (
                <Link
                  href={`/dashboard/visits/${activeCall.id}`}
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  Complete Call Report
                </Link>
              )}

              {activeCall.visitType === 'DOCTOR' && activeCall.doctorId && (
                <Link
                  href={`/dashboard/digital-detailing?doctorId=${activeCall.doctorId}&visitId=${activeCall.id}`}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all"
                >
                  <Presentation className="w-4 h-4 text-emerald-400" />
                  Launch Detailing Deck
                </Link>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenReschedule(activeCall)}
                  className="flex-1 text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleOpenCancel(activeCall)}
                  className="flex-1 text-center py-2 px-3 bg-rose-950/40 hover:bg-rose-950 text-rose-300 text-[11px] font-bold rounded-xl border border-rose-900/60 transition-colors"
                >
                  Cancel / Missed
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">All Scheduled Calls Completed!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            You have executed all planned visits for today. If you need to make an unscheduled doctor or pharmacy call, use the Unplanned Call launcher.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard/visits/unplanned"
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm"
            >
              Add Unplanned Visit
            </Link>
            <Link
              href="/dashboard/visits"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
            >
              Back to Visits List
            </Link>
          </div>
        </div>
      )}

      {/* ── QUEUE FILTER TABS ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          {['ALL', 'DOCTOR', 'HOSPITAL', 'RETAILER', 'DISTRIBUTOR'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === t
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t === 'ALL' ? 'All Calls' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredVisits.length} of {visits.length} scheduled today
        </span>
      </div>

      {/* ── TODAYS QUEUE LIST ── */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No visits match this filter</h3>
            <p className="text-xs text-slate-500">Select another filter tab or add visits via the batch planner.</p>
          </div>
        ) : (
          filteredVisits.map((v: any, idx: number) => {
            const vType = (v.visitType || 'DOCTOR').toUpperCase();
            const IconComp = VISIT_TYPE_ICONS[vType] || Stethoscope;
            const styleTheme = VISIT_TYPE_COLORS[vType] || VISIT_TYPE_COLORS.DOCTOR;
            const isDone = v.status === 'COMPLETED';
            const isActive = v.status === 'CHECKED_IN';
            const isMissed = ['CANCELLED', 'MISSED'].includes(v.status);

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-100'
                    : isDone
                    ? 'border-slate-200 opacity-85'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase">#{idx + 1}</span>
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mt-1 border ${styleTheme.bg} ${styleTheme.border}`}>
                      <IconComp className={`w-5 h-5 ${styleTheme.text}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">
                        {getVisitDisplayName(v)}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${styleTheme.bg} ${styleTheme.text}`}>
                        {vType}
                      </span>
                      {v.isUnplanned && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Unplanned
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      {getVisitDisplaySub(v)}
                      {v.doctor?.clinicAddress && ` · ${v.doctor.clinicAddress}`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatVisitTime(v.plannedDate)}
                      </span>
                      {v.checkInTime && (
                        <span className="text-emerald-600 font-bold">
                          Checked-in: {formatVisitTime(v.checkInTime)}
                        </span>
                      )}
                      {v.checkOutTime && (
                        <span className="text-slate-500">
                          Checked-out: {formatVisitTime(v.checkOutTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Completed
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 animate-pulse">
                      In Progress
                    </span>
                  ) : isMissed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
                      {v.status}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">
                      Planned
                    </span>
                  )}

                  {/* Detailing Link */}
                  {vType === 'DOCTOR' && v.doctorId && (
                    <Link
                      href={`/dashboard/digital-detailing?doctorId=${v.doctorId}&visitId=${v.id}`}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                    >
                      Detailing
                    </Link>
                  )}

                  {/* Check in / detail button */}
                  {v.status === 'PLANNED' && (
                    <button
                      onClick={() => handleTriggerCheckIn(v)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                    >
                      Check In
                    </button>
                  )}

                  {/* Reschedule Button */}
                  {v.status === 'PLANNED' && (
                    <button
                      onClick={() => handleOpenReschedule(v)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Reschedule"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dossier Link */}
                  <Link
                    href={`/dashboard/visits/${v.id}`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    title="View Full Visit Dossier"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── RESCHEDULE MODAL ── */}
      {rescheduleModalOpen && rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">Reschedule Field Call</h3>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Target Account</span>
              <p className="text-sm font-black text-slate-900">{getVisitDisplayName(rescheduleTarget)}</p>
              <p className="text-xs text-slate-500">{getVisitDisplaySub(rescheduleTarget)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">New Appointment Slot</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {RESCHEDULE_TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRescheduleTime(t)}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all ${
                        rescheduleTime === t
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Rescheduling</label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {RESCHEDULE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="Doctor confirmed availability at this hour..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={rescheduleMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCEL / MISSED MODAL ── */}
      {cancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-black text-slate-900">Mark Visit Cancelled / Missed</h3>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Target Account</span>
              <p className="text-sm font-black text-slate-900">{getVisitDisplayName(cancelTarget)}</p>
              <p className="text-xs text-slate-500">{getVisitDisplaySub(cancelTarget)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Non-Execution</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supervisor Remarks</label>
                <textarea
                  rows={3}
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Additional context on why visit was missed..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {cancelMutation.isPending ? 'Recording...' : 'Record as Missed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
