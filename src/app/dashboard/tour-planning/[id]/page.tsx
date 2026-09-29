'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Calendar, ArrowLeft, CheckCircle, XCircle, Clock, MapPin, Users,
  Building2, Stethoscope, Store, Truck, ShieldCheck, Printer, AlertCircle,
  ChevronRight, CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export default function TourPlanDossierPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const id = params?.id as string;

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const { data: tp, isLoading, isError } = useQuery({
    queryKey: ['tour-plan-detail', id],
    queryFn: async () => {
      const res = await api.get(`/tour-plans/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const { data: coverage } = useQuery({
    queryKey: ['tour-plan-coverage', id],
    queryFn: async () => {
      const res = await api.get(`/tour-plans/${id}/coverage`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: 'APPROVED' | 'REJECTED'; reason?: string }) => {
      return api.patch(`/tour-plans/${id}/status`, { status, rejectionReason: reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-plan-detail', id] });
      qc.invalidateQueries({ queryKey: ['tour-plans'] });
      setRejectModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 space-y-4">
        <div className="h-10 bg-slate-100 rounded-2xl w-48 animate-pulse" />
        <div className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !tp) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Tour Plan Not Found</h2>
        <p className="text-xs text-slate-500">The requested monthly tour plan could not be located or you may not have permission to view it.</p>
        <Link href="/dashboard/tour-planning" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Tour Planning
        </Link>
      </div>
    );
  }

  const days = tp.days || [];
  const selectedDay = days[activeDayIndex] || days[0];
  const isPending = tp.approvalStatus === 'PENDING';
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Monthly Tour Plan (MTP)
              </h1>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  tp.approvalStatus === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tp.approvalStatus === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                }`}
              >
                {tp.approvalStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Plan #{tp.id.slice(-6)} · {tp.planMonth || 'Monthly Schedule'} · Rep: {tp.user?.firstName} {tp.user?.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print MTP Sheet
          </button>

          {isAdminOrManager && isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={statusMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject Plan
              </button>
              <button
                onClick={() => statusMutation.mutate({ status: 'APPROVED' })}
                disabled={statusMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Approve MTP
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Metadata Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Medical Representative</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {tp.user?.firstName} {tp.user?.lastName}
            </p>
            <span className="text-xs text-slate-500 font-mono">ID: {tp.user?.employeeId || tp.userId?.slice(-6)}</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Headquarter & Territory</span>
            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {tp.hq?.name || 'Assigned HQ'}
            </p>
            <p className="text-xs text-slate-500">{tp.location?.name || tp.area?.name || 'Territory Core'}</p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tour Schedule</span>
            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              {tp.tourFromDate ? formatDate(tp.tourFromDate) : tp.planMonth}
            </p>
            {tp.tourToDate && <p className="text-xs text-slate-500">To: {formatDate(tp.tourToDate)}</p>}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Joint Field Work</span>
            <p className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              {tp.jointVisit ? `Yes (${tp.jointVisitWith || 'Manager'})` : 'Independent Visit'}
            </p>
            <p className="text-xs text-slate-500 truncate" title={tp.tourPurpose}>{tp.tourPurpose || 'Standard Coverage'}</p>
          </div>
        </div>

        {tp.rejectionReason && (
          <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Manager Rejection Remarks:</span> {tp.rejectionReason}
            </div>
          </div>
        )}
      </div>

      {/* Coverage & KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Scheduled Days</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{days.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Planned field days</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Planned Doctor Calls</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {coverage?.totalDoctorsPlanned || days.reduce((sum: number, d: any) => sum + (d.plannedVisits?.filter((v: any) => v.doctorId)?.length || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Target physicians</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chemist & Trade Calls</span>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {coverage?.totalRetailersPlanned || days.reduce((sum: number, d: any) => sum + (d.plannedVisits?.filter((v: any) => v.retailerId || v.stockistId)?.length || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Retailers & Stockists</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hospital & Institutional</span>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {days.reduce((sum: number, d: any) => sum + (d.plannedVisits?.filter((v: any) => v.hospitalId)?.length || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Hospital departments</p>
        </div>
      </div>

      {/* Day-by-Day Agenda Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Days Rail */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-2 max-h-[600px] overflow-y-auto">
          <div className="px-2 py-1 mb-2">
            <h3 className="font-bold text-slate-900 text-sm">Monthly Tour Days</h3>
            <p className="text-xs text-slate-500">Select a day to inspect planned visits</p>
          </div>

          {days.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No specific day visits added yet.</p>
          ) : (
            days.map((day: any, idx: number) => {
              const isSelected = idx === activeDayIndex;
              const visitCount = day.plannedVisits?.length || 0;
              return (
                <button
                  key={day.id || idx}
                  onClick={() => setActiveDayIndex(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {day.date ? formatDate(day.date) : `Day ${idx + 1}`}
                      </p>
                      <p className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                        Area: {day.area?.name || tp.hq?.name || 'Assigned Beat'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {visitCount} calls
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Day Visits Inspector */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {selectedDay?.date ? formatDate(selectedDay.date) : `Day ${activeDayIndex + 1}`} Planned Visits
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Area: {selectedDay?.area?.name || tp.hq?.name || 'Local Territory'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {selectedDay?.plannedVisits?.length || 0} Targets Planned
            </span>
          </div>

          <div className="space-y-3">
            {(!selectedDay?.plannedVisits || selectedDay.plannedVisits.length === 0) ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <CalendarDays className="w-9 h-9 mx-auto opacity-30 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">No visits planned for this day yet.</p>
              </div>
            ) : (
              selectedDay.plannedVisits.map((pv: any, vIdx: number) => {
                const doc = pv.doctor;
                const ret = pv.retailer;
                const hosp = pv.hospital;
                const stk = pv.stockist || pv.distributor;

                return (
                  <div key={pv.id || vIdx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {doc ? (
                          <Stethoscope className="w-5 h-5 text-emerald-600" />
                        ) : ret ? (
                          <Store className="w-5 h-5 text-blue-600" />
                        ) : hosp ? (
                          <Building2 className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Truck className="w-5 h-5 text-amber-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {doc ? `Dr. ${doc.firstName} ${doc.lastName}` : ret ? ret.name : hosp ? hosp.name : stk ? stk.name : 'Target Entity'}
                          </p>
                          {doc?.classification && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              Class {doc.classification}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {doc?.specialty || (ret ? 'Chemist / Retailer' : hosp ? 'Hospital / Clinic' : 'Distribution Partner')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {pv.visitType || (doc ? 'DOCTOR' : ret ? 'RETAILER' : hosp ? 'HOSPITAL' : 'TRADE')}
                      </span>
                      {pv.priority && (
                        <p className="text-[10px] font-semibold text-amber-600 mt-1">Priority: {pv.priority}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Reject Monthly Tour Plan</h3>
            <p className="text-xs text-slate-500">
              Please state why this tour plan is rejected so the representative can adjust their schedule.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Doctor coverage in South Zone is below quota; please add 5 more Class-A doctors."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => statusMutation.mutate({ status: 'REJECTED', reason: rejectionReason })}
                disabled={statusMutation.isPending || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
