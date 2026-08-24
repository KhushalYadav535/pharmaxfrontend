'use client';

import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Search, Send, AlertCircle, X, Map, Target, Users } from 'lucide-react';
import { api } from '@/lib/api';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white';
const selectCls = inputCls;

interface TourPlanFormProps {
  onClose: () => void;
  editData?: any;
}

export default function TourPlanForm({ onClose, editData }: TourPlanFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [tourFromDate, setTourFromDate] = useState(editData?.tourFromDate ? new Date(editData.tourFromDate).toISOString().split('T')[0] : '');
  const [tourToDate, setTourToDate] = useState(editData?.tourToDate ? new Date(editData.tourToDate).toISOString().split('T')[0] : '');
  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [locationId, setLocationId] = useState(editData?.locationId ?? '');
  const [areaId, setAreaId] = useState(editData?.areaId ?? '');
  const [tourPurpose, setTourPurpose] = useState(editData?.tourPurpose ?? '');
  const [jointVisit, setJointVisit] = useState(editData?.jointVisit ?? false);
  const [jointVisitWith, setJointVisitWith] = useState(editData?.jointVisitWith ?? '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Headquarters
  const { data: hqList = [], isLoading: hqLoading } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then(r => r.data.data.headquarters || [])
  });

  // Fetch Locations based on HQ
  const { data: locationList = [], isLoading: locLoading } = useQuery({
    queryKey: ['locations-for-hq', hqId],
    queryFn: () => api.get('/locations', { params: { hqId, limit: 500 } }).then(r => r.data.data.locations || []),
    enabled: !!hqId
  });

  // Fetch Areas based on HQ or Location
  const { data: areaList = [], isLoading: areaLoading } = useQuery({
    queryKey: ['areas-for-hq', hqId],
    queryFn: () => api.get('/areas', { params: { hqId, limit: 500 } }).then(r => r.data.data.areas || []),
    enabled: !!hqId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourFromDate) { setError('Tour From Date is required'); return; }
    if (!tourPurpose.trim()) { setError('Tour Purpose is required'); return; }
    if (!hqId) { setError('Headquarter is required to plan a tour'); return; }
    if (jointVisit && !jointVisitWith.trim()) { setError('Please specify who you are doing the joint visit with'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        tourFromDate,
        tourToDate: tourToDate || undefined,
        hqId: hqId || undefined,
        locationId: locationId || undefined,
        areaId: areaId || undefined,
        tourPurpose,
        jointVisit,
        jointVisitWith: jointVisit ? jointVisitWith : undefined
      };

      if (isEdit) {
        await api.put(`/tour-plans/${editData.id}`, payload);
      } else {
        await api.post('/tour-plans', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['tour-plans'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Tour Plan' : 'Create Tour Plan'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form id="tourPlanForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <Field label="Tour From Date" required>
              <input type="date" value={tourFromDate} onChange={e => setTourFromDate(e.target.value)} className={inputCls} />
            </Field>

            <Field label="Tour To Date">
              <input type="date" value={tourToDate} onChange={e => setTourToDate(e.target.value)} className={inputCls} />
            </Field>

            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Geographic Scope</span>
            </div>

            <Field label="Headquarter" required span2>
              <div className="relative">
                <MapPin className="absolute left-3 top-[11px] w-4 h-4 text-gray-400" />
                <select value={hqId} onChange={e => { setHqId(e.target.value); setLocationId(''); setAreaId(''); }} className={`${selectCls} pl-9`}>
                  <option value="">{hqLoading ? 'Loading...' : 'Select Headquarter'}</option>
                  {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Location (Optional)">
              <select value={locationId} onChange={e => setLocationId(e.target.value)} disabled={!hqId} className={selectCls}>
                <option value="">{locLoading ? 'Loading...' : 'Select Location'}</option>
                {locationList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>

            <Field label="Area (Optional)">
              <select value={areaId} onChange={e => setAreaId(e.target.value)} disabled={!hqId} className={selectCls}>
                <option value="">{areaLoading ? 'Loading...' : 'Select Area'}</option>
                {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>

            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Visit Details</span>
            </div>

            <Field label="Tour Purpose" required span2>
              <textarea 
                value={tourPurpose} 
                onChange={e => setTourPurpose(e.target.value)} 
                className={inputCls} 
                rows={3}
                placeholder="Describe the main objectives of this tour..." 
              />
            </Field>

            <Field label="Joint Visit?" span2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jointVisit" checked={jointVisit === true} onChange={() => setJointVisit(true)} className="text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jointVisit" checked={jointVisit === false} onChange={() => { setJointVisit(false); setJointVisitWith(''); }} className="text-amber-500 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">No</span>
                </label>
              </div>
            </Field>

            {jointVisit && (
              <Field label="Joint Visit With (Name/Role)" required span2>
                <div className="relative">
                  <Users className="absolute left-3 top-[11px] w-4 h-4 text-gray-400" />
                  <input type="text" value={jointVisitWith} onChange={e => setJointVisitWith(e.target.value)} placeholder="e.g. Area Sales Manager (John Doe)" className={`${inputCls} pl-9`} />
                </div>
              </Field>
            )}
          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="tourPlanForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Plan' : 'Submit Plan'}</>}
        </button>
      </div>
    </div>
  );
}
