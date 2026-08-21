'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Send, AlertCircle, ChevronDown, TrendingUp, IndianRupee } from 'lucide-react';
import { api } from '@/lib/api';

interface SurveyFormProps {
  headquarterList?: { id: string; name: string }[];
  productList?: { id: string; name: string }[];
  onSuccess?: () => void;
}

const RING = '#f43f5e33';

export default function SurveyForm({ headquarterList = [], productList = [], onSuccess }: SurveyFormProps) {
  const router = useRouter();
  const todayStr = new Date().toISOString().split('T')[0];

  const [hqId, setHqId] = useState('');
  const [surveyDate, setSurveyDate] = useState(todayStr);
  const [productId, setProductId] = useState('');
  const [competitorCompanyName, setCompetitorCompanyName] = useState('');
  const [competitorProductName, setCompetitorProductName] = useState('');
  const [competitorProductComposition, setCompetitorProductComposition] = useState('');
  const [mrp, setMrp] = useState('');
  const [pts, setPts] = useState('');
  const [ptr, setPtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (surveyDate < todayStr) return 'Survey date cannot be in the past';
    if (!competitorCompanyName) return 'Competitor Company Name is mandatory';
    if (!competitorProductName) return 'Competitor Product Name is mandatory';
    if (!mrp) return 'Maximum Retail Price is mandatory';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/surveys', {
        hqId: hqId || undefined,
        surveyDate,
        productId: productId || undefined,
        competitorCompanyName,
        competitorProductName,
        competitorProductComposition: competitorProductComposition || undefined,
        maximumRetailPrice: Number(mrp),
        priceToStockist: pts ? Number(pts) : undefined,
        priceToRetailer: ptr ? Number(ptr) : undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/surveys');
    } catch (e: any) { setError(e.message || 'Failed to submit'); }
    finally { setIsSubmitting(false); }
  };

  const inputCls = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all`;
  const selectCls = `${inputCls} appearance-none cursor-pointer font-semibold`;
  const labelCls = `block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide`;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">Competitor Survey</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Survey Entry</p>
        </div>
        <TrendingUp className="w-6 h-6 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* HQ */}
        <div>
          <label className={labelCls}>Headquarter</label>
          <div className="relative group">
            <select value={hqId} onChange={e => setHqId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="" className="text-gray-400">Select HQ...</option>
              {headquarterList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Survey Date */}
        <div>
          <label className={labelCls}>
            Survey Date <span className="text-red-500">*</span>
            <span className="ml-1 font-medium text-gray-400 normal-case tracking-normal">(Past dates not allowed)</span>
          </label>
          <div className="relative">
            <input type="date" value={surveyDate} min={todayStr} onChange={e => setSurveyDate(e.target.value)}
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* Our Product */}
        <div>
          <label className={labelCls}>
            Our Product <span className="font-medium text-gray-400 normal-case tracking-normal">(FK: Product Master)</span>
          </label>
          <div className="relative group">
            <select value={productId} onChange={e => setProductId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="" className="text-gray-400">Select Product...</option>
              {productList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Divider — Competitor Details */}
        <div className="md:col-span-2 lg:col-span-3 -mx-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Competitor Details</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </div>

        {/* Competitor Company Name */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className={labelCls}>Competitor Company <span className="text-red-500">*</span></label>
          <input type="text" value={competitorCompanyName} onChange={e => setCompetitorCompanyName(e.target.value)}
            placeholder="Enter company name"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* Competitor Product Name */}
        <div>
          <label className={labelCls}>Competitor Product <span className="text-red-500">*</span></label>
          <input type="text" value={competitorProductName} onChange={e => setCompetitorProductName(e.target.value)}
            placeholder="Enter product name"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* Composition */}
        <div>
          <label className={labelCls}>Composition</label>
          <input type="text" value={competitorProductComposition} onChange={e => setCompetitorProductComposition(e.target.value)}
            placeholder="e.g. Paracetamol 500mg"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* Divider — Pricing */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pricing</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        </div>

        {/* MRP */}
        <div>
          <label className={labelCls}>MRP <span className="text-red-500">*</span></label>
          <div className="relative">
            <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="0.00" min={0} step={0.01}
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <IndianRupee className="w-5 h-5 text-rose-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* PTS */}
        <div>
          <label className={labelCls}>Price to Stockist</label>
          <div className="relative">
            <input type="number" value={pts} onChange={e => setPts(e.target.value)} placeholder="0.00" min={0} step={0.01}
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <IndianRupee className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* PTR */}
        <div>
          <label className={labelCls}>Price to Retailer</label>
          <div className="relative">
            <input type="number" value={ptr} onChange={e => setPtr(e.target.value)} placeholder="0.00" min={0} step={0.01}
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <IndianRupee className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 border-t border-gray-100 flex justify-end">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full md:w-auto px-10 bg-gradient-to-r from-rose-500 to-rose-600 hover:to-rose-500 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SUBMITTING...' : <><Send className="w-5 h-5" /> SUBMIT SURVEY</>}
        </button>
      </div>
    </div>
  );
}
