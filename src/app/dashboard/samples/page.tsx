'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Package, Plus, Loader2, X, TrendingDown, Stethoscope, Users,
  Search, Filter, ShieldCheck, Pill, ArrowRight, Layers, FileSpreadsheet
} from 'lucide-react';

export default function SamplesPage() {
  const [activeTab, setActiveTab] = useState<'distributions' | 'products' | 'rep-allocations'>('distributions');
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
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
    queryKey: ['sample-distributions', page, selectedProduct],
    queryFn: () =>
      api
        .get('/samples/distributions', {
          params: { page, limit: 15, sampleProductId: selectedProduct || undefined },
        })
        .then((r) => r.data.data),
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
      setForm({ doctorId: '', sampleProductId: '', quantity: '1', notes: '' });
    },
  });

  const distributionsList = data?.distributions || [];

  // Group distributions by MR
  const repAllocations = distributionsList.reduce((acc: any, dist: any) => {
    const repName = dist.user ? `${dist.user.firstName} ${dist.user.lastName}` : 'Unassigned Rep';
    if (!acc[repName]) {
      acc[repName] = { repName, totalUnits: 0, callCount: 0, products: {} };
    }
    acc[repName].totalUnits += dist.quantity || 0;
    acc[repName].callCount += 1;
    const pName = dist.sampleProduct?.name || 'Sample';
    acc[repName].products[pName] = (acc[repName].products[pName] || 0) + (dist.quantity || 0);
    return acc;
  }, {});

  const repList = Object.values(repAllocations);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" /> Physician Samples & Allocation Ledger
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Audit physician sample inventories, doctor distribution compliance, and MR allocations
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          id="distribute-sample-btn"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Issue Sample to Doctor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sample Distributions</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalDistributions || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total doctor sampling calls</p>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Active Sample SKUs</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{products?.length || 0}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Physician sample brands</p>
        </div>

        {stats?.topProducts?.slice(0, 2).map((prod: any, idx: number) => (
          <div key={prod.productName || idx} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate block">
              Top Sample #{idx + 1}
            </span>
            <p className="text-lg font-black text-slate-900 mt-1 truncate">{prod.productName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{prod.quantity} units distributed</p>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex gap-1 shadow-2xs w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('distributions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'distributions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Doctor Sampling Ledger
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4" /> Sample SKUs Catalog
        </button>
        <button
          onClick={() => setActiveTab('rep-allocations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rep-allocations' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> Rep-Wise Sampling
        </button>
      </div>

      {/* TAB 1: Distribution History */}
      {activeTab === 'distributions' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 text-sm">Doctor Sampling Audit History</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">All Sample Products</option>
                {products?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="text-left px-5 py-3.5">Sample Product</th>
                  <th className="text-left px-5 py-3.5">Doctor & Specialty</th>
                  <th className="text-left px-5 py-3.5">Quantity Distributed</th>
                  <th className="text-left px-5 py-3.5">Distributed By (MR)</th>
                  <th className="text-left px-5 py-3.5">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-5 bg-slate-100 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : distributionsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700">No sample distributions recorded</p>
                      <p className="text-xs text-slate-400 mt-1">Issue samples directly using the button above</p>
                    </td>
                  </tr>
                ) : (
                  distributionsList.map((dist: any) => (
                    <tr key={dist.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{dist.sampleProduct?.name}</p>
                        <span className="text-[10px] text-slate-400 font-medium">{dist.sampleProduct?.category || 'Standard Sample'}</span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {dist.doctor ? (
                          <div>
                            <p className="text-xs font-bold text-slate-900">Dr. {dist.doctor.firstName} {dist.doctor.lastName}</p>
                            <span className="text-[10px] text-slate-500">{dist.doctor.specialty || 'General Practitioner'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct Sampling</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                          {dist.quantity} units
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700 text-xs">
                        {dist.user ? `${dist.user.firstName} ${dist.user.lastName}` : 'System Admin'}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                        {formatDate(dist.distributedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Sample Products Catalog */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((prod: any) => (
            <div key={prod.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Sample
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{prod.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{prod.category || 'Pharmaceutical'}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Pack Specification</span>
                <span className="font-bold text-slate-700">{prod.packSize || 'Complimentary Trial Pack'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Rep-Wise Sampling */}
      {activeTab === 'rep-allocations' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm">MR Field Sampling Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="text-left px-5 py-3.5">Representative</th>
                  <th className="text-left px-5 py-3.5">Total Sampling Calls</th>
                  <th className="text-left px-5 py-3.5">Total Units Distributed</th>
                  <th className="text-left px-5 py-3.5">Top Distributed Sample Brands</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                      No representative distributions found.
                    </td>
                  </tr>
                ) : (
                  repList.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{r.repName}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{r.callCount} calls</td>
                      <td className="px-5 py-4">
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {r.totalUnits} units
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(r.products).map(([name, qty]: any) => (
                            <span key={name} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {name}: {qty}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Issue Physician Sample</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                distributeMutation.mutate({ ...form, quantity: parseInt(form.quantity) });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={form.doctorId}
                  onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">Select target doctor...</option>
                  {doctors?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sample Medicine SKU *</label>
                <select
                  required
                  value={form.sampleProductId}
                  onChange={(e) => setForm((f) => ({ ...f, sampleProductId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">Select sample brand...</option>
                  {products?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category || 'Pharma'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Units) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Notes / Discussion Feedback</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Physician feedback, batch remarks or compliance note..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={distributeMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-60 shadow-sm"
                >
                  {distributeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
