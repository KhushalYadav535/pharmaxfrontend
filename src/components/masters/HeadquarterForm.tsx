'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, AlertCircle, Building2, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 bg-white';

interface HeadquarterFormProps {
  onClose: () => void;
  editData?: any;
}

export default function HeadquarterForm({ onClose, editData }: HeadquarterFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [name, setName]       = useState(editData?.name ?? '');
  const [district, setDistrict] = useState(editData?.district ?? '');
  const [state, setState]     = useState(editData?.state ?? '');
  const [pinCode, setPinCode] = useState(editData?.pinCode ?? '');
  const [region, setRegion]   = useState(editData?.region ?? '');
  const [zone, setZone]       = useState(editData?.zone ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Headquarter name is required'); return; }
    if (!state) { setError('State is required'); return; }

    try {
      setIsSubmitting(true); setError('');
      const payload = {
        name: name.trim(),
        district: district || undefined,
        state,
        pinCode: pinCode || undefined,
        region: region || undefined,
        zone: zone || undefined,
      };

      if (isEdit) {
        await api.put(`/headquarters/${editData.id}`, payload);
      } else {
        await api.post('/headquarters', payload);
      }

      qc.invalidateQueries({ queryKey: ['headquarters'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save headquarter');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEdit ? 'Edit Headquarter' : 'Add Headquarter'}
              </h2>
              <p className="text-xs text-gray-500">
                HQ Code will be auto-generated
              </p>
            </div>
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

          {/* HQ ID — non-editable */}
          {isEdit && (
            <Field label="HQ Code">
              <input value={editData?.code ?? ''} readOnly className={`${inputCls} opacity-60 cursor-not-allowed font-mono`} />
            </Field>
          )}

          <Field label="Headquarter Name" required>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mumbai West"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="District">
              <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Mumbai Suburban" className={inputCls} />
            </Field>
            <Field label="State" required>
              <select value={state} onChange={e => setState(e.target.value)} className={inputCls}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Pin Code">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="400001" maxLength={6} className={`${inputCls} pl-9`} />
              </div>
            </Field>
            <Field label="Region">
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. West" className={inputCls} />
            </Field>
            <Field label="Zone">
              <input value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Zone A" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Headquarter'}
          </button>
        </div>
      </div>
    </div>
  );
}
