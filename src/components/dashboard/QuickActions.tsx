// ─── ACT-001: Quick Actions Grid ──────────────────────────────────────────────
// 4 cols, 180px height — 6-button action grid with hover effects

'use client';

import Link from 'next/link';
import { Users, FileText, ShoppingCart, Eye, Receipt, Package } from 'lucide-react';

const ACTIONS = [
  { icon: Users, label: 'Add Doctor', href: '/dashboard/doctors' },
  { icon: FileText, label: 'Add Call Report', href: '/dashboard/visits' },
  { icon: ShoppingCart, label: 'Place Order', href: '/dashboard/orders' },
  { icon: Eye, label: 'View Stock', href: '/dashboard/samples' },
  { icon: Receipt, label: 'Expense Claim', href: '/dashboard/expenses' },
  { icon: Package, label: 'Sample Given', href: '/dashboard/samples' },
] as const;

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" id="ACT-001">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-50 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
              <Icon className="w-5 h-5 text-gray-600 group-hover:text-brand-600 transition-colors" />
            </div>
            <span className="text-xs text-gray-600 font-medium text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
