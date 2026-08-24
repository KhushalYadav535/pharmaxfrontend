'use client';

import React, { useState } from 'react';
import { X, Loader2, AlertCircle, Grid3X3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

interface AreaFormProps {
  onClose: () => void;
  editData?: any;
}

export default function AreaForm({ onClose, editData }: AreaFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const { data: locationList = [] } = useQuery({
    queryKey: ['locations-for-form'],
    queryFn: () => api.get('/locations', { params: { limit: 200 } }).then(r => r.data.data.locations || []),
  });

  const { data: hqList = [] } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 200 } }).then(r => r.data.data.headquarters || []),
  });

  const [name, setName] = useState(editData?.name ?? '');
  const [locationId, setLocationId] = useState(editData?.locationId ?? '');
  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [district, setDistrict] = useState(editData?.district ?? '');
  const [state, setState] = useState(editData?.state ?? '');
  const [pinCode, setPinCode] = useState(editData?.pinCode ?? '');

  const districts = state ? (INDIAN_STATES_AND_DISTRICTS[state] ?? []) : [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Area name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      const payload = {
        name: name.trim(),
        locationId: locationId || undefined,
        hqId: hqId || undefined,
        district: district || undefined,
        state: state || undefined,
        pinCode: pinCode || undefined,
      };
      if (isEdit) {
        await api.put(`/areas/${editData.id}`, payload);
      } else {
        await api.post('/areas', payload);
      }
      qc.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Area' : 'Add Area'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Area Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Bandra West"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Parent Location</label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white"
              >
                <option value="">None</option>
                {locationList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Headquarter (HQ)</label>
              <select
                value={hqId}
                onChange={e => setHqId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white"
              >
                <option value="">None</option>
                {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">State</label>
              <select
                value={state}
                onChange={e => { setState(e.target.value); setDistrict(''); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white"
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
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400 bg-white disabled:opacity-50"
              >
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Pin Code</label>
            <input
              value={pinCode}
              onChange={e => setPinCode(e.target.value)}
              placeholder="400001"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ backgroundColor: '#d97706' }}
            className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Area'}
          </button>
        </div>
      </div>
    </div>
  );
}
