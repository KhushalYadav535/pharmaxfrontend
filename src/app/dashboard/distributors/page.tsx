'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Truck, Plus, Search, X, Loader2, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, AlertTriangle, Building } from 'lucide-react';
import Link from 'next/link';

const EMPTY_FORM = {
  name: '', ownerName: '', phone: '', email: '', address: '',
  city: '', state: '', pincode: '', gstNumber: '', drugLicenseNumber: '',
  warehouseAddress: '', creditLimit: 0, creditDays: 30, outstandingAmount: 0,
};

export default function DistributorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['distributors', search, page],
    queryFn: () => api.get('/distributors', { params: { search, page, limit: 20 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/distributors', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributors'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/distributors/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['distributors'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/distributors/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['distributors'] }),
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); };
  const openEdit = (d: any) => {
    setForm({
      name: d.name || '', ownerName: d.ownerName || '', phone: d.phone || '', email: d.email || '',
      address: d.address || '', city: d.city || '', state: d.state || '', pincode: d.pincode || '',
      gstNumber: d.gstNumber || '', drugLicenseNumber: d.drugLicenseNumber || '',
      warehouseAddress: d.warehouseAddress || '', creditLimit: d.creditLimit || 0,
      creditDays: d.creditDays || 30, outstandingAmount: d.outstandingAmount || 0,
    });
    setEditingId(d.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, creditLimit: Number(form.creditLimit), creditDays: Number(form.creditDays), outstandingAmount: Number(form.outstandingAmount) };
    if (editingId) updateMutation.mutate({ id: editingId, body });
    else createMutation.mutate(body);
  };

  const creditUtilPct = (dist: any) => dist.creditLimit > 0 ? Math.min(100, (dist.outstandingAmount / dist.creditLimit) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" /> Distributors
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your distribution network and credit</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Distributor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Distributors', value: data?.total ?? '—', color: 'bg-blue-50' },
          { label: 'Total Credit Limit', value: `₹${(data?.distributors?.reduce((s: number, d: any) => s + d.creditLimit, 0) || 0).toLocaleString()}`, color: 'bg-emerald-50' },
          { label: 'Outstanding Amount', value: `₹${(data?.distributors?.reduce((s: number, d: any) => s + d.outstandingAmount, 0) || 0).toLocaleString()}`, color: 'bg-amber-50' },
          { label: 'Overdue (>80%)', value: data?.distributors?.filter((d: any) => creditUtilPct(d) >= 80).length ?? 0, color: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} border border-gray-100`}>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search distributors by name, city..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Distributor', 'Contact', 'Location', 'Credit Limit', 'Outstanding', 'Credit Util.', 'Retailers', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.distributors?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No distributors found</p>
                  <button onClick={openCreate} className="text-emerald-600 text-sm font-medium mt-2">Add your first distributor →</button>
                </td></tr>
              ) : (
                data?.distributors?.map((d: any) => {
                  const util = creditUtilPct(d);
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{d.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{d.drugLicenseNumber || 'No license'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs">
                        <div>{d.ownerName || '—'}</div>
                        {d.phone && <div className="text-gray-400">{d.phone}</div>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{[d.city, d.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-4 text-gray-700 font-semibold">₹{d.creditLimit?.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={d.outstandingAmount > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          ₹{d.outstandingAmount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${util >= 80 ? 'bg-red-500' : util >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${util}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${util >= 80 ? 'text-red-600' : 'text-gray-500'}`}>{util.toFixed(0)}%</span>
                          {util >= 80 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-700">{d._count?.retailers ?? 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/distributors/${d.id}`} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="View"><Eye className="w-3.5 h-3.5" /></Link>
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if (confirm('Delete this distributor?')) deleteMutation.mutate(d.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Distributor' : 'Add New Distributor'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Distributor Name *</label>
                    <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Shree Pharma Distributors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name</label>
                    <input value={form.ownerName} onChange={(e) => setForm(f => ({ ...f, ownerName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
                    <input value={form.gstNumber} onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Drug License No.</label>
                    <input value={form.drugLicenseNumber} onChange={(e) => setForm(f => ({ ...f, drugLicenseNumber: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Office Address</label>
                    <input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse Address</label>
                    <input value={form.warehouseAddress} onChange={(e) => setForm(f => ({ ...f, warehouseAddress: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Credit Terms</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                    <input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm(f => ({ ...f, creditLimit: parseFloat(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Credit Days</label>
                    <input type="number" min={0} value={form.creditDays} onChange={(e) => setForm(f => ({ ...f, creditDays: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Outstanding (₹)</label>
                    <input type="number" min={0} value={form.outstandingAmount} onChange={(e) => setForm(f => ({ ...f, outstandingAmount: parseFloat(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingId ? 'Update Distributor' : 'Add Distributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
