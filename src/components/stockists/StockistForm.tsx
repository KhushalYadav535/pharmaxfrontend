'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, Phone, Mail, MapPin, PackageOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

// ─── Stockist Add Form ──────────────────────────────────────────────────────────
// Fields aligned with FFMS Stockist Sheet

const GENDERS        = ['MALE', 'FEMALE', 'OTHER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const CATEGORIES     = ['A', 'B', 'C', 'D'];
const VISIT_DAYS     = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RING = '#0891b233';

export default function StockistForm({ onSuccess }: { onSuccess?: () => void }) {
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
  const { data: cfaList = [] } = useQuery({
    queryKey: ['cfas'],
    queryFn: () => api.get('/cfas', { params: { limit: 100 } }).then(r => r.data.data.cfas || [])
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
  const [hqId, setHqId]                   = useState('');
  const [cfaId, setCfaId]                 = useState('');
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (day: string) =>
    setVisitDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Stockist name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/stockists', {
        name, gstinNumber: gstinNumber || undefined, panNumber: panNumber || undefined,
        contactFirstName: contactFirstName || undefined, contactLastName: contactLastName || undefined,
        contactDesignation: contactDesignation || undefined, contactDept: contactDept || undefined,
        gender: gender || undefined, maritalStatus: maritalStatus || undefined,
        category: category || undefined,
        address1: address1 || undefined, address2: address2 || undefined,
        city: city || undefined, district: district || undefined, state: state || undefined, pin: pin || undefined,
        areaId: areaId || undefined, hqId: hqId || undefined, cfaId: cfaId || undefined,
        mobileNumber: mobileNumber || undefined, whatsappNumber: whatsappNumber || undefined,
        email: email || undefined, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        website: website || undefined, facebook: facebook || undefined,
        instagram: instagram || undefined, twitter: twitter || undefined,
        visitDays: visitDays.length > 0 ? visitDays : undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/stockists');
    } catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to save stockist'); }
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

      <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight drop-shadow-sm">Add Stockist</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Stockist Master Entry</p>
        </div>
        <PackageOpen className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

        <Div label="Business Info" />

        <div className="md:col-span-2">
          <label className={lbl}>Stockist Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Stockist firm name"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>GSTIN Number</label>
          <input type="text" value={gstinNumber} onChange={e => setGstinNumber(e.target.value)} placeholder="22AAAAA0000A1Z5"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>PAN Number</label>
          <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value)} placeholder="AAAAA0000A"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Category</label>
          <div className="flex gap-2">
            {CATEGORIES.map((c: any) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-extrabold transition-all ${category === c ? 'border-2 border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>HQ / Territory (FK)</label>
          <div className="relative group">
            <select value={hqId} onChange={e => setHqId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select HQ...</option>
              {territoryList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>CFA (FK)</label>
          <div className="relative group">
            <select value={cfaId} onChange={e => setCfaId(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select CFA...</option>
              {cfaList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <Div label="Contact Person" />

        <div>
          <label className={lbl}>Contact First Name</label>
          <input type="text" value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} placeholder="First name"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Contact Last Name</label>
          <input type="text" value={contactLastName} onChange={e => setContactLastName(e.target.value)} placeholder="Last name"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Designation</label>
          <input type="text" value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} placeholder="Owner / Manager"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Department</label>
          <input type="text" value={contactDept} onChange={e => setContactDept(e.target.value)} placeholder="Purchase / Accounts"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Gender</label>
          <div className="relative group">
            <select value={gender} onChange={e => setGender(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select...</option>
              {GENDERS.map((g: any) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Marital Status</label>
          <div className="relative group">
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={sel} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select...</option>
              {MARITAL_STATUSES.map((m: any) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Date of Birth</label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Marriage Anniversary</label>
          <input type="date" value={marriageAnniversary} onChange={e => setMarriageAnniversary(e.target.value)}
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <Div label="Contact Details" />

        <div>
          <label className={lbl}>Mobile Number</label>
          <div className="relative">
            <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>WhatsApp</label>
          <div className="relative">
            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-green-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Email</label>
          <div className="relative">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="stockist@example.com"
              className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Address" />

        <div className="md:col-span-2">
          <label className={lbl}>Address Line 1</label>
          <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Building, Street"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div className="md:col-span-2">
          <label className={lbl}>Address Line 2</label>
          <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Area, Landmark"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
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
              {state && INDIAN_STATES_AND_DISTRICTS[state as keyof typeof INDIAN_STATES_AND_DISTRICTS]?.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>PIN Code</label>
          <div className="relative">
            <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="000000"
              className={`${inp} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
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

        <Div label="Visit Schedule" />

        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <label className={lbl}>Visit Days</label>
          <div className="flex flex-wrap gap-2">
            {VISIT_DAYS.map((day: any) => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${visitDays.includes(day) ? 'border-2 border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <Div label="Social Media" />

        <div>
          <label className={lbl}>Website</label>
          <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..."
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Facebook</label>
          <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Instagram</label>
          <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={lbl}>Twitter / X</label>
          <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle"
            className={inp} style={{ '--tw-ring-color': RING } as any} />
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
          className="w-full md:w-auto px-10 bg-gradient-to-r from-cyan-600 to-teal-600 hover:to-teal-500 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> SAVE STOCKIST</>}
        </button>
      </div>
    </div>
  );
}
