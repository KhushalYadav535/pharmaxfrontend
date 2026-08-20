'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Building2, Users, MapPin, Phone, ChevronLeft, ClipboardList } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate, CLASSIFICATION_COLORS } from '@/lib/utils';

export default function HospitalDetailPage() {
  const { id } = useParams();

  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital', id],
    queryFn: () => api.get(`/hospitals/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Hospital not found</p>
        <Link href="/dashboard/hospitals" className="text-emerald-600 font-medium text-sm mt-2 block">← Back to Hospitals</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/hospitals" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Hospitals
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{hospital.name}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">{hospital.category || 'Hospital'}</span>
              {hospital.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{hospital.city}, {hospital.state}</span>}
              {hospital.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{hospital.phone}</span>}
              {hospital.beds && <span>{hospital.beds} beds</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{hospital.doctors?.length || 0}</p>
            <p className="text-xs text-gray-500">Affiliated Doctors</p>
          </div>
        </div>
      </div>

      {/* Affiliated Doctors */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Affiliated Doctors ({hospital.doctors?.length || 0})
          </h2>
        </div>
        {hospital.doctors?.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No affiliated doctors</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {hospital.doctors?.map((doctor: any) => (
              <Link key={doctor.id} href={`/dashboard/doctors/${doctor.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">Dr. {doctor.firstName} {doctor.lastName}</p>
                  <p className="text-xs text-gray-500">{doctor.specialty}</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Visits */}
      {hospital.visits?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" /> Recent Visits
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {hospital.visits.map((visit: any) => (
              <div key={visit.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{visit.purpose || 'Visit'}</p>
                  <p className="text-xs text-gray-500">{formatDate(visit.checkInTime || visit.plannedDate)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${visit.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{visit.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
