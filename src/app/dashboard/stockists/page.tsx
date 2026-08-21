'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Search, Loader2, Phone, MapPin, PackageOpen, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function StockistsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['stockists', search, page],
    queryFn: () => api.get('/stockists', { params: { search, page, limit: 20 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageOpen className="w-6 h-6 text-cyan-600" /> Stockists
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage wholesale distributors and CFAs</p>
        </div>
        <Link href="/dashboard/stockists/new" className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Stockist
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Stockists', value: data?.total ?? 0, color: 'bg-cyan-50 text-cyan-700' },
          { label: 'Active This Month', value: data?.stockists?.filter((s: any) => s.isActive !== false).length ?? 0, color: 'bg-emerald-50 text-emerald-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.color.split(' ')[1]}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search stockists by name, city or GSTIN..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Stockist', 'Contact', 'Location', 'GSTIN', 'Category', 'Visit Days'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500 mb-3" />
                    Loading stockists...
                  </td>
                </tr>
              ) : data?.stockists?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500 bg-gray-50/50">
                    <PackageOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No stockists found.
                  </td>
                </tr>
              ) : (
                data?.stockists?.map((stockist: any) => (
                  <tr key={stockist.id} className="hover:bg-cyan-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{stockist.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stockist.stockistCode}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-900">{stockist.contactFirstName} {stockist.contactLastName}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Phone className="w-3 h-3" /> {stockist.mobileNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 text-gray-600">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {stockist.city || '—'}, {stockist.state || '—'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <FileText className="w-3.5 h-3.5 text-gray-400" /> {stockist.gstinNumber || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {stockist.category ? <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md">{stockist.category} Class</span> : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {stockist.visitDays?.length > 0 ? stockist.visitDays.join(', ') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
