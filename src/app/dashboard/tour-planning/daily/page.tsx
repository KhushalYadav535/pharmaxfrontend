'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ChevronLeft, ChevronRight, CalendarDays, User, Building2, Store,
  Truck, ArrowRight, Calendar, Plus, Clock, X, Check, ArrowLeft,
  Navigation, Presentation, AlertCircle
} from 'lucide-react';

const TIME_PRESETS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

export default function DailyTourPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const initialDate = searchParams?.get('date') || new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const currentMonth = selectedDate.slice(0, 7);

  // Time slot modal
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedVisitForTime, setSelectedVisitForTime] = useState<any>(null);
  const [pickedTime, setPickedTime] = useState('10:00 AM');

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // 1. Fetch tour plans for the month
  const { data: plansData = [] } = useQuery({
    queryKey: ['tour-plans-list-daily', currentMonth],
    queryFn: () => api.get('/tour-plans', { params: { planMonth: currentMonth, limit: 1 } }).then((r) => r.data?.data?.tourPlans || []),
  });

  const latestPlanId = plansData.length > 0 ? plansData[0].id : null;

  // 2. Fetch specific plan details
  const { data: planDetail } = useQuery({
    queryKey: ['tour-plan-daily-detail', latestPlanId],
    queryFn: () => api.get(`/tour-plans/${latestPlanId}`).then((r) => r.data?.data),
    enabled: !!latestPlanId,
  });

  // 3. Fetch direct visits scheduled for the day
  const { data: directVisits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['direct-visits-daily', selectedDate],
    queryFn: () =>
      api
        .get('/visits', { params: { fromDate: selectedDate, toDate: selectedDate, limit: 50 } })
        .then((r) => r.data?.data?.visits || []),
  });

  // Mutation to update appointment slot
  const updateTimeMutation = useMutation({
    mutationFn: async ({ visitId, time }: { visitId: string; time: string }) => {
      return api.patch(`/visits/${visitId}/reschedule`, {
        newDate: `${selectedDate}T${time}`,
        reason: `Appointment slot updated to ${time}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direct-visits-daily'] });
      qc.invalidateQueries({ queryKey: ['today-visits'] });
      setTimeModalOpen(false);
      setSelectedVisitForTime(null);
    },
  });

  // Combine plan visits and direct visits
  const { mergedVisits, stats, areaLocation } = useMemo(() => {
    let planVisits: any[] = [];
    let location = 'Assigned Territory';

    if (planDetail?.days) {
      const selectedDayData = planDetail.days.find((x: any) => x.date?.slice(0, 10) === selectedDate);
      if (selectedDayData) {
        planVisits = selectedDayData.plannedVisits || [];
        if (selectedDayData.area?.name) location = selectedDayData.area.name;
      }
    }

    const planVisitIds = new Set(planVisits.map((v: any) => v.id));
    const all = [...planVisits, ...directVisits.filter((v: any) => !planVisitIds.has(v.id))];

    let doctors = 0;
    let hospitals = 0;
    let retailers = 0;
    let distributors = 0;

    all.forEach((v: any) => {
      const t = (v.visitType || '').toUpperCase();
      if (t === 'DOCTOR') doctors++;
      else if (t === 'HOSPITAL') hospitals++;
      else if (t === 'RETAILER') retailers++;
      else if (t === 'DISTRIBUTOR') distributors++;
    });

    const estTravel = Math.round(all.length * 3.8);

    return {
      mergedVisits: all,
      stats: { total: all.length, doctors, hospitals, retailers, distributors, estTravel },
      areaLocation: location,
    };
  }, [planDetail, directVisits, selectedDate]);

  const handleOpenTimeModal = (visit: any) => {
    setSelectedVisitForTime(visit);
    setPickedTime('10:00 AM');
    setTimeModalOpen(true);
  };

  const handleSaveTime = () => {
    if (!selectedVisitForTime) return;
    updateTimeMutation.mutate({
      visitId: selectedVisitForTime.id,
      time: pickedTime,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tour-planning"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Daily Tour Execution & Itinerary</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {areaLocation}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Day-by-day field itinerary dispatch, appointment slot scheduling & call sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/tour-planning/my-plans"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Monthly Plan Calendar
          </Link>
          <Link
            href="/dashboard/visits/plan-new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Visits
          </Link>
        </div>
      </div>

      {/* ── DAY SELECTOR CONTROL ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-emerald-500"
          />
          <button
            type="button"
            onClick={handleNextDay}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>
            {new Date(selectedDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Calls</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Doctors</div>
          <div className="text-xl font-black text-emerald-700 mt-1">{stats.doctors}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Hospitals</div>
          <div className="text-xl font-black text-sky-700 mt-1">{stats.hospitals}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Retailers</div>
          <div className="text-xl font-black text-purple-700 mt-1">{stats.retailers}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Est. Travel</div>
          <div className="text-xl font-black text-amber-700 mt-1">~{stats.estTravel} km</div>
        </div>
      </div>

      {/* ── ITINERARY CALLS LIST ── */}
      <div className="space-y-3">
        {mergedVisits.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Field Calls Scheduled for This Day</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no visits planned for {selectedDate}. You can schedule visits using the Batch Day Planner or add an Unplanned Call.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/dashboard/visits/plan-new?date=${selectedDate}`}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm"
              >
                Plan Visits for {selectedDate}
              </Link>
            </div>
          </div>
        ) : (
          mergedVisits.map((v: any, index: number) => {
            const vType = (v.visitType || 'DOCTOR').toUpperCase();
            const title = v.doctor
              ? `${v.doctor.salutation || 'Dr.'} ${v.doctor.firstName} ${v.doctor.lastName}`
              : (v.retailer?.name || v.hospital?.name || v.distributor?.name || 'Account');
            const sub = v.doctor?.specialty || v.retailer?.city || v.hospital?.city || vType;
            const address = v.doctor?.clinicAddress || v.retailer?.address || v.hospital?.address;

            return (
              <div
                key={v.id || index}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">{title}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {vType}
                      </span>
                      {v.status && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {v.status}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium">
                      {sub} {address && ` · ${address}`}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Slot: {v.plannedDate ? new Date(v.plannedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:00 AM'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenTimeModal(v)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Adjust Slot
                  </button>

                  {vType === 'DOCTOR' && v.doctorId && (
                    <Link
                      href={`/dashboard/digital-detailing?doctorId=${v.doctorId}&visitId=${v.id}`}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
                    >
                      Detailing
                    </Link>
                  )}

                  <Link
                    href={`/dashboard/visits/${v.id}`}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                  >
                    Dossier
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── TIME SLOT MODAL ── */}
      {timeModalOpen && selectedVisitForTime && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">Set Appointment Slot</h3>
              </div>
              <button
                onClick={() => setTimeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {TIME_PRESETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPickedTime(t)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    pickedTime === t
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setTimeModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTime}
                disabled={updateTimeMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {updateTimeMutation.isPending ? 'Saving...' : 'Set Time Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
