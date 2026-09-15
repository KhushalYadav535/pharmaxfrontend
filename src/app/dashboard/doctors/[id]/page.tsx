'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatDate, CLASSIFICATION_COLORS, VISIT_STATUS_COLORS } from '@/lib/utils';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Star,
  Building2,
  Calendar,
  Package,
  Edit2,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Building,
  Mail,
  Store,
  Clock,
  Layers,
  Check,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch Doctor details
  const { data, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.get(`/doctors/${id}`).then((r) => r.data.data),
  });

  // Fetch Categories for switcher modal
  const { data: catData } = useQuery({
    queryKey: ['detailing-categories-list'],
    queryFn: () => api.get('/content/categories').then((r) => r.data.data),
  });
  const categoriesList = Array.isArray(catData) ? catData : [];

  // Mutation to update Doctor Category
  const updateCategoryMutation = useMutation({
    mutationFn: (newCategory: string) =>
      api.put(`/doctors/${id}`, {
        category: newCategory,
        specialty: newCategory,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
      setIsCategoryModalOpen(false);
    },
  });

  // Mutation for 1-click Approve / Reject
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'APPROVED' | 'REJECTED') =>
      api.post(`/approvals/entities/Doctor/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['approvals-summary'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-16 text-slate-400 font-semibold">Doctor not found</div>;

  const isPending = data.approvalStatus === 'PENDING';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Doctor Directory
        </button>

        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateStatusMutation.mutate('REJECTED')}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject Doctor
              </button>
              <button
                onClick={() => updateStatusMutation.mutate('APPROVED')}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Approve Doctor
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedCategory(data.category || data.specialty || '');
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" /> Switch Category
          </button>

          <Link
            href={`/dashboard/doctors/${id}/edit`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Doctor
          </Link>
        </div>
      </div>

      {/* Main Doctor Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-700/20">
              {data.firstName?.[0] || 'D'}{data.lastName?.[0] || 'R'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {data.salutation || 'Dr.'} {data.firstName} {data.lastName}
                </h1>
                {data.doctorCode && (
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                    {data.doctorCode}
                  </span>
                )}
                {data.isKol && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> KOL
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {data.qualification && (
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {data.qualification}
                  </span>
                )}
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Category: {data.category || data.specialty || 'General'}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold ${CLASSIFICATION_COLORS[data.classification]}`}>
                  Class {data.classification.replace('_', '+')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    data.approvalStatus === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : data.approvalStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {data.approvalStatus || 'APPROVED'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                {data.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {data.phone}
                  </span>
                )}
                {(data.city || data.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {[data.city, data.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {data.hq?.name && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> HQ: {data.hq.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Rx Potential', value: `${data.prescriptionPotential}/10`, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Visits Recorded', value: data.visits?.length ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Samples Distributed', value: data.sampleDistributions?.length ?? 0, icon: Package, color: 'text-purple-600 bg-purple-50' },
          { label: 'Visit Frequency', value: `${data.visitFrequency || 1}x / month`, icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 text-center">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Master Information Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" /> Master Profile & Territory Mapping
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Doctor Code</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{data.doctorCode || 'DOC-UNASSIGNED'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Headquarter (HQ)</span>
            <span className="font-bold text-slate-900 text-sm">{data.hq?.name || data.territory?.name || 'Nagpur Headquarter'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Area</span>
            <span className="font-bold text-slate-900 text-sm">{data.area?.name || data.city || 'Central Area'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Detailing Category</span>
            <span className="font-bold text-emerald-800 text-sm">{data.category || data.specialty || 'General'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Specialty & Degree</span>
            <span className="font-bold text-slate-900 text-sm">{data.qualification || 'MBBS'} ({data.specialty})</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Prescribing Retailer / Chemist</span>
            <span className="font-bold text-slate-900 text-sm">{data.retailer?.name || 'Primary Territory Chemist'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinic / Hospital</span>
            <span className="font-bold text-slate-900 text-sm">{data.hospital?.name || data.address1 || 'Private Clinic'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Mobile & WhatsApp</span>
            <span className="font-bold text-slate-900 text-sm">{data.phone || data.whatsappNumber || 'Not provided'}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Email ID</span>
            <span className="font-bold text-slate-900 text-sm">{data.email || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Visit History Log */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" /> Recent Field Visits
        </h2>

        {data.visits && data.visits.length > 0 ? (
          <div className="space-y-3">
            {data.visits.map((visit: any) => (
              <div
                key={visit.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all bg-slate-50/50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      visit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-slate-900">
                      Visit on {formatDate(visit.plannedDate || visit.checkInTime)}
                    </p>
                    {visit.user && (
                      <p className="text-slate-500 text-[11px]">
                        By {visit.user.firstName} {visit.user.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {visit.pobAmount > 0 && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      POB: {visit.pobAmount}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${VISIT_STATUS_COLORS[visit.status]}`}
                  >
                    {visit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-xs">No field visits logged for this doctor yet.</p>
          </div>
        )}
      </div>

      {/* ──────────────── MODAL: CATEGORY SWITCHER ──────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Switch Detailing Category</h3>
                  <p className="text-xs text-slate-500">Dr. {data.firstName} {data.lastName} ({data.doctorCode})</p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              <p className="text-xs text-slate-600 font-medium">
                Select the target specialty detailing category. All relevant Biocros medicines mapped to this category will automatically be featured during digital detailing calls:
              </p>

              <div className="space-y-2">
                {categoriesList.map((cat: any) => {
                  const isChecked = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id || cat.key}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{cat.name}</p>
                        <p className="text-[11px] text-slate-500">{cat.productsCount || 0} Biocros products mapped</p>
                      </div>
                      {isChecked && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateCategoryMutation.mutate(selectedCategory)}
                disabled={updateCategoryMutation.isPending || !selectedCategory}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {updateCategoryMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Category Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
