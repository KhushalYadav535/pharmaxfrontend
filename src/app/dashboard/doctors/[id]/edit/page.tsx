'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import DoctorForm from '@/components/doctors/DoctorForm';
import { ArrowLeft, Loader2, Stethoscope, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function EditDoctorPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'].includes(user?.role || '');
  const id = params?.id as string;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: doctor, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: () => api.delete(`/doctors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      router.push('/dashboard/doctors');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete doctor');
    },
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

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Delete this doctor record"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete Doctor
            </button>
          )}
          <Link
            href={`/dashboard/doctors/${id}`}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors"
          >
            View Full Dossier
          </Link>
        </div>
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

      {/* ──────────────── MODAL: CONFIRM DELETE DOCTOR ──────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Doctor Profile?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {doctor.doctorName || doctor.name || `Dr. ${doctor.firstName} ${doctor.lastName}`} ({doctor.doctorCode || 'Doctor'})
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Warning
              </p>
              <p>
                Deleting this doctor will remove them from active field lists, MR tour plans, and doctor directories. Existing past visits and order records will be preserved for audit history.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteDoctorMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteDoctorMutation.mutate()}
                disabled={deleteDoctorMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {deleteDoctorMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
