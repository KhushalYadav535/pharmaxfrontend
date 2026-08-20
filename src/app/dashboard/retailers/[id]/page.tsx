'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Store, ArrowLeft, MapPin, Phone, Mail, FileText, Package, ShoppingCart, ClipboardList, Star, Activity, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RetailerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: retailer, isLoading } = useQuery({
    queryKey: ['retailer', id],
    queryFn: () => api.get(`/retailers/${id}`).then((r) => r.data.data),
  });

  const { data: auditData } = useQuery({
    queryKey: ['retailer-audits', id],
    queryFn: () => api.get(`/retail-audit/retailer/${id}`).then((r) => r.data.data).catch(() => []),
  });

  const categoryColor: Record<string, string> = {
    'A+': 'bg-purple-100 text-purple-700 border-purple-200',
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    B: 'bg-blue-100 text-blue-700 border-blue-200',
    C: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!retailer) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">Retailer not found</p>
      <button onClick={() => router.back()} className="mt-3 text-emerald-600 text-sm">← Go back</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{retailer.name}</h1>
            {retailer.category && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${categoryColor[retailer.category] || 'bg-gray-100 text-gray-600'}`}>
                {retailer.category} Category
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {[retailer.address, retailer.city, retailer.state, retailer.pincode].filter(Boolean).join(', ')}
          </p>
        </div>
        <Link href="/dashboard/visits" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          <ClipboardList className="w-4 h-4" /> Plan Visit
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Potential Score', value: `${retailer.potentialScore}/100`, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Visit Frequency', value: `${retailer.visitFrequency}x / month`, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Visits', value: retailer.visits?.length ?? 0, icon: ClipboardList, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Orders', value: retailer.orders?.length ?? 0, icon: ShoppingCart, color: 'text-purple-600 bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Retailer Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Owner', value: retailer.ownerName },
              { label: 'Pharmacist', value: retailer.pharmacistName },
              { label: 'Phone', value: retailer.phone },
              { label: 'Email', value: retailer.email },
              { label: 'GST Number', value: retailer.gstNumber, mono: true },
              { label: 'Drug License', value: retailer.drugLicenseNumber, mono: true },
              { label: 'License Expiry', value: retailer.drugLicenseExpiry ? formatDate(retailer.drugLicenseExpiry) : null },
              { label: 'Mapped Distributor', value: retailer.distributor?.name },
            ].map(({ label, value, mono }) => value ? (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Potential Score Visual */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Potential & Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">Potential Score</span>
                <span className="font-bold text-gray-900">{retailer.potentialScore}/100</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{ width: `${retailer.potentialScore}%` }} />
              </div>
            </div>
            {auditData?.length > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Last Audit Score</span>
                  <span className="font-bold text-gray-900">{auditData[0].totalScore}/100</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all" style={{ width: `${auditData[0].totalScore}%` }} />
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href={`/dashboard/retail-audit?retailerId=${retailer.id}`} className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> View all audits →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Visits</h2>
          <span className="text-xs text-gray-500">{retailer.visits?.length ?? 0} visits</span>
        </div>
        {retailer.visits?.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No visits recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {retailer.visits?.slice(0, 10).map((v: any) => (
              <div key={v.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(v.plannedDate)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.notes || 'No notes'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${v.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : v.status === 'MISSED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                    {v.status}
                  </span>
                  {v.durationMinutes && <span className="text-xs text-gray-400">{v.durationMinutes}m</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
