'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Gift, ArrowLeft, Send, Sparkles, Calendar,
  ShieldCheck, AlertTriangle, Layers, Percent, Tag
} from 'lucide-react';

const SCHEME_TYPES = [
  { id: 'free_goods', label: 'Free Goods / Bonus', icon: '🎁', desc: 'Complimentary product bonus units' },
];

export default function NewSchemePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'free_goods',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
    targetRole: 'retailer',
    minPurchase: '',
    reward: '',
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/schemes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schemes'] });
      router.push('/dashboard/schemes');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      alert('Please fill out Scheme Name, Start Date, and End Date');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/schemes"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Trade Promotion Scheme</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Gift className="w-3 h-3 text-emerald-600" />
              Trade Incentive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Roll out volume discounts, free-stock bonus slabs, and retailer loyalty programs
          </p>
        </div>
      </div>

      {/* ── STEP 1: SCHEME TYPE ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          1. Incentive Structure
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCHEME_TYPES.map((t) => {
            const isSelected = form.type === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setForm((prev) => ({ ...prev, type: t.id }))}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="text-xs font-black text-slate-900">{t.label}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{t.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: GENERAL DETAILS ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          2. Scheme Identification
        </span>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Scheme Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Q3 Monsoon Antibiotic Drive - Free Goods / Bonus Scheme"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500"
            required
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Description & Slabs Terms</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Eligible products, minimum order criteria, distributor claiming protocol..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      {/* ── STEP 3: DATES & ELIGIBILITY ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          3. Validity Period & Target Audience
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Trade Role</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="retailer">Retail Chemist</option>
              <option value="distributor">Stockist / Distributor</option>
              <option value="hospital">Hospital Pharmacy</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Minimum Purchase (₹ Amount or Units)
            </label>
            <input
              type="text"
              value={form.minPurchase}
              onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
              placeholder="e.g. ₹15,000 or 50 Strips"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Payout / Free Goods Reward
            </label>
            <input
              type="text"
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: e.target.value })}
              placeholder="e.g. 10% Cash Rebate or 5 Free Packs"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/schemes"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {createMutation.isPending ? 'Publishing Scheme...' : 'Publish Trade Scheme'}
        </button>
      </div>
    </form>
  );
}
