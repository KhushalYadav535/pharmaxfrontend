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
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', { search, specialty, classification, page }],
    queryFn: () => api.get('/doctors', { params: { search, specialty, classification, page, limit: 20 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Removed inline modal states

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
        <Link
          href="/dashboard/doctors/new"
          id="add-doctor-btn"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </Link>
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
                    <Link href="/dashboard/doctors/new" className="text-emerald-600 text-sm font-medium mt-2 inline-block">Add your first doctor →</Link>
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

    </div>
  );
}
