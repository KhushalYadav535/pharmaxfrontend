'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  X, Loader2, AlertCircle, User, Mail, Phone, Shield,
  Briefcase, Calendar, Building, Lock, Eye, EyeOff,
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

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400';
const selectCls = `${inputCls} bg-white`;

// ─── MAIN FORM ───────────────────────────────────────────────────────────────
interface EmployeeFormProps {
  onClose: () => void;
  editData?: any;
}

export default function EmployeeForm({ onClose, editData }: EmployeeFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  // Manager dropdown
  const { data: managerList = [] } = useQuery({
    queryKey: ['employees-for-manager'],
    queryFn: () =>
      api.get('/employees', { params: { limit: 200, isActive: 'true' } }).then(r => r.data.data.employees || []),
  });

  // Basic Info
  const [firstName, setFirstName] = useState(editData?.firstName ?? '');
  const [lastName, setLastName] = useState(editData?.lastName ?? '');
  const [email, setEmail] = useState(editData?.email ?? '');
  const [phone, setPhone] = useState(editData?.phone ?? '');

  // Role & Position
  const [role, setRole] = useState(editData?.role ?? '');
  const [designation, setDesignation] = useState(editData?.designation ?? '');
  const [department, setDepartment] = useState(editData?.department ?? '');
  const [dateOfJoining, setDateOfJoining] = useState(
    editData?.dateOfJoining ? editData.dateOfJoining.split('T')[0] : ''
  );
  const [managerId, setManagerId] = useState(editData?.managerId ?? '');
  const [profilePhoto, setProfilePhoto] = useState(editData?.profilePhoto ?? '');

  // Password (create only)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!email.trim()) return 'Email is required';
    if (!role) return 'Role is required';
    if (!isEdit) {
      if (!password) return 'Password is required';
      if (password.length < 6) return 'Password must be at least 6 characters';
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || undefined,
        role,
        designation: designation || undefined,
        department: department || undefined,
        dateOfJoining: dateOfJoining || undefined,
        managerId: managerId || undefined,
        profilePhoto: profilePhoto || undefined,
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
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
              <p className="text-xs text-gray-500">Fill in all required fields to {isEdit ? 'update' : 'create'} an employee account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* ── Section: Basic Info ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">Basic Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ravi" className={inputCls} />
              </Field>
              <Field label="Last Name" required>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sharma" className={inputCls} />
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
              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={`${inputCls} pl-9`} />
                </div>
              </Field>
            </div>
          </div>

          {/* ── Section: Role & Position ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">Role & Position</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role" required>
                <select value={role} onChange={e => setRole(e.target.value)} className={selectCls}>
                  <option value="">Select role</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Designation">
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Senior MR" className={`${inputCls} pl-9`} />
                </div>
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
                  <input value={dateOfJoining} onChange={e => setDateOfJoining(e.target.value)} type="date" className={`${inputCls} pl-9`} />
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
              <Field label="Profile Photo URL">
                <input value={profilePhoto} onChange={e => setProfilePhoto(e.target.value)} placeholder="https://..." className={inputCls} />
              </Field>
            </div>
          </div>

          {/* ── Section: Password (create only) ── */}
          {!isEdit && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-700">Account Password</h3>
              </div>
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
            </div>
          )}
        </div>

        {/* Footer */}
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
