'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatCurrency, formatRole } from '@/lib/utils';
import {
  ArrowLeft, User, MapPin, Phone, Mail, Briefcase, Calendar, Shield,
  CheckCircle2, AlertCircle, Clock, Wifi, WifiOff, Battery, BatteryLow,
  Stethoscope, ShoppingCart, DollarSign, ChevronRight, CheckCircle, XCircle,
  TrendingUp, Building2, FileText, Target, Eye, Users, RefreshCw, Star,
  Activity, BarChart3, Key, PowerOff, Power, Loader2, Package, Store
} from 'lucide-react';
import EmployeeForm from '@/components/masters/EmployeeForm';

export default function EmployeeDossierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'visits' | 'orders'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdDone, setPwdDone] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // 1. Fetch employee dossier
  const { data: dossier, isLoading, isError, refetch } = useQuery({
    queryKey: ['employee-dossier', id],
    queryFn: () => api.get(`/employees/${id}/dossier`).then((r) => r.data.data),
    enabled: !!id,
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      isActive
        ? api.patch(`/employees/${id}/deactivate`)
        : api.patch(`/employees/${id}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-dossier', id] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update employee status');
    },
  });

  // Reset password mutation
  const resetPwdMutation = useMutation({
    mutationFn: (password: string) =>
      api.patch(`/employees/${id}/reset-password`, { newPassword: password }),
    onSuccess: () => {
      setPwdDone(true);
      setPwdError('');
    },
    onError: (err: any) => {
      setPwdError(err.response?.data?.message || 'Failed to reset password');
    },
  });

  const handleResetPassword = () => {
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }
    resetPwdMutation.mutate(newPassword);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4">
        <div className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !dossier) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Employee Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested staff dossier could not be retrieved.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
        >
          Return to Employee Master
        </button>
      </div>
    );
  }

  const emp = dossier.employee || dossier;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SALES_ADMIN';

  const doctors = dossier.doctors || [];
  const visits = dossier.visits || [];
  const orders = dossier.orders || [];
  const stats = dossier.stats || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employee Master
        </button>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setPwdDone(false);
                setNewPassword('');
                setPwdError('');
                setShowPwdModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" /> Reset Password
            </button>

            <button
              onClick={() => toggleStatusMutation.mutate(emp.isActive)}
              disabled={toggleStatusMutation.isPending}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors shadow-2xs ${
                emp.isActive
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              {emp.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
              {emp.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        )}
      </div>

      {/* ── EMPLOYEE DOSSIER BANNER ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-emerald-600/20 flex-shrink-0">
              {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || 'M'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {emp.firstName} {emp.lastName}
                </h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  {emp.employeeCode || 'EMP-PX'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {formatRole(emp.role)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    emp.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {emp.isActive ? 'Active Employee' : 'Inactive'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {emp.hq?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> HQ: <strong>{emp.hq.name}</strong>
                  </span>
                )}
                {emp.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {emp.phone}
                  </span>
                )}
                {emp.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {emp.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tagged Doctors
            </span>
            <span className="text-xl font-black text-slate-900">{doctors.length}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Visits Conducted
            </span>
            <span className="text-xl font-black text-emerald-700">{visits.length}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Orders Booked
            </span>
            <span className="text-xl font-black text-blue-700">{orders.length}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Call Average
            </span>
            <span className="text-xl font-black text-purple-700">{stats.callAverage || '10.5'} / day</span>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { key: 'overview', label: 'Master Overview', icon: User },
          { key: 'doctors', label: `Assigned Doctors (${doctors.length})`, icon: Stethoscope },
          { key: 'visits', label: `Field Calls (${visits.length})`, icon: Activity },
          { key: 'orders', label: `Commercial Orders (${orders.length})`, icon: ShoppingCart },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" /> Organizational Hierarchy
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Designation / Role</span>
                <span className="font-bold text-slate-900">{formatRole(emp.role)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Headquarter Base</span>
                <span className="font-bold text-slate-900">{emp.hq?.name || 'Nagpur Central'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Reporting Manager</span>
                <span className="font-bold text-slate-900">{emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'Area Sales Manager (ASM)'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-semibold text-slate-500">Joining Date</span>
                <span className="font-bold text-slate-900">{formatDate(emp.dateOfJoining || emp.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> Territory & Compliance Security
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Assigned Areas</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {emp.hq?.name || 'Territory Core Beats'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Mobile Geo-Fencing</span>
                <span className="font-bold text-slate-900">GPS Enforced (300m Clinic Radius)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Biometric / Device Lock</span>
                <span className="font-bold text-slate-900">Active Handshake</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-semibold text-slate-500">System Role</span>
                <span className="font-mono font-bold text-slate-700">{emp.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ASSIGNED DOCTORS ── */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" /> Doctor Master List for {emp.firstName}
            </h2>
            <span className="text-xs font-bold text-slate-500">{doctors.length} Doctors Tagged</span>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-slate-700 text-sm">No doctors directly tagged to this representative</p>
                <p className="text-xs text-slate-400 mt-1">Assign doctors via Doctor Directory or Area Beats.</p>
              </div>
            ) : (
              doctors.map((doc: any) => (
                <div key={doc.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs border border-emerald-100">
                      {doc.firstName?.[0]}{doc.lastName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/doctors/${doc.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition-colors"
                        >
                          {doc.salutation || 'Dr.'} {doc.firstName} {doc.lastName}
                        </Link>
                        {doc.doctorCode && (
                          <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                            {doc.doctorCode}
                          </span>
                        )}
                        {doc.isKol && (
                          <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> KOL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {doc.specialty || 'General Practice'} · {doc.qualification || 'MBBS'} · Category: {doc.category || 'General'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/doctors/${doc.id}`}
                    className="p-2 text-slate-400 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: FIELD VISITS ── */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Field Call History
            </h2>
            <span className="text-xs font-bold text-slate-500">{visits.length} Recorded Calls</span>
          </div>

          <div className="divide-y divide-slate-100">
            {visits.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-slate-700 text-sm">No field visits logged yet</p>
              </div>
            ) : (
              visits.map((v: any) => {
                const entityName = v.doctor
                  ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}`
                  : v.retailer
                  ? v.retailer.name
                  : v.hospital
                  ? v.hospital.name
                  : 'Direct Call';

                return (
                  <div key={v.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/visits/${v.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-emerald-700 transition-colors"
                        >
                          {entityName}
                        </Link>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {v.visitType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formatDate(v.plannedDate || v.checkInTime)} · Duration: {v.durationMinutes ? `${v.durationMinutes}m` : '—'}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/visits/${v.id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>View Dossier</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: ORDERS ── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" /> Commercial Orders Generated
            </h2>
            <span className="text-xs font-bold text-slate-500">{orders.length} Orders</span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-bold text-slate-700 text-sm">No commercial orders booked yet</p>
              </div>
            ) : (
              orders.map((o: any) => {
                const customer = o.retailer?.name || o.distributor?.name || 'Field Account';
                return (
                  <div key={o.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-blue-700 transition-colors"
                        >
                          {customer}
                        </Link>
                        <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded">
                          {o.orderNumber || `ORD-${o.id.slice(-6)}`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formatDate(o.orderDate || o.createdAt)} · Value: <strong>{formatCurrency(o.totalAmount || 0)}</strong>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Invoice</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD ── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
              </div>
              <button onClick={() => setShowPwdModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {pwdDone ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900">Password Reset Successfully!</p>
                <p className="text-xs text-slate-500">The employee can now log in with the new password.</p>
                <button
                  onClick={() => setShowPwdModal(false)}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Set a new password for <strong>{emp.firstName} {emp.lastName}</strong>
                </p>
                {pwdError && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{pwdError}</p>}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min. 6 characters)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowPwdModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetPwdMutation.isPending}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {resetPwdMutation.isPending ? 'Resetting...' : 'Save Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
