// ─── MAP-001: Today's Route Map ───────────────────────────────────────────────
// 5 cols, 260px height — visual route with numbered dots, legend, View Full Map

'use client';

import Link from 'next/link';
import { Expand } from 'lucide-react';
import { cn } from '@/lib/utils';

function RouteDot({ number, status, style }: {
  number: number;
  status: 'completed' | 'pending' | 'missed' | 'current';
  style?: React.CSSProperties;
}) {
  if (status === 'current') {
    return (
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{ ...style, transform: 'translate(-50%, -50%)' }}
      >
        <div className="w-10 h-10 rounded-full bg-blue-500/20 animate-pulse absolute" />
        <div className="w-6 h-6 rounded-full bg-blue-500/30 animate-pulse absolute" />
        <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white relative z-10 shadow-sm" />
      </div>
    );
  }

  const colors = {
    completed: 'bg-[#0B6E4F] text-white border-2 border-white shadow-sm',
    pending: 'bg-[#E87B35] text-white border-2 border-white shadow-sm',
    missed: 'bg-[#E03E3E] text-white border-2 border-white shadow-sm',
  };

  return (
    <div
      className={cn(
        'absolute w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold z-10',
        colors[status as keyof typeof colors]
      )}
      style={{ ...style, transform: 'translate(-50%, -50%)' }}
    >
      {number}
    </div>
  );
}

interface RouteMapProps {
  planned?: number;
  completed?: number;
}

export default function RouteMap({ planned = 7, completed = 3 }: RouteMapProps) {
  // Generate route dots with status based on actual data
  const dots: { number: number; status: 'completed' | 'pending' | 'missed' | 'current'; top: string; left: string }[] = [
    { number: 1, status: 'completed', top: '40%', left: '15%' },
    { number: 2, status: 'completed', top: '25%', left: '30%' },
    { number: 3, status: 'completed', top: '35%', left: '45%' },
    { number: 4, status: 'current', top: '45%', left: '55%' },
    { number: 5, status: 'pending', top: '60%', left: '70%' },
    { number: 6, status: 'pending', top: '50%', left: '80%' },
    { number: 7, status: 'missed', top: '35%', left: '90%' },
  ];

  // Adjust statuses based on real data
  const adjustedDots = dots.slice(0, Math.max(planned, 7)).map((dot, i) => ({
    ...dot,
    status: i < completed ? 'completed' as const :
            i === completed ? 'current' as const :
            'pending' as const,
  }));

  return (
    <div className="relative bg-[#f0f2f5] rounded-2xl border border-gray-100 shadow-sm h-[280px] overflow-hidden" id="MAP-001">
      {/* Title */}
      <h2 className="absolute top-4 left-5 text-[15px] font-bold text-gray-900 z-20">Today&apos;s Route</h2>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-xl shadow-sm border border-gray-100 p-3 z-20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0B6E4F]" /> Completed
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E87B35]" /> Pending
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E03E3E]" /> Missed
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" /> Current Location
        </div>
      </div>

      {/* Real Map Background */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/map-bg.jpg" alt="Map" className="w-full h-full object-cover opacity-80" />
      </div>

      {/* Map Area for Route */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Route path */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <polyline
            points="15%,40% 30%,25% 45%,35% 55%,45% 70%,60% 80%,50% 90%,35%"
            fill="none"
            stroke="#0B6E4F"
            strokeWidth="2.5"
          />
        </svg>

        {/* Route dots */}
        {adjustedDots.map((dot) => (
          <RouteDot
            key={dot.number}
            number={dot.number}
            status={dot.status}
            style={{ top: dot.top, left: dot.left }}
          />
        ))}
      </div>

      {/* View Full Map Button */}
      <Link
        href="/dashboard/tour-planning"
        className="absolute bottom-4 right-4 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-2.5 flex items-center gap-2 text-[13px] text-[#0B6E4F] font-bold hover:bg-gray-50 transition-colors z-20 pointer-events-auto"
      >
        View Full Map <Expand className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
