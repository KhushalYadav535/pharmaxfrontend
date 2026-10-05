'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Stethoscope, Building2, Store, Truck, Search,
  ArrowLeft, Sparkles, Navigation, CheckCircle2, ChevronRight,
  MapPin, Phone
} from 'lucide-react';

const THEMES: Record<string, { primary: string; bg: string; text: string; icon: any; label: string }> = {
  DOCTOR: { primary: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Stethoscope, label: 'Doctor' },
  HOSPITAL: { primary: '#0284C7', bg: 'bg-sky-50', text: 'text-sky-700', icon: Building2, label: 'Hospital' },
  RETAILER: { primary: '#7C3AED', bg: 'bg-purple-50', text: 'text-purple-700', icon: Store, label: 'Retail Chemist' },
  DISTRIBUTOR: { primary: '#D97706', bg: 'bg-amber-50', text: 'text-amber-700', icon: Truck, label: 'Distributor' },
};

export default function UnplannedCallPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'HOSPITAL' | 'RETAILER' | 'DISTRIBUTOR'>('DOCTOR');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors-list-unplanned'],
    queryFn: () => api.get('/doctors', { params: { limit: 150 } }).then((r) => r.data.data.doctors || []),
  });

  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals-list-unplanned'],
    queryFn: () => api.get('/hospitals', { params: { limit: 150 } }).then((r) => r.data.data.hospitals || []),
  });

  const { data: retailers = [], isLoading: loadingRetailers } = useQuery({
    queryKey: ['retailers-list-unplanned'],
    queryFn: () => api.get('/retailers', { params: { limit: 150 } }).then((r) => r.data.data.retailers || []),
  });

  const { data: distributors = [], isLoading: loadingDistributors } = useQuery({
    queryKey: ['distributors-list-unplanned'],
    queryFn: () => api.get('/distributors', { params: { limit: 150 } }).then((r) => r.data.data.distributors || []),
  });

  const currentData = useMemo(() => {
    let raw: any[] = [];
    if (activeTab === 'DOCTOR') raw = doctors;
    else if (activeTab === 'HOSPITAL') raw = hospitals;
    else if (activeTab === 'RETAILER') raw = retailers;
    else if (activeTab === 'DISTRIBUTOR') raw = distributors;

    if (!search.trim()) return raw;
    const lower = search.toLowerCase();
    return raw.filter((i: any) => {
      const name = i.firstName ? `${i.salutation || 'Dr.'} ${i.firstName} ${i.lastName}` : i.name;
      const sub = i.specialty || i.city || i.clinicAddress || '';
      return name?.toLowerCase().includes(lower) || sub?.toLowerCase().includes(lower);
    });
  }, [activeTab, search, doctors, hospitals, retailers, distributors]);

  const handleCreateUnplanned = async (target: any) => {
    setCreating(true);
    try {
      let lat = 19.076;
      let lng = 72.877;

      if (typeof window !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      }

      // 1. Create Visit Record
      const payload: any = {
        visitType: activeTab,
        plannedDate: new Date().toISOString(),
        isUnplanned: true,
        unplannedReason: 'Added from field during round',
      };

      if (activeTab === 'DOCTOR') payload.doctorId = target.id;
      if (activeTab === 'HOSPITAL') payload.hospitalId = target.id;
      if (activeTab === 'RETAILER') payload.retailerId = target.id;
      if (activeTab === 'DISTRIBUTOR') payload.distributorId = target.id;

      const createRes = await api.post('/visits', payload);
      const visitId = createRes.data?.data?.id;

      // 2. Check in immediately
      if (visitId) {
        await api.patch(`/visits/${visitId}/check-in`, {
          lat,
          lng,
          address: 'Field location GPS',
        });
      }

      qc.invalidateQueries({ queryKey: ['today-visits'] });
      qc.invalidateQueries({ queryKey: ['visits'] });

      // 3. Navigate
      if (activeTab === 'DOCTOR' && target.id) {
        router.push(`/dashboard/digital-detailing?doctorId=${target.id}&visitId=${visitId}`);
      } else {
        router.push(`/dashboard/visits/${visitId}`);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to start unplanned visit');
      setCreating(false);
    }
  };

  const theme = THEMES[activeTab];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/visits"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Unplanned Field Call</h1>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Instant Check-In
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record on-the-spot physician or pharmacy visits not scheduled in your monthly tour plan
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['DOCTOR', 'HOSPITAL', 'RETAILER', 'DISTRIBUTOR'] as const).map((t) => {
            const itemTheme = THEMES[t];
            const Icon = itemTheme.icon;
            const isSelected = activeTab === t;

            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setActiveTab(t);
                  setSearch('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                {itemTheme.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={`Search ${theme.label.toLowerCase()} by name, clinic, address, territory...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-emerald-500"
          />
        </div>
      </div>

      {/* ── RESULTS LIST ── */}
      <div className="space-y-2.5">
        {creating && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <Navigation className="w-4 h-4 text-emerald-600 animate-spin" />
            Capturing GPS location & initiating call session...
          </div>
        )}

        {currentData.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">No {theme.label} Accounts Found</p>
            <p className="text-xs text-slate-500">Try changing your search term or select another category tab above.</p>
          </div>
        ) : (
          currentData.map((item: any) => {
            const title = item.firstName
              ? `${item.salutation || 'Dr.'} ${item.firstName} ${item.lastName}`
              : item.name;
            const subtitle = item.specialty || item.city || item.clinicAddress || 'Account';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{title}</span>
                    {item.tier && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
                  {item.phone && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {item.phone}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateUnplanned(item)}
                  disabled={creating}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 self-start sm:self-auto shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Instant Check-In & Start
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
