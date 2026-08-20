'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Truck, ArrowLeft, Store, ClipboardList, AlertTriangle, Package, MapPin, Phone, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DistributorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: dist, isLoading } = useQuery({
    queryKey: ['distributor', id],
    queryFn: () => api.get(`/distributors/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!dist) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">Distributor not found</p>
      <button onClick={() => router.back()} className="mt-3 text-emerald-600 text-sm">← Go back</button>
    </div>
  );

  const creditUtil = dist.creditLimit > 0 ? Math.min(100, (dist.outstandingAmount / dist.creditLimit) * 100) : 0;
  const isOverdue = creditUtil >= 80;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{dist.name}</h1>
            {isOverdue && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {[dist.address, dist.city, dist.state].filter(Boolean).join(', ')}
          </p>
        </div>
        <Link href="/dashboard/visits" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
          <ClipboardList className="w-4 h-4" /> Plan Visit
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Credit Limit', value: `₹${dist.creditLimit?.toLocaleString()}`, icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
          { label: 'Outstanding', value: `₹${dist.outstandingAmount?.toLocaleString()}`, icon: AlertTriangle, color: `${isOverdue ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'}` },
          { label: 'Retailers', value: dist.retailers?.length ?? 0, icon: Store, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Visits', value: dist.visits?.length ?? 0, icon: ClipboardList, color: 'text-purple-600 bg-purple-50' },
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
        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Distributor Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Owner', value: dist.ownerName },
              { label: 'Phone', value: dist.phone },
              { label: 'Email', value: dist.email },
              { label: 'GST Number', value: dist.gstNumber, mono: true },
              { label: 'Drug License', value: dist.drugLicenseNumber, mono: true },
              { label: 'Warehouse', value: dist.warehouseAddress },
              { label: 'Credit Days', value: dist.creditDays ? `${dist.creditDays} days` : null },
            ].map(({ label, value, mono }) => value ? (
              <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Credit Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Credit Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Credit Utilization</span>
              <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>{creditUtil.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : creditUtil >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${creditUtil}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>₹0</span>
              <span>₹{dist.creditLimit?.toLocaleString()}</span>
            </div>
            {isOverdue && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Credit utilization above 80%. Payment follow-up required.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retailers List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Linked Retailers ({dist.retailers?.length ?? 0})</h2>
        </div>
        {dist.retailers?.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No retailers linked to this distributor</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dist.retailers?.map((r: any) => (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Store className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.city || '—'}</p>
                  </div>
                </div>
                <Link href={`/dashboard/retailers/${r.id}`} className="text-xs text-emerald-600 font-medium hover:underline">View →</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Visits</h2>
        </div>
        {dist.visits?.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No visits recorded</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dist.visits?.slice(0, 8).map((v: any) => (
              <div key={v.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(v.plannedDate)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.notes || 'No notes'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${v.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
