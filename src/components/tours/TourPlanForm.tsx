'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, ChevronDown, Send, AlertCircle, Navigation } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Tour Planning Form ────────────────────────────────────────────────────────
// FFMS Fields: Employee ID*, HQ ID*, Location ID, Area ID,
//              Tour From Date*, Tour To Date*, Tour Purpose*,
//              Joint Visit* (Radio), Joint Visit With (List, enabled if Yes)

interface Location { id: string; name: string; }
interface Area { id: string; name: string; }
interface HQ { id: string; name: string; }

interface TourPlanFormProps {
  headquarterList?: HQ[];
  locationList?: Location[];
  areaList?: Area[];
  onSuccess?: () => void;
}

const JOINT_WITH_OPTIONS = ['ASM', 'RSM', 'ZM', 'NSM', 'Product Manager', 'Management', 'Other'];

export default function TourPlanForm({ headquarterList = [], locationList = [], areaList = [], onSuccess }: TourPlanFormProps) {
  const router = useRouter();

  // FFMS Fields
  const [hqId, setHqId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [tourFromDate, setTourFromDate] = useState('');
  const [tourToDate, setTourToDate] = useState('');
  const [tourPurpose, setTourPurpose] = useState('');
  const [jointVisit, setJointVisit] = useState<'Yes' | 'No' | ''>('');
  const [jointVisitWith, setJointVisitWith] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!tourFromDate) return 'Tour From Date is mandatory';
    if (!tourToDate) return 'Tour To Date is mandatory';
    if (!tourPurpose) return 'Tour Purpose is mandatory';
    if (!jointVisit) return 'Joint Visit is mandatory';
    if (jointVisit === 'Yes' && !jointVisitWith) return 'Please select Joint Visit With';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    try {
      setIsSubmitting(true);
      setError('');
      await api.post('/tour-plans', {
        hqId: hqId || undefined,
        locationId: locationId || undefined,
        areaId: areaId || undefined,
        tourFromDate,
        tourToDate,
        tourPurpose,
        jointVisit: jointVisit === 'Yes',
        jointVisitWith: jointVisit === 'Yes' ? jointVisitWith : undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/tour-planning');
    } catch (e: any) {
      setError(e.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">Tour Planning</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Tour Plan Entry</p>
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* HQ (Headquarter ID) */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Headquarter <span className="font-medium text-gray-400 normal-case tracking-normal ml-1">(Reference to HQ Master)</span>
          </label>
          <div className="relative group">
            <select value={hqId} onChange={e => setHqId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#6366f133' } as any}>
              <option value="" className="text-gray-400">Select Headquarter...</option>
              {headquarterList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Location ID */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Location</label>
          <div className="relative group">
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#6366f133' } as any}>
              <option value="" className="text-gray-400">Select Location...</option>
              {locationList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Area ID */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Area</label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#6366f133' } as any}>
              <option value="" className="text-gray-400">Select Area...</option>
              {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Tour From Date — Mandatory */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Tour From Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type="date" value={tourFromDate} onChange={e => setTourFromDate(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#6366f133' } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Tour To Date — Mandatory */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Tour To Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type="date" value={tourToDate} min={tourFromDate}
              onChange={e => setTourToDate(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#6366f133' } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Tour Purpose — Mandatory (Full Width) */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Tour Purpose <span className="text-red-500">*</span>
          </label>
          <textarea value={tourPurpose} onChange={e => setTourPurpose(e.target.value)}
            rows={2} placeholder="What is the objective of this tour?"
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': '#6366f133' } as any} />
        </div>

        {/* Joint Visit — Radio Button, Mandatory */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Joint Visit <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 mb-4">
            {(['Yes', 'No'] as const).map((opt: any) => (
              <button key={opt} onClick={() => { setJointVisit(opt); if (opt === 'No') setJointVisitWith(''); }}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-[14px] font-bold transition-all shadow-sm hover:shadow-md ${jointVisit === opt ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${jointVisit === opt ? 'border-indigo-500' : 'border-gray-400'}`}>
                  {jointVisit === opt && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                {opt}
              </button>
            ))}
          </div>

          {/* Joint Visit With — List, enabled only if Joint Visit = Yes */}
          {jointVisit === 'Yes' && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Joint Visit With <span className="font-medium text-gray-400 normal-case tracking-normal">(Select role)</span>
              </label>
              <div className="relative group">
                <select value={jointVisitWith} onChange={e => setJointVisitWith(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
                  style={{ '--tw-ring-color': '#6366f133' } as any}>
                  <option value="" className="text-gray-400">Select person...</option>
                  {JOINT_WITH_OPTIONS.map((o: any) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 border-t border-gray-100 pt-6 mt-2">
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full md:w-auto px-10 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:to-indigo-600 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
            {isSubmitting ? 'SUBMITTING...' : <><Send className="w-5 h-5" /> SUBMIT TOUR PLAN</>}
          </button>
        </div>
      </div>
    </div>
  );
}
