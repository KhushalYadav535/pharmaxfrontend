'use client';

import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Target, Send, AlertCircle, MapPin, Calendar, DollarSign, X } from 'lucide-react';
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

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 bg-white';
const selectCls = inputCls;

interface TargetFormProps {
  onClose: () => void;
  editData?: any;
}

export default function TargetForm({ onClose, editData }: TargetFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i); // current year - 1 to +3

  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [targetYear, setTargetYear] = useState(editData?.targetYear ?? currentYear);
  const [targetAmount, setTargetAmount] = useState(editData?.targetAmount ?? '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: hqList = [], isLoading: hqLoading } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then(r => r.data.data.headquarters || [])
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hqId) { setError('Headquarter is required'); return; }
    if (!targetAmount || Number(targetAmount) <= 0) { setError('Valid Target Amount is required'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        hqId,
        targetYear: Number(targetYear),
        targetAmount: Number(targetAmount)
      };

      if (isEdit) {
        await api.put(`/targets/${editData.id}`, payload);
      } else {
        await api.post('/targets', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['targets'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Territory Target' : 'Set Territory Target'}
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

        <form id="targetForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Headquarter / Territory" required span2>
              <div className="relative">
                <MapPin className="absolute left-3 top-[11px] w-4 h-4 text-gray-400" />
                <select value={hqId} onChange={e => setHqId(e.target.value)} className={`${selectCls} pl-9`}>
                  <option value="">{hqLoading ? 'Loading...' : 'Select Headquarter'}</option>
                  {hqList.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </Field>
            
            <Field label="Target Year" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-[11px] w-4 h-4 text-gray-400" />
                <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} className={`${selectCls} pl-9`}>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </Field>
            
            <Field label="Target Amount (₹)" required>
              <div className="relative">
                <DollarSign className="absolute left-3 top-[11px] w-4 h-4 text-gray-400" />
                <input 
                  type="number" 
                  step="0.01" 
                  value={targetAmount} 
                  onChange={e => setTargetAmount(e.target.value)} 
                  className={`${inputCls} pl-9`} 
                  placeholder="e.g. 500000" 
                />
              </div>
            </Field>
          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="targetForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Target' : 'Save Target'}</>}
        </button>
      </div>
    </div>
  );
}
