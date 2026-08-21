// ─── PRO-001: Today's Product Focus ───────────────────────────────────────────
// 4 cols, 180px height — featured product with stats and progress bar

'use client';

import Link from 'next/link';
import { Pill } from 'lucide-react';
import type { ProductFocusData } from '@/types/dashboard';

interface ProductFocusProps {
  data: ProductFocusData;
}

export default function ProductFocus({ data }: ProductFocusProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" id="PRO-001">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Product Focus</h2>
        <Link href="/dashboard/digital-detailing" className="text-xs text-brand-600 font-medium hover:text-brand-700">
          View All
        </Link>
      </div>

      {/* Product header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center flex-shrink-0 border border-brand-200/50">
          <Pill className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg leading-tight">{data.name}</p>
          <p className="text-xs text-brand-600 font-medium mt-0.5">↑ {data.trend}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2.5 bg-gray-50 rounded-xl">
          <p className="text-xl font-bold text-gray-900">{data.rxCount}</p>
          <p className="text-[10px] text-gray-500 font-medium">Rx</p>
        </div>
        <div className="text-center p-2.5 bg-gray-50 rounded-xl">
          <p className="text-xl font-bold text-gray-900">{data.doctorCount}</p>
          <p className="text-[10px] text-gray-500 font-medium">Doctors</p>
        </div>
        <div className="text-center p-2.5 bg-gray-50 rounded-xl">
          <p className="text-xl font-bold text-gray-900">{data.targetPercent}%</p>
          <p className="text-[10px] text-gray-500 font-medium">Target</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{data.targetLabel}</span>
          <span className="font-medium">{data.targetPercent}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(data.targetPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
