'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Calendar, Clock, User, Building2, Store, Truck,
  Plus, Check, Trash2, ArrowLeft, Search, CheckSquare,
  Square, Sparkles, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';

const ENTITY_TYPES = [
  { id: 'DOCTOR', label: 'Doctor', icon: User, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'HOSPITAL', label: 'Hospital', icon: Building2, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'RETAILER', label: 'Retailer', icon: Store, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'DISTRIBUTOR', label: 'Distributor', icon: Truck, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'STOCKIST', label: 'Stockist / CFA', icon: Truck, color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

const TIME_PRESETS = [
  { label: '09:00 AM', h: 9, m: 0 },
  { label: '09:30 AM', h: 9, m: 30 },
  { label: '10:00 AM', h: 10, m: 0 },
  { label: '10:30 AM', h: 10, m: 30 },
  { label: '11:00 AM', h: 11, m: 0 },
  { label: '11:30 AM', h: 11, m: 30 },
  { label: '12:00 PM', h: 12, m: 0 },
  { label: '12:30 PM', h: 12, m: 30 },
  { label: '01:00 PM', h: 13, m: 0 },
  { label: '01:30 PM', h: 13, m: 30 },
  { label: '02:00 PM', h: 14, m: 0 },
  { label: '02:30 PM', h: 14, m: 30 },
  { label: '03:00 PM', h: 15, m: 0 },
  { label: '03:30 PM', h: 15, m: 30 },
  { label: '04:00 PM', h: 16, m: 0 },
  { label: '04:30 PM', h: 16, m: 30 },
  { label: '05:00 PM', h: 17, m: 0 },
  { label: '05:30 PM', h: 17, m: 30 },
  { label: '06:00 PM', h: 18, m: 0 },
  { label: '06:30 PM', h: 18, m: 30 },
  { label: '07:00 PM', h: 19, m: 0 },
  { label: '07:30 PM', h: 19, m: 30 },
  { label: '08:00 PM', h: 20, m: 0 },
  { label: '08:30 PM', h: 20, m: 30 },
];

const INTERVAL_OPTIONS = [
  { label: '15m gap', value: 15 },
  { label: '30m gap', value: 30 },
  { label: '45m gap', value: 45 },
  { label: '60m gap', value: 60 },
  { label: 'Same time', value: 0 },
];

export default function BatchPlanVisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const initialType = searchParams?.get('type')?.toUpperCase() || 'DOCTOR';
  const [type, setType] = useState(initialType);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [startingTime, setStartingTime] = useState<{ h: number; m: number }>({ h: 9, m: 30 });
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Queries for entities
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-list-plan'],
    queryFn: () => api.get('/doctors', { params: { limit: 200 } }).then((r) => r.data.data.doctors || []),
    enabled: type === 'DOCTOR',
  });

  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals-list-plan'],
    queryFn: () => api.get('/hospitals', { params: { limit: 200 } }).then((r) => r.data.data.hospitals || []),
    enabled: type === 'HOSPITAL',
  });

  const { data: retailers = [], isLoading: loadingRetailers } = useQuery({
    queryKey: ['retailers-list-plan'],
    queryFn: () => api.get('/retailers', { params: { limit: 200 } }).then((r) => r.data.data.retailers || []),
    enabled: type === 'RETAILER',
  });

  const { data: distributors = [], isLoading: loadingDistributors } = useQuery({
    queryKey: ['distributors-list-plan'],
    queryFn: () => api.get('/distributors', { params: { limit: 200 } }).then((r) => r.data.data.distributors || []),
    enabled: type === 'DISTRIBUTOR',
  });

  const { data: stockists = [], isLoading: loadingStockists } = useQuery({
    queryKey: ['stockists-list-plan'],
    queryFn: () => api.get('/stockists', { params: { limit: 200 } }).then((r) => r.data.data.stockists || []),
    enabled: type === 'STOCKIST',
  });

  // Current entity list based on active type
  const rawEntities = useMemo(() => {
    if (type === 'DOCTOR') return doctors;
    if (type === 'HOSPITAL') return hospitals;
    if (type === 'RETAILER') return retailers;
    if (type === 'DISTRIBUTOR') return distributors;
    if (type === 'STOCKIST') return stockists;
    return [];
  }, [type, doctors, hospitals, retailers, distributors, stockists]);

  // Filtered by search
  const filteredEntities = useMemo(() => {
    if (!searchTerm.trim()) return rawEntities;
    const q = searchTerm.toLowerCase();
    return rawEntities.filter((e: any) => {
      const name = e.firstName ? `${e.salutation || 'Dr.'} ${e.firstName} ${e.lastName}` : (e.name || '');
      const sub = e.specialty || e.city || e.area?.name || e.clinicAddress || '';
      return name.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
    });
  }, [rawEntities, searchTerm]);

  const isLoadingEntities = loadingDoctors || loadingHospitals || loadingRetailers || loadingDistributors || loadingStockists;

  // Toggle selection
  const handleToggleEntity = (id: string) => {
    if (selectedEntityIds.includes(id)) {
      setSelectedEntityIds(selectedEntityIds.filter((item) => item !== id));
    } else {
      setSelectedEntityIds([...selectedEntityIds, id]);
    }
  };

  const handleSelectAll = () => {
    const ids = filteredEntities.map((e: any) => e.id);
    setSelectedEntityIds(ids);
  };

  const handleClearAll = () => {
    setSelectedEntityIds([]);
  };

  // Schedule timeline preview
  const scheduledTimeline = useMemo(() => {
    let currentH = startingTime.h;
    let currentM = startingTime.m;

    return selectedEntityIds.map((id, index) => {
      const entity = rawEntities.find((e: any) => e.id === id);
      const slotH = currentH;
      const slotM = currentM;

      // format time
      const period = slotH >= 12 ? 'PM' : 'AM';
      const displayH = slotH > 12 ? slotH - 12 : slotH === 0 ? 12 : slotH;
      const displayM = slotM < 10 ? `0${slotM}` : slotM;
      const timeStr = `${displayH}:${displayM} ${period}`;

      // advance for next if interval > 0
      if (intervalMinutes > 0) {
        currentM += intervalMinutes;
        while (currentM >= 60) {
          currentH += 1;
          currentM -= 60;
        }
      }

      return {
        id,
        entity,
        timeStr,
        order: index + 1,
        isoTime: `${plannedDate}T${slotH < 10 ? '0' + slotH : slotH}:${displayM}:00`,
      };
    });
  }, [selectedEntityIds, rawEntities, startingTime, intervalMinutes, plannedDate]);

  // Batch Submit mutation
  const handleBatchSubmit = async () => {
    if (scheduledTimeline.length === 0) return;
    setSubmitting(true);
    let count = 0;

    for (const item of scheduledTimeline) {
      try {
        const payload: any = {
          visitType: type,
          plannedDate: item.isoTime,
          notes: `Batch scheduled for ${item.timeStr}`,
        };
        if (type === 'DOCTOR') payload.doctorId = item.id;
        if (type === 'HOSPITAL') payload.hospitalId = item.id;
        if (type === 'RETAILER') payload.retailerId = item.id;
        if (type === 'DISTRIBUTOR') payload.distributorId = item.id;
        if (type === 'STOCKIST') payload.stockistId = item.id;

        await api.post('/visits', payload);
        count++;
      } catch (err) {
        console.error('Failed to create visit for entity', item.id, err);
      }
    }

    setSubmitting(false);
    setSuccessCount(count);
    qc.invalidateQueries({ queryKey: ['visits'] });
    qc.invalidateQueries({ queryKey: ['today-visits'] });

    setTimeout(() => {
      router.push('/dashboard/visits/next-call');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/visits"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Batch Multi-Visit Planner</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Multi-Account
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan and sequence multiple field calls for a day with automated time-spacing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits/next-call"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            Smart Call Console
          </Link>
        </div>
      </div>

      {/* ── STEP 1: ENTITY TYPE BAR ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          1. Select Account Type
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ENTITY_TYPES.map((et) => {
            const Icon = et.icon;
            const isSelected = type === et.id;
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => {
                  setType(et.id);
                  setSelectedEntityIds([]);
                }}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                {et.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: DATE & TIME CONFIGURATION ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Planned Date */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            2. Scheduled Date
          </span>
          <input
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          />
        </div>

        {/* Starting Time Preset */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              3. Starting Time
            </span>
            <span className="text-xs font-black text-emerald-600">
              {startingTime.h > 12 ? startingTime.h - 12 : startingTime.h}:{startingTime.m === 0 ? '00' : startingTime.m} {startingTime.h >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-1">
            {TIME_PRESETS.map((p) => {
              const active = startingTime.h === p.h && startingTime.m === p.m;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStartingTime({ h: p.h, m: p.m })}
                  className={`py-1 px-1.5 text-[10px] font-bold rounded-lg border text-center transition-all ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Interval Spacing */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            4. Slot Interval Gap
          </span>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntervalMinutes(opt.value)}
                className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                  intervalMinutes === opt.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 3: MAIN WORKSPACE (LIST & TIMELINE PREVIEW) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Entity Catalog Picker */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Select Accounts to Visit</h2>
              <p className="text-xs text-slate-500">Pick accounts from your assigned territory</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-emerald-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={`Search ${type.toLowerCase()}s by name, area, specialty...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-emerald-500"
            />
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {isLoadingEntities ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading accounts...</div>
            ) : filteredEntities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No accounts match search query.</div>
            ) : (
              filteredEntities.map((ent: any) => {
                const isChecked = selectedEntityIds.includes(ent.id);
                const title = ent.firstName
                  ? `${ent.salutation || 'Dr.'} ${ent.firstName} ${ent.lastName}`
                  : ent.name;
                const sub = ent.specialty || ent.city || ent.area?.name || ent.clinicAddress || 'Account';

                return (
                  <div
                    key={ent.id}
                    onClick={() => handleToggleEntity(ent.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-150 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{title}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{sub}</div>
                      </div>
                    </div>

                    {ent.tier && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {ent.tier}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Generated Route Itinerary Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 sticky top-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Planned Itinerary Sequence</h2>
              <p className="text-xs text-slate-500">
                {selectedEntityIds.length} visits configured for {plannedDate}
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-xl border border-emerald-200">
              {selectedEntityIds.length} Calls
            </span>
          </div>

          {scheduledTimeline.length === 0 ? (
            <div className="py-12 px-6 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Visits In Queue</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Select accounts on the left to generate the timeline and schedule sequence automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {scheduledTimeline.map((item, idx) => {
                const title = item.entity?.firstName
                  ? `${item.entity.salutation || 'Dr.'} ${item.entity.firstName} ${item.entity.lastName}`
                  : (item.entity?.name || 'Account');

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{title}</div>
                        <div className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Slot: {item.timeStr}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleEntity(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove from batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            {successCount !== null ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-bold justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Successfully created {successCount} visits! Redirecting...
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBatchSubmit}
                disabled={submitting || selectedEntityIds.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  'Scheduling Batch Calls...'
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Confirm & Schedule {selectedEntityIds.length} Field Calls
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
