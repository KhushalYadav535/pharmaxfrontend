'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Plus, CheckCircle2, Clock, MapPin, CheckSquare,
  AlertCircle, Users, Stethoscope, Store, Building2,
  Truck, ArrowRight, Filter, Search, ShieldCheck,
  Check, RefreshCw, ShoppingCart, Package, ExternalLink
} from 'lucide-react';

type VisitType = 'DOCTOR' | 'RETAILER' | 'HOSPITAL' | 'DISTRIBUTOR';

const VISIT_TYPE_THEME: Record<string, { bg: string; text: string; dot: string; label: string; icon: any }> = {
  DOCTOR:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Doctor', icon: Stethoscope },
  RETAILER:    { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  label: 'Chemist', icon: Store },
  HOSPITAL:    { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500',     label: 'Hospital', icon: Building2 },
  DISTRIBUTOR: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Distributor', icon: Truck },
};

function getEntityName(visit: any): string {
  if (visit.doctor) return `${visit.doctor.salutation || 'Dr.'} ${visit.doctor.firstName} ${visit.doctor.lastName}`;
  if (visit.retailer) return visit.retailer.name;
  if (visit.hospital) return visit.hospital.name;
  if (visit.distributor) return visit.distributor.name;
  return 'Direct Call';
}

function getEntitySub(visit: any): string {
  if (visit.doctor) return `${visit.doctor.specialty || 'Doctor'} · ${visit.doctor.city || 'Territory'}`;
  if (visit.retailer) return `${visit.retailer.city || 'Retailer'}`;
  if (visit.hospital) return `${visit.hospital.city || 'Hospital'}`;
  if (visit.distributor) return `${visit.distributor.city || 'Distributor'}`;
  return '';
}

export default function FieldCalendarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentMonth, setCurrentMonth] = useState<string>(todayStr.slice(0, 7)); // YYYY-MM
  const [activeTab, setActiveTab] = useState<'ALL' | 'VISITS' | 'TASKS'>('ALL');
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Month navigation
  const [year, monthNum] = currentMonth.split('-').map(Number);
  const handlePrevMonth = () => {
    const d = new Date(year, monthNum - 2, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(mStr);
    setSelectedDate(`${mStr}-01`);
  };

  const handleNextMonth = () => {
    const d = new Date(year, monthNum, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(mStr);
    setSelectedDate(`${mStr}-01`);
  };

  const handleJumpToday = () => {
    setCurrentMonth(todayStr.slice(0, 7));
    setSelectedDate(todayStr);
  };

  // Month bounds
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay(); // 0 is Sunday
  const monthStart = `${currentMonth}-01`;
  const monthEnd = `${currentMonth}-${String(daysInMonth).padStart(2, '0')}`;

  // 1. Fetch visits for the entire month
  const { data: monthVisits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['calendar-month-visits', currentMonth, selectedRep],
    queryFn: () =>
      api.get('/visits', {
        params: {
          fromDate: monthStart,
          toDate: monthEnd,
          userId: selectedRep || undefined,
          limit: 500,
        },
      }).then(r => r.data?.data?.visits || []),
  });

  // 2. Fetch tasks for the entire month
  const { data: monthTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['calendar-month-tasks', currentMonth, selectedRep],
    queryFn: () =>
      api.get('/tasks', {
        params: {
          fromDate: monthStart,
          toDate: monthEnd,
          userId: selectedRep || undefined,
          limit: 200,
        },
      }).then(r => r.data?.data?.tasks || []),
  });

  // 3. Fetch team members (MRs) for manager dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['calendar-employees-list'],
    queryFn: () => api.get('/employees', { params: { limit: 200 } }).then(r => r.data?.data?.employees || []),
  });

  const reps = useMemo(() => {
    return employees.filter((e: any) => ['MR', 'TRADE_REP', 'DISTRIBUTOR_REP', 'ASM'].includes(e.role));
  }, [employees]);

  // Map events to date strings
  const visitsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    monthVisits.forEach((v: any) => {
      const d = (v.plannedDate || v.checkInTime || '').slice(0, 10);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(v);
      }
    });
    return map;
  }, [monthVisits]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    monthTasks.forEach((t: any) => {
      const d = (t.dueDate || t.createdAt || '').slice(0, 10);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [monthTasks]);

  // Selected Day Data
  const selectedDayVisits = useMemo(() => {
    const list = visitsByDate[selectedDate] || [];
    if (typeFilter === 'ALL') return list;
    return list.filter((v: any) => v.visitType === typeFilter);
  }, [visitsByDate, selectedDate, typeFilter]);

  const selectedDayTasks = tasksByDate[selectedDate] || [];

  // Day Stats
  const dayStats = useMemo(() => {
    let docs = 0, chemists = 0, hospitals = 0, distributors = 0, completed = 0;
    selectedDayVisits.forEach((v: any) => {
      if (v.status === 'COMPLETED') completed++;
      if (v.visitType === 'DOCTOR') docs++;
      else if (v.visitType === 'RETAILER') chemists++;
      else if (v.visitType === 'HOSPITAL') hospitals++;
      else if (v.visitType === 'DISTRIBUTOR') distributors++;
    });
    return {
      total: selectedDayVisits.length,
      completed,
      docs,
      chemists,
      hospitals,
      distributors,
    };
  }, [selectedDayVisits]);

  // Toggle task complete mutation
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.patch(`/tasks/${id}`, { status: completed ? 'COMPLETED' : 'IN_PROGRESS' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-month-tasks'] });
    },
  });

  const monthName = new Date(year, monthNum - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100 shadow-2xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Field Activity & Tour Calendar
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Comprehensive schedule of doctor calls, chemist coverage, tasks, and monthly tour plans (MTP).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Manager Rep Selector */}
          {isAdminOrManager && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Rep:</span>
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">All Field Reps (Consolidated)</option>
                {reps.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} ({r.role}) {r.hq?.name ? `- ${r.hq.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/dashboard/visits/monitor"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <span>Live Monitor</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard/visits"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Call</span>
          </Link>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT: CALENDAR GRID + DAY AGENDA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Monthly Calendar Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          {/* Month Switcher Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{monthName}</h2>
              <button
                onClick={handleJumpToday}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((wd, i) => (
              <div
                key={wd}
                className={`py-1.5 text-[11px] font-black uppercase tracking-wider ${
                  i === 0 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Month Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-16 rounded-2xl bg-slate-50/50 opacity-40 border border-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentMonth}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              const vList = visitsByDate[dateStr] || [];
              const tList = tasksByDate[dateStr] || [];

              const hasVisits = vList.length > 0;
              const hasTasks = tList.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 rounded-2xl p-2 flex flex-col justify-between text-left transition-all border relative group ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : ''}`}>
                      {dayNum}
                    </span>
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {/* Badges / indicators */}
                  <div className="flex flex-wrap items-center gap-1">
                    {hasVisits && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {vList.length} call{vList.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {hasTasks && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {tList.length} task{tList.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Doctor Calls
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Chemist Calls
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Hospital Calls
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Distributor Calls
            </span>
          </div>
        </div>

        {/* Right Column: Selected Day Agenda & Detail (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Day Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Schedule Agenda
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                {dayStats.total} Field Event{dayStats.total !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Doctors</span>
                <span className="text-base font-black text-emerald-900">{dayStats.docs}</span>
              </div>
              <div className="bg-purple-50 p-2 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Chemists</span>
                <span className="text-base font-black text-purple-900">{dayStats.chemists}</span>
              </div>
              <div className="bg-sky-50 p-2 rounded-xl border border-sky-100">
                <span className="text-[10px] font-bold text-sky-800 uppercase block">Hospitals</span>
                <span className="text-base font-black text-sky-900">{dayStats.hospitals}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Tasks</span>
                <span className="text-base font-black text-slate-900">{selectedDayTasks.length}</span>
              </div>
            </div>

            {/* Tabs for Agenda */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(['ALL', 'VISITS', 'TASKS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'ALL' ? 'All Items' : tab === 'VISITS' ? `Visits (${selectedDayVisits.length})` : `Tasks (${selectedDayTasks.length})`}
                </button>
              ))}
            </div>

            {/* Entity Filter (only when in ALL or VISITS) */}
            {activeTab !== 'TASKS' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'DOCTOR', 'RETAILER', 'HOSPITAL', 'DISTRIBUTOR'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      typeFilter === type
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'ALL' ? 'All Entities' : type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agenda Feed List */}
          <div className="space-y-3">
            {/* Visits Section */}
            {(activeTab === 'ALL' || activeTab === 'VISITS') && (
              <>
                {selectedDayVisits.length === 0 && activeTab === 'VISITS' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-400">
                    <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">No field calls planned for this date</p>
                    <Link
                      href="/dashboard/visits"
                      className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Plan a visit
                    </Link>
                  </div>
                )}

                {selectedDayVisits.map((visit: any) => {
                  const theme = VISIT_TYPE_THEME[visit.visitType] || VISIT_TYPE_THEME.DOCTOR;
                  const TypeIcon = theme.icon;

                  return (
                    <div
                      key={visit.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon className="w-5 h-5" style={{ color: theme.dot.replace('bg-', '') }} />
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/dashboard/visits/${visit.id}`}
                                className="font-black text-slate-900 text-sm hover:text-emerald-700 transition-colors"
                              >
                                {getEntityName(visit)}
                              </Link>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${theme.bg} ${theme.text}`}>
                                {theme.label}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 font-medium">
                              {getEntitySub(visit)}
                            </p>

                            {visit.user && (
                              <p className="text-[10px] text-slate-400 font-semibold pt-0.5">
                                Rep: {visit.user.firstName} {visit.user.lastName} ({visit.user.role})
                              </p>
                            )}

                            {visit.productsDiscussed?.length > 0 && (
                              <p className="text-[10px] text-slate-600 font-medium">
                                Discussed: {visit.productsDiscussed.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              visit.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : visit.status === 'CHECKED_IN'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {visit.status}
                          </span>

                          <Link
                            href={`/dashboard/visits/${visit.id}`}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Tasks Section */}
            {(activeTab === 'ALL' || activeTab === 'TASKS') && (
              <>
                {selectedDayTasks.length === 0 && activeTab === 'TASKS' && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-xs">No tasks due on this date</p>
                    <Link
                      href="/dashboard/tasks"
                      className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Create a task
                    </Link>
                  </div>
                )}

                {selectedDayTasks.map((task: any) => {
                  const isDone = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 p-4 transition-all flex items-start gap-3"
                    >
                      <button
                        onClick={() => toggleTaskMutation.mutate({ id: task.id, completed: !isDone })}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700">
                            {task.taskType || 'TODO'}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500">{task.description}</p>
                        )}
                        {task.user && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Assigned to: {task.user.firstName} {task.user.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Empty state when all is selected and nothing planned */}
            {activeTab === 'ALL' && selectedDayVisits.length === 0 && selectedDayTasks.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center text-slate-400 space-y-2">
                <CalendarIcon className="w-10 h-10 mx-auto opacity-30 text-emerald-600" />
                <h4 className="font-bold text-slate-800 text-sm">No activity scheduled for this day</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click below to schedule calls or assign tasks for this date.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Link
                    href="/dashboard/visits"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    + Schedule Visit
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    + Add Task
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
