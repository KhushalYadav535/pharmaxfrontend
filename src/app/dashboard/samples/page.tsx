'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Package, Plus, Loader2, X, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function SamplesPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['sample-products'],
    queryFn: () => api.get('/samples/products').then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['sample-stats'],
    queryFn: () => api.get('/samples/stats').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sample-distributions', page],
    queryFn: () => api.get('/samples/distributions', { params: { page, limit: 15 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data.data?.doctors || []),
  });

  const [form, setForm] = useState({ doctorId: '', sampleProductId: '', quantity: '1', notes: '' });

  const distributeMutation = useMutation({
    mutationFn: (body: any) => api.post('/samples/distribute', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sample-distributions'] });
      qc.invalidateQueries({ queryKey: ['sample-stats'] });
      setShowForm(false);
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" /> Samples
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage sample distributions to doctors</p>
        </div>
        <button onClick={() => setShowForm(true)} id="distribute-sample-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Distribute Sample
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <TrendingDown className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats?.totalDistributions || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Distributions</p>
        </div>
        {stats?.topProducts?.slice(0, 3).map((prod: any) => (
          <div key={prod.productName} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 truncate mb-1">{prod.productName}</p>
            <p className="text-2xl font-bold text-gray-900">{prod.quantity}</p>
            <p className="text-xs text-gray-400">{prod.count} distributions</p>
          </div>
        ))}
      </div>

      {/* Top Products Bar */}
      {stats?.topProducts?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Top Products by Quantity</h2>
          <div className="space-y-3">
            {stats.topProducts.map((prod: any, i: number) => {
              const maxQty = stats.topProducts[0]?.quantity || 1;
              return (
                <div key={prod.productName} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{prod.productName}</span>
                      <span className="text-sm font-bold text-gray-700">{prod.quantity} units</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(prod.quantity / maxQty) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribution Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Distribution History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Product', 'Doctor', 'Quantity', 'Distributed By', 'Date'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.distributions?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No sample distributions yet</p>
                </td></tr>
              ) : data?.distributions?.map((dist: any) => (
                <tr key={dist.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{dist.sampleProduct?.name}</p>
                    <p className="text-xs text-gray-400">{dist.sampleProduct?.category}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-700">Dr. {dist.doctor?.firstName} {dist.doctor?.lastName}</td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-900">{dist.quantity}</span>
                    <span className="text-xs text-gray-400 ml-1">units</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-xs">{dist.user?.firstName} {dist.user?.lastName}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(dist.distributedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Distribute Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Distribute Sample</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); distributeMutation.mutate({ ...form, quantity: parseInt(form.quantity) }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Doctor *</label>
                <select required value={form.doctorId} onChange={(e) => setForm(f => ({ ...f, doctorId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  <option value="">Select doctor...</option>
                  {doctors?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product *</label>
                <select required value={form.sampleProductId} onChange={(e) => setForm(f => ({ ...f, sampleProductId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  <option value="">Select product...</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                <input required type="number" min={1} value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={distributeMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {distributeMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Distributing...</> : 'Distribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
