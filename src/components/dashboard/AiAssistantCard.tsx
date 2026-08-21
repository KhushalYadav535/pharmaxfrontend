// ─── AI-001: AI Field Assistant Card ──────────────────────────────────────────
// 4 cols, 180px height — AI insight bubbles with route/coaching suggestions

'use client';

import Link from 'next/link';
import { Brain, Route, Sparkles } from 'lucide-react';

interface AiAssistantCardProps {
  insights: { type: 'insight' | 'route'; message: string }[];
}

export default function AiAssistantCard({ insights }: AiAssistantCardProps) {
  const iconMap = {
    insight: { Icon: Brain, bg: 'bg-brand-600', border: 'border-brand-100/60', bgCard: 'bg-brand-50/60' },
    route: { Icon: Route, bg: 'bg-blue-500', border: 'border-blue-100/60', bgCard: 'bg-blue-50/60' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" id="AI-001">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Field Assistant</h2>
        </div>
        <Link href="/dashboard/ai" className="text-xs text-brand-600 font-medium hover:text-brand-700">
          Ask AI
        </Link>
      </div>
      <div className="space-y-3">
        {insights.map((item, i) => {
          const { Icon, bg, border, bgCard } = iconMap[item.type] || iconMap.insight;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${border} ${bgCard}`}>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{item.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
