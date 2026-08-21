'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, Phone, Mail, MapPin, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

// ─── CFA Add Form ──────────────────────────────────────────────────────────

const GENDERS        = ['MALE', 'FEMALE', 'OTHER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const RING = '#0891b233';

export default function CfaForm({ onSuccess }: { onSuccess?: () => void }) {
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

  // Basic Info
  const [name, setName]                   = useState('');
  const [gstinNumber, setGstinNumber]     = useState('');
  const [panNumber, setPanNumber]         = useState('');

  // Contact Person
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName]   = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactDept, setContactDept]           = useState('');
  const [gender, setGender]               = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');

  // Location Details
  const [address1, setAddress1]           = useState('');
  const [address2, setAddress2]           = useState('');
  const [state, setState]                 = useState('');
  const [district, setDistrict]           = useState('');
  const [city, setCity]                   = useState('');
  const [pin, setPin]                     = useState('');
  const [areaId, setAreaId]               = useState('');
  const [hqId, setHqId]                   = useState(''); // Territory

  // Communication
  const [mobileNumber, setMobileNumber]   = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail]                 = useState('');
  const [dateOfBirth, setDateOfBirth]     = useState('');
  const [marriageAnniversary, setMarriageAnniversary] = useState('');

  // Social & Web
  const [website, setWebsite]             = useState('');
  const [facebook, setFacebook]           = useState('');
  const [instagram, setInstagram]         = useState('');
  const [twitter, setTwitter]             = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const availableDistricts = state && INDIAN_STATES_AND_DISTRICTS[state] ? INDIAN_STATES_AND_DISTRICTS[state] : [];

  const handleSubmit = async () => {
    if (!name.trim()) { setError('CFA name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/cfas', {
        name, gstinNumber: gstinNumber || undefined, panNumber: panNumber || undefined,
        contactFirstName: contactFirstName || undefined, contactLastName: contactLastName || undefined,
        contactDesignation: contactDesignation || undefined, contactDept: contactDept || undefined,
        gender: gender || undefined, maritalStatus: maritalStatus || undefined,
        address1: address1 || undefined, address2: address2 || undefined,
        city: city || undefined, district: district || undefined, state: state || undefined, pin: pin || undefined,
        areaId: areaId || undefined, hqId: hqId || undefined,
        mobileNumber: mobileNumber || undefined, whatsappNumber: whatsappNumber || undefined,
        email: email || undefined, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        website: website || undefined, facebook: facebook || undefined,
        instagram: instagram || undefined, twitter: twitter || undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/cfas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create CFA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all";
  const sel = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none";
  const lbl = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1";
  const ringStyle = { '--tw-ring-color': RING } as any;

  const Div = ({ label }: { label: string }) => (
    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight drop-shadow-sm">Add CFA</h1>
          <p className="text-[12px] font-medium text-indigo-100 mt-1 uppercase tracking-wider">CFA Master Entry</p>
        </div>
        <Building className="w-7 h-7 opacity-70" />
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm font-medium border border-red-100">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
          
          <Div label="Organization Profile" />
          <div className="xl:col-span-2">
            <label className={lbl}>CFA Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Pharma Depot" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>GSTIN Number</label>
            <input value={gstinNumber} onChange={e => setGstinNumber(e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>PAN Number</label>
            <input value={panNumber} onChange={e => setPanNumber(e.target.value)} placeholder="e.g. ABCDE1234F" className={inp} style={ringStyle} />
          </div>

          <Div label="Contact Person" />
          <div>
            <label className={lbl}>First Name</label>
            <input value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} placeholder="First Name" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Last Name</label>
            <input value={contactLastName} onChange={e => setContactLastName(e.target.value)} placeholder="Last Name" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Designation</label>
            <input value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} placeholder="e.g. Manager" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Department</label>
            <input value={contactDept} onChange={e => setContactDept(e.target.value)} placeholder="e.g. Logistics" className={inp} style={ringStyle} />
          </div>
          <div className="relative">
            <label className={lbl}>Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select...</option>
              {GENDERS.map((g: any) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>
          <div className="relative">
            <label className={lbl}>Marital Status</label>
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select...</option>
              {MARITAL_STATUSES.map((m: any) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>

          <Div label="Communication & Personal Details" />
          <div className="relative">
            <label className={lbl}>Mobile Number</label>
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-[35px]" />
            <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="10-digit number" className={`${inp} pl-9`} style={ringStyle} />
          </div>
          <div className="relative">
            <label className={lbl}>WhatsApp Number</label>
            <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-[35px]" />
            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="WhatsApp number" className={`${inp} pl-9`} style={ringStyle} />
          </div>
          <div className="relative xl:col-span-2">
            <label className={lbl}>Email Address</label>
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-[35px]" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@cfa.com" className={`${inp} pl-9`} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Marriage Anniversary</label>
            <input type="date" value={marriageAnniversary} onChange={e => setMarriageAnniversary(e.target.value)} className={inp} style={ringStyle} />
          </div>

          <Div label="Address & Location" />
          <div className="xl:col-span-2">
            <label className={lbl}>Address Line 1</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-[11px]" />
              <input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Street, Building name" className={`${inp} pl-9`} style={ringStyle} />
            </div>
          </div>
          <div className="xl:col-span-2">
            <label className={lbl}>Address Line 2</label>
            <input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Landmark, Area" className={inp} style={ringStyle} />
          </div>
          <div className="relative">
            <label className={lbl}>State</label>
            <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} className={sel} style={ringStyle}>
              <option value="">Select State...</option>
              {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>
          <div className="relative">
            <label className={lbl}>District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} className={sel} style={ringStyle}>
              <option value="">Select District...</option>
              {availableDistricts.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>
          <div>
            <label className={lbl}>City</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City / Town" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>PIN Code</label>
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="6-digit PIN" maxLength={6} className={inp} style={ringStyle} />
          </div>

          <Div label="Territory / HQ Mapping" />
          <div className="relative xl:col-span-2">
            <label className={lbl}>Mapped Territory (HQ)</label>
            <select value={hqId} onChange={e => setHqId(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select Territory / HQ...</option>
              {territoryList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>
          <div className="relative xl:col-span-2">
            <label className={lbl}>Mapped Area</label>
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select Area...</option>
              {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[35px] pointer-events-none" />
          </div>

          <Div label="Social Media & Links" />
          <div>
            <label className={lbl}>Website URL</label>
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Facebook Profile</label>
            <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/..." className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Instagram Handle</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" className={inp} style={ringStyle} />
          </div>
          <div>
            <label className={lbl}>Twitter Handle</label>
            <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle" className={inp} style={ringStyle} />
          </div>

        </div>

        {/* Submit */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save CFA Data'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
