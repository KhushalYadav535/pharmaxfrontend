// ─── Mobile Bottom Navigation Bar ─────────────────────────────────────────────
// Fixed bottom bar visible on mobile (md:hidden) with Check In, Calls, +, Order, Report

'use client';

import Link from 'next/link';
import { MapPin, Phone, Plus, ShoppingCart, FileText } from 'lucide-react';

export default function MobileBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 px-4 z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <Link href="/dashboard/visits" className="flex flex-col items-center gap-0.5 py-1 px-2">
        <MapPin className="w-5 h-5 text-brand-600" />
        <span className="text-[10px] text-brand-600 font-medium">Check In</span>
      </Link>
      <Link href="/dashboard/visits" className="flex flex-col items-center gap-0.5 py-1 px-2">
        <Phone className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] text-gray-500 font-medium">Today&apos;s Calls</span>
      </Link>
      <Link href="/dashboard/visits" className="flex flex-col items-center -mt-5">
        <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
          <Plus className="w-6 h-6 text-white" />
        </div>
      </Link>
      <Link href="/dashboard/orders" className="flex flex-col items-center gap-0.5 py-1 px-2">
        <ShoppingCart className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] text-gray-500 font-medium">Place Order</span>
      </Link>
      <Link href="/dashboard/visits" className="flex flex-col items-center gap-0.5 py-1 px-2">
        <FileText className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] text-gray-500 font-medium">Add Report</span>
      </Link>
    </div>
  );
}
