'use client';

import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  X, Loader2, AlertCircle, User, Mail, Phone, Shield,
  Briefcase, Calendar, Building, Lock, Eye, EyeOff,
  MapPin, Heart, Globe, Link, CreditCard, Users,
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'MR', label: 'Medical Representative (MR)' },
  { value: 'TRADE_REP', label: 'Trade Representative / TSO' },
  { value: 'DISTRIBUTOR_REP', label: 'Distributor Sales Representative' },
  { value: 'ASM', label: 'Area Sales Manager (ASM)' },
  { value: 'RSM', label: 'Regional Sales Manager (RSM)' },
  { value: 'ZM', label: 'Zonal Manager (ZM)' },
  { value: 'NSM', label: 'National Sales Manager (NSM)' },
  { value: 'PRODUCT_MANAGER', label: 'Product Manager' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES_ADMIN', label: 'Sales Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const DEPARTMENTS = [
  'Sales', 'Marketing', 'Trade', 'Distribution', 'Medical Affairs',
  'Admin', 'Finance', 'HR', 'IT', 'Operations',
];

const GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G1', 'G2', 'G3', 'M1', 'M2', 'M3'];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const MARITAL_STATUSES = [
  { value: 'UNMARRIED', label: 'Unmarried' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'SEPARATED', label: 'Separated' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
];

const QUALIFICATIONS = [
  'B.Pharm', 'M.Pharm', 'B.Sc', 'M.Sc', 'MBA', 'B.Com', 'M.Com',
  'MBBS', 'BDS', 'B.E.', 'B.Tech', 'B.A.', 'M.A.', 'Other',
];

const PREFIXES = [
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Mrs.', label: 'Mrs.' },
  { value: 'Dr.', label: 'Dr.' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-blue-500" />
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
    </div>
  );
}

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 bg-white';
const selectCls = inputCls;

// ─── MAIN FORM ───────────────────────────────────────────────────────────────
interface EmployeeFormProps {
  onClose: () => void;
  editData?: any;
}

export default function EmployeeForm({ onClose, editData }: EmployeeFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  // ── Manager dropdown ──────────────────────────────────────────────────────
  const { data: managerList = [] } = useQuery({
    queryKey: ['employees-for-manager'],
    queryFn: () =>
      api.get('/employees', { params: { limit: 200, isActive: 'true' } }).then(r => r.data.data.employees || []),
  });

  // ── HQ dropdown ──────────────────────────────────────────────────────────
  const { data: hqData, isLoading: isLoadingHq } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters', { params: { limit: 200 } }).then(r => r.data.data.headquarters || []),
  });
  const hqList: any[] = hqData ?? [];

  // ── Basic Info ────────────────────────────────────────────────────────────
  const [prefix, setPrefix]         = useState(editData?.prefix ?? '');
  const [firstName, setFirstName]   = useState(editData?.firstName ?? '');
  const [middleName, setMiddleName] = useState(editData?.middleName ?? '');
  const [lastName, setLastName]     = useState(editData?.lastName ?? '');
  const [qualification, setQualification] = useState(editData?.qualification ?? '');
  const [gender, setGender]               = useState(editData?.gender ?? '');
  const [maritalStatus, setMaritalStatus] = useState(editData?.maritalStatus ?? '');

  // ── Address ───────────────────────────────────────────────────────────────
  const [address1, setAddress1] = useState(editData?.address1 ?? '');
  const [address2, setAddress2] = useState(editData?.address2 ?? '');
  const [city, setCity]         = useState(editData?.city ?? '');
  const [district, setDistrict] = useState(editData?.district ?? '');
  const [state, setState]       = useState(editData?.state ?? '');
  const [pin, setPin]           = useState(editData?.pin ?? '');

  // ── Contact ───────────────────────────────────────────────────────────────
  const [phone, setPhone]               = useState(editData?.phone ?? '');
  const [whatsappNumber, setWhatsapp]   = useState(editData?.whatsappNumber ?? '');
  const [email, setEmail]               = useState(editData?.email ?? '');

  // ── Personal ──────────────────────────────────────────────────────────────
  const [dateOfBirth, setDOB]                   = useState(editData?.dateOfBirth ? editData.dateOfBirth.split('T')[0] : '');
  const [marriageAnniversary, setAnniversary]   = useState(editData?.marriageAnniversary ? editData.marriageAnniversary.split('T')[0] : '');
  const [spouseName, setSpouseName]             = useState(editData?.spouseName ?? '');
  const [dependents, setDependents]             = useState(editData?.dependents ?? '');

  // ── Identity ──────────────────────────────────────────────────────────────
  const [aadharNumber, setAadhar] = useState(editData?.aadharNumber ?? '');
  const [panNumber, setPan]       = useState(editData?.panNumber ?? '');
  const [bloodGroup, setBloodGroup] = useState(editData?.bloodGroup ?? '');

  // ── Social Media ──────────────────────────────────────────────────────────
  const [facebook, setFacebook]   = useState(editData?.facebook ?? '');
  const [instagram, setInstagram] = useState(editData?.instagram ?? '');
  const [twitter, setTwitter]     = useState(editData?.twitter ?? '');
  const [linkedin, setLinkedin]   = useState(editData?.linkedin ?? '');

  // ── Employment ────────────────────────────────────────────────────────────
  const [role, setRole]               = useState(editData?.role ?? '');
  const [designation, setDesignation] = useState(editData?.designation ?? '');
  const [grade, setGrade]             = useState(editData?.grade ?? '');
  const [department, setDepartment]   = useState(editData?.department ?? '');
  const [dateOfJoining, setDOJ]       = useState(editData?.dateOfJoining ? editData.dateOfJoining.split('T')[0] : '');
  const [hqIds, setHqIds]             = useState<string[]>(
    editData?.territories?.map((t: any) => t.territoryId) ?? (editData?.hqId ? [editData.hqId] : [])
  );
  const [managerId, setManagerId]     = useState(editData?.managerId ?? '');
  const [profilePhoto, setProfilePhoto] = useState(editData?.profilePhoto ?? '');

  // ── Account (create only) ─────────────────────────────────────────────────
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd]                 = useState(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const validate = () => {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim())  return 'Last name is required';
    if (!email.trim())     return 'Email is required';
    if (!role)             return 'Role is required';
    if (!isEdit) {
      if (!password)            return 'Password is required';
      if (password.length < 6)  return 'Password must be at least 6 characters';
      if (password !== confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setIsSubmitting(true); setError('');
      const payload: any = {
        // Basic Info
        prefix,
        firstName: firstName.trim(),
        middleName: middleName || undefined,
        lastName: lastName.trim(),
        qualification: qualification || undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        // Address
        address1: address1 || undefined,
        address2: address2 || undefined,
        city: city || undefined,
        district: district || undefined,
        state: state || undefined, pin: pin || undefined, phone: phone || undefined, whatsappNumber: whatsappNumber || undefined,
        email: email.trim().toLowerCase(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        marriageAnniversary: marriageAnniversary ? new Date(marriageAnniversary).toISOString() : undefined,
        spouseName: spouseName || undefined, dependents: dependents !== '' ? Number(dependents) : undefined,
        aadharNumber: aadharNumber || undefined, panNumber: panNumber || undefined, bloodGroup: bloodGroup || undefined,
        facebook: facebook || undefined, instagram: instagram || undefined, twitter: twitter || undefined, linkedin: linkedin || undefined,
        role, designation: designation || undefined, grade: grade || undefined, department: department || undefined,
        dateOfJoining: dateOfJoining ? new Date(dateOfJoining).toISOString() : undefined,
        hqIds, managerId: managerId || undefined, profilePhoto: profilePhoto || undefined,
      };
      if (!isEdit) payload.password = password;

      if (isEdit) {
        await api.put(`/employees/${editData.id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employees-for-manager'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative">

          {/* ── Header ── */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
                <p className="text-xs text-gray-500">Fill in required fields to {isEdit ? 'update' : 'create'} the employee record</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="p-6 space-y-7 overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* ─── 1. Basic Info ─── */}
            <section>
              <SectionHeader icon={User} label="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isEdit && editData?.employeeId && (
                  <Field label="Employee Code (Auto)" span2>
                    <input type="text" value={editData.employeeId} disabled className={`${inputCls} bg-gray-50 opacity-70`} />
                  </Field>
                )}
                <Field label="Prefix">
                  <select value={prefix} onChange={e => setPrefix(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {PREFIXES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="First Name" required>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ravi" className={inputCls} />
                </Field>
                <Field label="Middle Name">
                  <input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Kumar" className={inputCls} />
                </Field>
                <Field label="Last Name" required>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sharma" className={inputCls} />
                </Field>
                <Field label="Qualification">
                  <select value={qualification} onChange={e => setQualification(e.target.value)} className={selectCls}>
                    <option value="">Select qualification</option>
                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </Field>
                <Field label="Gender">
                  <select value={gender} onChange={e => setGender(e.target.value)} className={selectCls}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Marital Status">
                  <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={selectCls}>
                    <option value="">Select status</option>
                    {MARITAL_STATUSES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </Field>
              </div>
            </section>

            {/* ─── 2. Address ─── */}
            <section>
              <SectionHeader icon={MapPin} label="Address" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Address 1">
                  <input value={address1} onChange={e => setAddress1(e.target.value)} placeholder="Street / Building" className={inputCls} />
                </Field>
                <Field label="Address 2">
                  <input value={address2} onChange={e => setAddress2(e.target.value)} placeholder="Locality / Landmark" className={inputCls} />
                </Field>
                <Field label="City">
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" className={inputCls} />
                </Field>
                <Field label="District">
                  <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Mumbai Suburban" className={inputCls} />
                </Field>
                <Field label="State">
                  <input value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra" className={inputCls} />
                </Field>
                <Field label="Pin Code">
                  <input value={pin} onChange={e => setPin(e.target.value)} placeholder="400001" maxLength={6} className={inputCls} />
                </Field>
              </div>
            </section>

            {/* ─── 3. Contact ─── */}
            <section>
              <SectionHeader icon={Phone} label="Contact Details" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Mobile Number">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="WhatsApp Number">
                  <input value={whatsappNumber} onChange={e => setWhatsapp(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                </Field>
                <Field label="Email" required>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      placeholder="ravi.sharma@company.com"
                      disabled={isEdit}
                      className={`${inputCls} pl-9 ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* ─── 4. Personal ─── */}
            <section>
              <SectionHeader icon={Heart} label="Personal Details" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={dateOfBirth} onChange={e => setDOB(e.target.value)} type="date" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="Marriage Anniversary">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={marriageAnniversary} onChange={e => setAnniversary(e.target.value)} type="date" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="Spouse Name">
                  <input value={spouseName} onChange={e => setSpouseName(e.target.value)} placeholder="Spouse full name" className={inputCls} />
                </Field>
                <Field label="No. of Dependents">
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={dependents} onChange={e => setDependents(e.target.value)} type="number" min={0} placeholder="0" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
              </div>
            </section>

            {/* ─── 5. Identity ─── */}
            <section>
              <SectionHeader icon={CreditCard} label="Identity Documents" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Aadhar Number">
                  <input value={aadharNumber} onChange={e => setAadhar(e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14} className={inputCls} />
                </Field>
                <Field label="PAN Number">
                  <input type="text" value={panNumber} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className={inputCls} />
                </Field>
                <Field label="Blood Group">
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className={selectCls}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
            </section>

            {/* ─── 6. Social Media ─── */}
            <section>
              <SectionHeader icon={Globe} label="Social Media" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Facebook">
                  <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
                </Field>
                <Field label="Instagram">
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
                </Field>
                <Field label="Twitter / X">
                  <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/..." className={inputCls} />
                </Field>
                <Field label="LinkedIn">
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className={`${inputCls} pl-9`} />
                  </div>
                </Field>
              </div>
            </section>

            {/* ─── 7. Employment ─── */}
            <section>
              <SectionHeader icon={Briefcase} label="Employment Details" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Role" required>
                  <select value={role} onChange={e => setRole(e.target.value)} className={selectCls}>
                    <option value="">Select role</option>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
                <Field label="Designation">
                  <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior MR" className={inputCls} />
                </Field>
                <Field label="Grade">
                  <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                    <option value="">Select grade</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select value={department} onChange={e => setDepartment(e.target.value)} className={`${selectCls} pl-9`}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Date of Joining">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={dateOfJoining} onChange={e => setDOJ(e.target.value)} type="date" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="Headquarters (Territories) Assigned">
                  <div className="border border-gray-200 rounded-xl overflow-hidden h-40 overflow-y-auto bg-gray-50/50">
                    <div className="flex flex-col divide-y divide-gray-100">
                      {hqList.map((hq: any) => (
                        <label key={hq.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            checked={hqIds.includes(hq.id)}
                            onChange={(e) => {
                              if (e.target.checked) setHqIds(prev => [...prev, hq.id]);
                              else setHqIds(prev => prev.filter(id => id !== hq.id));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-gray-800 group-hover:text-emerald-800 transition-colors">
                              {hq.name}
                            </span>
                            <span className="text-[11px] font-medium text-gray-500">
                              {hq.code} {hq.district ? `• ${hq.district}` : ''}
                            </span>
                          </div>
                        </label>
                      ))}
                      {isLoadingHq && (
                        <div className="px-4 py-3 text-[13px] text-gray-500 text-center flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading headquarters...
                        </div>
                      )}
                      {!isLoadingHq && hqList.length === 0 && (
                        <div className="px-4 py-3 text-[13px] text-gray-500 text-center">No headquarters found.</div>
                      )}
                    </div>
                  </div>
                </Field>
                <Field label="Reporting Manager">
                  <select value={managerId} onChange={e => setManagerId(e.target.value)} className={selectCls}>
                    <option value="">None</option>
                    {managerList
                      .filter((m: any) => m.id !== editData?.id)
                      .map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.role})
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Profile Photo URL" span2>
                  <input value={profilePhoto} onChange={e => setProfilePhoto(e.target.value)} placeholder="https://..." className={inputCls} />
                </Field>
              </div>
            </section>

            {/* ─── 8. Account Password (create only) ─── */}
            {!isEdit && (
              <section>
                <SectionHeader icon={Lock} label="Account Password" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password" required>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm Password" required>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="sticky bottom-0 z-10 bg-white rounded-b-2xl flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
