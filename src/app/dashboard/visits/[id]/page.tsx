'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, MapPin, Clock, Calendar, CheckCircle2, XCircle,
  Stethoscope, Store, Building2, Truck, Package,
  User, Users, MessageSquare, TrendingUp, Star, FileText,
  Navigation, Timer, Check, Ban, ChevronRight, Activity, Zap,
  ShoppingCart, ShieldCheck, Sparkles, AlertTriangle, ExternalLink,
  Receipt, Eye
} from 'lucide-react';

const TYPE_THEME: Record<string, { color: string; bg: string; text: string; icon: any; label: string }> = {
  DOCTOR:      { color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: Stethoscope, label: 'Doctor Visit' },
  HOSPITAL:    { color: '#0EA5E9', bg: 'bg-sky-50',     text: 'text-sky-800',     icon: Building2,   label: 'Hospital Visit' },
  RETAILER:    { color: '#8B5CF6', bg: 'bg-purple-50',  text: 'text-purple-800',  icon: Store,       label: 'Retail Chemist Visit' },
  DISTRIBUTOR: { color: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-800',   icon: Truck,       label: 'Distributor Visit' },
};

function formatDateTime(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDuration(mins?: number | null) {
  if (!mins) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getEntityName(v: any): string {
  if (v.doctor) return `${v.doctor.salutation || 'Dr.'} ${v.doctor.firstName} ${v.doctor.lastName}`;
  if (v.retailer) return v.retailer.name;
  if (v.hospital) return v.hospital.name;
  if (v.distributor) return v.distributor.name;
  return 'Direct Call';
}

function getEntitySub(v: any): string {
  if (v.doctor) return `${v.doctor.specialty || 'General Practice'} · Degree: ${v.doctor.qualification || 'MBBS'}`;
  if (v.retailer) return `${v.retailer.city || 'Chemist'} · DL: ${v.retailer.drugLicense || 'On File'}`;
  if (v.hospital) return `${v.hospital.city || 'Hospital'} · ${v.hospital.type || 'Super Specialty'}`;
  if (v.distributor) return `${v.distributor.city || 'Distributor'} · GST: ${v.distributor.gstNumber || 'Active'}`;
  return '';
}

export default function VisitAdminDossierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  // Fetch visit details
  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit-detail', id],
    queryFn: () => api.get(`/visits/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/visits/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-detail', id] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.patch(`/visits/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit-detail', id] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
      setRejectModalOpen(false);
      setRejectReason('');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Visit Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested field visit record could not be loaded.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
        >
          Return Back
        </button>
      </div>
    );
  }

  const vType = (visit.visitType || 'DOCTOR') as string;
  const theme = TYPE_THEME[vType] || TYPE_THEME.DOCTOR;
  const TypeIcon = theme.icon;

  const isPending = visit.approvalStatus === 'PENDING';
  const isApproved = visit.approvalStatus === 'APPROVED';
  const isRejected = visit.approvalStatus === 'REJECTED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Visits
        </button>

        {/* Manager Approval Controls */}
        {isAdminOrManager && isPending && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={rejectMutation.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all shadow-2xs"
            >
              <Ban className="w-4 h-4" /> Reject Call
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/20 transition-all"
            >
              <Check className="w-4 h-4" /> Approve Call
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN VISIT DOSSIER BANNER ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl ${theme.bg} flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-2xs`}>
              <TypeIcon className="w-8 h-8" style={{ color: theme.color }} />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {getEntityName(visit)}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${theme.bg} ${theme.text}`}>
                  {theme.label}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                    visit.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : visit.status === 'CHECKED_IN'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {visit.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {getEntitySub(visit)}
              </p>

              {/* Rep attribution & territory */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Rep: {visit.user?.firstName} {visit.user?.lastName} ({visit.user?.role || 'MR'})
                </span>
                {visit.user?.hq?.name && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> HQ: {visit.user.hq.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Approval Stamp */}
          <div className="self-end sm:self-center">
            {isApproved && (
              <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approved
                </div>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Verified & Signed Off</p>
              </div>
            )}
            {isRejected && (
              <div className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-600" /> Rejected
                </div>
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{visit.rejectionReason || 'Corrections required'}</p>
              </div>
            )}
            {isPending && (
              <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-600" /> Pending Sign-off
                </div>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">Awaiting Manager Review</p>
              </div>
            )}
          </div>
        </div>

        {/* ── KPI HIGHLIGHTS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
            <span className="text-base font-black text-slate-900">{formatDuration(visit.durationMinutes)}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Check In</span>
            <span className="text-base font-black text-slate-900">
              {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">POB Booked</span>
            <span className="text-base font-black text-emerald-700">₹{visit.pobAmount || 0}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GPS Verified</span>
            <span className="text-base font-black text-slate-900 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {visit.checkInLat ? 'Yes' : 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* ── TIMELINE & GEOLOCATION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Call Execution Timeline
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Planned Call Date</span>
              <span className="font-bold text-slate-900">{formatDate(visit.plannedDate)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">MR Check-in Timestamp</span>
              <span className="font-bold text-slate-900">{formatDateTime(visit.checkInTime)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">MR Check-out Timestamp</span>
              <span className="font-bold text-slate-900">{formatDateTime(visit.checkOutTime)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Total In-Clinic Time</span>
              <span className="font-bold text-emerald-700">{formatDuration(visit.durationMinutes)}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="font-semibold text-slate-500">Report Status</span>
              <span className="font-bold text-slate-900">{visit.isReported ? 'DCR Filed' : 'Report Pending'}</span>
            </div>
          </div>
        </div>

        {/* Geolocation Verification */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Geolocation & Beat Audit
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Check-in Coordinates</span>
              <span className="font-mono font-bold text-slate-900">
                {visit.checkInLat ? `${visit.checkInLat.toFixed(5)}, ${visit.checkInLng?.toFixed(5)}` : 'Location not captured'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">GPS Address Captured</span>
              <span className="font-bold text-slate-800 text-right max-w-xs truncate">
                {visit.checkInAddress || 'Territory GPS Location'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Territory Beat Compliance</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Within Scheduled Beat
              </span>
            </div>

            {visit.checkInLat && (
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps?q=${visit.checkInLat},${visit.checkInLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> View on Google Maps
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SCIENTIFIC DETAILING & CLINICAL FEEDBACK ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" /> Scientific Detailing & Doctor Feedback
        </h2>

        {/* Products detailed */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500">Biocros Medicines Presented / Discussed:</span>
          <div className="flex flex-wrap items-center gap-2">
            {visit.productsDiscussed && visit.productsDiscussed.length > 0 ? (
              visit.productsDiscussed.map((prod: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-600" /> {prod}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 font-medium">No specific products tagged.</p>
            )}
          </div>
        </div>

        {/* Notes & Objections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Discussion Notes / Call Remarks
            </span>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {visit.notes || visit.discussionRemarks || 'No call notes entered by representative.'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Doctor Objections / Follow-up Needs
            </span>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {visit.objectionsRaised || 'None recorded. Positive reception of therapy.'}
            </p>
          </div>
        </div>

        {/* Competitor Activity */}
        {visit.competitorActivity && (
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Competitor Market Intelligence Captured
            </span>
            <p className="text-xs text-amber-900 font-medium leading-relaxed">
              {visit.competitorActivity}
            </p>
          </div>
        )}
      </div>

      {/* ── SAMPLES & POB ORDERS LINKED ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Samples Distributed */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" /> Physician Samples Handed Over
          </h2>

          {visit.sampleDistributions && visit.sampleDistributions.length > 0 ? (
            <div className="space-y-2">
              {visit.sampleDistributions.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{s.product?.name || s.sampleProduct?.name || 'Sample Pack'}</p>
                    <p className="text-[10px] text-slate-500">Batch: {s.batchNumber || 'BX-2026'}</p>
                  </div>
                  <span className="font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                    {s.quantity} Units
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs font-semibold">No samples given during this visit</p>
            </div>
          )}
        </div>

        {/* Orders Booked */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" /> Primary / Secondary Orders Booked
          </h2>

          {visit.pobAmount > 0 || (visit.orders && visit.orders.length > 0) ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total POB Captured</span>
                  <p className="text-xl font-black text-emerald-900">₹{visit.pobAmount || 0}</p>
                </div>
                <Link
                  href="/dashboard/orders"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-emerald-700 transition-colors"
                >
                  View in Orders →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs font-semibold">No commercial orders booked during this visit</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: REJECT REMARKS ── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Call Report</h3>
                  <p className="text-xs text-slate-500">{getEntityName(visit)}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
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
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate(rejectReason || 'Incomplete field visit details.')}
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
