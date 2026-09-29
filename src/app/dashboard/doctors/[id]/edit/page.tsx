'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import DoctorForm from '@/components/doctors/DoctorForm';
import { ArrowLeft, Loader2, Stethoscope } from 'lucide-react';
import Link from 'next/link';

export default function EditDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: doctor, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading doctor details for editing...</p>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          {(error as any)?.response?.data?.message || 'The requested doctor could not be found or you may not have permission to edit this profile.'}
        </p>
        <Link
          href="/dashboard/doctors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Doctor Profile</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Modify master details for {doctor.doctorName || doctor.name || 'Doctor'} ({doctor.doctorCode || 'KOL'})
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/doctors/${id}`}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors"
        >
          View Full Dossier
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <DoctorForm
          doctorId={id}
          initialData={doctor}
          onSuccess={() => {
            router.push(`/dashboard/doctors/${id}`);
          }}
        />
      </div>
    </div>
  );
}
