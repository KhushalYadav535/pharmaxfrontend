'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MapPin, Plus, Search, Building2, User, Calendar, ArrowRight,
  Loader2, CheckCircle2, History, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import Link from 'next/link';

export default function TerritoryAssignmentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Transfer Form State
  const [transferData, setTransferData] = useState<any>({
    userId: '',
    hqId: '',
    managerId: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    reason: 'Regular field transfer',
  });
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch all employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-assignments'],
    queryFn: () => api.get('/employees', { params: { limit: 300, isActive: 'true' } }).then(r => r.data.data.employees || []),
  });
  const employees: any[] = employeesData || [];

  // 2. Fetch Headquarters/Territories
  const { data: headquarters = [] } = useQuery({
    queryKey: ['headquarters-for-assignments'],
    queryFn: () => api.get('/headquarters').then(r => r.data.data?.headquarters || r.data.data || []),
  });

  // 3. Fetch Divisions
  const { data: divisions = [] } = useQuery({
    queryKey: ['divisions-for-assignments'],
    queryFn: () => api.get('/hrms/org/divisions').then(r => r.data.data || []),
  });

  // 4. Fetch assignments history if specific user selected
  const { data: userHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['user-assignment-history', selectedUserId],
    queryFn: () => api.get(`/hrms/assignments/user/${selectedUserId}`).then(r => r.data.data),
    enabled: !!selectedUserId,
  });

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: (data: any) => api.post('/hrms/assignments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employees-for-assignments'] });
      if (selectedUserId) {
        qc.invalidateQueries({ queryKey: ['user-assignment-history', selectedUserId] });
      }
      setIsTransferModalOpen(false);
      setTransferData({
        userId: '',
        hqId: '',
        managerId: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
        reason: 'Regular field transfer',
      });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Transfer failed');
    },
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.userId || !transferData.hqId) {
      setErrorMsg('Please select employee and headquarter');
      return;
    }
    transferMutation.mutate(transferData);
  };

  const filteredEmployees = employees.filter((e: any) =>
    e.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    e.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    e.hq?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" /> Workforce Allocation & Mobility
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Field Force Assignments & Transfers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Effective-dated territory allocation. Past visits and historical data remain tied to historical territory.
          </p>
        </div>

        <button
          onClick={() => {
            setIsTransferModalOpen(true);
            setErrorMsg('');
          }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Transfer / Reassign Rep
        </button>
      </div>

      {/* Grid Layout: Active Assignments vs History Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employees with Current Allocation */}
        <div className={`space-y-4 ${selectedUserId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rep name, code, or HQ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Showing {filteredEmployees.length} active representatives
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Representative</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Assigned Headquarter</th>
                    <th className="px-6 py-3.5">Reporting Manager</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((emp: any) => {
                    const isSelected = selectedUserId === emp.id;
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-gray-50/70 transition-colors ${
                          isSelected ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</div>
                              <div className="text-xs font-mono text-gray-500">{emp.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {emp.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {emp.hq ? (
                            <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{emp.hq.name}</span>
                              <span className="text-xs text-gray-400 font-mono">({emp.hq.code})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                              Vacant / Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">
                          {emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedUserId(isSelected ? '' : emp.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <History className="w-3.5 h-3.5" />
                            {isSelected ? 'Close' : 'Timeline'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: User Assignment Timeline History */}
        {selectedUserId && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Assignment Timeline
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Historical territory assignments with effective dates
                </p>
              </div>
              <button
                onClick={() => setSelectedUserId('')}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                ✕ Close
              </button>
            </div>

            {loadingHistory ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-xs">Loading timeline...</span>
              </div>
            ) : userHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No past assignment records found for this employee.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-emerald-200 space-y-6 ml-2">
                {userHistory.map((asg: any) => (
                  <div key={asg.id} className="relative group">
                    {/* Circle */}
                    <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
                      asg.isCurrent ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-gray-300'
                    }`} />

                    <div className={`p-4 rounded-xl border ${
                      asg.isCurrent ? 'bg-emerald-50/40 border-emerald-200' : 'bg-gray-50/50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {asg.hq?.name || 'Unassigned HQ'}
                        </span>
                        {asg.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 space-y-1 mt-2">
                        <div>
                          <span className="text-gray-400">Effective:</span>{' '}
                          <span className="font-semibold text-gray-800">
                            {new Date(asg.effectiveFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {asg.effectiveTo && (
                            <>
                              {' '}→{' '}
                              <span className="font-semibold text-gray-800">
                                {new Date(asg.effectiveTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                        {asg.manager && (
                          <div>
                            <span className="text-gray-400">Manager:</span>{' '}
                            <span className="text-gray-800">{asg.manager.firstName} {asg.manager.lastName}</span>
                          </div>
                        )}
                        {asg.reason && (
                          <div className="text-gray-500 italic mt-1 pt-1 border-t border-gray-200/50">
                            &quot;{asg.reason}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TRANSFER / REASSIGN MODAL ── */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Transfer / Reassign Employee</h3>
                <p className="text-xs text-gray-500">Record an effective-dated territory movement</p>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={transferData.userId}
                  onChange={e => setTransferData({ ...transferData, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId}) — Currently: {emp.hq?.name || 'Unassigned'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  New Headquarter / Territory *
                </label>
                <select
                  required
                  value={transferData.hqId}
                  onChange={e => setTransferData({ ...transferData, hqId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Select target HQ...</option>
                  {headquarters.map((hq: any) => (
                    <option key={hq.id} value={hq.id}>
                      {hq.name} ({hq.code}) — {hq.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Division (Optional)
                  </label>
                  <select
                    value={transferData.divisionId || ''}
                    onChange={e => setTransferData({ ...transferData, divisionId: e.target.value || null })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="">Keep current / default</option>
                    {divisions.map((div: any) => (
                      <option key={div.id} value={div.id}>{div.name} ({div.code})</option>
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
                    value={transferData.effectiveFrom}
                    onChange={e => setTransferData({ ...transferData, effectiveFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  New Reporting Manager (Optional)
                </label>
                <select
                  value={transferData.managerId || ''}
                  onChange={e => setTransferData({ ...transferData, managerId: e.target.value || null })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Keep existing manager</option>
                  {employees
                    .filter((m: any) => ['ASM', 'RSM', 'ZM', 'NSM', 'SALES_ADMIN', 'SUPER_ADMIN'].includes(m.role))
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.role}) — {m.hq?.name || ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Territory reorganization, Vacancy fulfillment, Employee request"
                  value={transferData.reason}
                  onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {transferMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
