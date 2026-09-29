'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Warehouse, MapPin, Phone, Mail, Building,
  Package, Truck, Calendar, ShieldCheck, CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CfaDepotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: cfa, isLoading } = useQuery({
    queryKey: ['cfa-detail', id],
    queryFn: () => api.get(`/cfas/${id}`).then((r) => r.data.data),
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

  if (!cfa) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">CFA Depot Not Found</h2>
        <button onClick={() => router.back()} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
          Return to CFAs
        </button>
      </div>
    );
  }

  const contactName = [cfa.contactFirstName, cfa.contactLastName].filter(Boolean).join(' ') || 'Depot In-charge';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" /> Back to CFA Depots
      </button>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-2xs">
            <Warehouse className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{cfa.name}</h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                Central Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {[cfa.city, cfa.state].filter(Boolean).join(', ')} · Code: {cfa.cfaCode || 'CFA-CENTRAL'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Depot Address & Warehouse
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Address</span>
              <span className="font-bold text-slate-800 text-right">{cfa.address || 'Central Industrial Area'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">City / State</span>
              <span className="font-bold text-slate-800">{cfa.city}, {cfa.state}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">PIN Code</span>
              <span className="font-mono font-bold text-slate-800">{cfa.pincode || '440001'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" /> Contact In-Charge
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Contact Person</span>
              <span className="font-bold text-slate-800">{contactName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phone</span>
              <span className="font-bold text-slate-800">{cfa.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Email</span>
              <span className="font-bold text-slate-800">{cfa.email || 'cfa@biocros.com'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
