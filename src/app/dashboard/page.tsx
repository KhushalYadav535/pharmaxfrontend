'use client';

// ─── BioCros FFMS Dashboard v2.0 — Page Orchestrator ──────────────────────────
// Slim page that imports all dashboard components and wires up data queries.
// Layout: 12-col grid per spec (24px margins, 24px gutters)

import { useAuth } from '@/lib/auth-context';
import { MapPin, BarChart3, ShoppingCart, Target, Calendar } from 'lucide-react';
import Link from 'next/link';

// ── Dashboard API hooks ──────────────────────────────────────────────────────
import {
  useVisitStats,
  useDoctorStats,
  useRecentVisits,
  useRetailerCoverage,
  useOrderStats,
  useAuditStats,
  useDistributorStats,
  useVisitTrend,
  useTeamProductivity,
  useDoctorClassification,
  deriveMission,
  deriveKpis,
  deriveAlerts,
} from '@/lib/dashboard.api';

// ── Dashboard components ─────────────────────────────────────────────────────
import MissionCard from '@/components/dashboard/MissionCard';
import KpiCard from '@/components/dashboard/KpiCard';
import NextVisitCard from '@/components/dashboard/NextVisitCard';
import RouteMap from '@/components/dashboard/RouteMap';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import ProductFocus from '@/components/dashboard/ProductFocus';
import AiAssistantCard from '@/components/dashboard/AiAssistantCard';
import QuickActions from '@/components/dashboard/QuickActions';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDayName() {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(new Date());
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth();
  const isMgr = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(user?.role || '');

  // ── Data queries ────────────────────────────────────────────────────────
  const { data: visitStats } = useVisitStats();
  const { data: doctorStats } = useDoctorStats();
  const { data: recentVisits } = useRecentVisits();
  const { data: retailerCoverage } = useRetailerCoverage();
  const { data: orderStats } = useOrderStats();
  useAuditStats();
  useDistributorStats();
  useVisitTrend();
  useTeamProductivity(isMgr);
  useDoctorClassification();

  // ── Derived data ────────────────────────────────────────────────────────
  const mission = deriveMission(visitStats);
  const kpis = deriveKpis(visitStats, orderStats, retailerCoverage);
  const alerts = deriveAlerts(visitStats, doctorStats);
  const nextVisit = recentVisits?.find((v: any) => v.status === 'PLANNED') ?? null;

  // ── AI insights ─────────────────────────────────────────────────────────
  const aiInsights: { type: 'insight' | 'route'; message: string }[] = [
    {
      type: 'insight',
      message: nextVisit?.doctor
        ? `Dr. ${nextVisit.doctor.firstName} usually prescribes probiotics. Suggest Pharmax-D with the new clinical visual.`
        : mission.planned > 0
          ? `You have ${mission.planned} calls today. Focus on A+ and A-class doctors for maximum impact.`
          : 'No visits planned today. Consider planning visits to high-potential doctors in your territory.',
    },
    {
      type: 'route',
      message: `Best route saves approximately 18 minutes and covers all ${mission.planned} calls.`,
    },
  ];

  // ── Product focus (static for now) ──────────────────────────────────────
  const productFocus = {
    name: 'Pharmax-D',
    trend: '18% this month',
    rxCount: 8,
    doctorCount: 3,
    targetPercent: 67,
    targetLabel: 'Target: 12 Rx today',
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-24 md:pb-6 relative">

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER + MISSION COMBINED CARD
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6" id="HDR-001">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5" />
              {getFormattedDate()}, {getDayName()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName || 'Rahul'}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Keep going! You&apos;re doing great.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Checked Out</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Link
            href="/dashboard/visits"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-colors shadow-md shadow-emerald-600/20"
          >
            <MapPin className="w-4 h-4" /> Check In
          </Link>
        </div>
      </div>

        <hr className="border-gray-100 my-6" />
        <MissionCard data={mission} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          KPI CARDS (3+3+3+3 cols, 140px)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          id="KPI-001"
          icon={MapPin}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          title="Today's Calls"
          value={`${kpis.todayCalls.completed}/${kpis.todayCalls.planned}`}
          unit="completed"
          badge={
            kpis.todayCalls.completed >= kpis.todayCalls.planned && kpis.todayCalls.planned > 0
              ? 'All done!'
              : mission.remaining <= 2 && kpis.todayCalls.planned > 0
                ? 'On schedule'
                : undefined
          }
          badgeColor="bg-brand-50 text-brand-700"
        />
        <KpiCard
          id="KPI-002"
          icon={BarChart3}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          title="Call Quality"
          value={kpis.todayCalls.planned > 0 ? `${kpis.callQuality}%` : '—'}
          unit="average"
          subtitle="Based on detailing & reporting"
        />
        <KpiCard
          id="KPI-003"
          icon={ShoppingCart}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          title="Orders Today"
          value={kpis.ordersValue > 0 ? `₹${(kpis.ordersValue / 1000).toFixed(0)}K` : '—'}
          unit="primary"
          subtitle={`${kpis.ordersCount} orders booked`}
        />
        <KpiCard
          id="KPI-004"
          icon={Target}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          title="Coverage"
          value={kpis.coverageRate > 0 ? `${kpis.coverageRate}%` : '—'}
          unit="territory"
          subtitle={`${kpis.coverageVisited} of ${kpis.coverageTotal} doctors visited`}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MIDDLE ROW: Next Visit (3) | Route Map (5) | Alerts (4) — 260px
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <NextVisitCard visit={nextVisit} />
        </div>
        <div className="lg:col-span-5">
          <RouteMap planned={mission.planned} completed={mission.completed} />
        </div>
        <div className="lg:col-span-4">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM ROW: Product (4) | AI (4) | Actions (4) — 180px
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProductFocus data={productFocus} />
        <AiAssistantCard insights={aiInsights} />
        <QuickActions />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV (md:hidden)
          ═══════════════════════════════════════════════════════════════════ */}
      <MobileBottomNav />
    </div>
  );
}
