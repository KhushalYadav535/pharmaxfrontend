'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Store, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function RetailersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['retailers', search],
    queryFn: () => api.get('/retailers', { params: { search, limit: 20 } }).then((r) => r.data.data),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Store className="w-6 h-6 text-emerald-600" /> Retailers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your pharmacy and retail partnerships</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search retailers..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Name', 'Owner', 'City', 'Category', 'Distributor', 'Drug License'].map((h) => (
              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
            )) : data?.retailers?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Store className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>No retailers found</p></td></tr>
            ) : data?.retailers?.map((ret: any) => (
              <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-900">{ret.name}</td>
                <td className="px-5 py-4 text-gray-600">{ret.ownerName || '—'}</td>
                <td className="px-5 py-4 text-gray-500 text-xs">{ret.city || '—'}</td>
                <td className="px-5 py-4"><span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700">{ret.category || '—'}</span></td>
                <td className="px-5 py-4 text-gray-500 text-xs">{ret.distributor?.name || '—'}</td>
                <td className="px-5 py-4 text-gray-500 text-xs">{ret.drugLicenseNumber || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
