'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, Phone, Mail, MapPin, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'];
const CATEGORIES = ['A', 'B', 'C', 'D'];
const VISIT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RING = '#8b5cf633'; // Violet

export default function RetailerForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  // Queries
  const { data: areaList = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas', { params: { limit: 100 } }).then(r => r.data.data.areas || [])
  });
  const { data: territoryList = [] } = useQuery({
    queryKey: ['territories'],
    queryFn: () => api.get('/locations', { params: { limit: 100 } }).then(r => r.data.data.locations || [])
  });
  const { data: stockistList = [] } = useQuery({
    queryKey: ['stockists'],
    queryFn: () => api.get('/stockists', { params: { limit: 100 } }).then(r => r.data.data.stockists || [])
  });
  const { data: distributorList = [] } = useQuery({
    queryKey: ['distributors'],
    queryFn: () => api.get('/distributors', { params: { limit: 100 } }).then(r => r.data.data.distributors || [])
  });

  const [name, setName]                   = useState('');
  const [gstinNumber, setGstinNumber]     = useState('');
  const [panNumber, setPanNumber]         = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName]   = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactDept, setContactDept]     = useState('');
  const [gender, setGender]               = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [category, setCategory]           = useState('');
  const [address1, setAddress1]           = useState('');
  const [address2, setAddress2]           = useState('');
  const [city, setCity]                   = useState('');
  const [district, setDistrict]           = useState('');
  const [state, setState]                 = useState('');
  const [pin, setPin]                     = useState('');
  const [areaId, setAreaId]               = useState('');
  const [territoryId, setTerritoryId]     = useState('');
  const [stockistId, setStockistId]       = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [mobileNumber, setMobileNumber]   = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail]                 = useState('');
  const [dateOfBirth, setDateOfBirth]     = useState('');
  const [marriageAnniversary, setMarriageAnniversary] = useState('');
  const [website, setWebsite]             = useState('');
  const [facebook, setFacebook]           = useState('');
  const [instagram, setInstagram]         = useState('');
  const [twitter, setTwitter]             = useState('');
  const [visitDays, setVisitDays]         = useState<string[]>([]);
  
  // Legacy backward compat
  const [ownerName, setOwnerName]         = useState('');
  const [pharmacistName, setPharmacistName] = useState('');
  const [drugLicenseNumber, setDrugLicenseNumber] = useState('');
  const [drugLicenseExpiry, setDrugLicenseExpiry] = useState('');
  const [visitFrequency, setVisitFrequency] = useState('2');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (day: string) =>
    setVisitDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Retailer name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/retailers', {
        name, gstinNumber: gstinNumber || undefined, panNumber: panNumber || undefined,
        contactFirstName: contactFirstName || undefined, contactLastName: contactLastName || undefined,
        contactDesignation: contactDesignation || undefined, contactDept: contactDept || undefined,
        gender: gender || undefined, maritalStatus: maritalStatus || undefined,
        category: category || undefined,
        address1: address1 || undefined, address2: address2 || undefined,
        city: city || undefined, district: district || undefined, state: state || undefined, pin: pin || undefined,
        areaId: areaId || undefined, territoryId: territoryId || undefined,
        stockistId: stockistId || undefined, distributorId: distributorId || undefined,
        mobileNumber: mobileNumber || undefined, whatsappNumber: whatsappNumber || undefined,
        email: email || undefined, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        website: website || undefined, facebook: facebook || undefined,
        instagram: instagram || undefined, twitter: twitter || undefined,
        visitDays: visitDays.length > 0 ? visitDays : undefined,
        ownerName: ownerName || undefined, pharmacistName: pharmacistName || undefined,
        drugLicenseNumber: drugLicenseNumber || undefined, 
        drugLicenseExpiry: drugLicenseExpiry ? new Date(drugLicenseExpiry).toISOString() : undefined,
        visitFrequency: Number(visitFrequency) || 2,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/retailers');
    } catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to save retailer'); }
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
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-purple-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight drop-shadow-sm">Add Retailer</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Retailer Master Entry</p>
        </div>
        <Store className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <Div label="Business Info" />

        <div className="md:col-span-2">
          <label className={lbl}>Retailer Firm Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Firm name" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Category</label>
          <div className="flex gap-2">
            {CATEGORIES.map((c: any) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-extrabold transition-all ${category === c ? 'border-2 border-violet-500 bg-violet-50 text-violet-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Visit Frequency</label>
          <input type="number" value={visitFrequency} onChange={e => setVisitFrequency(e.target.value)} placeholder="Visits per month" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>GSTIN Number</label>
          <input type="text" value={gstinNumber} onChange={e => setGstinNumber(e.target.value)} placeholder="GSTIN" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>PAN Number</label>
          <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value)} placeholder="PAN" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Drug License No.</label>
          <input type="text" value={drugLicenseNumber} onChange={e => setDrugLicenseNumber(e.target.value)} placeholder="DL No." className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Drug License Expiry</label>
          <input type="date" value={drugLicenseExpiry} onChange={e => setDrugLicenseExpiry(e.target.value)} className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <Div label="Mapping" />
        
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
        <div>
          <label className={lbl}>Area (FK)</label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Area...</option>
              {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>Map to Stockist</label>
          <div className="relative group">
            <select value={stockistId} onChange={e => setStockistId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Stockist...</option>
              {stockistList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>Map to Distributor</label>
          <div className="relative group">
            <select value={distributorId} onChange={e => setDistributorId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Distributor...</option>
              {distributorList.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <Div label="Contact Details" />
        
        <div>
          <label className={lbl}>Owner Name</label>
          <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner's Name" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Pharmacist Name</label>
          <input type="text" value={pharmacistName} onChange={e => setPharmacistName(e.target.value)} placeholder="Pharmacist's Name" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>Mobile Number</label>
          <div className="relative">
            <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="+91 XXXXX XXXXX" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>WhatsApp Number</label>
          <div className="relative">
            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+91 XXXXX XXXXX" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-green-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Address" />
        
        <div className="md:col-span-2">
          <label className={lbl}>Address Line 1</label>
          <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Building, Street" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div className="md:col-span-2">
          <label className={lbl}>Address Line 2</label>
          <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Area, Landmark" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>City</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>
        <div>
          <label className={lbl}>State</label>
          <div className="relative group">
            <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select State...</option>
              {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>District</label>
          <div className="relative group">
            <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} className={`${sel} disabled:opacity-50`} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select District...</option>
              {state && INDIAN_STATES_AND_DISTRICTS[state]?.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>PIN Code</label>
          <div className="relative">
            <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="000000" className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Visit Schedule" />

        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <label className={lbl}>Visit Days</label>
          <div className="flex flex-wrap gap-2">
            {VISIT_DAYS.map((day: any) => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${visitDays.includes(day) ? 'border-2 border-violet-500 bg-violet-50 text-violet-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>
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
          className="w-full md:w-auto px-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:to-purple-500 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> SAVE RETAILER</>}
        </button>
      </div>
    </div>
  );
}
