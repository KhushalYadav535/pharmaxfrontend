// ─── KPI-001 to KPI-004: Reusable KPI Card ───────────────────────────────────
// 3 cols each, 140px height — icon, value, unit, subtitle, optional badge

'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}

export default function KpiCard({
  id,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  value,
  unit,
  subtitle,
  badge,
  badgeColor,
}: KpiCardProps) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 group"
      id={id}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-[32px] font-bold text-gray-900 leading-none">{value}</span>
            {unit && <span className="text-sm text-gray-500 font-medium">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {badge && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-2',
              badgeColor || 'bg-brand-50 text-brand-700',
            )}>
              <CheckCircle className="w-3 h-3" /> {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
