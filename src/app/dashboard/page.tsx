'use client';

import { useState } from 'react';
import {
  Target, CheckCircle, Clock, MapPin, Navigation2, Phone,
  ChevronRight, Bell, ShoppingCart, Package,
  Calendar, Wifi, Battery, Flag, Car, Activity,
  FlaskConical, DollarSign, Plane, Star, MoreHorizontal,
  Stethoscope, Building2, Store, Truck, Zap,
  AlertCircle, ArrowUpRight, CheckCircle2, SlidersHorizontal,
  Users, Layers, RefreshCw, ShieldCheck, TrendingUp, Sparkles,
  BarChart3, Eye, ArrowRight, Check, MessageCircle, Copy, Share2, X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  useVisitStats,
  useDoctorStats,
  useRecentVisits,
  useOrderStats,
} from '@/lib/dashboard.api';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

function getFormattedDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date());
}

function formatTimeOnly(d?: string | null) {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(d));
  } catch {
    return '—';
  }
}

function formatTimeAgo(d?: string | null) {
  if (!d) return '—';
  try {
    const diffMs = Date.now() - new Date(d).getTime();
    const diffMins = Math.max(0, Math.round(diffMs / 60000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ${diffMins % 60}m ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return '—';
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEODModal, setShowEODModal] = useState(false);
  const [eodNotes, setEodNotes] = useState('');
  const [copiedEOD, setCopiedEOD] = useState(false);

  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  // Live Approvals Summary
  const { data: approvalSummary, refetch: refetchApprovals } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: () => api.get('/approvals/summary').then((r) => r.data.data),
    refetchInterval: 20000,
  });

  // Live Field Rep (MR) Login & Session Telemetry
  const { data: telemetryData, refetch: refetchTelemetry } = useQuery({
    queryKey: ['live-mr-telemetry'],
    queryFn: () => api.get('/employees/live-telemetry').then((r) => r.data.data),
    refetchInterval: 15000,
    enabled: isAdminOrManager,
  });

  // Doctor stats & Headquarters
  const { data: hqList, refetch: refetchHq } = useQuery({
    queryKey: ['headquarters-overview'],
    queryFn: () => api.get('/headquarters').then((r) => r.data.data),
  });
  const headquarters = Array.isArray(hqList) ? hqList : hqList?.headquarters || [];

  const { data: doctorsOverview, refetch: refetchDoctors } = useQuery({
    queryKey: ['doctors-count-overview'],
    queryFn: () => api.get('/doctors', { params: { limit: 1 } }).then((r) => r.data.data),
  });

  const { data: visitStats, refetch: refetchVisits } = useVisitStats();
  const { data: doctorStats } = useDoctorStats();
  const { data: recentVisits, refetch: refetchRecent } = useRecentVisits();
  const { data: orderStats } = useOrderStats();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchApprovals(),
      refetchTelemetry(),
      refetchHq(),
      refetchDoctors(),
      refetchVisits(),
      refetchRecent(),
      queryClient.invalidateQueries({ queryKey: ['visit-trend'] }),
      queryClient.invalidateQueries({ queryKey: ['order-stats-dash'] }),
      queryClient.invalidateQueries({ queryKey: ['doctor-classification'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const planned = visitStats?.totalPlanned ?? 8;
  const completed = visitStats?.totalCompleted ?? 3;
  const remaining = Math.max(0, planned - completed);
  const coverageRatio = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 100;

  const pendingTotal = approvalSummary?.total || 0;

  return (
    <div className="min-h-full bg-slate-50/70 space-y-6 pb-16">
      {/* ── Topbar: Clean Light Glassmorphic Header ─────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/20">
              PX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  {isAdminOrManager ? 'Executive Operations Command Desk' : 'Field Force Day Desk'}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{getFormattedDate()}</span>
                <span>·</span>
                <span className="font-semibold text-slate-600">Biocros Healthcare</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'overview'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview Desk
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics & Charts</span>
              </button>
            </div>

            {/* Daily Manager EOD WhatsApp Digest */}
            <button
              onClick={() => setShowEODModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
              title="Generate 1-click WhatsApp EOD Digest for managers"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EOD WhatsApp</span>
            </button>

            {/* Quick Refresh Button */}
            <button
              onClick={handleRefresh}
              title="Refresh all metrics"
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Pending Approvals Pill */}
            {pendingTotal > 0 && (
              <Link
                href="/dashboard/approvals"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>{pendingTotal} Pending Actions</span>
              </Link>
            )}

            {/* User Profile Chip */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 pl-2.5 sm:border-l sm:border-slate-200 hover:opacity-85 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                </p>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-emerald-50">
                {user?.firstName ? user.firstName[0] + (user.lastName?.[0] ?? '') : 'AD'}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-6">
        {/* ══════════════════════════════════════════════════════════════════
            LIGHT HERO: OPERATIONS AUDIT & APPROVAL COMMAND HUB
        ══════════════════════════════════════════════════════════════════ */}
        {isAdminOrManager && (
          <div className="bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/20 rounded-3xl p-6 sm:p-7 border border-emerald-200/70 shadow-xs relative overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Operations Audit & Control Hub</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Field Force Approvals & Audit Hub
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Real-time audit desk for verifying doctor visit calls, field expense reimbursements, monthly tour plans (MTP), chemist supply orders, and territory registrations.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/dashboard/approvals"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Open Approvals Hub ({pendingTotal})</span>
                </Link>

                <Link
                  href="/dashboard/visits/monitor"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                >
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Live Field Monitor</span>
                </Link>

                <Link
                  href="/dashboard/detailing-categories"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                >
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Detailing Master</span>
                </Link>
              </div>
            </div>

            {/* The 6 Light Queue Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-emerald-100/80 relative z-10">
              {/* 1. Doctor Visits */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-blue-50/40 p-4 rounded-2xl border border-blue-100/90 hover:border-blue-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-blue-900 font-bold uppercase tracking-wider block">Visits</span>
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingVisits || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Calls waiting audit</span>
              </Link>

              {/* 2. Expenses Claims */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-amber-50/40 p-4 rounded-2xl border border-amber-100/90 hover:border-amber-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider block">Expenses</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-amber-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingExpenses || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Claims to reimburse</span>
              </Link>

              {/* 3. Monthly Tour Plans */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-purple-50/40 p-4 rounded-2xl border border-purple-100/90 hover:border-purple-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-purple-900 font-bold uppercase tracking-wider block">Tour Plans</span>
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-purple-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingTourPlans || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">MTP submitted</span>
              </Link>

              {/* 4. Leaves Requests */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-rose-50/40 p-4 rounded-2xl border border-rose-100/90 hover:border-rose-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-rose-900 font-bold uppercase tracking-wider block">Leaves</span>
                  <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-rose-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingLeaves || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Leave requests</span>
              </Link>

              {/* 5. Primary Orders */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/90 hover:border-emerald-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-900 font-bold uppercase tracking-wider block">Orders</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingOrders || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Chemist dispatches</span>
              </Link>

              {/* 6. New Records / Doctors */}
              <Link
                href="/dashboard/approvals"
                className="bg-white hover:bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/90 hover:border-indigo-300 transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-indigo-900 font-bold uppercase tracking-wider block">New Doctors</span>
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-indigo-700 mt-2 block tracking-tight">
                  {approvalSummary?.pendingEntities || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">New verifications</span>
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            EXECUTIVE KPI METRIC CARDS (4 PILLARS)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Doctor Network */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Doctor Network</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              {doctorsOverview?.total ?? 50} <span className="text-base font-semibold text-slate-500">Doctors</span>
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 50 Nagpur Doctors Active
              </span>
              <Link href="/dashboard/doctors" className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                <span>View CRM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Active Headquarters */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-sky-300 transition-all p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Headquarters</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              {headquarters.length || 5} <span className="text-base font-semibold text-slate-500">Territories</span>
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              <span className="truncate max-w-[170px]" title="Nagpur, Indore, Burhanpur, Wardha">
                Nagpur, Indore, Burhanpur...
              </span>
              <Link href="/dashboard/masters/headquarters" className="text-sky-700 font-bold hover:underline flex items-center gap-0.5 shrink-0">
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Primary Sales & Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-amber-300 transition-all p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Sales & Targets</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              ₹12,48,000
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                +18.4% MoM
              </span>
              <Link href="/dashboard/orders" className="text-amber-700 font-bold hover:underline flex items-center gap-0.5">
                <span>Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Detailing Master */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-purple-300 transition-all p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailing Catalog</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              8 <span className="text-base font-semibold text-slate-500">Categories</span>
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
              <span>Dynamic Specialty Deck</span>
              <Link href="/dashboard/detailing-categories" className="text-purple-700 font-bold hover:underline flex items-center gap-0.5">
                <span>Setup</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB VIEW: ANALYTICS & CHARTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Field Analytics & Trend Visualizer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly visit cadence, order fulfillment pipeline, and doctor territory classification.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
              >
                Back to Desk &rarr;
              </button>
            </div>
            <DashboardCharts />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW TAB CONTENT: FIELD TELEMETRY & COMMAND DESK
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            {/* LEFT: TODAY'S FIELD CALL TELEMETRY */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Field Call & Activity Metrics
                    </h3>
                    <p className="text-xs text-slate-500">Live doctor coverage and execution telemetry</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* 4 Call Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 text-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Planned Calls</span>
                  <span className="text-2xl font-black text-slate-900 mt-1.5 block">{planned}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Scheduled today</span>
                </div>
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/70 text-center">
                  <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Completed</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1.5 block">{completed}</span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Reports filed</span>
                </div>
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 text-center">
                  <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block">Remaining</span>
                  <span className="text-2xl font-black text-amber-700 mt-1.5 block">{remaining}</span>
                  <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Calls in pipeline</span>
                </div>
                <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200/70 text-center">
                  <span className="text-xs text-sky-800 font-bold uppercase tracking-wider block">Coverage Ratio</span>
                  <span className="text-2xl font-black text-sky-700 mt-1.5 block">{coverageRatio}%</span>
                  <span className="text-[10px] text-sky-600 font-medium mt-0.5 block">Efficiency</span>
                </div>
              </div>

              {/* Visual Multi-Segment Progress Bar */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Today's Call Target Fulfillment</span>
                  <span className="font-extrabold text-emerald-700">{completed} of {planned} calls completed ({coverageRatio}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${coverageRatio}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done ({completed})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Pending ({remaining})
                  </span>
                </div>
              </div>

              {/* Recent Field Visits Feed */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recent Field Calls Logged</span>
                  </h4>
                  <Link href="/dashboard/visits/monitor" className="text-xs font-bold text-emerald-700 hover:underline">
                    Live GPS Monitor &rarr;
                  </Link>
                </div>

                {recentVisits && recentVisits.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentVisits.slice(0, 4).map((v: any) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 transition-colors shadow-2xs text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {v.doctor ? 'DR' : 'CH'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : v.retailer?.name || 'Client'}
                            </span>
                            <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <span>By {v.user?.firstName} {v.user?.lastName}</span>
                              <span>·</span>
                              <span>{formatDate(v.plannedDate || v.checkInTime)}</span>
                            </span>
                          </div>
                        </div>

                        <span className={`font-bold px-2.5 py-1 rounded-lg border text-[11px] ${
                          v.status === 'REPORTED' || v.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : v.status === 'DETAILING' || v.status === 'CHECKED_IN'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/60">
                    <Target className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-slate-500">No recent visits recorded today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: ADMIN MANAGEMENT COMMAND SHORTCUTS */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Admin Command Desk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quick access to key operational hubs</p>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/dashboard/approvals"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Approvals Queue</span>
                    </div>
                    {pendingTotal > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                        {pendingTotal}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/dashboard/doctors"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Doctor CRM Directory</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/detailing-categories"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Detailing & Medicine Master</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/orders"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Primary Sales Orders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/masters/headquarters"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Territory Headquarters</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/visits/monitor"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Live Field GPS Monitor</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/retailers"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Retail Chemists Directory</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    href="/dashboard/hospitals"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 text-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Hospitals & Clinics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LIVE FIELD FORCE (MR) LOGIN & SESSION DURATION MONITOR
        ══════════════════════════════════════════════════════════════════ */}
        {isAdminOrManager && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Live Field Rep (MR) Login & Presence Monitor
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Real-Time Session Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Live tracking of which MR is logged in, their active duration, login timestamps, and session history.
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  {telemetryData?.summary?.onlineCount || 0} Online Now
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {telemetryData?.summary?.awayCount || 0} In Clinic / Away
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {telemetryData?.summary?.offlineCount || 0} Offline
                </span>
                <Link
                  href="/dashboard/masters/employees"
                  className="text-xs font-bold text-emerald-700 hover:underline pl-2 flex items-center gap-0.5"
                >
                  <span>All Staff &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {(telemetryData?.telemetry || []).map((mr: any) => {
                const isOnline = mr.status === 'ONLINE';
                const isAway = mr.status === 'AWAY';
                return (
                  <div
                    key={mr.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3.5 shadow-2xs ${
                      isOnline
                        ? 'bg-emerald-50/20 border-emerald-300 ring-1 ring-emerald-200/60'
                        : isAway
                        ? 'bg-amber-50/15 border-amber-200/80'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    {/* Header: MR Identity & Status Beacon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs relative ${
                          isOnline
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/20'
                            : isAway
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {mr.firstName?.[0] || 'M'}{mr.lastName?.[0] || 'R'}
                          {isOnline && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900">{mr.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-600">{mr.employeeId || 'MR'}</span>
                            <span>·</span>
                            <span>{mr.hq?.name || 'Headquarter'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isOnline
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isAway
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isOnline ? 'Online Now' : isAway ? 'In Field' : 'Offline'}
                      </span>
                    </div>

                    {/* Middle Card: Kitne der se login hai / Kitni der tak login tha */}
                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                      isOnline
                        ? 'bg-white border-emerald-200/80'
                        : isAway
                        ? 'bg-white border-amber-200/80'
                        : 'bg-white/80 border-slate-200/70'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          {isOnline ? 'Active Login Duration' : 'Login / Session Status'}
                        </span>
                        <span className={`font-extrabold ${
                          isOnline ? 'text-emerald-700' : isAway ? 'text-amber-700' : 'text-slate-700'
                        }`}>
                          {isOnline
                            ? `Online for ${mr.formattedDuration}`
                            : isAway
                            ? `Active for ${mr.formattedDuration}`
                            : mr.formattedDuration !== '0m'
                            ? `Was on for ${mr.formattedDuration}`
                            : 'No Session Today'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          {mr.loginTime
                            ? `Logged in: ${formatTimeOnly(mr.loginTime)}`
                            : mr.lastLoginAt
                            ? `Last login: ${formatTimeOnly(mr.lastLoginAt)}`
                            : 'Never logged in'}
                        </span>
                        <span>
                          {isOnline
                            ? `Ping: ${formatTimeAgo(mr.lastActiveAt)}`
                            : mr.logoutTime
                            ? `Logged out: ${formatTimeOnly(mr.logoutTime)}`
                            : mr.lastActiveAt
                            ? `Active: ${formatTimeAgo(mr.lastActiveAt)}`
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Doctor calls & Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-600 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{mr.todayMetrics?.completedVisits || 0} / {mr.todayMetrics?.totalVisits || 0} calls filed</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/masters/employees/${mr.id}`}
                          className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:underline"
                        >
                          Dossier
                        </Link>
                        <span>·</span>
                        <Link
                          href={`/dashboard/visits/route-audit?userId=${mr.id}`}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          GPS Route &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HEADQUARTER TERRITORIAL CENSUS (DOCTORS, HOSPITALS, CHEMISTS)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Headquarter Territory Census</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Doctor & Hospital Breakdown
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Territorial breakdown of active doctors, hospitals, retail chemists, and field reps across all headquarters.
              </p>
            </div>

            <Link
              href="/dashboard/masters/headquarters"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 self-start sm:self-center bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors"
            >
              <span>Manage All Headquarters</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {headquarters.map((hq: any) => (
              <div
                key={hq.id}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all bg-slate-50/50 space-y-4 shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {hq.code}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{hq.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{hq.district || hq.state} {hq.region ? `· ${hq.region}` : ''}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center pt-2 border-t border-slate-200/70">
                  <Link
                    href={`/dashboard/doctors?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-2xs transition-all group"
                    title={`View all doctors in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-emerald-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.doctors ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Doctors &rarr;
                    </span>
                  </Link>

                  <Link
                    href={`/dashboard/hospitals?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-2xs transition-all group"
                    title={`View hospitals in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-sky-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.hospitals ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Hospitals &rarr;
                    </span>
                  </Link>

                  <Link
                    href={`/dashboard/retailers?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-2xs transition-all group"
                    title={`View retail chemists in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-amber-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.retailers ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Chemists &rarr;
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Daily Manager EOD WhatsApp Digest Modal ──────────────────────── */}
      {showEODModal && (() => {
        const todayStr = new Intl.DateTimeFormat('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }).format(new Date());

        const totalMRs = telemetryData?.totalReps ?? 0;
        const onlineMRs = telemetryData?.onlineReps ?? 0;
        const visitsCompleted = visitStats?.totalCompleted ?? 0;
        const visitsPlanned = visitStats?.totalPlanned ?? 0;
        const ordersCount = orderStats?.todayCount ?? orderStats?.totalOrders ?? 0;
        const ordersVal = orderStats?.todayValue ?? orderStats?.totalValue ?? 0;

        const digestMessage = `*BIOCROS PHARMA - DAILY EOD FIELD FORCE DIGEST*
📅 *Date:* ${todayStr}
🏢 *Active Divisions:* ${headquarters?.length || 1} Headquarters

*📊 FIELD TELEMETRY & ATTENDANCE:*
• Active MRs in Field: ${onlineMRs} / ${totalMRs} (${totalMRs > 0 ? Math.round((onlineMRs / totalMRs) * 100) : 0}%)
• Doctor Calls Completed: ${visitsCompleted} / ${visitsPlanned}
• Daily Call Compliance: ${coverageRatio}%

*📦 COMMERCIAL & SECONDARY SALES:*
• Orders Logged: ${ordersCount}
• Orders Value: ₹${Number(ordersVal).toLocaleString('en-IN')}

*⚠️ GOVERNANCE & PENDING ACTIONS:*
• Approvals Pending: ${pendingTotal}

${eodNotes ? `*📝 MANAGER REMARKS:*\n${eodNotes}\n\n` : ''}_Generated via Pharmax Executive Operations Desk_`;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">Manager EOD WhatsApp Digest</h2>
                    <p className="text-xs text-slate-400">1-click daily field force performance summary</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEODModal(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Add Optional Manager Note / Instruction
                  </label>
                  <input
                    type="text"
                    value={eodNotes}
                    onChange={(e) => setEodNotes(e.target.value)}
                    placeholder="e.g. Great doctor coverage in Patna HQ today! Target pending orders tomorrow morning."
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Formatted WhatsApp Preview
                  </label>
                  <pre className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-[11px] font-mono text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed select-all">
                    {digestMessage}
                  </pre>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(digestMessage);
                      setCopiedEOD(true);
                      setTimeout(() => setCopiedEOD(false), 2000);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {copiedEOD ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(digestMessage)}`, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
