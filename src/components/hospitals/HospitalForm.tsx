'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const HOSPITAL_TYPES = ['Government', 'Private', 'Trust', 'Nursing Home', 'Clinic', 'Dispensary', 'Other'];
const VISIT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RING = '#0d9488';

export default function HospitalForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const { data: areaList = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas', { params: { limit: 100 } }).then(r => r.data.data.areas || [])
  });

  const [name, setName]                   = useState('');
  const [hospitalType, setHospitalType]   = useState('');
  const [beds, setBeds]                   = useState('');
  const [departments, setDepartments]     = useState('');
  const [gstinNumber, setGstinNumber]     = useState('');
  const [panNumber, setPanNumber]         = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName]   = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactDept, setContactDept]     = useState('');
  const [gender, setGender]               = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [address1, setAddress1]           = useState('');
  const [address2, setAddress2]           = useState('');
  const [city, setCity]                   = useState('');
  const [state, setState]                 = useState('');
  const [pincode, setPincode]             = useState('');
  const [areaId, setAreaId]               = useState('');
  const [territoryId, setTerritoryId]     = useState('');
  const [phone, setPhone]                 = useState('');
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
    if (!name.trim()) { setError('Hospital name is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      const depts = departments.split(',').map((d: any) => d.trim()).filter(Boolean);
      await api.post('/hospitals', {
        name, type: hospitalType || undefined,
        beds: beds ? Number(beds) : undefined,
        departments: depts.length > 0 ? depts : undefined,
        gstinNumber: gstinNumber || undefined, panNumber: panNumber || undefined,
        contactFirstName: contactFirstName || undefined, contactLastName: contactLastName || undefined,
        contactDesignation: contactDesignation || undefined, contactDept: contactDept || undefined,
        gender: gender || undefined, maritalStatus: maritalStatus || undefined,
        address1: address1 || undefined, address2: address2 || undefined,
        city: city || undefined,
        state: state || undefined, pincode: pincode || undefined,
        areaId: areaId || undefined, territoryId: territoryId || undefined,
        phone: phone || undefined, whatsappNumber: whatsappNumber || undefined,
        email: email || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined, 
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        website: website || undefined, facebook: facebook || undefined,
        instagram: instagram || undefined, twitter: twitter || undefined,
        visitDays: visitDays.length > 0 ? visitDays : undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/hospitals');
    } catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to save hospital'); }
    finally { setIsSubmitting(false); }
  };

  const inp = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all`;
  const sel = `${inp} appearance-none cursor-pointer font-semibold`;
  const lbl = `block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-widest`;
  const ringStyle = { '--tw-ring-color': `${RING}33` } as any;

  const Div = ({ label }: { label: string }) => (
    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight drop-shadow-sm">Add Hospital</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Hospital Master Entry</p>
        </div>
        <Building2 className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

        <Div label="Hospital Info" />

        <div className="md:col-span-2">
          <label className={lbl}>Hospital Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hospital / Clinic name"
            className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Hospital Type</label>
          <div className="relative group">
            <select value={hospitalType} onChange={e => setHospitalType(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select Type...</option>
              {HOSPITAL_TYPES.map((t: any) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>No. of Beds</label>
          <input type="number" value={beds} onChange={e => setBeds(e.target.value)} placeholder="0" min={0}
            className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>GSTIN Number</label>
          <input type="text" value={gstinNumber} onChange={e => setGstinNumber(e.target.value)} placeholder="22AAAAA0000A1Z5"
            className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>PAN Number</label>
          <input type="text" value={panNumber} onChange={e => setPanNumber(e.target.value)} placeholder="AAAAA0000A"
            className={inp} style={ringStyle} />
        </div>

        <div className="md:col-span-2">
          <label className={lbl}>Departments <span className="text-gray-400 font-medium normal-case tracking-normal">(comma separated)</span></label>
          <input type="text" value={departments} onChange={e => setDepartments(e.target.value)} placeholder="Cardiology, Ortho, Gynae..."
            className={inp} style={ringStyle} />
        </div>

        <Div label="Contact Person" />

        <div>
          <label className={lbl}>Contact First Name</label>
          <input type="text" value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} placeholder="First name" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Contact Last Name</label>
          <input type="text" value={contactLastName} onChange={e => setContactLastName(e.target.value)} placeholder="Last name" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Designation</label>
          <input type="text" value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} placeholder="Medical Director / Purchase" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Department</label>
          <input type="text" value={contactDept} onChange={e => setContactDept(e.target.value)} placeholder="Purchase / Admin" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Gender</label>
          <div className="relative group">
            <select value={gender} onChange={e => setGender(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select...</option>
              {GENDERS.map((g: any) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Marital Status</label>
          <div className="relative group">
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={sel} style={ringStyle}>
              <option value="">Select...</option>
              {MARITAL_STATUSES.map((m: any) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Date of Birth</label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Marriage Anniversary</label>
          <input type="date" value={marriageAnniversary} onChange={e => setMarriageAnniversary(e.target.value)} className={inp} style={ringStyle} />
        </div>

        <Div label="Contact Details" />

        <div>
          <label className={lbl}>Phone</label>
          <div className="relative">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inp} pl-12`} style={ringStyle} />
            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>WhatsApp</label>
          <div className="relative">
            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inp} pl-12`} style={ringStyle} />
            <Phone className="w-5 h-5 text-green-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Email</label>
          <div className="relative">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hospital@example.com"
              className={`${inp} pl-12`} style={ringStyle} />
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <Div label="Address" />

        <div className="md:col-span-2">
          <label className={lbl}>Address Line 1</label>
          <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Building, Street" className={inp} style={ringStyle} />
        </div>

        <div className="md:col-span-2">
          <label className={lbl}>Address Line 2</label>
          <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Area, Landmark" className={inp} style={ringStyle} />
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
          <label className={lbl}>Pincode</label>
          <div className="relative">
            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="000000"
              className={`${inp} pl-12`} style={ringStyle} />
            <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={lbl}>Area (FK)</label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={sel} style={ringStyle}>
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
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${visitDays.includes(day) ? 'border-2 border-teal-500 bg-teal-50 text-teal-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <Div label="Social Media" />

        <div>
          <label className={lbl}>Website</label>
          <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Facebook</label>
          <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Instagram</label>
          <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" className={inp} style={ringStyle} />
        </div>

        <div>
          <label className={lbl}>Twitter / X</label>
          <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle" className={inp} style={ringStyle} />
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
          className="w-full md:w-auto px-10 bg-gradient-to-r from-teal-600 to-emerald-600 hover:to-emerald-500 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> SAVE HOSPITAL</>}
        </button>
      </div>
    </div>
  );
}
