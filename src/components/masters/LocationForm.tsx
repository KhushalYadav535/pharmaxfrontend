'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

interface LocationFormProps {
  onClose: () => void;
  editData?: any;
}

export default function LocationForm({ onClose, editData }: LocationFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  // HQ dropdown (territories)
  const { data: hqList = [] } = useQuery({
    queryKey: ['territories-for-form'],
    queryFn: () => api.get('/locations', { params: { limit: 200 } }).then(r => r.data.data.locations || []),
  });

  const [name, setName] = useState(editData?.name ?? '');
  const [district, setDistrict] = useState(editData?.district ?? '');
  const [state, setState] = useState(editData?.state ?? '');
  const [pinCode, setPinCode] = useState(editData?.pinCode ?? '');
  const [hqId, setHqId] = useState(editData?.hqId ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const districts = state ? (INDIAN_STATES_AND_DISTRICTS[state] ?? []) : [];

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Location name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      const payload = {
        name: name.trim(),
        district: district || undefined,
        state: state || undefined,
        pinCode: pinCode || undefined,
        hqId: hqId || undefined,
      };
      if (isEdit) {
        await api.put(`/locations/${editData.id}`, payload);
      } else {
        await api.post('/locations', payload);
      }
      qc.invalidateQueries({ queryKey: ['locations'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save location');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Location' : 'Add Location'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Location Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Andheri East"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">State</label>
              <select
                value={state}
                onChange={e => { setState(e.target.value); setDistrict(''); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 bg-white"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">District</label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                disabled={!state}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 bg-white disabled:opacity-50"
              >
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Pin Code</label>
              <input
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="400001"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Headquarter (HQ)</label>
              <select
                value={hqId}
                onChange={e => setHqId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 bg-white"
              >
                <option value="">None</option>
                {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ backgroundColor: '#059669' }}
            className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
