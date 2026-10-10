'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Calendar, Clock, User, Building2, Store, Truck,
  Plus, Check, Trash2, ArrowLeft, Search, CheckSquare,
  Square, Sparkles, AlertCircle, CheckCircle2, ChevronRight, UserCheck, ShieldCheck, MapPin, Layers, Filter
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
  const { user } = useAuth();

  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  const initialType = searchParams?.get('type')?.toUpperCase() || 'DOCTOR';
  const [type, setType] = useState(initialType);
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [startingTime, setStartingTime] = useState<{ h: number; m: number }>({ h: 9, m: 30 });
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Planning mode: Doctor-Wise or Area-Wise
  const [planningMode, setPlanningMode] = useState<'AREA_WISE' | 'DOCTOR_WISE'>('AREA_WISE');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');

  // Admin / Manager Headquarter and MR delegation state
  const [selectedHqId, setSelectedHqId] = useState('');
  const [selectedMrId, setSelectedMrId] = useState('');

  // HQ List for Admin
  const { data: hqList = [] } = useQuery({
    queryKey: ['headquarters-plan-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then((r) => r.data.data?.headquarters || r.data.data || []),
    enabled: isAdminOrManager,
  });

  // MR Field Reps list for Admin
  const { data: repsList = [] } = useQuery({
    queryKey: ['reps-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/employees', {
          params: {
            role: 'MR',
            hqId: selectedHqId || undefined,
            limit: 200,
          },
        })
        .then((r) => r.data.data?.employees || r.data.data || []),
    enabled: isAdminOrManager,
  });

  // Queries for entities (filtered by HQ if HQ is selected)
  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/doctors', {
          params: { limit: 300, hqId: selectedHqId || undefined },
        })
        .then((r) => r.data.data?.doctors || []),
    enabled: type === 'DOCTOR',
  });

  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/hospitals', {
          params: { limit: 300, hqId: selectedHqId || undefined },
        })
        .then((r) => r.data.data?.hospitals || []),
    enabled: type === 'HOSPITAL',
  });

  const { data: retailers = [], isLoading: loadingRetailers } = useQuery({
    queryKey: ['retailers-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/retailers', {
          params: { limit: 300, hqId: selectedHqId || undefined },
        })
        .then((r) => r.data.data?.retailers || []),
    enabled: type === 'RETAILER',
  });

  const { data: distributors = [], isLoading: loadingDistributors } = useQuery({
    queryKey: ['distributors-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/distributors', {
          params: { limit: 300, hqId: selectedHqId || undefined },
        })
        .then((r) => r.data.data?.distributors || []),
    enabled: type === 'DISTRIBUTOR',
  });

  const { data: stockists = [], isLoading: loadingStockists } = useQuery({
    queryKey: ['stockists-list-plan', selectedHqId],
    queryFn: () =>
      api
        .get('/stockists', {
          params: { limit: 300, hqId: selectedHqId || undefined },
        })
        .then((r) => r.data.data?.stockists || []),
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

  // Helper to extract area info from any account entity
  const getEntityArea = (ent: any) => {
    if (ent.area?.id && ent.area?.name) return { id: ent.area.id, name: ent.area.name };
    if (ent.areaId) return { id: ent.areaId, name: ent.area?.name || `Area ${ent.areaId}` };
    if (ent.city) return { id: `city_${ent.city}`, name: `${ent.city} Sector` };
    return { id: 'unassigned', name: 'General / Unassigned Area' };
  };

  // Group entities by their Territory Area / Beat
  const areaGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; entities: any[] }>();

    rawEntities.forEach((ent: any) => {
      const area = getEntityArea(ent);
      if (!map.has(area.id)) {
        map.set(area.id, { id: area.id, name: area.name, entities: [] });
      }
      map.get(area.id)!.entities.push(ent);
    });

    return Array.from(map.values()).sort((a, b) => b.entities.length - a.entities.length);
  }, [rawEntities]);

  // 1-Click Select All doctors in a specific Area
  const handleSelectAreaAll = (areaId: string) => {
    const group = areaGroups.find((g) => g.id === areaId);
    if (!group) return;
    const idsToAdd = group.entities.map((e) => e.id);
    setSelectedEntityIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  // 1-Click Deselect All doctors in a specific Area
  const handleDeselectAreaAll = (areaId: string) => {
    const group = areaGroups.find((g) => g.id === areaId);
    if (!group) return;
    const idsToRemove = new Set(group.entities.map((e) => e.id));
    setSelectedEntityIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  // Filtered by area filter AND search text
  const filteredEntities = useMemo(() => {
    let list = rawEntities;

    if (selectedAreaId !== 'ALL') {
      list = list.filter((e: any) => getEntityArea(e).id === selectedAreaId);
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((e: any) => {
      const name = e.firstName ? `${e.salutation || 'Dr.'} ${e.firstName} ${e.lastName}` : (e.name || '');
      const sub = e.specialty || e.city || e.area?.name || e.clinicAddress || '';
      const areaName = getEntityArea(e).name;
      return (
        name.toLowerCase().includes(q) ||
        sub.toLowerCase().includes(q) ||
        areaName.toLowerCase().includes(q)
      );
    });
  }, [rawEntities, selectedAreaId, searchTerm]);

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
    setSelectedEntityIds((prev) => Array.from(new Set([...prev, ...ids])));
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
    if (isAdminOrManager && !selectedMrId) {
      alert('Please select a Medical Representative to assign these visits to.');
      return;
    }
    setSubmitting(true);

    try {
      const visitsPayload = scheduledTimeline.map((item) => {
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
        return payload;
      });

      const res = await api.post('/visits/bulk-plan', {
        userId: selectedMrId || user?.id,
        visits: visitsPayload,
      });

      const count = res.data.data?.count || visitsPayload.length;
      setSuccessCount(count);
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['today-visits'] });

      setTimeout(() => {
        router.push('/dashboard/visits');
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to schedule visits');
    } finally {
      setSubmitting(false);
    }
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

      {/* ── ADMIN / MANAGER DELEGATION BAR: HEADQUARTER & MR SELECTION ── */}
      {isAdminOrManager && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Headquarter & Medical Representative Assignment</h2>
                <p className="text-xs text-slate-500">
                  Select a Headquarter to filter doctors/chemists and dispatch batch visits directly to that MR
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              Admin Delegation Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select HQ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Headquarter (HQ) *
              </label>
              <select
                value={selectedHqId}
                onChange={(e) => {
                  setSelectedHqId(e.target.value);
                  setSelectedMrId('');
                  setSelectedEntityIds([]);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="">All Headquarters (Pick specific HQ to filter)...</option>
                {hqList.map((hq: any) => (
                  <option key={hq.id} value={hq.id}>
                    {hq.name} {hq.code ? `(${hq.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Select MR */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assign Visits to Medical Representative (MR) *
              </label>
              <select
                value={selectedMrId}
                onChange={(e) => {
                  const mrId = e.target.value;
                  setSelectedMrId(mrId);
                  const picked = repsList.find((r: any) => r.id === mrId);
                  if (picked?.hqId && !selectedHqId) {
                    setSelectedHqId(picked.hqId);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="">Select Medical Representative...</option>
                {repsList.map((rep: any) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.firstName} {rep.lastName} {rep.employeeId ? `[ID: ${rep.employeeId}]` : ''} {rep.hq?.name ? `(${rep.hq.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMrId && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-950 font-medium">
                  Dispatching batch schedule to:{' '}
                  <strong className="font-bold">
                    {repsList.find((r: any) => r.id === selectedMrId)?.firstName}{' '}
                    {repsList.find((r: any) => r.id === selectedMrId)?.lastName}
                  </strong>
                  {selectedHqId && (
                    <span className="text-emerald-700">
                      {' '}in Headquarter: <strong>{hqList.find((h: any) => h.id === selectedHqId)?.name}</strong>
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                Auto-Approved on Dispatch
              </span>
            </div>
          )}
        </div>
      )}

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
        {/* Left Side: Entity Catalog Picker with Area & Doctor Wise Modes */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Select Accounts to Visit</h2>
              <p className="text-xs text-slate-500">Pick accounts individually or batch-select entire beats/areas</p>
            </div>

            {/* Mode Switcher: Area-Wise vs Doctor-Wise */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPlanningMode('AREA_WISE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  planningMode === 'AREA_WISE'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Area-Wise Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setPlanningMode('DOCTOR_WISE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  planningMode === 'DOCTOR_WISE'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Doctor-Wise Mode</span>
              </button>
            </div>
          </div>

          {/* Area Filter Selector Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Territory Areas ({areaGroups.length} detected)
              </span>
              {selectedAreaId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedAreaId('ALL')}
                  className="text-emerald-700 hover:underline text-[11px] font-bold"
                >
                  Show All Areas
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedAreaId('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedAreaId === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Areas ({rawEntities.length})
              </button>
              {areaGroups.map((g) => {
                const isActive = selectedAreaId === g.id;
                const selCount = g.entities.filter((e) => selectedEntityIds.includes(e.id)).length;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedAreaId(g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{g.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selCount > 0 ? `${selCount}/${g.entities.length}` : g.entities.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Area Action Banner */}
          {selectedAreaId !== 'ALL' && (() => {
            const currGroup = areaGroups.find((g) => g.id === selectedAreaId);
            if (!currGroup) return null;
            const allInAreaSelected = currGroup.entities.length > 0 && currGroup.entities.every((e) => selectedEntityIds.includes(e.id));
            const countInArea = currGroup.entities.filter((e) => selectedEntityIds.includes(e.id)).length;

            return (
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-950 font-bold">
                    {currGroup.name}: <span className="font-normal text-emerald-800">{countInArea} of {currGroup.entities.length} accounts selected</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (allInAreaSelected) {
                      handleDeselectAreaAll(currGroup.id);
                    } else {
                      handleSelectAreaAll(currGroup.id);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs ${
                    allInAreaSelected
                      ? 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {allInAreaSelected
                    ? `Deselect All in ${currGroup.name}`
                    : `⚡ Select All (${currGroup.entities.length}) in ${currGroup.name}`}
                </button>
              </div>
            );
          })()}

          {/* Search bar & Selection status */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={`Search ${type.toLowerCase()}s by name, area, specialty...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-emerald-600 hover:underline px-1"
              >
                Select All
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-400 hover:underline px-1"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── LIST RENDER: AREA-WISE GROUPED or DOCTOR-WISE FLAT ── */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {isLoadingEntities ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading accounts...</div>
            ) : filteredEntities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No accounts match search or area query.</div>
            ) : planningMode === 'AREA_WISE' && selectedAreaId === 'ALL' ? (
              /* Area-Wise Grouped View */
              areaGroups.map((group) => {
                const groupEntities = group.entities.filter((e) => {
                  if (!searchTerm.trim()) return true;
                  const q = searchTerm.toLowerCase();
                  const name = e.firstName ? `${e.salutation || 'Dr.'} ${e.firstName} ${e.lastName}` : (e.name || '');
                  const sub = e.specialty || e.city || e.area?.name || e.clinicAddress || '';
                  return name.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
                });

                if (groupEntities.length === 0) return null;

                const allSelected = groupEntities.every((e) => selectedEntityIds.includes(e.id));
                const selectedInGroup = groupEntities.filter((e) => selectedEntityIds.includes(e.id)).length;

                return (
                  <div key={group.id} className="border border-slate-200/90 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                    {/* Area Group Header */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-black text-slate-900">{group.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold ml-2">
                            ({selectedInGroup}/{groupEntities.length} Selected)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            handleDeselectAreaAll(group.id);
                          } else {
                            handleSelectAreaAll(group.id);
                          }
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                          allSelected
                            ? 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                        }`}
                      >
                        {allSelected ? 'Deselect Area' : `⚡ Select All (${groupEntities.length})`}
                      </button>
                    </div>

                    {/* Doctors in this area */}
                    <div className="space-y-1.5">
                      {groupEntities.map((ent: any) => {
                        const isChecked = selectedEntityIds.includes(ent.id);
                        const title = ent.firstName
                          ? `${ent.salutation || 'Dr.'} ${ent.firstName} ${ent.lastName}`
                          : ent.name;
                        const sub = ent.specialty || ent.city || ent.clinicAddress || 'Account';

                        return (
                          <div
                            key={ent.id}
                            onClick={() => handleToggleEntity(ent.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{title}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{sub}</div>
                              </div>
                            </div>

                            {ent.tier && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {ent.tier}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Doctor-Wise Flat List */
              filteredEntities.map((ent: any) => {
                const isChecked = selectedEntityIds.includes(ent.id);
                const title = ent.firstName
                  ? `${ent.salutation || 'Dr.'} ${ent.firstName} ${ent.lastName}`
                  : ent.name;
                const sub = ent.specialty || ent.clinicAddress || 'Account';
                const areaInfo = getEntityArea(ent);

                return (
                  <div
                    key={ent.id}
                    onClick={() => handleToggleEntity(ent.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span>{sub}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {areaInfo.name}
                          </span>
                        </div>
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

        {/* Right Side: Generated Route Itinerary Preview & Territory Route Density */}
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

          {/* Territory Route Density summary */}
          {scheduledTimeline.length > 0 && (() => {
            const coveredAreasMap: Record<string, number> = {};
            scheduledTimeline.forEach((item) => {
              const a = getEntityArea(item.entity).name;
              coveredAreasMap[a] = (coveredAreasMap[a] || 0) + 1;
            });
            const coveredList = Object.entries(coveredAreasMap);

            return (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Route Coverage ({coveredList.length} Areas / Beats)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {coveredList.map(([name, count]) => (
                    <span key={name} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{name}:</span>
                      <strong className="text-emerald-700 font-bold">{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {scheduledTimeline.length === 0 ? (
            <div className="py-12 px-6 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Visits In Queue</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Select accounts on the left by Area or individually to generate the timeline automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {scheduledTimeline.map((item, idx) => {
                const title = item.entity?.firstName
                  ? `${item.entity.salutation || 'Dr.'} ${item.entity.firstName} ${item.entity.lastName}`
                  : (item.entity?.name || 'Account');
                const areaName = getEntityArea(item.entity).name;

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
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            {item.timeStr}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {areaName}
                          </span>
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
                    {isAdminOrManager && selectedMrId
                      ? `Confirm & Dispatch ${selectedEntityIds.length} Calls to ${repsList.find((r: any) => r.id === selectedMrId)?.firstName || 'MR'}`
                      : `Confirm & Schedule ${selectedEntityIds.length} Field Calls`}
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
