'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Calendar, Coffee, Heart, Send, ArrowLeft,
  CheckCircle2, AlertCircle, Clock, ShieldCheck
} from 'lucide-react';

const LEAVE_TYPES = [
  {
    id: 'casual',
    label: 'Casual Leave',
    code: 'CL',
    desc: 'Personal errands, short family commitments',
    total: 12,
    icon: Coffee,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'sick',
    label: 'Sick Leave',
    code: 'SL',
    desc: 'Medical recovery, outpatient treatment',
    total: 12,
    icon: Heart,
    color: 'text-rose-700 bg-rose-50 border-rose-200'
  },
  {
    id: 'earned',
    label: 'Earned Leave',
    code: 'EL',
    desc: 'Planned vacation, extended rest period',
    total: 21,
    icon: Calendar,
    color: 'text-sky-700 bg-sky-50 border-sky-200'
  },
];

export default function ApplyLeavePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');

  // Fetch live leave balance
  const { data: balance } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/leaves/balance').then((r) => r.data.data),
  });

  const calcDays = () => {
    const s = new Date(startDate).setHours(0, 0, 0, 0);
    const e = new Date(endDate).setHours(0, 0, 0, 0);
    if (e < s) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const applyMutation = useMutation({
    mutationFn: (body: any) => api.post('/leaves', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      router.push('/dashboard/leave');
    },
  });

  const daysCount = calcDays();
  const selectedMeta = LEAVE_TYPES.find((t) => t.id === leaveType) || LEAVE_TYPES[0];
  const quotaRemaining = balance?.[leaveType]?.remaining ?? selectedMeta.total;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (daysCount <= 0) {
      alert('End date must be the same or after the start date.');
      return;
    }
    if (!reason.trim()) {
      alert('Please provide a reason for your leave application.');
      return;
    }

    applyMutation.mutate({
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/leave"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Apply for Leave</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Time-Off Request
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit formal leave request for managerial approval and territory reassignment
          </p>
        </div>
      </div>

      {/* ── STEP 1: LEAVE TYPE CARDS ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
            1. Select Leave Category
          </span>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            {quotaRemaining} Days Remaining
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEAVE_TYPES.map((type) => {
            const isSelected = leaveType === type.id;
            const b = balance?.[type.id];
            const rem = b?.remaining ?? type.total;
            const Icon = type.icon;

            return (
              <div
                key={type.id}
                onClick={() => setLeaveType(type.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {rem} Left
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900">{type.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{type.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: DATES ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          2. Leave Duration ({daysCount} {daysCount === 1 ? 'Day' : 'Days'})
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>
        </div>

        {daysCount > quotaRemaining && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Requested {daysCount} days exceeds current balance of {quotaRemaining} days. Excess may be treated as Loss of Pay (LOP).</span>
          </div>
        )}
      </div>

      {/* ── STEP 3: REASON ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          3. Reason for Absence
        </span>

        <div>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State the reason for your time-off request (medical appointment, family event, personal travel)..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
            required
          />
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/leave"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {applyMutation.isPending ? 'Submitting Application...' : `Submit Application (${daysCount} Days)`}
        </button>
      </div>
    </form>
  );
}
