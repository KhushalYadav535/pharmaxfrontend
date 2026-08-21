// ─── Dashboard Type Definitions ───────────────────────────────────────────────
// BioCros FFMS Dashboard v2.0

export interface MissionData {
  planned: number;
  completed: number;
  remaining: number;
  routeEfficiency: number;
}

export interface KpiData {
  todayCalls: { completed: number; planned: number };
  callQuality: number;
  ordersValue: number;
  ordersCount: number;
  coverageRate: number;
  coverageVisited: number;
  coverageTotal: number;
}

export interface DoctorInfo {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  hospital?: string;
  classification?: string;
}

export interface NextVisitData {
  id: string;
  doctor: DoctorInfo | null;
  retailer?: { name: string } | null;
  distributor?: { name: string } | null;
  plannedDate: string;
  status: string;
  distance?: number;
  lastVisitDays?: number;
  lastRx?: string;
}

export interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  icon: 'alert' | 'file' | 'package' | 'users';
  title: string;
  subtitle: string;
}

export interface ProductFocusData {
  name: string;
  trend: string;
  rxCount: number;
  doctorCount: number;
  targetPercent: number;
  targetLabel: string;
}

export interface AiRecommendation {
  id: string;
  type: 'insight' | 'route' | 'coaching';
  message: string;
}

export interface QuickActionItem {
  icon: string;
  label: string;
  href: string;
}

export interface DashboardData {
  mission: MissionData;
  kpis: KpiData;
  nextVisit: NextVisitData | null;
  alerts: AlertItem[];
  productFocus: ProductFocusData;
  aiRecommendations: AiRecommendation[];
}
