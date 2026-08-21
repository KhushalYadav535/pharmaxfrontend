'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, Phone, Mail, MapPin, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

const RING = '#f59e0b33'; // Amber

export default function DistributorForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  // Queries
  const { data: territoryList = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: () => api.get('/locations', { params: { limit: 100 } }).then(r => r.data.data.locations || [])
  });

  const [name, setName]                   = useState('');
  const [ownerName, setOwnerName]         = useState('');
  const [phone, setPhone]                 = useState('');
  const [email, setEmail]                 = useState('');
  const [address, setAddress]             = useState('');
  const [city, setCity]                   = useState('');
  const [state, setState]                 = useState('');
  const [pincode, setPincode]             = useState('');
  const [gstNumber, setGstNumber]         = useState('');
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [creditLimit, setCreditLimit]     = useState('0');
  const [creditDays, setCreditDays]       = useState('30');
  const [territoryId, setTerritoryId]     = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Distributor name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/distributors', {
        name, ownerName: ownerName || undefined,
        phone: phone || undefined, email: email || undefined,
        address: address || undefined, city: city || undefined,
        state: state || undefined, pincode: pincode || undefined,
        gstNumber: gstNumber || undefined,
        drugLicenseNumber: drugLicenseNumber || undefined,
        warehouseAddress: warehouseAddress || undefined,
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        creditDays: creditDays ? Number(creditDays) : 30,
        territoryId: territoryId || undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/distributors');
    } catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to save distributor'); }
    finally { setIsSubmitting(false); }
  };

  const inp = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all`;
  const sel = `${inp} appearance-none cursor-pointer font-semibold`;
  const lbl = `block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-widest`;

  const Div = ({ label }: { label: string }) => (
    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight drop-shadow-sm">Add Distributor</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Distributor Master Entry</p>
        </div>
        <Truck className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <Div label="Business Info" />

        <div className="md:col-span-2">
          <label className={lbl}>Distributor Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Firm name" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Owner Name</label>
          <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner's Name" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Territory (FK)</label>
          <div className="relative group">
            <select value={territoryId} onChange={e => setTerritoryId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Territory...</option>
              {territoryList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <Div label="Contact Details" />
        
        <div>
          <label className={lbl}>Phone</label>
          <div className="relative">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>Email</label>
          <div className="relative">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Address & Logistics" />
        
        <div className="md:col-span-2">
          <label className={lbl}>Billing Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Billing address" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>Warehouse Address</label>
          <input type="text" value={warehouseAddress} onChange={e => setWarehouseAddress(e.target.value)} placeholder="Godown / Warehouse address" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>State</label>
          <div className="relative group">
            <select value={state} onChange={e => { setState(e.target.value); setCity(''); }} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select State...</option>
              {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>City/District</label>
          <div className="relative group">
            <select value={city} onChange={e => setCity(e.target.value)} disabled={!state} className={`${sel} disabled:opacity-50`} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select City/District...</option>
              {state && INDIAN_STATES_AND_DISTRICTS[state]?.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>PIN Code</label>
          <div className="relative">
            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="000000" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Compliance & Financials" />
        
        <div>
          <label className={lbl}>GST Number</label>
          <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="GSTIN" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Drug License No.</label>
          <input type="text" value={drugLicenseNumber} onChange={e => setDrugLicenseNumber(e.target.value)} placeholder="DL No." className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Credit Limit (₹)</label>
          <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} min={0} className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Credit Days</label>
          <input type="number" value={creditDays} onChange={e => setCreditDays(e.target.value)} min={0} className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {error && (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 border-t border-gray-100 flex justify-end">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full md:w-auto px-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:to-orange-600 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> SAVE DISTRIBUTOR</>}
        </button>
      </div>
    </div>
  );
}
