'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Send, AlertCircle, ChevronDown, Navigation, IndianRupee } from 'lucide-react';
import { api } from '@/lib/api';

// ─── Expense Report Form ───────────────────────────────────────────────────────
// FFMS Fields: Employee ID*, HQ ID*, Location ID, Area ID,
//              Tour From Date*, Tour To Date*, Distance*,
//              Fare* (Radio Button), Daily Allowance (List), Misc Expenses

interface ExpenseReportFormProps {
  headquarterList?: { id: string; name: string }[];
  locationList?: { id: string; name: string }[];
  areaList?: { id: string; name: string }[];
  onSuccess?: () => void;
}

const FARE_TYPES = ['Bus', 'Train', 'Auto', 'Own Vehicle', 'Taxi', 'Flight'];
const DA_OPTIONS = ['Full DA', 'Half DA', 'No DA'];

export default function ExpenseReportForm({
  headquarterList = [], locationList = [], areaList = [], onSuccess
}: ExpenseReportFormProps) {
  const router = useRouter();

  const [hqId, setHqId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [tourFromDate, setTourFromDate] = useState('');
  const [tourToDate, setTourToDate] = useState('');
  const [distance, setDistance] = useState('');
  const [fareType, setFareType] = useState('');        // Radio Button per FFMS
  const [fareAmount, setFareAmount] = useState('');
  const [dailyAllowance, setDailyAllowance] = useState('');  // List per FFMS
  const [miscExpenses, setMiscExpenses] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = (
    Number(fareAmount || 0) +
    Number(miscExpenses || 0)
  );

  const validate = () => {
    if (!tourFromDate) return 'Tour From Date is mandatory';
    if (!tourToDate) return 'Tour To Date is mandatory';
    if (!distance) return 'Distance is mandatory';
    if (!fareType) return 'Fare type is mandatory';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/expenses', {
        hqId: hqId || undefined,
        locationId: locationId || undefined,
        areaId: areaId || undefined,
        tourFromDate,
        tourToDate,
        distance: Number(distance),
        fareType,
        fare: Number(fareAmount || 0),
        dailyAllowance: dailyAllowance || undefined,
        miscExpenses: Number(miscExpenses || 0),
        amount: totalAmount,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/expenses');
    } catch (e: any) { setError(e.message || 'Failed to submit'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">Expense Report</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Expense Entry</p>
        </div>
        {totalAmount > 0 && (
          <div className="ml-auto bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[14px] font-bold shadow-inner">
            ₹{totalAmount.toFixed(0)} Total
          </div>
        )}
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* HQ */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Headquarter</label>
          <div className="relative group">
            <select value={hqId} onChange={e => setHqId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#f59e0b33' } as any}>
              <option value="" className="text-gray-400">Select HQ...</option>
              {headquarterList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Location</label>
          <div className="relative group">
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#f59e0b33' } as any}>
              <option value="" className="text-gray-400">Select Location...</option>
              {locationList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Area */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Area</label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#f59e0b33' } as any}>
              <option value="" className="text-gray-400">Select Area...</option>
              {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Dates row */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Tour From <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={tourFromDate} onChange={e => setTourFromDate(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#f59e0b33' } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Tour To <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="date" value={tourToDate} min={tourFromDate} onChange={e => setTourToDate(e.target.value)}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#f59e0b33' } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Distance — Mandatory */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">
            Distance (km) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input type="number" value={distance} onChange={e => setDistance(e.target.value)}
              placeholder="0" min={0}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#f59e0b33' } as any} />
            <Navigation className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Fare — Radio Button per FFMS, Mandatory */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-[12px] font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Fare Type <span className="text-red-500">*</span>
            <span className="ml-1 font-medium text-gray-400 normal-case tracking-normal">(Select mode)</span>
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            {FARE_TYPES.map((ft: any) => (
              <button key={ft} onClick={() => setFareType(ft)}
                className={`px-5 py-3 rounded-xl border text-[13px] font-bold transition-all shadow-sm hover:shadow-md ${fareType === ft ? 'border-2 border-amber-500 bg-amber-50 text-amber-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {ft}
              </button>
            ))}
          </div>
          {fareType && (
            <div className="relative md:w-1/3 animate-in fade-in slide-in-from-top-2 duration-300">
              <input type="number" value={fareAmount} onChange={e => setFareAmount(e.target.value)}
                placeholder={`${fareType} amount (₹)`} min={0}
                className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
                style={{ '--tw-ring-color': '#f59e0b33' } as any} />
              <IndianRupee className="w-5 h-5 text-amber-500 absolute left-4 top-[14px] pointer-events-none" />
            </div>
          )}
        </div>

        {/* Daily Allowance — List per FFMS */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Daily Allowance</label>
          <div className="relative group">
            <select value={dailyAllowance} onChange={e => setDailyAllowance(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer"
              style={{ '--tw-ring-color': '#f59e0b33' } as any}>
              <option value="" className="text-gray-400">Select DA...</option>
              {DA_OPTIONS.map((o: any) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Misc Expenses */}
        <div>
          <label className="block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide">Misc Expenses (₹)</label>
          <div className="relative">
            <input type="number" value={miscExpenses} onChange={e => setMiscExpenses(e.target.value)}
              placeholder="0" min={0}
              className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all"
              style={{ '--tw-ring-color': '#f59e0b33' } as any} />
            <IndianRupee className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Total summary */}
        {totalAmount > 0 && (
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-6 py-5 flex justify-between items-center shadow-sm">
            <span className="text-[14px] font-bold text-amber-800 uppercase tracking-wide">Total Expense Summary</span>
            <span className="text-[24px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">₹{totalAmount.toFixed(2)}</span>
          </div>
        )}

        {error && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 mt-2 border-t border-gray-100 flex justify-end">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full md:w-auto px-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-500 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SUBMITTING...' : <><Send className="w-5 h-5" /> SUBMIT EXPENSE REPORT</>}
        </button>
      </div>
    </div>
  );
}
