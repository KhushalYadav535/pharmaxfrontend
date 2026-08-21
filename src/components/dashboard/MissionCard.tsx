// ─── MIS-001: Today's Mission Card ────────────────────────────────────────────
// 12 cols, 120px height — shows Planned, Completed, Remaining, Route Efficiency

'use client';

import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MissionData } from '@/types/dashboard';

function MissionStat({ icon: Icon, label, value, iconBg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium leading-none">{label}</p>
        <p className="text-[32px] font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

interface MissionCardProps {
  data: MissionData;
}

export default function MissionCard({ data }: MissionCardProps) {
  return (
    <div className="bg-transparent" id="MIS-001">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-brand-600" />
        <h2 className="text-xs font-bold text-brand-700 uppercase tracking-wider">Today&apos;s Mission</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MissionStat icon={Calendar} label="Planned Calls" value={data.planned} iconBg="bg-brand-600" />
        <MissionStat icon={CheckCircle} label="Completed" value={data.completed} iconBg="bg-brand-500" />
        <MissionStat icon={Clock} label="Remaining" value={data.remaining} iconBg="bg-amber-500" />
        <MissionStat icon={TrendingUp} label="Route Efficiency" value={`${data.routeEfficiency}%`} iconBg="bg-blue-500" />
      </div>
    </div>
  );
}
