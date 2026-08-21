'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, User, Building2, Store, Package, Clock,
  MessageSquare, Calendar, Send, Stethoscope, Truck,
  Users, ChevronDown, CheckSquare, Square, AlertCircle, Search
} from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

// ─── FFMS Daily Visit Report Form ─────────────────────────────────────────────
// Matches: Doctor Daily Reporting / Hospital Visit Reporting /
//          Retailer Visit Reporting / Stockist Visit Reporting sheets
// Fields: Employee ID*, HQ ID*, Entity ID*, Visit Date*, Visit Purpose,
//         Visit Feedback, Next Visit, Remarks, Joint Visit*, Products Promoted,
//         Location Details (auto-captured)

interface DailyReportFormProps {
  visitType: 'DOCTOR' | 'HOSPITAL' | 'RETAILER' | 'STOCKIST';
  entityId?: string;
  entityName?: string;
  entitySub?: string;
  hqId?: string;
  hqName?: string;
  employeeId?: string;
  availableProducts?: { id: string; name: string }[];
  onSuccess?: () => void;
}

const JOINT_VISIT_OPTIONS = [
  'ASM', 'RSM', 'ZM', 'NSM', 'Product Manager', 'Management', 'Other'
];

const typeConfig = {
  DOCTOR: {
    color: 'from-blue-600 via-indigo-600 to-blue-700',
    accent: '#3b82f6',
    lightBg: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1d4ed8',
    title: 'Doctor Daily Report',
    entityLabel: 'Doctor',
    icon: Stethoscope,
  },
  HOSPITAL: {
    color: 'from-teal-600 to-teal-700',
    accent: '#0d9488',
    lightBg: '#f0fdfa',
    borderColor: '#99f6e4',
    textColor: '#0f766e',
    title: 'Hospital Visit Report',
    entityLabel: 'Hospital',
    icon: Building2,
  },
  RETAILER: {
    color: 'from-purple-600 to-purple-700',
    accent: '#7c3aed',
    lightBg: '#faf5ff',
    borderColor: '#ddd6fe',
    textColor: '#6d28d9',
    title: 'Retailer Visit Report',
    entityLabel: 'Retailer',
    icon: Store,
  },
  STOCKIST: {
    color: 'from-emerald-500 via-teal-600 to-emerald-700',
    accent: '#10b981',
    lightBg: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#047857',
    title: 'Stockist Visit Report',
    entityLabel: 'Stockist',
    icon: Truck,
  },
};

export default function DailyReportForm({
  visitType,
  entityId,
  entityName = 'Unknown',
  entitySub = '',
  hqId,
  hqName = '',
  availableProducts = [],
  onSuccess,
}: DailyReportFormProps) {
  const router = useRouter();
  const config = typeConfig[visitType];
  const EntityIcon = config.icon;

  const { data: entities, isLoading: isLoadingEntities } = useQuery({
    queryKey: ['entities', visitType],
    queryFn: async () => {
      let endpoint = '';
      let key = '';
      if (visitType === 'DOCTOR') { endpoint = '/doctors'; key = 'doctors'; }
      else if (visitType === 'HOSPITAL') { endpoint = '/hospitals'; key = 'hospitals'; }
      else if (visitType === 'RETAILER') { endpoint = '/retailers'; key = 'retailers'; }
      else if (visitType === 'STOCKIST') { endpoint = '/stockists'; key = 'stockists'; }
      
      if (!endpoint) return [];
      const r = await api.get(endpoint);
      const payload = r.data.data;
      return Array.isArray(payload) ? payload : (payload?.[key] || []);
    },
    enabled: !entityId, // Fetch only if entityId is not provided
  });

  const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
  
  useEffect(() => {
    setSelectedEntityId(entityId || '');
  }, [entityId, visitType]);

  // ── FFMS Form Fields ──────────────────────────────────────────────────────
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitFeedback, setVisitFeedback] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [remarks, setRemarks] = useState('');
  const [jointVisit, setJointVisit] = useState<'Yes' | 'No' | ''>('');
  const [jointVisitWith, setJointVisitWith] = useState('');
  const [productsPromoted, setProductsPromoted] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Location (auto-captured — non-editable per FFMS spec)
  const [locationLat] = useState<number | null>(null);
  const [locationLng] = useState<number | null>(null);
  const [locationAddress] = useState('Auto-capturing...');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleProduct = (productId: string) => {
    setProductsPromoted(prev =>
      prev.includes(productId) ? prev.filter(p => p !== productId) : [...prev, productId]
    );
  };

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedEntityId) { setError(`Please select a ${config.entityLabel}`); return; }
    if (!visitDate) { setError('Visit Date is required'); return; }
    if (!jointVisit) { setError('Joint Visit field is required'); return; }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        hqId,
        visitType,
        doctorId: visitType === 'DOCTOR' ? selectedEntityId : undefined,
        hospitalId: visitType === 'HOSPITAL' ? selectedEntityId : undefined,
        retailerId: visitType === 'RETAILER' ? selectedEntityId : undefined,
        stockistId: visitType === 'STOCKIST' ? selectedEntityId : undefined,
        visitDate,
        visitPurpose,
        visitFeedback,
        nextVisit: nextVisit || undefined,
        remarks,
        jointVisit: jointVisit === 'Yes',
        jointVisitWith: jointVisit === 'Yes' ? jointVisitWith : undefined,
        productsPromoted,
        locationLat: locationLat ?? undefined,
        locationLng: locationLng ?? undefined,
        locationAddress,
      };

      await api.post('/daily-reports', payload);
      if (onSuccess) onSuccess();
      else router.push('/dashboard/visits');
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* ── Header ── */}
      <div className={`bg-gradient-to-br ${config.color} text-white px-6 py-6 flex items-center gap-4`}>
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">{config.title}</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">Daily Visit Reporting — FFMS</p>
        </div>
      </div>

      {/* ── Entity Card (Selector if standalone) ── */}
      <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors" style={{ background: config.lightBg }}>
          <EntityIcon className="w-7 h-7" style={{ color: config.textColor }} />
        </div>
        <div className="flex-1 min-w-0">
          {!entityId ? (
            <div className="relative group">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Select {config.entityLabel} <span className="text-red-500">*</span>
              </label>
              <select 
                value={selectedEntityId}
                onChange={e => setSelectedEntityId(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3 text-[14px] font-bold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
                style={{ '--tw-ring-color': `${config.accent}33` } as any}
              >
                <option value="" className="text-gray-400">Choose a {config.entityLabel} to report on...</option>
                {entities?.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {visitType === 'DOCTOR' ? `Dr. ${e.firstName} ${e.lastName}` : (e.name || e.firstName)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[32px] pointer-events-none group-hover:text-gray-600 transition-colors" />
            </div>
          ) : (
            <>
              <p className="font-bold text-gray-900 text-[18px] leading-tight truncate">{entityName}</p>
              {entitySub && <p className="text-[13px] text-gray-500 mt-1 truncate">{entitySub}</p>}
              {hqName && <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider truncate">HQ: {hqName}</p>}
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ── 1. Visit Date ── */}
        <section>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Visit Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': `${config.accent}33` } as any}
            />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px]" />
          </div>
        </section>

        {/* ── 2. Visit Purpose ── */}
        <section className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Visit Purpose
          </label>
          <textarea
            value={visitPurpose}
            onChange={e => setVisitPurpose(e.target.value)}
            rows={2}
            placeholder="What is the objective of this visit?"
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': `${config.accent}33` } as any}
          />
        </section>

        {/* ── 3. Visit Feedback ── */}
        <section className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Visit Feedback
          </label>
          <textarea
            value={visitFeedback}
            onChange={e => setVisitFeedback(e.target.value)}
            rows={2}
            placeholder="How did the visit go?"
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': `${config.accent}33` } as any}
          />
        </section>

        {/* ── 4. Next Visit ── */}
        <section>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Next Visit Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={nextVisit}
              onChange={e => setNextVisit(e.target.value)}
              min={visitDate}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': `${config.accent}33` } as any}
            />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px]" />
          </div>
        </section>

        {/* ── 5. Remarks ── */}
        <section className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={2}
            placeholder="Any additional remarks..."
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': `${config.accent}33` } as any}
          />
        </section>

        {/* ── 6. Joint Visit (Radio) ── */}
        <section>
          <label className="block text-[12px] font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Joint Visit <span className="text-red-500">*</span>
            <span className="ml-2 font-medium text-gray-400 normal-case tracking-normal">(With Manager/Other)</span>
          </label>
          <div className="flex gap-3 mb-4">
            {(['Yes', 'No'] as const).map((opt: any) => (
              <button
                key={opt}
                onClick={() => { setJointVisit(opt); if (opt === 'No') setJointVisitWith(''); }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-[14px] font-bold transition-all shadow-sm hover:shadow-md"
                style={jointVisit === opt ? {
                  background: config.lightBg,
                  borderColor: config.accent,
                  color: config.textColor,
                  borderWidth: 2,
                } : {
                  background: '#f9fafb',
                  borderColor: 'transparent',
                  color: '#6b7280',
                  borderWidth: 2,
                }}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center`}
                  style={{ borderColor: jointVisit === opt ? config.accent : '#9ca3af' }}>
                  {jointVisit === opt && <div className="w-2 h-2 rounded-full" style={{ background: config.accent }} />}
                </div>
                {opt}
              </button>
            ))}
          </div>

          {/* Joint Visit With — enabled only if jointVisit = Yes */}
          {jointVisit === 'Yes' && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Joint Visit With <span className="text-gray-400 normal-case tracking-normal">(Select role)</span>
              </label>
              <div className="relative group">
                <select
                  value={jointVisitWith}
                  onChange={e => setJointVisitWith(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
                  style={{ '--tw-ring-color': `${config.accent}33` } as any}
                >
                  <option value="" className="text-gray-400">Select person...</option>
                  {JOINT_VISIT_OPTIONS.map((opt: any) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          )}
        </section>

        {/* ── 7. Products Promoted (multi-select, FK Product Master) ── */}
        {visitType !== 'STOCKIST' && (
          <section className="md:col-span-2 lg:col-span-3">
            <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
              Products Promoted
              <span className="ml-1 font-normal text-gray-400">(Reference to Product Master)</span>
            </label>

            {/* Selected chips */}
            {productsPromoted.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {productsPromoted.map((pid: any) => {
                  const p = availableProducts.find(x => x.id === pid);
                  return p ? (
                    <span
                      key={pid}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: config.lightBg, color: config.textColor }}
                    >
                      {p.name}
                      <button onClick={() => toggleProduct(pid)} className="ml-0.5 text-[10px] font-bold">×</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Search and select products..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-400"
              />
              <Package className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredProducts.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => { toggleProduct(p.id); setProductSearch(''); setShowProductDropdown(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-gray-800 hover:bg-gray-50 transition-colors text-left"
                    >
                      {productsPromoted.includes(p.id)
                        ? <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: config.textColor }} />
                        : <Square className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      }
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 8. Location Details (auto-captured, non-editable) ── */}
        <section className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Location Details
            <span className="ml-1 font-normal text-gray-400">(Auto-captured, non-editable)</span>
          </label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500">{locationAddress}</span>
          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <div className="px-6 pb-6 pt-6 mt-2 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full md:w-auto px-10 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none"
          style={{ background: `linear-gradient(to right, ${config.accent}, ${config.accent}e6)` }}
        >
          {isSubmitting ? 'SUBMITTING...' : (
            <>
              <Send className="w-5 h-5" />
              SUBMIT DAILY REPORT
            </>
          )}
        </button>
      </div>
    </div>
  );
}
