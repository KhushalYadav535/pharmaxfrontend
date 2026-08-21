// ─── Dashboard API Hooks ──────────────────────────────────────────────────────
// Centralized data-fetching for the BioCros FFMS Dashboard v2.0
// Wraps existing backend endpoints into clean, typed query hooks.

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { MissionData, KpiData, AlertItem, NextVisitData } from '@/types/dashboard';

/* ── Visit Stats (Today's Mission + KPIs) ──────────────────────────────────── */
export function useVisitStats() {
  return useQuery({
    queryKey: ['visit-today-stats'],
    queryFn: () => api.get('/visits/today-stats').then((r) => r.data.data),
  });
}

/* ── Doctor Stats ──────────────────────────────────────────────────────────── */
export function useDoctorStats() {
  return useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => api.get('/doctors/stats').then((r) => r.data.data),
  });
}

/* ── Visit Trend (chart data) ──────────────────────────────────────────────── */
export function useVisitTrend() {
  return useQuery({
    queryKey: ['visit-trend'],
    queryFn: () => api.get('/analytics/visit-trend').then((r) => r.data.data),
  });
}

/* ── Team Productivity (manager-only) ──────────────────────────────────────── */
export function useTeamProductivity(enabled: boolean) {
  return useQuery({
    queryKey: ['team-productivity'],
    queryFn: () => api.get('/analytics/team-productivity').then((r) => r.data.data),
    enabled,
  });
}

/* ── Doctor Classification ─────────────────────────────────────────────────── */
export function useDoctorClassification() {
  return useQuery({
    queryKey: ['doctor-classification'],
    queryFn: () => api.get('/analytics/doctor-classification').then((r) => r.data.data),
  });
}

/* ── Recent Visits ─────────────────────────────────────────────────────────── */
export function useRecentVisits() {
  return useQuery({
    queryKey: ['recent-visits'],
    queryFn: () => api.get('/visits?limit=5').then((r) => r.data.data.visits),
  });
}

/* ── Retailer Coverage ─────────────────────────────────────────────────────── */
export function useRetailerCoverage() {
  return useQuery({
    queryKey: ['retailer-coverage-dash'],
    queryFn: () => api.get('/analytics/retailer-coverage').then((r) => r.data.data),
  });
}

/* ── Distributor Stats ─────────────────────────────────────────────────────── */
export function useDistributorStats() {
  return useQuery({
    queryKey: ['distributor-stats-dash'],
    queryFn: () => api.get('/analytics/distributor-stats').then((r) => r.data.data),
  });
}

/* ── Order Stats ───────────────────────────────────────────────────────────── */
export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats-dash'],
    queryFn: () => api.get('/analytics/order-stats').then((r) => r.data.data),
  });
}

/* ── Audit Stats ───────────────────────────────────────────────────────────── */
export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats-dash'],
    queryFn: () => api.get('/retail-audit/stats/summary').then((r) => r.data.data),
  });
}

/* ── Derived: build MissionData from visitStats ────────────────────────────── */
export function deriveMission(visitStats: any): MissionData {
  const planned = visitStats?.planned ?? 0;
  const completed = visitStats?.completed ?? 0;
  return {
    planned,
    completed,
    remaining: Math.max(0, planned - completed),
    routeEfficiency: planned > 0 ? Math.round((completed / planned) * 100) : 0,
  };
}

/* ── Derived: build KpiData from multiple sources ──────────────────────────── */
export function deriveKpis(visitStats: any, orderStats: any, retailerCoverage: any): KpiData {
  const planned = visitStats?.planned ?? 0;
  const completed = visitStats?.completed ?? 0;
  return {
    todayCalls: { completed, planned },
    callQuality: planned > 0 ? Math.round((completed / planned) * 100) : 0,
    ordersValue: orderStats?.totalRevenue ?? 0,
    ordersCount: orderStats?.byStatus?.find((s: any) => s.status === 'DELIVERED')?._count ?? 0,
    coverageRate: retailerCoverage?.coverageRate ?? 0,
    coverageVisited: retailerCoverage?.uniqueRetailers ?? 0,
    coverageTotal: retailerCoverage?.totalRetailers ?? 0,
  };
}

/* ── Derived: build alerts from multiple sources ───────────────────────────── */
export function deriveAlerts(visitStats: any, doctorStats: any): AlertItem[] {
  const alerts: AlertItem[] = [];
  const missed = visitStats?.missed ?? 0;
  const pending = visitStats?.pending ?? 0;

  if (missed > 0) {
    alerts.push({
      id: 'missed-visits',
      type: 'critical',
      icon: 'alert',
      title: `${missed} visit(s) missed today`,
      subtitle: 'High priority • Reschedule required',
    });
  }

  if (pending > 0) {
    alerts.push({
      id: 'pending-reports',
      type: 'warning',
      icon: 'file',
      title: `${pending} call reports pending`,
      subtitle: 'Complete before checkout',
    });
  }

  alerts.push({
    id: 'low-stock',
    type: 'info',
    icon: 'package',
    title: 'Sample stock running low',
    subtitle: 'Opportunity to reorder',
  });

  if ((doctorStats?.total ?? 0) > 0) {
    alerts.push({
      id: 'territory-doctors',
      type: 'info',
      icon: 'users',
      title: `${doctorStats.total} doctors in your territory`,
      subtitle: `${doctorStats.kolCount ?? 0} KOLs to prioritize`,
    });
  }

  return alerts;
}
