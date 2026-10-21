'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, ChevronDown, User, Phone, Mail, MapPin, Calendar, Stethoscope, Tag, Loader2, Building2 } from 'lucide-react';
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

export default function DoctorForm({
  onSuccess,
  doctorId,
  initialData,
}: {
  onSuccess?: () => void;
  doctorId?: string;
  initialData?: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultHqParam = searchParams?.get('hqId') || '';

  // Safe array normalizer helper
  const toSafeArray = (val: any, nestedKey?: string): any[] => {
    if (Array.isArray(val)) return val;
    if (nestedKey && Array.isArray(val?.[nestedKey])) return val[nestedKey];
    if (Array.isArray(val?.headquarters)) return val.headquarters;
    if (Array.isArray(val?.areas)) return val.areas;
    if (Array.isArray(val?.interiors)) return val.interiors;
    if (Array.isArray(val?.hospitals)) return val.hospitals;
    if (Array.isArray(val?.retailers)) return val.retailers;
    if (Array.isArray(val?.products)) return val.products;
    return [];
  };

  // Queries
  const { data: rawAreaList } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/areas', { params: { limit: 300 } }).then(r => r.data?.data?.areas || r.data?.data || [])
  });
  const areaList = toSafeArray(rawAreaList, 'areas');

  const { data: rawInteriorList } = useQuery({
    queryKey: ['interiors'],
    queryFn: () => api.get('/interiors', { params: { limit: 300 } }).then(r => r.data?.data?.interiors || r.data?.data || [])
  });
  const interiorList = toSafeArray(rawInteriorList, 'interiors');

  const { data: rawTerritoryList } = useQuery({
    queryKey: ['territories'],
    queryFn: () => api.get('/headquarters', { params: { limit: 300 } }).then(r => r.data?.data?.headquarters || r.data?.data || [])
  });
  const territoryList = toSafeArray(rawTerritoryList, 'headquarters');

  const { data: rawHospitalList } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => api.get('/hospitals', { params: { limit: 200 } }).then(r => r.data?.data?.hospitals || r.data?.data || [])
  });
  const hospitalList = toSafeArray(rawHospitalList, 'hospitals');

  const { data: rawProductList } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products', { params: { limit: 300 } }).then(r => r.data?.data?.products || r.data?.data || [])
  });
  const productList = toSafeArray(rawProductList, 'products');

  const { data: rawRetailerList } = useQuery({
    queryKey: ['retailers'],
    queryFn: () => api.get('/retailers', { params: { limit: 300 } }).then(r => r.data?.data?.retailers || r.data?.data || [])
  });
  const retailerList = toSafeArray(rawRetailerList, 'retailers');

  const { data: rawHqList } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 300 } }).then(r => r.data?.data?.headquarters || r.data?.data || [])
  });
  const hqList = toSafeArray(rawHqList, 'headquarters');

  // FFMS Fields
  const [salutation, setSalutation]           = useState(initialData?.salutation || 'Dr.');
  const [firstName, setFirstName]             = useState(initialData?.firstName || '');
  const [middleName, setMiddleName]           = useState(initialData?.middleName || '');
  const [lastName, setLastName]               = useState(initialData?.lastName || '');
  const [specialty, setSpecialty]             = useState(initialData?.specialty || '');
  const [subSpecialty, setSubSpecialty]       = useState(initialData?.subSpecialty || '');
  const [qualification, setQualification]     = useState(initialData?.qualification || '');
  const [classification, setClassification]   = useState(initialData?.classification || 'B');
  const [category, setCategory]               = useState(initialData?.category || '');
  const [prescriber, setPrescriber]           = useState(initialData?.prescriber ?? true);
  const [prescriptionPotential, setPrescriptionPotential] = useState(initialData?.prescriptionPotential ? String(initialData.prescriptionPotential) : '');
  const [gender, setGender]                   = useState(initialData?.gender || '');
  const [maritalStatus, setMaritalStatus]     = useState(initialData?.maritalStatus || '');
  const [phone, setPhone]                     = useState(initialData?.phone || '');
  const [whatsappNumber, setWhatsappNumber]   = useState(initialData?.whatsappNumber || '');
  const [email, setEmail]                     = useState(initialData?.email || '');
  const [dateOfBirth, setDateOfBirth]         = useState(initialData?.dateOfBirth ? String(initialData.dateOfBirth).slice(0, 10) : '');
  const [marriageAnniversary, setMarriageAnniversary] = useState(initialData?.marriageAnniversary ? String(initialData.marriageAnniversary).slice(0, 10) : '');
  const [address1, setAddress1]               = useState(initialData?.address1 || '');
  const [address2, setAddress2]               = useState(initialData?.address2 || '');
  const [city, setCity]                       = useState(initialData?.city || '');
  const [district, setDistrict]               = useState(initialData?.district || '');
  const [state, setState]                     = useState(initialData?.state || '');
  const [pincode, setPincode]                 = useState(initialData?.pincode || '');
  const [geoTag, setGeoTag]                   = useState(initialData?.geoTag || '');
  const [areaId, setAreaId]                   = useState(initialData?.areaId || '');
  const [interiorId, setInteriorId]           = useState(initialData?.interiorId || '');
  const [territoryId, setTerritoryId]         = useState(initialData?.territoryId || '');
  const [hqId, setHqId]                       = useState(initialData?.hqId || defaultHqParam);
  const [hospitalId, setHospitalId]           = useState(initialData?.hospitalId || '');
  const [retailerId, setRetailerId]           = useState(initialData?.retailerId || '');

  useEffect(() => {
    if (defaultHqParam && !hqId) {
      setHqId(defaultHqParam);
    }
  }, [defaultHqParam]);

  useEffect(() => {
    if (initialData) {
      if (initialData.salutation) setSalutation(initialData.salutation);
      if (initialData.firstName) setFirstName(initialData.firstName);
      if (initialData.middleName) setMiddleName(initialData.middleName);
      if (initialData.lastName) setLastName(initialData.lastName);
      if (initialData.specialty) setSpecialty(initialData.specialty);
      if (initialData.subSpecialty) setSubSpecialty(initialData.subSpecialty);
      if (initialData.qualification) setQualification(initialData.qualification);
      if (initialData.classification) setClassification(initialData.classification);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.prescriber !== undefined) setPrescriber(initialData.prescriber);
      if (initialData.prescriptionPotential !== undefined) setPrescriptionPotential(String(initialData.prescriptionPotential));
      if (initialData.gender) setGender(initialData.gender);
      if (initialData.maritalStatus) setMaritalStatus(initialData.maritalStatus);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.whatsappNumber) setWhatsappNumber(initialData.whatsappNumber);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.dateOfBirth) setDateOfBirth(String(initialData.dateOfBirth).slice(0, 10));
      if (initialData.marriageAnniversary) setMarriageAnniversary(String(initialData.marriageAnniversary).slice(0, 10));
      if (initialData.address1) setAddress1(initialData.address1);
      if (initialData.address2) setAddress2(initialData.address2);
      if (initialData.city) setCity(initialData.city);
      if (initialData.district) setDistrict(initialData.district);
      if (initialData.state) setState(initialData.state);
      if (initialData.pincode) setPincode(initialData.pincode);
      if (initialData.geoTag) setGeoTag(initialData.geoTag);
      if (initialData.areaId) setAreaId(initialData.areaId);
      if (initialData.interiorId) setInteriorId(initialData.interiorId);
      if (initialData.territoryId) setTerritoryId(initialData.territoryId);
      if (initialData.hqId) setHqId(initialData.hqId);
      if (initialData.hospitalId) setHospitalId(initialData.hospitalId);
      if (initialData.retailerId) setRetailerId(initialData.retailerId);
      if (initialData.productsSelected || initialData.products) {
        const pids = (initialData.productsSelected || initialData.products || []).map((p: any) => p.productId || p.id);
        setProductIds(pids);
      }
      if (initialData.website) setWebsite(initialData.website);
      if (initialData.facebook) setFacebook(initialData.facebook);
      if (initialData.instagram) setInstagram(initialData.instagram);
      if (initialData.twitter) setTwitter(initialData.twitter);
      if (initialData.visitDays) setVisitDays(initialData.visitDays);
      if (initialData.isKol !== undefined) setIsKol(initialData.isKol);
      if (initialData.kolCategory) setKolCategory(initialData.kolCategory);
      if (initialData.visitFrequency !== undefined) setVisitFrequency(String(initialData.visitFrequency));
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const filteredAreas = React.useMemo(() => {
    if (!hqId) return areaList;
    const matches = areaList.filter((a: any) => a.hqId === hqId || a.headquarterId === hqId || a.location?.hqId === hqId);
    if (areaId && !matches.some((a: any) => a.id === areaId)) {
      const current = areaList.find((a: any) => a.id === areaId);
      if (current) return [current, ...matches];
    }
    return matches;
  }, [areaList, hqId, areaId]);

  const filteredInteriors = React.useMemo(() => {
    let list = interiorList;
    if (hqId) {
      const hqMatches = interiorList.filter((i: any) => i.hqId === hqId || i.location?.hqId === hqId);
      if (hqMatches.length > 0) list = hqMatches;
    }
    if (areaId) {
      const selectedArea = areaList.find((a: any) => a.id === areaId);
      if (selectedArea?.locationId) {
        const locMatches = list.filter((i: any) => i.locationId === selectedArea.locationId);
        if (locMatches.length > 0) list = locMatches;
      }
    }
    if (interiorId && !list.some((i: any) => i.id === interiorId)) {
      const current = interiorList.find((i: any) => i.id === interiorId);
      if (current) return [current, ...list];
    }
    return list;
  }, [interiorList, areaList, hqId, areaId, interiorId]);

  const [productIds, setProductIds]           = useState<string[]>(initialData?.products?.map((p: any) => p.id || p.productId) || []);
  const [website, setWebsite]                 = useState(initialData?.website || '');
  const [facebook, setFacebook]               = useState(initialData?.facebook || '');
  const [instagram, setInstagram]             = useState(initialData?.instagram || '');
  const [twitter, setTwitter]                 = useState(initialData?.twitter || '');
  const [visitDays, setVisitDays]             = useState<string[]>(initialData?.visitDays || []);
  const [isKol, setIsKol]                     = useState(initialData?.isKol ?? false);
  const [kolCategory, setKolCategory]         = useState(initialData?.kolCategory || '');
  const [visitFrequency, setVisitFrequency]   = useState(initialData?.visitFrequency ? String(initialData.visitFrequency) : '1');
  const [notes, setNotes]                     = useState(initialData?.notes || '');

  const toggleProduct = (id: string) =>
    setProductIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

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
      const payload: any = {
        salutation: salutation || undefined,
        firstName, middleName: middleName || undefined, lastName, specialty,
        subSpecialty: subSpecialty || undefined,
        qualification: qualification || undefined,
        classification: classification || undefined,
        category: category || undefined,
        prescriber,
        prescriptionPotential: prescriptionPotential ? Number(prescriptionPotential) : (doctorId ? null : undefined),
        gender: gender || (doctorId ? null : undefined),
        maritalStatus: maritalStatus || (doctorId ? null : undefined),
        phone: phone || (doctorId ? null : undefined),
        whatsappNumber: whatsappNumber || (doctorId ? null : undefined),
        email: email || (doctorId ? null : undefined),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : (doctorId ? null : undefined),
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : (doctorId ? null : undefined),
        address1: address1 || (doctorId ? null : undefined),
        address2: address2 || (doctorId ? null : undefined),
        city: city || (doctorId ? null : undefined),
        district: district || (doctorId ? null : undefined),
        state: state || (doctorId ? null : undefined),
        pincode: pincode || (doctorId ? null : undefined),
        geoTag: geoTag || (doctorId ? null : undefined),
        areaId: areaId || (doctorId ? null : undefined),
        interiorId: interiorId || (doctorId ? null : undefined),
        territoryId: territoryId || (doctorId ? null : undefined),
        hqId: hqId || (doctorId ? null : undefined),
        hospitalId: hospitalId || (doctorId ? null : undefined),
        retailerId: retailerId || (doctorId ? null : undefined),
        productIds: productIds.length > 0 ? productIds : (doctorId ? [] : undefined),
        website: website || (doctorId ? null : undefined),
        facebook: facebook || (doctorId ? null : undefined),
        instagram: instagram || (doctorId ? null : undefined),
        twitter: twitter || (doctorId ? null : undefined),
        visitDays: visitDays.length > 0 ? visitDays : (doctorId ? [] : undefined),
        isKol,
        kolCategory: isKol && kolCategory ? kolCategory : (doctorId ? null : undefined),
        visitFrequency: Number(visitFrequency) || 1,
        notes: notes || (doctorId ? null : undefined),
      };

      if (doctorId) {
        await api.put(`/doctors/${doctorId}`, payload);
      } else {
        await api.post('/doctors', payload);
      }

      if (onSuccess) onSuccess();
      else router.push(doctorId ? `/dashboard/doctors/${doctorId}` : '/dashboard/doctors');
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
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">
            {doctorId ? 'Edit Doctor Profile' : 'Add Doctor'}
          </h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">
            {doctorId ? 'Modify Master, Territory, City Area & Interior Mapping' : 'FFMS Doctor Master Entry'}
          </p>
        </div>
        <Stethoscope className="w-7 h-7 opacity-70" />
      </div>

      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

        {/* ── Headquarter & Territory Assignment ── */}
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">
                Primary Headquarter (HQ) Territory <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-emerald-700 block">
                Doctor will be mapped to this headquarter and its assigned field representatives
              </span>
            </div>
          </div>
          <div className="w-full sm:w-80">
            <select
              value={hqId}
              onChange={e => {
                setHqId(e.target.value);
                const selected = hqList.find((h: any) => h.id === e.target.value);
                if (selected) {
                  if (!city && selected.district) setCity(selected.district);
                  if (selected.state) setState(selected.state);
                }
              }}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              <option value="">-- Select Headquarter (HQ) --</option>
              {hqList.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name} ({h.code}) — {h.district || h.state}</option>
              ))}
            </select>
          </div>
        </div>

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
          <label className={labelCls}>Middle Name</label>
          <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Middle name"
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
          <label className={labelCls}>Classification / Category</label>
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
          <label className={labelCls}>Category</label>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Specialist / General"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>Prescriber</label>
          <div className="flex gap-2">
            {(['Yes', 'No'] as const).map(opt => (
              <button key={opt} onClick={() => setPrescriber(opt === 'Yes')}
                className={`flex-1 py-3 rounded-xl border text-[13px] font-bold transition-all ${prescriber === (opt === 'Yes') ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border-2 border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {opt}
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

        <div>
          <label className={labelCls}>Retailer (FK)</label>
          <div className="relative group">
            <select value={retailerId} onChange={e => setRetailerId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select Retailer...</option>
              {retailerList.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Headquarter (HQ)</label>
          <div className="relative group">
            <select value={hqId} onChange={e => setHqId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">Select HQ...</option>
              {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
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
          <label className={labelCls}>Geo Tag (Lat,Long)</label>
          <input type="text" value={geoTag} onChange={e => setGeoTag(e.target.value)} placeholder="e.g. 19.0760,72.8777"
            className={inputCls} style={{ '--tw-ring-color': RING } as any} />
        </div>

        <div>
          <label className={labelCls}>
            City Area
            {hqId && <span className="text-[10px] text-emerald-600 font-normal lowercase ml-1">(filtered by HQ)</span>}
          </label>
          <div className="relative group">
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">-- None / Select City Area --</option>
              {filteredAreas.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
          {hqId && filteredAreas.length === 0 && (
            <span className="text-[11px] text-amber-600 block mt-1">No city areas linked to this HQ in Location Master</span>
          )}
        </div>

        <div>
          <label className={labelCls}>
            Interior
            {hqId && <span className="text-[10px] text-emerald-600 font-normal lowercase ml-1">(filtered by HQ)</span>}
          </label>
          <div className="relative group">
            <select value={interiorId} onChange={e => setInteriorId(e.target.value)} className={selectCls} style={{ '--tw-ring-color': RING } as any}>
              <option value="">-- None / Select Interior --</option>
              {filteredInteriors.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-[15px] pointer-events-none" />
          </div>
          {hqId && filteredInteriors.length === 0 && (
            <span className="text-[11px] text-amber-600 block mt-1">No interiors linked to this HQ/Area in Location Master</span>
          )}
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

        {/* ── Products ── */}
        <SectionDivider label="Products Selected" />

        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <label className={labelCls}>Products Promoted to this Doctor</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {(productList as any[]).map((p: any) => (
              <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                  productIds.includes(p.id)
                    ? 'border-2 border-blue-500 bg-blue-50 text-blue-700'
                    : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                {p.name}
              </button>
            ))}
            {(productList as any[]).length === 0 && <span className="text-xs text-gray-400">No products available</span>}
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
          {isSubmitting ? 'SAVING...' : <><Send className="w-5 h-5" /> {doctorId ? 'UPDATE DOCTOR' : 'SAVE DOCTOR'}</>}
        </button>
      </div>
    </div>
  );
}
