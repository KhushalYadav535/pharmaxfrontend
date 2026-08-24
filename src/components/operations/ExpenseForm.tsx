'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Send, AlertCircle, X, Receipt, Calculator, MapPin, DollarSign, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 bg-white transition-all';
const selectCls = inputCls;

interface ExpenseFormProps {
  onClose: () => void;
  editData?: any;
}

export default function ExpenseForm({ onClose, editData }: ExpenseFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [tourFromDate, setTourFromDate] = useState(editData?.tourFromDate ? new Date(editData.tourFromDate).toISOString().split('T')[0] : '');
  const [tourToDate, setTourToDate] = useState(editData?.tourToDate ? new Date(editData.tourToDate).toISOString().split('T')[0] : '');
  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [locationId, setLocationId] = useState(editData?.locationId ?? '');
  const [areaId, setAreaId] = useState(editData?.areaId ?? '');
  
  const [distance, setDistance] = useState(editData?.distance ?? '');
  const [fareType, setFareType] = useState(editData?.fareType ?? '');
  const [fare, setFare] = useState(editData?.fare ?? 0);
  const [dailyAllowance, setDailyAllowance] = useState(editData?.dailyAllowance ?? 0);
  const [miscExpenses, setMiscExpenses] = useState(editData?.miscExpenses ?? 0);
  const [description, setDescription] = useState(editData?.description ?? '');

  const [totalAmount, setTotalAmount] = useState(editData?.amount ?? 0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Dropdown Data
  const { data: hqList = [], isLoading: hqLoading } = useQuery({ queryKey: ['headquarters-list'], queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then(r => r.data.data.headquarters || []) });
  const { data: locationList = [], isLoading: locLoading } = useQuery({ queryKey: ['locations-for-hq', hqId], queryFn: () => api.get('/locations', { params: { hqId, limit: 500 } }).then(r => r.data.data.locations || []), enabled: !!hqId });
  const { data: areaList = [], isLoading: areaLoading } = useQuery({ queryKey: ['areas-for-hq', hqId], queryFn: () => api.get('/areas', { params: { hqId, limit: 500 } }).then(r => r.data.data.areas || []), enabled: !!hqId });

  // Auto-calculation logic
  useEffect(() => {
    const total = Number(fare || 0) + Number(dailyAllowance || 0) + Number(miscExpenses || 0);
    setTotalAmount(total);
  }, [fare, dailyAllowance, miscExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourFromDate) { setError('Tour From Date is required'); return; }
    if (Number(totalAmount) <= 0) { setError('Total Expense amount must be greater than zero'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        hqId: hqId || undefined,
        locationId: locationId || undefined,
        areaId: areaId || undefined,
        tourFromDate,
        tourToDate: tourToDate || undefined,
        distance: distance ? Number(distance) : undefined,
        fareType: fareType || undefined,
        fare: Number(fare),
        dailyAllowance: Number(dailyAllowance),
        miscExpenses: Number(miscExpenses),
        description
      };

      if (isEdit) {
        await api.put(`/expenses/${editData.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['expenses'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Expense Report' : 'Submit Expense Report'}
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

        <form id="expenseForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="md:col-span-2 flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Tour Details</span>
            </div>

            <Field label="Tour From Date" required>
              <input type="date" value={tourFromDate} onChange={e => setTourFromDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tour To Date">
              <input type="date" value={tourToDate} onChange={e => setTourToDate(e.target.value)} className={inputCls} />
            </Field>

            <Field label="Headquarter" span2>
              <select value={hqId} onChange={e => { setHqId(e.target.value); setLocationId(''); setAreaId(''); }} className={selectCls}>
                <option value="">{hqLoading ? 'Loading...' : 'Select Headquarter'}</option>
                {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <select value={locationId} onChange={e => setLocationId(e.target.value)} disabled={!hqId} className={selectCls}>
                <option value="">{locLoading ? 'Loading...' : 'Select Location'}</option>
                {locationList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Area">
              <select value={areaId} onChange={e => setAreaId(e.target.value)} disabled={!hqId} className={selectCls}>
                <option value="">{areaLoading ? 'Loading...' : 'Select Area'}</option>
                {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>

            <div className="md:col-span-2 pt-4 flex items-center gap-2 mb-1 border-t border-gray-200">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-widest">Expense Details</span>
            </div>

            <Field label="Travel Fare Type">
              <select value={fareType} onChange={e => setFareType(e.target.value)} className={selectCls}>
                <option value="">Select Mode</option>
                <option value="BUS">Bus</option>
                <option value="TRAIN">Train</option>
                <option value="AUTO">Auto</option>
                <option value="TAXI">Taxi</option>
                <option value="OWN_VEHICLE">Own Vehicle</option>
              </select>
            </Field>
            <Field label="Distance Travelled (km)">
              <input type="number" min="0" step="any" value={distance} onChange={e => setDistance(e.target.value)} className={inputCls} placeholder="e.g. 45" />
            </Field>

            <div className="md:col-span-2 grid grid-cols-3 gap-4">
              <Field label="Travel Fare (₹)">
                <input type="number" min="0" step="any" value={fare} onChange={e => setFare(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Daily Allowance (₹)">
                <input type="number" min="0" step="any" value={dailyAllowance} onChange={e => setDailyAllowance(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Misc Expenses (₹)">
                <input type="number" min="0" step="any" value={miscExpenses} onChange={e => setMiscExpenses(e.target.value)} className={inputCls} />
              </Field>
            </div>

            <Field label="Notes / Description" span2>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls} placeholder="Any details regarding the expenses..." />
            </Field>

            <div className="md:col-span-2 bg-emerald-50 p-4 rounded-xl border-2 border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Total Calculated Amount</span>
              </div>
              <span className="text-2xl font-black text-emerald-700">₹ {totalAmount.toFixed(2)}</span>
            </div>

          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="expenseForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Expense' : 'Submit Expense'}</>}
        </button>
      </div>
    </div>
  );
}
