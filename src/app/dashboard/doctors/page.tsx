'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, CLASSIFICATION_COLORS } from '@/lib/utils';
import { Users, Plus, Search, Filter, Phone, Building2, Star, Loader2, X } from 'lucide-react';
import Link from 'next/link';

const SPECIALTIES = ['Cardiology', 'Endocrinology', 'General Medicine', 'Pediatrics', 'Neurology', 'Gynecology', 'Orthopedics', 'Dermatology'];
const CLASSIFICATIONS = ['A_PLUS', 'A', 'B', 'C'];

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [classification, setClassification] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', { search, specialty, classification, page }],
    queryFn: () => api.get('/doctors', { params: { search, specialty, classification, page, limit: 20 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/doctors', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); setShowForm(false); },
  });

  const [form, setForm] = useState({
    firstName: '', lastName: '', specialty: 'General Medicine', classification: 'B',
    prescriptionPotential: 5, phone: '', city: 'Mumbai', visitFrequency: 2,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, prescriptionPotential: Number(form.prescriptionPotential), visitFrequency: Number(form.visitFrequency), state: 'Maharashtra', isActive: true });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Doctor CRM
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your doctor relationships and visit history</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          id="add-doctor-btn"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['A_PLUS', 'A', 'B', 'C'].map((cls) => (
          <button
            key={cls}
            onClick={() => setClassification(classification === cls ? '' : cls)}
            className={`p-4 rounded-xl border text-sm font-medium transition-all ${classification === cls ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
          >
            <span className={`px-2 py-0.5 rounded-lg text-xs ${CLASSIFICATION_COLORS[cls]}`}>{cls.replace('_', '+')}</span>
            <p className="text-gray-500 text-xs mt-2">Click to filter</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or specialty..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
        >
          <option value="">All Specialties</option>
          {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {(search || specialty || classification) && (
          <button onClick={() => { setSearch(''); setSpecialty(''); setClassification(''); setPage(1); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialty</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rx Potential</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospital</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Visit</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.doctors?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No doctors found</p>
                    <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Add your first doctor →</button>
                  </td>
                </tr>
              ) : (
                data?.doctors?.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/doctors/${doc.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                          {doc.firstName[0]}{doc.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">Dr. {doc.firstName} {doc.lastName}</p>
                          {doc.isKol && <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />KOL</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{doc.specialty}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${CLASSIFICATION_COLORS[doc.classification]}`}>
                        {doc.classification.replace('_', '+')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-16">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(doc.prescriptionPotential / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{doc.prescriptionPotential}/10</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{doc.hospital?.name || '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{doc.lastVisitDate ? formatDate(doc.lastVisitDate) : 'Never'}</td>
                    <td className="px-5 py-4 text-gray-700 font-medium">{doc._count?.visits ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} doctors</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Add New Doctor</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input required value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input required value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Specialty *</label>
                <select value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Classification</label>
                  <select value={form.classification} onChange={(e) => setForm(f => ({ ...f, classification: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c.replace('_', '+')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rx Potential (1–10)</label>
                  <input type="number" min={1} max={10} value={form.prescriptionPotential} onChange={(e) => setForm(f => ({ ...f, prescriptionPotential: Number(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              {createMutation.isError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{(createMutation.error as any)?.response?.data?.message || 'Failed to create doctor'}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
