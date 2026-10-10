'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const [showAddProductModal, setShowAddProductModal] = useState(false);
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

  const { data: repAllocationsData, isLoading: isRepLoading } = useQuery({
    queryKey: ['sample-rep-allocations'],
    queryFn: () => api.get('/samples/rep-allocations').then((r) => r.data.data || []),
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data.data?.doctors || []),
  });

  const [form, setForm] = useState({ doctorId: '', sampleProductId: '', quantity: '1', notes: '' });
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    code: '',
    packSize: '1x10 Tablets',
    category: 'Tablets',
    batchNumber: '',
    expiryDate: '',
    openingBalance: '100',
  });

  const distributeMutation = useMutation({
    mutationFn: (body: any) => api.post('/samples/distribute', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sample-distributions'] });
      qc.invalidateQueries({ queryKey: ['sample-stats'] });
      qc.invalidateQueries({ queryKey: ['sample-rep-allocations'] });
      setShowForm(false);
      setForm({ doctorId: '', sampleProductId: '', quantity: '1', notes: '' });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (body: any) => api.post('/samples/products', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sample-products'] });
      qc.invalidateQueries({ queryKey: ['sample-rep-allocations'] });
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        code: '',
        packSize: '1x10 Tablets',
        category: 'Tablets',
        batchNumber: '',
        expiryDate: '',
        openingBalance: '100',
      });
    },
  });

  const distributionsList = data?.distributions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" /> Physician Samples & Bag Stock Ledger
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Audit physician sample inventories, doctor distribution compliance, and MR allocations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4 text-slate-500" /> Add Sample SKU
          </button>
          <button
            onClick={() => setShowForm(true)}
            id="distribute-sample-btn"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Issue Sample to Doctor
          </button>
        </div>
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Physician trial batches and active promotional medicines</p>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" /> New Sample SKU
            </button>
          </div>
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-medium">{prod.category || 'Pharmaceutical'}</span>
                    {prod.code && <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SKU: {prod.code}</span>}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Pack Specification</span>
                    <span className="font-bold text-slate-700">{prod.packSize || 'Complimentary Trial Pack'}</span>
                  </div>
                  {prod.batchNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Batch Number</span>
                      <span className="font-mono text-slate-700 font-semibold">{prod.batchNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Warehouse Balance</span>
                    <span className="font-black text-emerald-700">{prod.currentBalance ?? prod.openingBalance ?? 0} units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Rep Bag Allocations & Field Stock Ledger */}
      {activeTab === 'rep-allocations' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">MR Field Bag Stock & Allocation Ledger</h2>
              <p className="text-xs text-slate-400 mt-0.5">Monthly rep bag quota, distributed sample units, and remaining carrying balance</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 self-start sm:self-auto">
              {repAllocationsData?.length || 0} Field Representatives
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="text-left px-5 py-3.5">MR Name & HQ</th>
                  <th className="text-left px-5 py-3.5">Distributed to Doctors</th>
                  <th className="text-left px-5 py-3.5">Sample Bag Stock & SKU Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isRepLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                    </td>
                  </tr>
                ) : !repAllocationsData || repAllocationsData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-slate-400 text-xs">
                      No medical representative allocations recorded.
                    </td>
                  </tr>
                ) : (
                  repAllocationsData.map((rep: any) => (
                    <tr key={rep.repId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{rep.repName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>HQ: {rep.hqName}</span>
                          {rep.employeeId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">ID: {rep.employeeId}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                          {rep.totalDistributed} units given
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {rep.products?.map((p: any) => (
                            <div key={p.productId} className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 space-y-1">
                              <p className="font-bold text-slate-800 text-xs truncate">{p.productName}</p>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Quota: {p.quota}</span>
                                <span className="text-slate-600 font-medium">Given: {p.distributed}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[11px]">
                                <span className="text-slate-500 font-semibold">In Bag:</span>
                                <span className={`font-black ${p.bagBalance < 10 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                  {p.bagBalance} units
                                </span>
                              </div>
                            </div>
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

      {/* Add Sample Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" /> Add Sample SKU / Gift
              </h2>
              <button onClick={() => setShowAddProductModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProductMutation.mutate({
                  ...newProductForm,
                  openingBalance: parseInt(newProductForm.openingBalance) || 0,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Paracetamol 650mg Trial"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SMP-001"
                    value={newProductForm.code}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, code: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Syrups">Syrups</option>
                    <option value="Injections">Injections</option>
                    <option value="Ointments">Ointments</option>
                    <option value="Doctor Gift">Doctor Gift / Promo Item</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 1x10 Strip"
                    value={newProductForm.packSize}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, packSize: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BTH-9821"
                    value={newProductForm.batchNumber}
                    onChange={(e) => setNewProductForm((f) => ({ ...f, batchNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opening Stock (Units)</label>
                <input
                  type="number"
                  min={0}
                  value={newProductForm.openingBalance}
                  onChange={(e) => setNewProductForm((f) => ({ ...f, openingBalance: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-60 shadow-sm"
                >
                  {createProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Sample SKU'}
                </button>
              </div>
            </form>
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
