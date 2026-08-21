'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, CLASSIFICATION_COLORS } from '@/lib/utils';
import { Building2, Search, Plus, Users, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function HospitalsPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hospitals', search],
    queryFn: () => api.get('/hospitals', { params: { search, limit: 30 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Removed inline modal states

  const CATEGORIES = ['Government', 'Private', 'Nursing Home', 'Corporate', 'Trust', 'Medical College'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" /> Hospitals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track hospital accounts and affiliated doctors</p>
        </div>
        <Link href="/dashboard/hospitals/new" id="add-hospital-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Hospital
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {['Government', 'Private', 'Medical College'].map((cat) => {
          const count = data?.hospitals?.filter((h: any) => h.type === cat).length || 0;
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 mt-0.5">{cat}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hospitals by name..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : data?.hospitals?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hospitals found</p>
          <Link href="/dashboard/hospitals/new" className="text-emerald-600 text-sm font-medium mt-2 inline-block">Add a hospital →</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.hospitals?.map((hosp: any) => (
            <Link key={hosp.id} href={`/dashboard/hospitals/${hosp.id}`} className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">{hosp.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{hosp.city || '—'} · {hosp.territory?.name || 'General'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">{hosp.type || 'Hospital'}</span>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{hosp._count?.doctors || 0}</span>
                  <span className="text-xs text-gray-400">doctors</span>
                </div>
              </div>
              {hosp.beds && <p className="text-xs text-gray-400 mt-2">{hosp.beds} beds</p>}
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
