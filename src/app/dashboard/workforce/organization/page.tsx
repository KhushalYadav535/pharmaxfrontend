'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Building2, Layers, Award, Tag, Settings, Plus, Search,
  Edit2, Trash2, CheckCircle2, XCircle, Loader2, ShieldCheck,
  Users, Sliders, AlertCircle, Sparkles
} from 'lucide-react';

export default function OrganizationMastersPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'departments' | 'divisions' | 'designations' | 'grades' | 'settings'>('departments');
  const [search, setSearch] = useState('');

  // Modals state
  const [modalType, setModalType] = useState<'dept' | 'div' | 'desig' | 'grade' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [errorMsg, setErrorMsg] = useState('');

  // ── Queries ──
  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['hrms-departments'],
    queryFn: () => api.get('/hrms/org/departments').then(r => r.data.data),
  });

  const { data: divisions = [], isLoading: loadingDivs } = useQuery({
    queryKey: ['hrms-divisions'],
    queryFn: () => api.get('/hrms/org/divisions').then(r => r.data.data),
  });

  const { data: designations = [], isLoading: loadingDesigs } = useQuery({
    queryKey: ['hrms-designations'],
    queryFn: () => api.get('/hrms/org/designations').then(r => r.data.data),
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['hrms-grades'],
    queryFn: () => api.get('/hrms/org/grades').then(r => r.data.data),
  });

  const { data: settings = [], isLoading: loadingSettings } = useQuery({
    queryKey: ['hrms-settings'],
    queryFn: () => api.get('/hrms/org/settings').then(r => r.data.data),
  });

  // ── Mutations ──
  const saveDeptMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? api.put(`/hrms/org/departments/${editingItem.id}`, data)
        : api.post('/hrms/org/departments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-departments'] });
      closeModal();
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to save department'),
  });

  const saveDivMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? api.put(`/hrms/org/divisions/${editingItem.id}`, data)
        : api.post('/hrms/org/divisions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-divisions'] });
      closeModal();
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to save division'),
  });

  const saveGradeMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? api.put(`/hrms/org/grades/${editingItem.id}`, data)
        : api.post('/hrms/org/grades', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-grades'] });
      closeModal();
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to save grade band'),
  });

  const saveDesigMutation = useMutation({
    mutationFn: (data: any) =>
      editingItem
        ? api.put(`/hrms/org/designations/${editingItem.id}`, data)
        : api.post('/hrms/org/designations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-designations'] });
      closeModal();
    },
    onError: (err: any) => setErrorMsg(err.response?.data?.message || 'Failed to save designation'),
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`/hrms/org/settings/${key}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-settings'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update policy setting'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      api.delete(`/hrms/org/${type}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-departments'] });
      qc.invalidateQueries({ queryKey: ['hrms-divisions'] });
      qc.invalidateQueries({ queryKey: ['hrms-designations'] });
      qc.invalidateQueries({ queryKey: ['hrms-grades'] });
    },
    onError: (err: any) => alert(err.response?.data?.message || 'Delete failed'),
  });

  // Modal helpers
  const openModal = (type: 'dept' | 'div' | 'desig' | 'grade', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setErrorMsg('');
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({ status: true });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setFormData({});
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'dept') saveDeptMutation.mutate(formData);
    else if (modalType === 'div') saveDivMutation.mutate(formData);
    else if (modalType === 'grade') saveGradeMutation.mutate(formData);
    else if (modalType === 'desig') saveDesigMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Workforce Foundation & Masters
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organization Structure</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage company departments, divisions, bands, designations, and multi-level approval workflows.
          </p>
        </div>

        {activeTab !== 'settings' && (
          <button
            onClick={() => {
              if (activeTab === 'departments') openModal('dept');
              else if (activeTab === 'divisions') openModal('div');
              else if (activeTab === 'grades') openModal('grade');
              else if (activeTab === 'designations') openModal('desig');
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'departments' ? 'Department' : activeTab === 'divisions' ? 'Division' : activeTab === 'grades' ? 'Grade Band' : 'Designation'}
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { key: 'departments', label: 'Departments', icon: Building2, count: departments.length },
          { key: 'divisions', label: 'Divisions', icon: Layers, count: divisions.length },
          { key: 'grades', label: 'Grades & Bands', icon: Award, count: grades.length },
          { key: 'designations', label: 'Designations', icon: Tag, count: designations.length },
          { key: 'settings', label: 'Approval Policies', icon: Settings, count: null },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key as any); setSearch(''); }}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DEPARTMENTS ── */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {loadingDepts ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Loading departments...</span>
            </div>
          ) : departments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No departments configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Department Name</th>
                    <th className="px-6 py-3.5">Department Head</th>
                    <th className="px-6 py-3.5">Total Staff</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departments
                    .filter((d: any) =>
                      d.name.toLowerCase().includes(search.toLowerCase()) ||
                      d.code.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((dept: any) => (
                      <tr key={dept.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-700 text-xs">
                          {dept.code}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {dept.name}
                        </td>
                        <td className="px-6 py-4">
                          {dept.head ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                                {dept.head.firstName[0]}
                              </div>
                              <span className="font-medium text-gray-800">{dept.head.firstName} {dept.head.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">
                          {dept._count?.employees || 0} employees
                        </td>
                        <td className="px-6 py-4">
                          {dept.status ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openModal('dept', dept)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete department "${dept.name}"?`)) {
                                deleteMutation.mutate({ type: 'departments', id: dept.id });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: DIVISIONS ── */}
      {activeTab === 'divisions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search divisions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {loadingDivs ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Loading divisions...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Division Name</th>
                    <th className="px-6 py-3.5">Business Unit</th>
                    <th className="px-6 py-3.5">Active Workforce</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {divisions
                    .filter((d: any) =>
                      d.name.toLowerCase().includes(search.toLowerCase()) ||
                      d.code.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((div: any) => (
                      <tr key={div.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-700 text-xs">{div.code}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{div.name}</td>
                        <td className="px-6 py-4 text-gray-700">{div.businessUnit || '—'}</td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{div._count?.employees || 0} Reps</td>
                        <td className="px-6 py-4">
                          {div.status ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openModal('div', div)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete division "${div.name}"?`)) {
                                deleteMutation.mutate({ type: 'divisions', id: div.id });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: GRADES & BANDS ── */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search grades..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {loadingGrades ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Loading grades...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Band Code</th>
                    <th className="px-6 py-3.5">Band Name</th>
                    <th className="px-6 py-3.5">Hierarchy Level</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades
                    .filter((g: any) =>
                      g.name.toLowerCase().includes(search.toLowerCase()) ||
                      g.code.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((g: any) => (
                      <tr key={g.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-700 text-xs">{g.code}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{g.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs bg-indigo-50 text-indigo-700 font-bold">
                            Level {g.level || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">{g.description || '—'}</td>
                        <td className="px-6 py-4">
                          {g.status ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openModal('grade', g)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete grade band "${g.name}"?`)) {
                                deleteMutation.mutate({ type: 'grades', id: g.id });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: DESIGNATIONS ── */}
      {activeTab === 'designations' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search designations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {loadingDesigs ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Loading designations...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Designation Title</th>
                    <th className="px-6 py-3.5">Grade Band</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {designations
                    .filter((ds: any) =>
                      ds.name.toLowerCase().includes(search.toLowerCase()) ||
                      ds.code.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((ds: any) => (
                      <tr key={ds.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-700 text-xs">{ds.code}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{ds.name}</td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">
                          {ds.gradeBand?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">
                          {ds.department?.name || 'General'}
                        </td>
                        <td className="px-6 py-4">
                          {ds.status ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openModal('desig', ds)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete designation "${ds.name}"?`)) {
                                deleteMutation.mutate({ type: 'designations', id: ds.id });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: APPROVAL POLICIES & SETTINGS (Super Admin) ── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              HRMS Governance & Approval Workflows
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Super Admin controls for Field Force workflow approval levels and operational guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setting 1: Leave Approval Hierarchy */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Leave Approval Workflow</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Determine whether leave requests need 1 or 2 levels of approval</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  {settings.find((s: any) => s.key === 'leave_approval_workflow')?.value || 'DIRECT_MANAGER'}
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    val: 'DIRECT_MANAGER',
                    title: 'Level 1: Direct Manager Only (ASM)',
                    desc: 'Leave is approved immediately once approved by the employee’s immediate Reporting Manager.'
                  },
                  {
                    val: 'TWO_LEVEL',
                    title: 'Level 2: ASM → HR / Super Admin Final Approval',
                    desc: 'Manager reviews first, then final approval is granted by HR Admin.'
                  }
                ].map(opt => {
                  const currentVal = settings.find((s: any) => s.key === 'leave_approval_workflow')?.value || 'DIRECT_MANAGER';
                  const isSelected = currentVal === opt.val;
                  return (
                    <div
                      key={opt.val}
                      onClick={() => updateSettingMutation.mutate({ key: 'leave_approval_workflow', value: opt.val })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Setting 2: Regularization Approval Workflow */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Attendance Regularization Approval</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Approval path for missed punches and attendance corrections</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 bg-blue-100 text-blue-800 rounded-lg">
                  {settings.find((s: any) => s.key === 'regularization_approval_workflow')?.value || 'DIRECT_MANAGER'}
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    val: 'DIRECT_MANAGER',
                    title: 'Level 1: Direct Manager (ASM)',
                    desc: 'Immediate reporting manager can accept or reject punch regularization.'
                  },
                  {
                    val: 'TWO_LEVEL',
                    title: 'Level 2: ASM Review → HR Final Approval',
                    desc: 'ASM recommends correction, but attendance record updates only after HR sign-off.'
                  }
                ].map(opt => {
                  const currentVal = settings.find((s: any) => s.key === 'regularization_approval_workflow')?.value || 'DIRECT_MANAGER';
                  const isSelected = currentVal === opt.val;
                  return (
                    <div
                      key={opt.val}
                      onClick={() => updateSettingMutation.mutate({ key: 'regularization_approval_workflow', value: opt.val })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Setting 3: Block Start Day on Approved Leave */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Block Field Day on Approved Leave</h3>
                  <p className="text-xs text-gray-500">Prevent MR from clocking in / starting day if approved full-day leave exists</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.find((s: any) => s.key === 'block_day_start_on_approved_leave')?.value === 'true'}
                  onChange={e => updateSettingMutation.mutate({
                    key: 'block_day_start_on_approved_leave',
                    value: e.target.checked ? 'true' : 'false'
                  })}
                  className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Setting 4: Negative Leave Balance */}
            <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Allow Negative Leave Balance</h3>
                  <p className="text-xs text-gray-500">Allow submitting leave when balance is zero (as unpaid leave)</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.find((s: any) => s.key === 'allow_negative_leave_balance')?.value === 'true'}
                  onChange={e => updateSettingMutation.mutate({
                    key: 'allow_negative_leave_balance',
                    value: e.target.checked ? 'true' : 'false'
                  })}
                  className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL (CREATE / EDIT) ── */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">
                {editingItem ? 'Edit' : 'Create'} {modalType === 'dept' ? 'Department' : modalType === 'div' ? 'Division' : modalType === 'grade' ? 'Grade Band' : 'Designation'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <XCircle className="w-5 h-5" />
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
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SALES, G1, MR"
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Marketing, Medical Representative"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {modalType === 'div' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Business Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary Care, Specialty"
                    value={formData.businessUnit || ''}
                    onChange={e => setFormData({ ...formData, businessUnit: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              {modalType === 'grade' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Hierarchy Level (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.level || 1}
                      onChange={e => setFormData({ ...formData, level: parseInt(e.target.value, 10) })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Field Executives, Medical Representatives"
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              {modalType === 'desig' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Grade Band</label>
                    <select
                      value={formData.gradeBandId || ''}
                      onChange={e => setFormData({ ...formData, gradeBandId: e.target.value || null })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="">None / Unassigned</option>
                      {grades.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Department</label>
                    <select
                      value={formData.departmentId || ''}
                      onChange={e => setFormData({ ...formData, departmentId: e.target.value || null })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="">General / All Departments</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={formData.status !== false}
                  onChange={e => setFormData({ ...formData, status: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="statusToggle" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Active in System
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveDeptMutation.isPending || saveDivMutation.isPending || saveGradeMutation.isPending || saveDesigMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {(saveDeptMutation.isPending || saveDivMutation.isPending || saveGradeMutation.isPending || saveDesigMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
