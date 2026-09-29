'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Pencil, PowerOff, Power, Key, Calendar,
  Shield, Phone, Eye,
} from 'lucide-react';
import EmployeeForm from '@/components/masters/EmployeeForm';

// ─── Role label map ──────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  MR:               { label: 'MR',              color: 'bg-blue-100 text-blue-700' },
  TRADE_REP:        { label: 'Trade Rep',        color: 'bg-cyan-100 text-cyan-700' },
  DISTRIBUTOR_REP:  { label: 'Dist. Rep',        color: 'bg-teal-100 text-teal-700' },
  ASM:              { label: 'ASM',              color: 'bg-violet-100 text-violet-700' },
  RSM:              { label: 'RSM',              color: 'bg-purple-100 text-purple-700' },
  ZM:               { label: 'ZM',               color: 'bg-indigo-100 text-indigo-700' },
  NSM:              { label: 'NSM',              color: 'bg-pink-100 text-pink-700' },
  PRODUCT_MANAGER:  { label: 'Product Mgr',      color: 'bg-orange-100 text-orange-700' },
  MARKETING:        { label: 'Marketing',        color: 'bg-rose-100 text-rose-700' },
  SALES_ADMIN:      { label: 'Sales Admin',      color: 'bg-amber-100 text-amber-700' },
  SUPER_ADMIN:      { label: 'Super Admin',      color: 'bg-red-100 text-red-700' },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_LABELS[role] ?? { label: role, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
      <Shield className="w-3 h-3" /> {meta.label}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />Active</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><XCircle className="w-3 h-3" />Inactive</span>;
}

// ─── Reset Password Modal ────────────────────────────────────────────────────
function ResetPwdModal({ employeeId, name, onClose }: { employeeId: string; name: string; onClose: () => void }) {
  const [pwd, setPwd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (pwd.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      setIsSubmitting(true); setError('');
      await api.patch(`/employees/${employeeId}/reset-password`, { newPassword: pwd });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-semibold text-gray-900">Reset Password</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">Password reset!</p>
              <p className="text-sm text-gray-500 mt-1">New password set for {name}</p>
              <button onClick={onClose} className="mt-4 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">Setting new password for <strong>{name}</strong></p>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <input
                type="password"
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="New password (min. 6 chars)"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmployeeMasterPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, roleFilter, page],
    queryFn: () =>
      api.get('/employees', { params: { search, role: roleFilter || undefined, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const toggleActive = async (emp: any) => {
    await (emp.isActive
      ? api.patch(`/employees/${emp.id}/deactivate`)
      : api.patch(`/employees/${emp.id}/reactivate`));
    qc.invalidateQueries({ queryKey: ['employees'] });
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d));
  };

  return (
    <>
      {(showForm || editData) && (
        <EmployeeForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}
      {resetTarget && (
        <ResetPwdModal
          employeeId={resetTarget.id}
          name={`${resetTarget.firstName} ${resetTarget.lastName}`}
          onClose={() => setResetTarget(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" /> Employee Master
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all field force employees, roles, territories and access
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Employees', value: data?.total ?? 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Active', value: data?.employees?.filter((e: any) => e.isActive).length ?? 0, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Field Force (MR)', value: data?.employees?.filter((e: any) => e.role === 'MR').length ?? 0, color: 'bg-violet-50 text-violet-700' },
            { label: 'Managers (ASM+)', value: data?.employees?.filter((e: any) => ['ASM', 'RSM', 'ZM', 'NSM', 'NSM'].includes(e.role)).length ?? 0, color: 'bg-amber-50 text-amber-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[0]} border border-gray-100`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${s.color.split(' ')[1]}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email or employee code..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, meta]) => (
              <option key={val} value={val}>{meta.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Employee', 'Emp. Code', 'Role', 'Designation / Dept', 'DOJ', 'Contact', 'Manager', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-3" />Loading employees...
                  </td></tr>
                ) : data?.employees?.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />No employees found.
                  </td></tr>
                ) : data?.employees?.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(emp.firstName?.[0] ?? '') + (emp.lastName?.[0] ?? '')}
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/masters/employees/${emp.id}`}
                            className="font-bold text-gray-900 hover:text-blue-700 hover:underline"
                          >
                            {emp.firstName} {emp.lastName}
                          </Link>
                          <div className="text-xs text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{emp.employeeId ?? '—'}</td>
                    <td className="px-5 py-4"><RoleBadge role={emp.role} /></td>
                    <td className="px-5 py-4">
                      <div className="text-gray-900">{emp.designation || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{emp.department || ''}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(emp.dateOfJoining)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Phone className="w-3 h-3 text-gray-400" /> {emp.phone || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'}
                    </td>
                    <td className="px-5 py-4"><StatusBadge active={emp.isActive} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/masters/employees/${emp.id}`}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                          title="View Full MR Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditData(emp)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResetTarget(emp)}
                          className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500 transition-colors"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          className={`p-1.5 rounded-lg transition-colors ${emp.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
                          title={emp.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {emp.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
              <p className="text-gray-500">
                Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
