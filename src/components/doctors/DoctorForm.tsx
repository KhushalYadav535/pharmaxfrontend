'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, User, Phone, Mail, MapPin, Calendar, Stethoscope, Tag, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { INDIAN_STATES, INDIAN_STATES_AND_DISTRICTS } from '@/lib/constants';

// ─── Doctor Add Form ────────────────────────────────────────────────────────────
// Fields aligned with FFMS Doctor Sheet (schema: Doctor model)

const SALUTATIONS    = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'];
const SPECIALTIES    = ['General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'ENT', 'Ophthalmologist', 'Psychiatrist', 'Oncologist', 'Urologist', 'Other'];
const CLASSIFICATIONS = ['A+', 'A', 'B', 'C'];
const GENDERS        = ['MALE', 'FEMALE', 'OTHER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'SEPARATED', 'DIVORCED', 'WIDOWED'];
const VISIT_DAYS     = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const RING = '#2563eb33';

export default function DoctorForm({ onSuccess }: { onSuccess?: () => void }) {
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
  const { data: hospitalList = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => api.get('/hospitals', { params: { limit: 100 } }).then(r => r.data.data.hospitals || [])
  });

  // FFMS Fields
  const [salutation, setSalutation]           = useState('Dr.');
  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [specialty, setSpecialty]             = useState('');
  const [subSpecialty, setSubSpecialty]       = useState('');
  const [qualification, setQualification]     = useState('');
  const [classification, setClassification]   = useState('B');
  const [prescriptionPotential, setPrescriptionPotential] = useState('');
  const [gender, setGender]                   = useState('');
  const [maritalStatus, setMaritalStatus]     = useState('');
  const [phone, setPhone]                     = useState('');
  const [whatsappNumber, setWhatsappNumber]   = useState('');
  const [email, setEmail]                     = useState('');
  const [dateOfBirth, setDateOfBirth]         = useState('');
  const [marriageAnniversary, setMarriageAnniversary] = useState('');
  const [address1, setAddress1]               = useState('');
  const [address2, setAddress2]               = useState('');
  const [city, setCity]                       = useState('');
  const [district, setDistrict]               = useState('');
  const [state, setState]                     = useState('');
  const [pincode, setPincode]                 = useState('');
  const [areaId, setAreaId]                   = useState('');
  const [territoryId, setTerritoryId]         = useState('');
  const [hospitalId, setHospitalId]           = useState('');
  const [website, setWebsite]                 = useState('');
  const [facebook, setFacebook]               = useState('');
  const [instagram, setInstagram]             = useState('');
  const [twitter, setTwitter]                 = useState('');
  const [visitDays, setVisitDays]             = useState<string[]>([]);
  const [isKol, setIsKol]                     = useState(false);
  const [kolCategory, setKolCategory]         = useState('');
  const [visitFrequency, setVisitFrequency]   = useState('1');
  const [notes, setNotes]                     = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleVisitDay = (day: string) =>
    setVisitDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const handleSubmit = async () => {
    if (!firstName.trim()) { setError('First Name is required'); return; }
    if (!lastName.trim())  { setError('Last Name is required'); return; }
    if (!specialty)        { setError('Specialty is required'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.post('/doctors', {
        salutation: salutation || undefined,
        firstName, lastName, specialty,
        subSpecialty: subSpecialty || undefined,
        qualification: qualification || undefined,
        classification: classification || undefined,
        prescriptionPotential: prescriptionPotential ? Number(prescriptionPotential) : undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        phone: phone || undefined,
        whatsappNumber: whatsappNumber || undefined,
        email: email || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        address1: address1 || undefined,
        address2: address2 || undefined,
        city: city || undefined,
        district: district || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        areaId: areaId || undefined,
        territoryId: territoryId || undefined,
        hospitalId: hospitalId || undefined,
        website: website || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
        twitter: twitter || undefined,
        visitDays: visitDays.length > 0 ? visitDays : undefined,
        isKol,
        kolCategory: isKol && kolCategory ? kolCategory : undefined,
        visitFrequency: Number(visitFrequency) || 1,
        notes: notes || undefined,
      });
      if (onSuccess) onSuccess();
      else router.push('/dashboard/doctors');
    } catch (e: any) { setError(e.response?.data?.message || e.message || 'Failed to save doctor'); }
    finally { setIsSubmitting(false); }
  };

  const inputCls = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all`;
  const selectCls = `${inputCls} appearance-none cursor-pointer font-semibold`;
  const labelCls = `block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-widest`;

  const SectionDivider = ({ label }: { label: string }) => (
    <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">Add Doctor</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Doctor Master Entry</p>
        </div>
        <Stethoscope className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

        {/* ── Identity ── */}
        <SectionDivider label="Identity" />

        <div>
          <label className={labelCls}>Salutation</label>
          <div className="relative group">
            <select value={salutation} onChange={e => setSalutation(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              {SALUTATIONS.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Gender</label>
          <div className="relative group">
            <select value={gender} onChange={e => setGender(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select...</option>
              {GENDERS.map((g: any) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Marital Status</label>
          <div className="relative group">
            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select...</option>
              {MARITAL_STATUSES.map((m: any) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Date of Birth</label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Marriage Anniversary</label>
          <input type="date" value={marriageAnniversary} onChange={e => setMarriageAnniversary(e.target.value)}
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* ── Professional ── */}
        <SectionDivider label="Professional Details" />

        <div>
          <label className={labelCls}>Specialty <span className="text-red-500">*</span></label>
          <div className="relative group">
            <select value={specialty} onChange={e => setSpecialty(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Specialty...</option>
              {SPECIALTIES.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Sub Specialty</label>
          <input type="text" value={subSpecialty} onChange={e => setSubSpecialty(e.target.value)} placeholder="Sub specialty"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Qualification</label>
          <input type="text" value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. MBBS, MD"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Classification</label>
          <div className="flex gap-2">
            {CLASSIFICATIONS.map((c: any) => (
              <button key={c} onClick={() => setClassification(c)}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-extrabold transition-all ${classification === c ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Prescription Potential</label>
          <input type="number" value={prescriptionPotential} onChange={e => setPrescriptionPotential(e.target.value)} placeholder="0" min={0}
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Visit Frequency (per month)</label>
          <input type="number" value={visitFrequency} onChange={e => setVisitFrequency(e.target.value)} placeholder="1" min={0}
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Hospital (FK)</label>
          <div className="relative group">
            <select value={hospitalId} onChange={e => setHospitalId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Hospital...</option>
              {hospitalList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        {/* KOL */}
        <div>
          <label className={labelCls}>KOL (Key Opinion Leader)</label>
          <div className="flex gap-2">
            {(['Yes', 'No'] as const).map((opt: any) => (
              <button key={opt} onClick={() => setIsKol(opt === 'Yes')}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-bold transition-all ${isKol === (opt === 'Yes') ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {isKol && (
          <div>
            <label className={labelCls}>KOL Category</label>
            <input type="text" value={kolCategory} onChange={e => setKolCategory(e.target.value)} placeholder="National / Regional / Local"
              className={inputCls} style={{ '--tw-ring-color': RING } as any} />
          </div>
        )}

        {/* ── Contact ── */}
        <SectionDivider label="Contact Information" />

        <div>
          <label className={labelCls}>Mobile Number</label>
          <div className="relative">
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>WhatsApp Number</label>
          <div className="relative">
            <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+91 XXXXX XXXXX"
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Phone className="w-5 h-5 text-green-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <div className="relative">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com"
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        {/* ── Address ── */}
        <SectionDivider label="Address" />

        <div className="md:col-span-2">
          <label className={labelCls}>Address Line 1</label>
          <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Building / Clinic name, Street"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Address Line 2</label>
          <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Area, Landmark"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>City</label>
          <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>State</label>
          <div className="relative group">
            <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select State...</option>
              {INDIAN_STATES.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>District</label>
          <div className="relative group">
            <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!state} className={`${selectCls} disabled:opacity-50`} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select District...</option>
              {state && INDIAN_STATES_AND_DISTRICTS[state]?.map((d: any) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Pincode</label>
          <div className="relative">
            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="000000"
              className={`${inputCls} pl-12`} style={{ '--tw-ring-color': RING } as any} />
            <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Area (FK)</label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Area...</option>
              {areaList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Territory (FK)</label>
          <div className="relative group">
            <select value={territoryId} onChange={e => setTerritoryId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Territory...</option>
              {territoryList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        {/* ── Visit Days ── */}
        <SectionDivider label="Visit Schedule" />

        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <label className={labelCls}>Visit Days</label>
          <div className="flex flex-wrap gap-2">
            {VISIT_DAYS.map((day: any) => (
              <button key={day} onClick={() => toggleVisitDay(day)}
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${visitDays.includes(day) ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* ── Social Media ── */}
        <SectionDivider label="Social Media & Digital" />

        <div>
          <label className={labelCls}>Website</label>
          <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..."
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Facebook</label>
          <input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="Facebook URL or handle"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Instagram</label>
          <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Twitter / X</label>
          <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@handle"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        {/* ── Notes ── */}
        <SectionDivider label="Notes" />

        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <label className={labelCls}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Any additional notes about this doctor..."
            className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 transition-all"
            style={{ '--tw-ring-color': RING } as any} />
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
          className="w-full md:w-auto px-10 bg-gradient-to-r from-blue-600 to-indigo-700 hover:to-indigo-600 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> SAVE DOCTOR</>}
        </button>
      </div>
    </div>
  );
}
