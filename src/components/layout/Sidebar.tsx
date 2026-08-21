'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, formatRole, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Users, Building2, Store, Truck, ClipboardList,
  ShoppingCart, DollarSign, BarChart3, Brain, ChevronLeft, ChevronRight,
  Calendar, Package, BookOpen, Clock, LogOut, MapPin, FileText,
  CheckSquare, Megaphone, TrendingUp, FlaskConical,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Field Work',
    items: [
      { label: 'Visits', href: '/dashboard/visits', icon: ClipboardList },
      { label: 'Daily Reports', href: '/dashboard/daily-reports', icon: FileText },
      { label: 'Tour Planning', href: '/dashboard/tour-planning', icon: Calendar },
      { label: 'Attendance', href: '/dashboard/attendance', icon: Clock },
      { label: 'Leave', href: '/dashboard/leave', icon: Calendar },
      { label: 'Expenses', href: '/dashboard/expenses', icon: DollarSign },
      { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Doctor CRM', href: '/dashboard/doctors', icon: Users },
      { label: 'Hospitals', href: '/dashboard/hospitals', icon: Building2 },
      { label: 'Retailers', href: '/dashboard/retailers', icon: Store },
      { label: 'Stockists', href: '/dashboard/stockists', icon: Package },
      { label: 'Distributors', href: '/dashboard/distributors', icon: Truck },
      { label: 'CFAs', href: '/dashboard/cfas', icon: Building2 },
    ],
  },
  {
    title: 'Sales & Trade',
    items: [
      { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Stock Reports', href: '/dashboard/stock-reports', icon: BarChart3 },
      { label: 'Samples', href: '/dashboard/samples', icon: Package },
      { label: 'Trade Schemes', href: '/dashboard/schemes', icon: TrendingUp, roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'MARKETING', 'TRADE_REP'] },
      { label: 'Retail Audit', href: '/dashboard/retail-audit', icon: CheckSquare, roles: ['MR', 'TRADE_REP', 'ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'] },
      { label: 'Competitor Surveys', href: '/dashboard/surveys', icon: FileText },
    ],
  },
  {
    title: 'Content & Training',
    items: [
      { label: 'Digital Detailing', href: '/dashboard/digital-detailing', icon: BookOpen },
      { label: 'Content Library', href: '/dashboard/content', icon: Megaphone, roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'MARKETING', 'PRODUCT_MANAGER'] },
      { label: 'Training', href: '/dashboard/training', icon: FlaskConical },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'] },
      { label: 'Approvals', href: '/dashboard/approvals', icon: FileText, roles: ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'] },
      { label: 'AI Copilot', href: '/dashboard/ai', icon: Brain },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 sticky top-0 z-40',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">Px</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 text-lg tracking-tight">Pharmax</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => {
          const visible = filterByRole(section.items);
          if (visible.length === 0) return null;
          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) || (item.href !== '/dashboard' && pathname === item.href);
                  const isExact = pathname === item.href;
                  const isDashboard = item.href === '/dashboard';
                  const active = isDashboard ? isExact : (pathname === item.href || pathname.startsWith(item.href + '/'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        collapsed && 'justify-center px-2',
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0',
                          active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600',
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom: User + collapse */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{formatRole(user.role)}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-sm transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
