'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, formatRole, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Users, Building2, Store, Truck, ClipboardList,
  ShoppingCart, DollarSign, BarChart3, Brain, ChevronLeft, ChevronRight,
  ChevronDown, Calendar, Package, BookOpen, Clock, LogOut, MapPin, FileText,
  CheckSquare, Megaphone, TrendingUp, FlaskConical, Database, Target,
  Sparkles, Boxes, UserCog, LineChart, CheckCircle2, GraduationCap,
  FileSpreadsheet, Receipt, CalendarOff, Gift, MonitorPlay, Warehouse,
  Search, X, Activity, ShieldCheck, Bell, SlidersHorizontal
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    accentColor: '#2563EB',
    items: [
      { label: 'Executive Home', href: '/dashboard', icon: LayoutDashboard },
      {
        label: 'Approvals Hub',
        href: '/dashboard/approvals',
        icon: CheckCircle2,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'],
        badge: '6 Queues',
        badgeColor: 'bg-emerald-100 text-emerald-800',
      },
      {
        label: 'Tour Plan Approvals',
        href: '/dashboard/approvals?tab=tourplans',
        icon: Calendar,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'],
        badge: 'MTP',
        badgeColor: 'bg-indigo-100 text-indigo-700',
      },
      {
        label: 'Headquarter Census & Master',
        href: '/dashboard/masters/headquarters',
        icon: Building2,
        roles: ['SALES_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'ASM', 'RSM', 'ZM', 'NSM'],
        badge: 'HQ',
        badgeColor: 'bg-purple-100 text-purple-700',
      },
      { label: 'System Notifications', href: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    title: 'CRM & Network',
    icon: Users,
    accentColor: '#059669',
    items: [
      { label: 'Doctor Directory & Codes', href: '/dashboard/doctors', icon: Users, badge: 'DOC', badgeColor: 'bg-emerald-100 text-emerald-800' },
      { label: 'Detailing & Doctor Categories', href: '/dashboard/detailing-categories', icon: SlidersHorizontal },
      { label: 'Hospitals & Clinics', href: '/dashboard/hospitals', icon: Building2 },
      { label: 'Retail Chemists', href: '/dashboard/retailers', icon: Store },
      { label: 'Stockists', href: '/dashboard/stockists', icon: Package },
      { label: 'Distributors', href: '/dashboard/distributors', icon: Truck },
      { label: 'CFAs & Hubs', href: '/dashboard/cfas', icon: Warehouse },
    ],
  },
  {
    title: 'Field Operations',
    icon: ClipboardList,
    accentColor: '#0D9488',
    items: [
      { label: 'Doctor Calls & Visits', href: '/dashboard/visits', icon: ClipboardList },
      { label: 'Daily Call Reports (DCR)', href: '/dashboard/daily-reports', icon: FileText },
      {
        label: 'Tour Plan Approvals (MTP)',
        href: '/dashboard/approvals?tab=tourplans',
        icon: Calendar,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'],
        badge: 'Approve',
        badgeColor: 'bg-indigo-100 text-indigo-700',
      },
      {
        label: 'Monthly Tour Plans (MTP)',
        href: '/dashboard/tour-planning',
        icon: Calendar,
        roles: ['MR', 'TRADE_REP', 'DISTRIBUTOR_REP'],
      },
      { label: 'Field Attendance', href: '/dashboard/attendance', icon: Clock },
      { label: 'Leave Desk', href: '/dashboard/leave', icon: CalendarOff },
      {
        label: 'Expense Reimbursements',
        href: '/dashboard/approvals?tab=expenses',
        icon: Receipt,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'],
      },
      {
        label: 'TA / DA & Expenses',
        href: '/dashboard/expenses',
        icon: Receipt,
        roles: ['MR', 'TRADE_REP', 'DISTRIBUTOR_REP'],
      },
      { label: 'Tasks & Directives', href: '/dashboard/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Sales & Commercials',
    icon: ShoppingCart,
    accentColor: '#D97706',
    items: [
      { label: 'Sales Targets', href: '/dashboard/targets', icon: Target },
      { label: 'Primary Orders & Approvals', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Stock Reports', href: '/dashboard/stock-reports', icon: BarChart3 },
      { label: 'Physician Samples', href: '/dashboard/samples', icon: Gift },
      {
        label: 'Trade Schemes',
        href: '/dashboard/schemes',
        icon: TrendingUp,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'MARKETING', 'TRADE_REP']
      },
      {
        label: 'Chemist Retail Audit',
        href: '/dashboard/retail-audit',
        icon: CheckSquare,
        roles: ['MR', 'TRADE_REP', 'ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN']
      },
      { label: 'Competitor Surveys', href: '/dashboard/surveys', icon: FileText },
    ],
  },
  {
    title: 'Detailing & Training',
    icon: BookOpen,
    accentColor: '#7E22CE',
    items: [
      { label: 'Digital Detailing Deck', href: '/dashboard/digital-detailing', icon: MonitorPlay },
      {
        label: 'Content Library',
        href: '/dashboard/content',
        icon: Megaphone,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'MARKETING', 'PRODUCT_MANAGER']
      },
      { label: 'Field Training & Academy', href: '/dashboard/training', icon: GraduationCap },
    ],
  },
  {
    title: 'Management & AI',
    icon: LineChart,
    accentColor: '#4F46E5',
    items: [
      {
        label: 'Sales Analytics & BI',
        href: '/dashboard/analytics',
        icon: LineChart,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'],
        badge: 'BI',
        badgeColor: 'bg-blue-100 text-blue-700'
      },
      {
        label: 'Approvals Hub',
        href: '/dashboard/approvals',
        icon: CheckCircle2,
        roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN']
      },
      { label: 'Executive Reports', href: '/dashboard/reports', icon: FileSpreadsheet },
      {
        label: 'AI Sales Copilot',
        href: '/dashboard/ai',
        icon: Sparkles,
        badge: 'AI',
        badgeColor: 'bg-purple-100 text-purple-700'
      },
    ],
  },
  {
    title: 'Master Data',
    icon: Database,
    accentColor: '#059669',
    badge: 'Admin',
    items: [
      { label: 'Headquarter Census & Master', href: '/dashboard/masters/headquarters', icon: Building2, roles: ['SALES_ADMIN', 'SUPER_ADMIN', 'ADMIN'] },
      { label: 'Doctor Master & Directory', href: '/dashboard/doctors', icon: Users, roles: ['SALES_ADMIN', 'SUPER_ADMIN', 'ADMIN'] },
      { label: 'Detailing & Doctor Categories', href: '/dashboard/detailing-categories', icon: SlidersHorizontal },
      { label: 'Product Master', href: '/dashboard/masters/products', icon: Boxes },
      { label: 'Location & Beat Master', href: '/dashboard/masters/locations', icon: MapPin, roles: ['SALES_ADMIN', 'SUPER_ADMIN', 'ADMIN'] },
      { label: 'Employee Master', href: '/dashboard/masters/employees', icon: UserCog, roles: ['SALES_ADMIN', 'SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

export default function Sidebar({
  collapsed,
  setCollapsed
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [filterQuery, setFilterQuery] = useState('');

  // Manage accordion states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Overview': true,
    'CRM & Network': true,
    'Field Operations': true,
    'Sales & Commercials': false,
    'Detailing & Training': false,
    'Management & AI': false,
    'Master Data': true,
  });

  // Automatically expand whichever section contains the currently active route
  useEffect(() => {
    if (!pathname) return;
    NAV_SECTIONS.forEach((section) => {
      const hasActive = section.items.some(
        (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
      );
      if (hasActive) {
        setExpandedSections((prev) => ({ ...prev, [section.title]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (title: string) => {
    if (collapsed) setCollapsed(false);
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  // Quick filter matching
  const isFiltering = filterQuery.trim().length > 0;
  const filteredSections = useMemo(() => {
    if (!isFiltering) return NAV_SECTIONS;
    const query = filterQuery.toLowerCase().trim();
    return NAV_SECTIONS.map((section) => {
      const matchingItems = section.items.filter(
        (item) => item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query)
      );
      return { ...section, items: matchingItems };
    }).filter((section) => section.items.length > 0);
  }, [filterQuery, isFiltering]);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-slate-200/90 shadow-sm transition-all duration-300 sticky top-0 z-40 select-none',
        collapsed ? 'w-[72px]' : 'w-68'
      )}
    >
      {/* ── BRAND HEADER ── */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-4.5 border-b border-slate-100 bg-white/50 backdrop-blur-xs',
          collapsed && 'justify-center px-2'
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Activity className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-lg tracking-tight leading-none">
                  PHARMAX
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-800 tracking-wider">
                  ERP
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wide mt-1 uppercase">
                Biocros Healthcare
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── QUICK FILTER (Expanded only) ── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Quick search menu..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
            {filterQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── NAVIGATION LIST ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredSections.map((section) => {
          const visible = filterByRole(section.items);
          if (visible.length === 0) return null;

          const isExpanded = isFiltering || (expandedSections[section.title] ?? true);
          const SectionIcon = section.icon;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-500 tracking-wider uppercase hover:text-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: section.accentColor }}
                    />
                    <span>{section.title}</span>
                    {section.badge && (
                      <span className="ml-1 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200',
                      !isExpanded && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {(collapsed || isExpanded) && (
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const isExact = pathname === item.href;
                    const isDashboard = item.href === '/dashboard';
                    const active = isDashboard
                      ? isExact
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group',
                          active
                            ? 'bg-emerald-50/90 text-emerald-900 border-l-[3px] border-emerald-600 shadow-2xs font-bold'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
                          collapsed && 'justify-center px-2 py-2.5'
                        )}
                      >
                        <ItemIcon
                          className={cn(
                            'w-4 h-4 flex-shrink-0 transition-colors',
                            active
                              ? 'text-emerald-700'
                              : 'text-slate-400 group-hover:text-slate-700'
                          )}
                        />
                        {!collapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}

                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              'text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                              item.badgeColor || 'bg-slate-100 text-slate-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}

                        {!collapsed && active && !item.badge && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── FOOTER / USER PROFILE & CONTROLS ── */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 space-y-1.5">
        {/* User Card */}
        {user && (
          <Link
            href="/dashboard/profile"
            title={collapsed ? `${user.firstName} ${user.lastName} (${formatRole(user.role)})` : undefined}
            className={cn(
              'flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/70 hover:border-emerald-300 hover:shadow-xs transition-all group',
              collapsed && 'justify-center p-1.5'
            )}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-black shadow-xs flex-shrink-0">
                {getInitials(user.firstName || 'A', user.lastName || 'D')}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <p className="text-[10px] font-semibold text-slate-500 truncate">
                    {formatRole(user.role)}
                  </p>
                </div>
              </div>
            )}
          </Link>
        )}

        {/* Action Controls */}
        <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl text-xs font-bold border border-transparent hover:border-slate-200 transition-all"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors',
              collapsed ? 'w-full py-2' : ''
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
