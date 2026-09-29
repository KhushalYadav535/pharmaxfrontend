'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OrderForm from '@/components/operations/OrderForm';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" /> Book New Commercial Order
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a primary or secondary order for retail chemists, hospitals, or stockists.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <OrderForm onClose={() => router.push('/dashboard/orders')} />
      </div>
    </div>
  );
}
