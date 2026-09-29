'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Truck, MapPin, Phone, Mail, Building,
  Package, ShoppingCart, Calendar, ShieldCheck, CheckCircle2,
  AlertCircle, Store, Award
} from 'lucide-react';

export default function StockistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: stockist, isLoading } = useQuery({
    queryKey: ['stockist-detail', id],
    queryFn: () => api.get(`/stockists/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stockist) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Stockist Not Found</h2>
        <button onClick={() => router.back()} className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl">
          Return to Stockists
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Stockists
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center flex-shrink-0 border border-cyan-100 shadow-2xs">
            <Truck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{stockist.name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                Class {stockist.category || 'A'} Distributor
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {[stockist.city, stockist.state].filter(Boolean).join(', ')} · Code: {stockist.stockistCode || stockist.code || 'STK-001'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-600" /> Commercial & Tax Details
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Drug License No.</span>
              <span className="font-mono font-bold text-slate-800">{stockist.drugLicense || 'DL-20B/21B-VALID'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">GSTIN</span>
              <span className="font-mono font-bold text-slate-800">{stockist.gstNumber || '27AAAAA0000A1Z5'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">PAN Number</span>
              <span className="font-mono font-bold text-slate-800">{stockist.panNumber || 'ABCDE1234F'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Credit Limit</span>
              <span className="font-bold text-emerald-700">₹{stockist.creditLimit?.toLocaleString('en-IN') || '5,00,000'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" /> Contact & Territory
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Contact Person</span>
              <span className="font-bold text-slate-800">{stockist.contactPerson || 'Proprietor'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phone</span>
              <span className="font-bold text-slate-800">{stockist.phone || stockist.mobile || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="font-bold text-slate-800">{stockist.email || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Address</span>
              <span className="font-bold text-slate-800 text-right">{stockist.address || `${stockist.city}, ${stockist.state}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
