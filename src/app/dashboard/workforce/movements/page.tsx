'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity, Search, Plus, Filter, Calendar, User, ArrowRight,
  TrendingUp, Award, CheckCircle2, AlertCircle, Loader2, Sparkles,
  FileText, ShieldCheck
} from 'lucide-react';

const MOVEMENT_TYPES = [
  { value: 'PROMOTION', label: 'Promotion', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'TRANSFER', label: 'Territory Transfer', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONFIRMATION', label: 'Probation Confirmation', color: 'bg-purple-100 text-purple-800' },
  { value: 'DESIGNATION_CHANGE', label: 'Designation Change', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'GRADE_CHANGE', label: 'Grade Band Change', color: 'bg-violet-100 text-violet-800' },
  { value: 'MANAGER_CHANGE', label: 'Manager Change', color: 'bg-teal-100 text-teal-800' },
  { value: 'JOINING', label: 'New Joiner', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'RESIGNATION', label: 'Resignation', color: 'bg-amber-100 text-amber-800' },
  { value: 'TERMINATION', label: 'Termination', color: 'bg-red-100 text-red-800' },
  { value: 'SUSPENDED', label: 'Suspension', color: 'bg-rose-100 text-rose-800' },
];

export default function EmployeeMovementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    userId: '',
    movementType: 'PROMOTION',
    effectiveDate: new Date().toISOString().split('T')[0],
    previousValue: '',
    newValue: '',
    reason: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch movements
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['employee-movements', typeFilter],
    queryFn: () =>
      api.get('/hrms/assignments/movements', {
        params: { movementType: typeFilter || undefined },
      }).then(r => r.data.data),
  });

  // 2. Fetch employees for modal
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-movements'],
    queryFn: () => api.get('/employees', { params: { limit: 300, isActive: 'true' } }).then(r => r.data.data.employees || []),
  });
  const employees: any[] = employeesData || [];

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: (data: any) => api.post('/hrms/assignments/movements', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-movements'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setFormData({
        userId: '',
        movementType: 'PROMOTION',
        effectiveDate: new Date().toISOString().split('T')[0],
        previousValue: '',
        newValue: '',
        reason: '',
      });
      setErrorMsg('');
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to record movement'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.movementType) {
      setErrorMsg('Please select employee and movement type');
      return;
    }
    createMovementMutation.mutate(formData);
  };

  const filtered = movements.filter((m: any) =>
    m.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    m.user?.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    m.movementType?.toLowerCase().includes(search.toLowerCase()) ||
    m.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" /> Employee Lifecycle & Audit
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Employee Movements Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit-grade immutable register of promotions, transfers, confirmations, and organizational movements.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg('');
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Lifecycle Event
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, event or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === '' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          {MOVEMENT_TYPES.slice(0, 5).map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value === typeFilter ? '' : t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === t.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-sm">Loading movement history...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            No employee lifecycle events found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Effective Date</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Movement Type</th>
                  <th className="px-6 py-3.5">Transition (Previous → New)</th>
                  <th className="px-6 py-3.5">Reason & Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m: any) => {
                  const meta = MOVEMENT_TYPES.find(t => t.value === m.movementType) || {
                    label: m.movementType,
                    color: 'bg-gray-100 text-gray-700',
                  };

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {new Date(m.effectiveDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {m.user?.firstName?.[0]}{m.user?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{m.user?.firstName} {m.user?.lastName}</div>
                            <div className="text-xs font-mono text-gray-400">{m.user?.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-0.5">
                          {m.previousValue && (
                            <div className="text-gray-400 line-through">
                              {m.previousValue}
                            </div>
                          )}
                          <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {m.previousValue && <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />}
                            <span>{m.newValue || 'Updated'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-700">
                          {m.reason || '—'}
                          {m.approvedBy && (
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Authorized by: {m.approvedBy.firstName} {m.approvedBy.lastName}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RECORD MOVEMENT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Record Employee Lifecycle Event</h3>
                <p className="text-xs text-gray-500">Log a promotion, designation change, confirmation or resignation</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={formData.userId}
                  onChange={e => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId}) — {emp.designation || emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Event Type *
                  </label>
                  <select
                    required
                    value={formData.movementType}
                    onChange={e => setFormData({ ...formData, movementType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    {MOVEMENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Previous Value (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical Representative (Grade G1)"
                  value={formData.previousValue}
                  onChange={e => setFormData({ ...formData, previousValue: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  New Value *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Medical Representative (Grade G2)"
                  value={formData.newValue}
                  onChange={e => setFormData({ ...formData, newValue: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Reason & Business Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Annual appraisal performance reward, Completed 6 months probation"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMovementMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {createMovementMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
