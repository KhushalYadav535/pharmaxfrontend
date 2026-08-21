// ─── ALT-001: Needs Attention / Alerts Panel ─────────────────────────────────
// 4 cols, 260px height — priority alert items with icons and chevrons

'use client';

import Link from 'next/link';
import { AlertTriangle, FileText, Package, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertItem } from '@/types/dashboard';

const ICON_MAP = {
  alert: AlertTriangle,
  file: FileText,
  package: Package,
  users: Users,
} as const;

const TYPE_STYLES = {
  critical: { iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  warning: { iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  info: { iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
} as const;

function AttentionItem({ item }: { item: AlertItem }) {
  const Icon = ICON_MAP[item.icon] || AlertTriangle;
  const styles = TYPE_STYLES[item.type] || TYPE_STYLES.info;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', styles.iconBg)}>
        <Icon className={cn('w-4 h-4', styles.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 leading-snug">{item.title}</p>
        <p className={cn('text-xs mt-0.5', item.type === 'critical' ? 'text-red-500 font-medium' : 'text-gray-500')}>
          {item.subtitle}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 transition-colors" />
    </div>
  );
}

interface AlertsPanelProps {
  alerts: AlertItem[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" id="ALT-001">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Needs Attention</h2>
        <Link href="/dashboard/visits" className="text-xs text-brand-600 font-medium hover:text-brand-700">
          View All
        </Link>
      </div>
      <div className="space-y-1">
        {alerts.length > 0 ? (
          alerts.map((alert) => <AttentionItem key={alert.id} item={alert} />)
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No alerts right now 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
