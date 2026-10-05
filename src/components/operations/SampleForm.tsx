'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Gift, Package, Send, ChevronLeft, Stethoscope,
  Plus, Minus, MessageSquare, CheckCircle2, ShieldCheck,
  UserCheck, Sparkles, Tag, Clock, ArrowLeft
} from 'lucide-react';

const PRESET_NOTES = [
  'Prescription initiation trial for 3 patients',
  'Doctor requested clinical feedback sample',
  'High-potential prescriber conversion',
  'Follow-up trial after detailing session',
  'New dosage formulation introduction'
];

export default function SampleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();

  const entityId = searchParams?.get('entityId') || searchParams?.get('doctorId') || '';
  const [doctorId, setDoctorId] = useState(entityId);
  const [sampleProductId, setSampleProductId] = useState('');
  const [quantity, setQuantity] = useState('2');
  const [notes, setNotes] = useState('');

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-list-sample'],
    queryFn: () => api.get('/doctors', { params: { limit: 200 } }).then((r) => r.data.data.doctors || []),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['sample-products-form'],
    queryFn: () => api.get('/samples/products').then((r) => r.data.data || []),
  });

  const selectedDoctor = useMemo(() => {
    return doctors.find((d: any) => d.id === doctorId);
  }, [doctors, doctorId]);

  const selectedProduct = useMemo(() => {
    return products.find((p: any) => p.id === sampleProductId);
  }, [products, sampleProductId]);

  const submitMutation = useMutation({
    mutationFn: (payload: any) => api.post('/samples/distribute', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sample-distributions'] });
      qc.invalidateQueries({ queryKey: ['sample-stats'] });
      router.push('/dashboard/samples');
    },
  });

  const handleStepQuantity = (delta: number) => {
    const curr = parseInt(quantity, 10) || 0;
    const nextVal = Math.max(1, curr + delta);
    setQuantity(nextVal.toString());
  };

  const handlePresetNote = (phrase: string) => {
    setNotes((prev) => (prev ? `${prev}. ${phrase}` : phrase));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      alert('Please select a Target Physician / Doctor');
      return;
    }
    if (!sampleProductId) {
      alert('Please select a Pharmaceutical Sample Formulation');
      return;
    }
    const q = parseInt(quantity, 10);
    if (isNaN(q) || q < 1) {
      alert('Quantity must be at least 1 unit');
      return;
    }

    submitMutation.mutate({
      doctorId,
      sampleProductId,
      quantity: q,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/samples"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Issue Physician Sample</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Gift className="w-3 h-3 text-emerald-600" />
              Doctor Sampling
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hand over promotional medical samples with physician feedback & prescription trial tracking
          </p>
        </div>
      </div>

      {/* ── STEP 1: DOCTOR SELECTOR ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          1. Target Physician
        </span>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Select Doctor <span className="text-rose-500">*</span>
          </label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
            required
          >
            <option value="">-- Choose Target Doctor --</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.salutation || 'Dr.'} {d.firstName} {d.lastName} ({d.specialty || 'Doctor'} · {d.qualification || 'MBBS'})
              </option>
            ))}
          </select>

          {selectedDoctor && (
            <div className="mt-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 space-y-1">
              <div className="font-black text-emerald-950 text-sm">
                {selectedDoctor.salutation || 'Dr.'} {selectedDoctor.firstName} {selectedDoctor.lastName}
              </div>
              <div className="text-emerald-800 font-medium">
                {selectedDoctor.specialty || 'General Practice'} · Degree: {selectedDoctor.qualification || 'MBBS'}
              </div>
              {selectedDoctor.clinicAddress && (
                <div className="text-slate-500 text-[11px]">
                  Clinic: {selectedDoctor.clinicAddress}
                </div>
              )}
              {selectedDoctor.phone && (
                <div className="text-slate-500 text-[11px]">
                  Phone: {selectedDoctor.phone}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 2: SAMPLE PRODUCT ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          2. Pharmaceutical Sample Formulation
        </span>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Select Formulation <span className="text-rose-500">*</span>
          </label>
          <select
            value={sampleProductId}
            onChange={(e) => setSampleProductId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
            required
          >
            <option value="">-- Choose Sample Product --</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.packSize ? `(${p.packSize})` : ''} {p.batchNumber ? `· Batch: ${p.batchNumber}` : ''}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-slate-900">{selectedProduct.name}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pack Size: {selectedProduct.packSize || 'Standard Sample Pack'}
                  {selectedProduct.batchNumber && ` · Batch #${selectedProduct.batchNumber}`}
                </p>
              </div>
              {selectedProduct.remainingStock !== undefined && (
                <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                  Stock: {selectedProduct.remainingStock} units
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 3: QUANTITY COUNTER ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          3. Units Handed Over
        </span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepQuantity(-1)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 text-center font-black text-lg py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-emerald-500"
              required
            />
            <button
              type="button"
              onClick={() => handleStepQuantity(1)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['1', '2', '3', '5', '10'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setQuantity(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  quantity === val
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val} units
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 4: NOTES & PRESET CHIPS ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          4. Handover Context & Physician Feedback
        </span>

        {/* Preset Suggestions */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500">Quick Phrases</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_NOTES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => handlePresetNote(phrase)}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-slate-600 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Trial Notes / Clinical Observation</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Doctor feedback on dosage tolerance, planned patient category..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/samples"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitMutation.isPending ? 'Logging Handover...' : 'Record Sample Handover'}
        </button>
      </div>
    </form>
  );
}
