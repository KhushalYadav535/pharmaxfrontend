'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ChevronLeft, ChevronRight, CalendarDays, User, Building2, Store,
  Truck, ArrowRight, Calendar, ArrowLeft, Clock, MapPin, AlertCircle
} from 'lucide-react';

export default function MyTourPlansCalendarPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  // 1. Fetch Plan List for selected month
  const { data: plansData = [], isLoading: loadingList } = useQuery({
    queryKey: ['my-tour-plans-list-cal', currentMonth],
    queryFn: () => api.get('/tour-plans', { params: { planMonth: currentMonth, limit: 1 } }).then((r) => r.data?.data?.tourPlans || []),
  });

  const latestPlanId = plansData.length > 0 ? plansData[0].id : null;

  // 2. Fetch Plan Details
  const { data: planDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['my-tour-plan-cal-detail', latestPlanId],
    queryFn: () => api.get(`/tour-plans/${latestPlanId}`).then((r) => r.data?.data),
    enabled: !!latestPlanId,
  });

  // Calculate full month grid
  const monthGrid = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const days = planDetail?.days || [];
    const grid: any[] = [];

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }

    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayNum = i < 10 ? `0${i}` : `${i}`;
      const dateStr = `${currentMonth}-${dayNum}`;
      const dayData = days.find((x: any) => x.date?.slice(0, 10) === dateStr);
      const isSelected = dateStr === selectedDate;
      const count = dayData?.plannedVisits?.length || 0;

      grid.push({
        dateStr,
        dayNum: i,
        isSelected,
        dayData,
        count,
        area: dayData?.area?.name || '',
      });
    }

    return grid;
  }, [currentMonth, selectedDate, planDetail]);

  // Selected Day data
  const selectedDayInfo = useMemo(() => {
    if (!planDetail?.days) return null;
    return planDetail.days.find((x: any) => x.date?.slice(0, 10) === selectedDate);
  }, [planDetail, selectedDate]);

  const visitsForSelectedDay = selectedDayInfo?.plannedVisits || [];

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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Monthly Tour Plan Calendar</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {planDetail?.approvalStatus || 'Active Plan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive month-at-a-glance territory coverage and daily visit allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/tour-planning/daily?date=${selectedDate}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            Daily Execution Itinerary
          </Link>
        </div>
      </div>

      {/* ── MONTH SWITCHER & STATS ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-slate-900 px-3">
            {new Date(`${currentMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <span>Headquarters: <strong className="text-slate-900">{planDetail?.hq?.name || 'Assigned HQ'}</strong></span>
          <span>Total Working Days: <strong className="text-emerald-700">{planDetail?.days?.length || 0}</strong></span>
        </div>
      </div>

      {/* ── MAIN CALENDAR GRID & DAY DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center font-black text-[11px] text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthGrid.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-20 rounded-2xl bg-slate-50/50" />;
              }

              const isSelected = item.dateStr === selectedDate;
              const hasVisits = item.count > 0;

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`h-20 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200 shadow-2xs'
                      : hasVisits
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/60 border-slate-150 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {item.dayNum}
                    </span>
                    {hasVisits && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {hasVisits ? (
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 block truncate">
                        {item.count} calls
                      </span>
                      {item.area && (
                        <span className="text-[9px] text-slate-500 block truncate font-medium">
                          {item.area}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-medium">Off / No Plan</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Day Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Selected Day Overview
              </span>
              <h3 className="text-base font-black text-slate-900">
                {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
              </h3>
            </div>
            <Link
              href={`/dashboard/tour-planning/daily?date=${selectedDate}`}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Open Day <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {selectedDayInfo?.area?.name && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Territory Route</span>
                <span className="font-bold text-slate-900">{selectedDayInfo.area.name}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Scheduled Calls ({visitsForSelectedDay.length})
            </span>

            {visitsForSelectedDay.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No calls allocated for this date.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {visitsForSelectedDay.map((v: any, i: number) => {
                  const title = v.doctor
                    ? `${v.doctor.salutation || 'Dr.'} ${v.doctor.firstName} ${v.doctor.lastName}`
                    : (v.retailer?.name || v.hospital?.name || 'Account');

                  return (
                    <div
                      key={v.id || i}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{title}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {v.doctor?.specialty || v.visitType}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/visits/${v.id}`}
                        className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
