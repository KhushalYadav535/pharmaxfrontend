'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  X,
  Stethoscope,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { INDIAN_STATES } from '@/lib/constants';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHqId?: string;
  onDoctorAdded?: (doctor: any) => void;
}

const SALUTATIONS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'];
const SPECIALTIES = [
  'GENERAL_PRACTICE',
  'CARDIOLOGY',
  'PEDIATRICS',
  'ORTHOPEDICS',
  'GYNECOLOGY',
  'DERMATOLOGY',
  'NEUROLOGY',
  'ENT',
  'OPHTHALMOLOGY',
  'PSYCHIATRY',
  'ONCOLOGY',
  'UROLOGY',
  'DIABETOLOGY',
  'GASTROENTEROLOGY',
  'PULMONOLOGY',
  'DENTAL'
];

const CLASSIFICATIONS = [
  { value: 'A_PLUS', label: 'A+ (High Priority)' },
  { value: 'A', label: 'A (Core Prescriber)' },
  { value: 'B', label: 'B (Standard)' },
  { value: 'C', label: 'C (Occasional)' }
];

const CATEGORIES = ['CORE', 'SUPER_CORE', 'SECONDARY', 'TERTIARY'];

export default function AddDoctorModal({
  isOpen,
  onClose,
  defaultHqId = '',
  onDoctorAdded
}: AddDoctorModalProps) {
  const qc = useQueryClient();

  // Headquarter query
  const { data: hqData } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 200 } }).then((r) => r.data.data),
  });
  const headquarters = Array.isArray(hqData) ? hqData : hqData?.headquarters || [];

  // Areas & Interiors queries
  const { data: areaData } = useQuery({
    queryKey: ['areas-list'],
    queryFn: () => api.get('/areas', { params: { limit: 200 } }).then((r) => r.data.data),
  });
  const areas = Array.isArray(areaData) ? areaData : areaData?.areas || [];

  const { data: interiorData } = useQuery({
    queryKey: ['interiors-list'],
    queryFn: () => api.get('/interiors', { params: { limit: 200 } }).then((r) => r.data.data),
  });
  const interiors = Array.isArray(interiorData) ? interiorData : interiorData?.interiors || [];

  // Form State
  const [selectedHqId, setSelectedHqId] = useState(defaultHqId);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedInteriorId, setSelectedInteriorId] = useState('');

  // Filtered areas and interiors based on selected HQ
  const filteredAreas = React.useMemo(() => {
    if (!selectedHqId) return areas;
    const matches = areas.filter((a: any) => a.hqId === selectedHqId || a.headquarterId === selectedHqId || a.location?.hqId === selectedHqId);
    if (selectedAreaId && !matches.some((a: any) => a.id === selectedAreaId)) {
      const current = areas.find((a: any) => a.id === selectedAreaId);
      if (current) return [current, ...matches];
    }
    return matches;
  }, [areas, selectedHqId, selectedAreaId]);

  const filteredInteriors = React.useMemo(() => {
    let list = interiors;
    if (selectedHqId) {
      const hqMatches = interiors.filter((i: any) => i.hqId === selectedHqId || i.location?.hqId === selectedHqId);
      if (hqMatches.length > 0) list = hqMatches;
    }
    if (selectedAreaId) {
      const selectedArea = areas.find((a: any) => a.id === selectedAreaId);
      if (selectedArea?.locationId) {
        const locMatches = list.filter((i: any) => i.locationId === selectedArea.locationId);
        if (locMatches.length > 0) list = locMatches;
      }
    }
    if (selectedInteriorId && !list.some((i: any) => i.id === selectedInteriorId)) {
      const current = interiors.find((i: any) => i.id === selectedInteriorId);
      if (current) return [current, ...list];
    }
    return list;
  }, [interiors, areas, selectedHqId, selectedAreaId, selectedInteriorId]);

  const [salutation, setSalutation] = useState('Dr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('GENERAL_PRACTICE');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [qualification, setQualification] = useState('MBBS');
  const [classification, setClassification] = useState('A');
  const [category, setCategory] = useState('CORE');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [isKol, setIsKol] = useState(false);
  const [kolCategory, setKolCategory] = useState('');
  const [visitFrequency, setVisitFrequency] = useState('2');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Keep selected HQ updated if defaultHqId changes
  useEffect(() => {
    if (defaultHqId) {
      setSelectedHqId(defaultHqId);
    } else if (!selectedHqId && headquarters.length > 0) {
      setSelectedHqId(headquarters[0].id);
    }
  }, [defaultHqId, headquarters]);

  // When HQ changes, auto-fill city/state and clear mismatching area/interior
  const activeHq = headquarters.find((h: any) => h.id === selectedHqId);
  useEffect(() => {
    if (activeHq) {
      if (!city && activeHq.district) setCity(activeHq.district);
      if (activeHq.state) setState(activeHq.state);
    }
    if (selectedAreaId) {
      const currentArea = areas.find((a: any) => a.id === selectedAreaId);
      if (currentArea && currentArea.hqId && currentArea.hqId !== selectedHqId) {
        setSelectedAreaId('');
        setSelectedInteriorId('');
      }
    }
  }, [selectedHqId, activeHq]);

  const addDoctorMutation = useMutation({
    mutationFn: (payload: any) => api.post('/doctors', payload),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      qc.invalidateQueries({ queryKey: ['headquarters'] });
      qc.invalidateQueries({ queryKey: ['headquarters-list'] });
      qc.invalidateQueries({ queryKey: ['hq-doctors'] });
      if (onDoctorAdded) onDoctorAdded(res.data?.data);
      resetForm();
      onClose();
      alert(res.data?.message || 'Doctor registered successfully!');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to add doctor');
    }
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setWhatsappNumber('');
    setEmail('');
    setCustomSpecialty('');
    setQualification('MBBS');
    setAddress1('');
    setPincode('');
    setIsKol(false);
    setKolCategory('');
    setSelectedAreaId('');
    setSelectedInteriorId('');
    setNotes('');
    setFormError('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedHqId) {
      setFormError('Please select a Headquarter (HQ).');
      return;
    }
    if (!firstName.trim()) {
      setFormError('Doctor First Name is required.');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Doctor Last Name is required.');
      return;
    }

    const finalSpecialty = specialty === 'OTHER' ? customSpecialty : specialty;
    if (!finalSpecialty.trim()) {
      setFormError('Please specify doctor specialty.');
      return;
    }

    const payload = {
      salutation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      specialty: finalSpecialty,
      qualification: qualification.trim() || 'MBBS',
      classification: classification.replace('+', '_PLUS'),
      category,
      phone: phone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      email: email.trim() || undefined,
      hqId: selectedHqId,
      territoryId: selectedHqId,
      areaId: selectedAreaId || undefined,
      interiorId: selectedInteriorId || undefined,
      city: city.trim() || activeHq?.district || 'Nagpur',
      state: state || activeHq?.state || 'Maharashtra',
      address1: address1.trim() || undefined,
      pincode: pincode.trim() || undefined,
      isKol,
      kolCategory: isKol ? kolCategory.trim() : undefined,
      visitFrequency: Number(visitFrequency) || 2,
      notes: notes.trim() || undefined,
      approvalStatus: 'APPROVED'
    };

    addDoctorMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Add New Doctor</h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Assign doctor to headquarter and register in Doctor CRM Master
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ── STEP 1: Headquarter Selection (Primary Focus) ── */}
          <div className="bg-emerald-50/60 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                1. Select Headquarter (HQ) <span className="text-rose-500">*</span>
              </label>
              {activeHq && (
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
                  Code: {activeHq.code}
                </span>
              )}
            </div>

            <select
              value={selectedHqId}
              onChange={(e) => setSelectedHqId(e.target.value)}
              required
              className="w-full bg-white border border-emerald-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xs cursor-pointer"
            >
              <option value="">-- Choose Headquarter Territory --</option>
              {headquarters.map((hq: any) => (
                <option key={hq.id} value={hq.id}>
                  {hq.name} ({hq.code}) — {hq.district || hq.state} [{hq.region || 'Territory'}]
                </option>
              ))}
            </select>

            {activeHq && (
              <p className="text-[11px] text-emerald-700 font-medium">
                📍 Assigned to: <strong>{activeHq.name}</strong> · District: {activeHq.district || 'N/A'}, State: {activeHq.state}
              </p>
            )}
          </div>

          {/* ── STEP 2: Doctor Identity ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                2. Doctor Identity & Specialization
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Title</label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {SALUTATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rajesh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Specialty</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>{sp.replace('_', ' ')}</option>
                  ))}
                  <option value="OTHER">Other / Custom</option>
                </select>
              </div>

              {specialty === 'OTHER' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Custom Specialty</label>
                  <input
                    type="text"
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    placeholder="Specialty Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Qualification</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MD, MBBS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Classification</label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Detailing Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── STEP 3: Contact Details ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                3. Contact & Communication
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="WhatsApp No."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 4: Location & Clinic ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                4. Clinic / Practice Address
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  City Area
                  {selectedHqId && <span className="text-[10px] text-emerald-600 font-normal lowercase ml-1">(filtered by HQ)</span>}
                </label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Select City Area --</option>
                  {filteredAreas.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {selectedHqId && filteredAreas.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">No city areas linked to this HQ in Location Master</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Interior
                  {selectedHqId && <span className="text-[10px] text-emerald-600 font-normal lowercase ml-1">(filtered by HQ)</span>}
                </label>
                <select
                  value={selectedInteriorId}
                  onChange={(e) => setSelectedInteriorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Select Interior --</option>
                  {filteredInteriors.map((intItem: any) => (
                    <option key={intItem.id} value={intItem.id}>{intItem.name}</option>
                  ))}
                </select>
                {selectedHqId && filteredInteriors.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">No interiors linked to this HQ/Area in Location Master</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Clinic Address</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Clinic Name, Street, Landmark"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">City / Town</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 440001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* ── STEP 5: KOL & Visit Settings ── */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800">Key Opinion Leader (KOL)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKol(!isKol)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isKol ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isKol ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isKol && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">KOL Level</label>
                <input
                  type="text"
                  value={kolCategory}
                  onChange={(e) => setKolCategory(e.target.value)}
                  placeholder="e.g. National / State / Regional KOL"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Planned Visits / Month</label>
                <select
                  value={visitFrequency}
                  onChange={(e) => setVisitFrequency(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="1">1 Visit per Month</option>
                  <option value="2">2 Visits per Month (Standard)</option>
                  <option value="3">3 Visits per Month</option>
                  <option value="4">4 Visits per Month (Weekly)</option>
                  <option value="6">6 Visits per Month</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Doctor Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special prescribing habits or preferences"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addDoctorMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              {addDoctorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering Doctor...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Save Doctor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
