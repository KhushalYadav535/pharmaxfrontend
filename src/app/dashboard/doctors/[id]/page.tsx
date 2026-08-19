'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate, CLASSIFICATION_COLORS, VISIT_STATUS_COLORS } from '@/lib/utils';
import { ArrowLeft, Phone, MapPin, Star, Building2, Calendar, Package, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.get(`/doctors/${id}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-gray-400">Doctor not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
            {data.firstName[0]}{data.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Dr. {data.firstName} {data.lastName}</h1>
              {data.isKol && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
                  <Star className="w-3 h-3" /> KOL
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${CLASSIFICATION_COLORS[data.classification]}`}>
                {data.classification.replace('_', '+')}
              </span>
            </div>
            <p className="text-gray-600">{data.specialty}{data.subSpecialty ? ` · ${data.subSpecialty}` : ''}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              {data.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{data.phone}</span>}
              {(data.city || data.state) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[data.city, data.state].filter(Boolean).join(', ')}</span>}
              {data.hospital && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{data.hospital.name}</span>}
            </div>
          </div>
          <Link href={`/dashboard/doctors/${id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">
            <Edit2 className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Rx Potential', value: `${data.prescriptionPotential}/10`, icon: Star },
          { label: 'Total Visits', value: data.visits?.length ?? 0, icon: Calendar },
          { label: 'Samples Given', value: data.sampleDistributions?.length ?? 0, icon: Package },
          { label: 'Visit Frequency', value: `${data.visitFrequency}x/month`, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <Icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" /> Visit History
        </h2>
        {data.visits && data.visits.length > 0 ? (
          <div className="space-y-3">
            {data.visits.map((visit: any) => (
              <div key={visit.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  visit.status === 'COMPLETED' ? 'bg-emerald-500' : visit.status === 'PLANNED' ? 'bg-blue-400' : 'bg-red-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{formatDate(visit.plannedDate)}</p>
                  {visit.productsDiscussed?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">Products: {visit.productsDiscussed.join(', ')}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${VISIT_STATUS_COLORS[visit.status]}`}>
                  {visit.status}
                </span>
                <span className="text-xs text-gray-400">{visit.durationMinutes ? `${visit.durationMinutes} min` : ''}</span>
                {visit.user && (
                  <span className="text-xs text-gray-400">{visit.user.firstName}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No visits recorded yet</p>
            <Link href="/dashboard/visits" className="text-emerald-600 text-sm font-medium mt-1 block">Plan a visit →</Link>
          </div>
        )}
      </div>

      {/* Sample History */}
      {data.sampleDistributions && data.sampleDistributions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Sample History
          </h2>
          <div className="space-y-3">
            {data.sampleDistributions.map((sd: any) => (
              <div key={sd.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sd.sampleProduct?.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(sd.distributedAt)}</p>
                </div>
                <div className="ml-auto text-sm font-semibold text-gray-700">{sd.quantity} units</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
