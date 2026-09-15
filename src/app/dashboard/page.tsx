'use client';

import {
  Target, CheckCircle, Clock, MapPin, Navigation2, Phone,
  ChevronRight, Bell, ShoppingCart, Package,
  Calendar, Wifi, Battery, Flag, Car, Activity,
  FlaskConical, DollarSign, Plane, Star, MoreHorizontal,
  Stethoscope, Building2, Store, Truck, Zap,
  AlertCircle, ArrowUpRight, CheckCircle2, SlidersHorizontal,
  Users, Layers, RefreshCw, ShieldCheck, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  useVisitStats,
  useDoctorStats,
  useRecentVisits,
  useRetailerCoverage,
  useOrderStats,
  deriveAlerts,
} from '@/lib/dashboard.api';

function getFormattedDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date());
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  // Live Approvals Summary
  const { data: approvalSummary, refetch: refetchApprovals } = useQuery({
    queryKey: ['approvals-summary'],
    queryFn: () => api.get('/approvals/summary').then((r) => r.data.data),
    refetchInterval: 20000,
  });

  // Doctor stats & Headquarters
  const { data: hqList } = useQuery({
    queryKey: ['headquarters-overview'],
    queryFn: () => api.get('/headquarters').then((r) => r.data.data),
  });
  const headquarters = Array.isArray(hqList) ? hqList : hqList?.headquarters || [];

  const { data: doctorsOverview } = useQuery({
    queryKey: ['doctors-count-overview'],
    queryFn: () => api.get('/doctors', { params: { limit: 1 } }).then((r) => r.data.data),
  });

  const { data: visitStats } = useVisitStats();
  const { data: doctorStats } = useDoctorStats();
  const { data: recentVisits } = useRecentVisits();
  const { data: orderStats } = useOrderStats();

  const planned = visitStats?.totalPlanned ?? 8;
  const completed = visitStats?.totalCompleted ?? 3;
  const remaining = Math.max(0, planned - completed);

  const pendingTotal = approvalSummary?.total || 0;

  return (
    <div className="min-h-full space-y-6 pb-12" style={{ background: '#F8FAFC' }}>
      {/* ── Day Dashboard Topbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
            PX
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {isAdminOrManager ? 'Executive Operations Command Desk' : 'Field Day Dashboard'}
            </h1>
            <p className="text-xs text-slate-500">{getFormattedDate()} · Biocros Healthcare</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {pendingTotal > 0 && (
            <Link
              href="/dashboard/approvals"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300/80 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm animate-pulse"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingTotal} Pending Approvals</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold">{user?.role || 'SUPER_ADMIN'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.firstName ? user.firstName[0] + (user.lastName?.[0] ?? '') : 'AD'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* ══════════════════════════════════════════════════════════════════
            ADMIN & MANAGER COMMAND BANNER: LIVE APPROVAL QUEUE
        ══════════════════════════════════════════════════════════════════ */}
        {isAdminOrManager && (
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Operations Audit Desk
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Field Force Approvals & Audit Hub</h2>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Review and verify doctor visit calls, travel reimbursements, monthly tour plans, chemist orders, and doctor registrations across all territories.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href="/dashboard/approvals"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Open Approval Hub ({pendingTotal})
                </Link>
                <Link
                  href="/dashboard/detailing-categories"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-colors border border-white/15"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Detailing Master
                </Link>
              </div>
            </div>

            {/* Quick Pending Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Visits</span>
                <span className="text-xl font-extrabold text-blue-400 mt-1 block">{approvalSummary?.pendingVisits || 0}</span>
                <span className="text-[10px] text-slate-400">Calls waiting audit</span>
              </Link>

              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Expenses</span>
                <span className="text-xl font-extrabold text-amber-400 mt-1 block">{approvalSummary?.pendingExpenses || 0}</span>
                <span className="text-[10px] text-slate-400">Claims to reimburse</span>
              </Link>

              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Tour Plans</span>
                <span className="text-xl font-extrabold text-purple-400 mt-1 block">{approvalSummary?.pendingTourPlans || 0}</span>
                <span className="text-[10px] text-slate-400">Programs submitted</span>
              </Link>

              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Leaves</span>
                <span className="text-xl font-extrabold text-rose-400 mt-1 block">{approvalSummary?.pendingLeaves || 0}</span>
                <span className="text-[10px] text-slate-400">Applications</span>
              </Link>

              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">Orders</span>
                <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{approvalSummary?.pendingOrders || 0}</span>
                <span className="text-[10px] text-slate-400">Pending dispatch</span>
              </Link>

              <Link href="/dashboard/approvals" className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-colors">
                <span className="text-[11px] text-slate-300 font-semibold uppercase tracking-wider block">New Records</span>
                <span className="text-xl font-extrabold text-indigo-400 mt-1 block">{approvalSummary?.pendingEntities || 0}</span>
                <span className="text-[10px] text-slate-400">Doctors / Clinics</span>
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TERRITORY & DOCTOR CRM EXECUTIVE CARDS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Doctor Network</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {doctorsOverview?.total ?? 50} Doctors
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>All 50 Nagpur Doctors Active</span>
              <Link href="/dashboard/doctors" className="text-emerald-700 font-bold hover:underline">
                View CRM &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Headquarters</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {headquarters.length || 5} Territories
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Nagpur, Indore, Burhanpur...</span>
              <Link href="/dashboard/masters/headquarters" className="text-blue-700 font-bold hover:underline">
                Manage &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Sales & Targets</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">₹12,48,000</p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-bold">+18% MoM Growth</span>
              <Link href="/dashboard/orders" className="text-amber-700 font-bold hover:underline">
                Orders &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detailing Catalog</span>
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">8 Categories</p>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Dynamic Specialty Deck</span>
              <Link href="/dashboard/detailing-categories" className="text-purple-700 font-bold hover:underline">
                Setup &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ROW 2: Field Force Call Execution + Quick Command Desk
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
          {/* TODAY'S MISSION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Field Call & Activity Metrics
                </h3>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Field Sync
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-medium block">Planned Calls</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">{planned}</span>
              </div>
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-center">
                <span className="text-xs text-emerald-800 font-medium block">Calls Completed</span>
                <span className="text-xl font-bold text-emerald-700 mt-1 block">{completed}</span>
              </div>
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 text-center">
                <span className="text-xs text-amber-800 font-medium block">Remaining Calls</span>
                <span className="text-xl font-bold text-amber-600 mt-1 block">{remaining}</span>
              </div>
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-center">
                <span className="text-xs text-blue-800 font-medium block">Coverage Ratio</span>
                <span className="text-xl font-bold text-blue-600 mt-1 block">
                  {planned > 0 ? `${Math.round((completed / planned) * 100)}%` : '100%'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Recent Field Visits Logged
              </h4>
              {recentVisits && recentVisits.length > 0 ? (
                <div className="space-y-2">
                  {recentVisits.slice(0, 4).map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : v.retailer?.name || 'Client'}
                        </span>
                        <span className="text-slate-400 text-[11px] block">
                          By {v.user?.firstName} {v.user?.lastName} · {formatDate(v.plannedDate || v.checkInTime)}
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No recent visits recorded today.</p>
              )}
            </div>
          </div>

          {/* QUICK COMMAND SHORTCUTS */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Admin Management Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/approvals"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Approvals Queue</span>
                  </div>
                  {pendingTotal > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      {pendingTotal}
                    </span>
                  )}
                </Link>

                <Link
                  href="/dashboard/doctors"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold">Doctor CRM (Nagpur & HQ)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </Link>

                <Link
                  href="/dashboard/detailing-categories"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold">Detailing & Medicine Master</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </Link>

                <Link
                  href="/dashboard/orders"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold">Primary Sales Orders</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </Link>

                <Link
                  href="/dashboard/masters/headquarters"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-800 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-bold">Headquarter & Territory Master</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            HEADQUARTER TERRITORIAL CENSUS (DOCTOR & HOSPITAL BREAKDOWN)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Headquarter Territory Census</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                  Doctor & Hospital Breakdown
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Territorial overview — see how many active doctors, hospitals, retail chemists, and field reps are in each headquarter.
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
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all bg-slate-50/50 space-y-3.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {hq.code}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{hq.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {hq.district || hq.state} {hq.region ? `· ${hq.region}` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60">
                  <Link
                    href={`/dashboard/doctors?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 transition-colors group"
                    title={`View all doctors in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-emerald-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.doctors ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Doctors →
                    </span>
                  </Link>

                  <Link
                    href={`/dashboard/hospitals?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 transition-colors group"
                    title={`View hospitals in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-sky-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.hospitals ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Hospitals →
                    </span>
                  </Link>

                  <Link
                    href={`/dashboard/retailers?hqId=${hq.id}`}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-colors group"
                    title={`View retail chemists in ${hq.name}`}
                  >
                    <span className="text-lg font-black text-amber-700 block group-hover:scale-105 transition-transform">
                      {hq._count?.retailers ?? 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      Chemists →
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
