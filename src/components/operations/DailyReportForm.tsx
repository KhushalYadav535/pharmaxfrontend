'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { FileText, Send, AlertCircle, X, MapPin, Map, Package, Activity, Clock, Users, Building2, Store } from 'lucide-react';
import { api } from '@/lib/api';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-blue-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 bg-white';
const selectCls = inputCls;

interface DailyReportFormProps {
  onClose: () => void;
  editData?: any;
}

export default function DailyReportForm({ onClose, editData }: DailyReportFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [visitDate, setVisitDate] = useState(editData?.visitDate ? new Date(editData.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [visitType, setVisitType] = useState(editData?.visitType ?? 'DOCTOR');
  const [doctorId, setDoctorId] = useState(editData?.doctorId ?? '');
  const [hospitalId, setHospitalId] = useState(editData?.hospitalId ?? '');
  const [retailerId, setRetailerId] = useState(editData?.retailerId ?? '');
  const [stockistId, setStockistId] = useState(editData?.stockistId ?? '');
  const [visitPurpose, setVisitPurpose] = useState(editData?.visitPurpose ?? '');
  const [visitFeedback, setVisitFeedback] = useState(editData?.visitFeedback ?? '');
  const [nextVisit, setNextVisit] = useState(editData?.nextVisit ? new Date(editData.nextVisit).toISOString().split('T')[0] : '');
  const [remarks, setRemarks] = useState(editData?.remarks ?? '');
  const [jointVisit, setJointVisit] = useState(editData?.jointVisit ?? false);
  const [jointVisitWith, setJointVisitWith] = useState(editData?.jointVisitWith ?? '');
  const [productsPromoted, setProductsPromoted] = useState<string[]>(editData?.productsPromoted ?? []);
  
  // GPS Tracking State
  const [locationLat, setLocationLat] = useState<number | null>(editData?.locationLat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(editData?.locationLng ?? null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>(isEdit ? 'idle' : 'fetching');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Dropdown Data
  const { data: hqList = [] } = useQuery({ queryKey: ['headquarters-list'], queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then(r => r.data.data.headquarters || []) });
  const { data: products = [] } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products', { params: { limit: 500 } }).then(r => r.data.data.products || []) });
  
  // Targets Data
  const { data: doctors = [] } = useQuery({ queryKey: ['doctors-list'], queryFn: () => api.get('/doctors', { params: { limit: 500 } }).then(r => r.data.data.doctors || []), enabled: visitType === 'DOCTOR' });
  const { data: hospitals = [] } = useQuery({ queryKey: ['hospitals-list'], queryFn: () => api.get('/hospitals', { params: { limit: 500 } }).then(r => r.data.data.hospitals || []), enabled: visitType === 'HOSPITAL' });
  const { data: retailers = [] } = useQuery({ queryKey: ['retailers-list'], queryFn: () => api.get('/retailers', { params: { limit: 500 } }).then(r => r.data.data.retailers || []), enabled: visitType === 'RETAILER' });
  const { data: stockists = [] } = useQuery({ queryKey: ['stockists-list'], queryFn: () => api.get('/stockists', { params: { limit: 500 } }).then(r => r.data.data.stockists || []), enabled: visitType === 'STOCKIST' });

  useEffect(() => {
    if (!isEdit && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocationLat(pos.coords.latitude); setLocationLng(pos.coords.longitude); setGpsStatus('success'); },
        (err) => { console.warn("GPS Error:", err); setGpsStatus('error'); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (!isEdit) {
      setGpsStatus('error');
    }
  }, [isEdit]);

  const toggleProduct = (id: string) => {
    if (productsPromoted.includes(id)) {
      setProductsPromoted(productsPromoted.filter(p => p !== id));
    } else {
      setProductsPromoted([...productsPromoted, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate) { setError('Visit Date is required'); return; }
    if (visitType === 'DOCTOR' && !doctorId) { setError('Please select a Doctor'); return; }
    if (visitType === 'HOSPITAL' && !hospitalId) { setError('Please select a Hospital'); return; }
    if (visitType === 'RETAILER' && !retailerId) { setError('Please select a Retailer'); return; }
    if (visitType === 'STOCKIST' && !stockistId) { setError('Please select a Stockist'); return; }
    if (jointVisit && !jointVisitWith.trim()) { setError('Please specify who you are doing the joint visit with'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        hqId: hqId || undefined,
        visitType,
        doctorId: visitType === 'DOCTOR' ? doctorId : undefined,
        hospitalId: visitType === 'HOSPITAL' ? hospitalId : undefined,
        retailerId: visitType === 'RETAILER' ? retailerId : undefined,
        stockistId: visitType === 'STOCKIST' ? stockistId : undefined,
        visitDate,
        visitPurpose,
        visitFeedback,
        nextVisit: nextVisit || undefined,
        remarks,
        jointVisit,
        jointVisitWith: jointVisit ? jointVisitWith : undefined,
        productsPromoted,
        locationLat,
        locationLng
      };

      if (isEdit) {
        await api.put(`/daily-reports/${editData.id}`, payload);
      } else {
        await api.post('/daily-reports', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['daily-reports'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col my-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Visit Report' : 'Log Daily Visit'}
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

        <form id="dailyReportForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="md:col-span-2 flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-900">GPS Auto-Capture</span>
              </div>
              <div className="text-xs font-medium">
                {gpsStatus === 'fetching' && <span className="text-amber-600 animate-pulse">Fetching Location...</span>}
                {gpsStatus === 'success' && <span className="text-emerald-600">Lat: {locationLat?.toFixed(4)}, Lng: {locationLng?.toFixed(4)}</span>}
                {gpsStatus === 'error' && <span className="text-red-500">Failed to capture GPS. Ensure permissions are granted.</span>}
                {gpsStatus === 'idle' && <span className="text-gray-500">Stored Coordinates: {locationLat?.toFixed(4)}, {locationLng?.toFixed(4)}</span>}
              </div>
            </div>

            <div className="md:col-span-2 pt-1 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Visit Context</span>
            </div>

            <Field label="Visit Date" required>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className={inputCls} />
            </Field>

            <Field label="Headquarter / Territory">
              <select value={hqId} onChange={e => setHqId(e.target.value)} className={selectCls}>
                <option value="">Select Headquarter (Optional)</option>
                {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>

            <Field label="Visit Type" required span2>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'DOCTOR', label: 'Doctor', icon: Activity },
                  { id: 'HOSPITAL', label: 'Hospital', icon: Building2 },
                  { id: 'RETAILER', label: 'Retailer', icon: Store },
                  { id: 'STOCKIST', label: 'Stockist', icon: Package },
                  { id: 'OTHER', label: 'Other', icon: MapPin }
                ].map(vt => (
                  <label key={vt.id} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-bold cursor-pointer transition-all ${visitType === vt.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" className="hidden" name="visitType" checked={visitType === vt.id} onChange={() => { setVisitType(vt.id); setDoctorId(''); setHospitalId(''); setRetailerId(''); setStockistId(''); }} />
                    <vt.icon className={`w-4 h-4 ${visitType === vt.id ? 'text-white' : 'text-gray-400'}`} /> {vt.label}
                  </label>
                ))}
              </div>
            </Field>

            {visitType === 'DOCTOR' && (
              <Field label="Select Doctor" required span2>
                <select value={doctorId} onChange={e => setDoctorId(e.target.value)} className={selectCls}>
                  <option value="">Select a Doctor</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} ({d.speciality || 'General'})</option>)}
                </select>
              </Field>
            )}

            {visitType === 'HOSPITAL' && (
              <Field label="Select Hospital" required span2>
                <select value={hospitalId} onChange={e => setHospitalId(e.target.value)} className={selectCls}>
                  <option value="">Select a Hospital</option>
                  {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </Field>
            )}

            {visitType === 'RETAILER' && (
              <Field label="Select Retailer" required span2>
                <select value={retailerId} onChange={e => setRetailerId(e.target.value)} className={selectCls}>
                  <option value="">Select a Retailer</option>
                  {retailers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
            )}

            {visitType === 'STOCKIST' && (
              <Field label="Select Stockist" required span2>
                <select value={stockistId} onChange={e => setStockistId(e.target.value)} className={selectCls}>
                  <option value="">Select a Stockist</option>
                  {stockists.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            )}

            <div className="md:col-span-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Visit Outcome & Feedback</span>
            </div>

            <Field label="Visit Purpose">
              <input type="text" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value)} placeholder="Why did you visit?" className={inputCls} />
            </Field>

            <Field label="Next Follow-up Visit">
              <input type="date" value={nextVisit} onChange={e => setNextVisit(e.target.value)} className={inputCls} />
            </Field>

            <Field label="Visit Feedback" span2>
              <textarea value={visitFeedback} onChange={e => setVisitFeedback(e.target.value)} placeholder="Summary of the discussion, outcome, or response..." className={inputCls} rows={3} />
            </Field>

            <Field label="Products Promoted (Multi-Select)" span2>
              <div className="bg-white border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                {products.length === 0 ? <p className="text-xs text-gray-400 p-2">Loading products...</p> : products.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={productsPromoted.includes(p.id)} onChange={() => toggleProduct(p.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.composition || p.category || 'N/A'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Joint Visit?" span2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jointVisit" checked={jointVisit === true} onChange={() => setJointVisit(true)} className="text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jointVisit" checked={jointVisit === false} onChange={() => { setJointVisit(false); setJointVisitWith(''); }} className="text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">No</span>
                </label>
              </div>
            </Field>

            {jointVisit && (
              <Field label="Joint Visit With (Name/Role)" required span2>
                <input type="text" value={jointVisitWith} onChange={e => setJointVisitWith(e.target.value)} placeholder="e.g. Area Sales Manager (John Doe)" className={inputCls} />
              </Field>
            )}

            <Field label="Additional Remarks" span2>
              <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any extra notes?" className={inputCls} />
            </Field>

          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="dailyReportForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Report' : 'Submit Report'}</>}
        </button>
      </div>
    </div>
  );
}
