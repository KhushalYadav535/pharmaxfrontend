'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Store, Plus, Search, X, Loader2, Phone, MapPin, FileText, Star, Edit2, Trash2, Eye, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['A+', 'A', 'B', 'C'];
const EMPTY_FORM = {
  name: '', ownerName: '', pharmacistName: '', phone: '', email: '',
  address: '', city: '', state: '', pincode: '', gstNumber: '',
  drugLicenseNumber: '', drugLicenseExpiry: '', category: 'B',
  potentialScore: 50, visitFrequency: 2, distributorId: '',
};

export default function RetailersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['retailers', search, page, categoryFilter],
    queryFn: () => api.get('/retailers', { params: { search, page, limit: 20, ...(categoryFilter && { category: categoryFilter }) } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: distributors } = useQuery({
    queryKey: ['distributors-for-select'],
    queryFn: () => api.get('/distributors', { params: { limit: 100 } }).then((r) => r.data.data.distributors),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/retailers', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['retailers'] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/retailers/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['retailers'] }); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/retailers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['retailers'] }),
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setEditingId(null); setShowForm(true); };
  const openEdit = (r: any) => {
    setForm({
      name: r.name || '', ownerName: r.ownerName || '', pharmacistName: r.pharmacistName || '',
      phone: r.phone || '', email: r.email || '', address: r.address || '', city: r.city || '',
      state: r.state || '', pincode: r.pincode || '', gstNumber: r.gstNumber || '',
      drugLicenseNumber: r.drugLicenseNumber || '',
      drugLicenseExpiry: r.drugLicenseExpiry ? r.drugLicenseExpiry.slice(0, 10) : '',
      category: r.category || 'B', potentialScore: r.potentialScore || 50,
      visitFrequency: r.visitFrequency || 2, distributorId: r.distributorId || '',
    });
    setEditingId(r.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, potentialScore: Number(form.potentialScore), visitFrequency: Number(form.visitFrequency) };
    if (editingId) updateMutation.mutate({ id: editingId, body });
    else createMutation.mutate(body);
  };

  const categoryColor: Record<string, string> = {
    'A+': 'bg-purple-50 text-purple-700', A: 'bg-emerald-50 text-emerald-700',
    B: 'bg-blue-50 text-blue-700', C: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" /> Retailers & Pharmacies
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your pharmacy and retail partnerships</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Retailer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Retailers', value: data?.total ?? '—', color: 'bg-blue-50 text-blue-700' },
          { label: 'A+ Category', value: data?.retailers?.filter((r: any) => r.category === 'A+').length ?? 0, color: 'bg-purple-50 text-purple-700' },
          { label: 'A Category', value: data?.retailers?.filter((r: any) => r.category === 'A').length ?? 0, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Active Licenses', value: data?.retailers?.filter((r: any) => r.drugLicenseNumber).length ?? 0, color: 'bg-amber-50 text-amber-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[0]} border border-gray-100`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-xs font-medium mt-0.5 ${s.color.split(' ')[1]}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search retailers, owners..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c} Category</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Retailer', 'Contact', 'Location', 'Category', 'Distributor', 'Drug License', 'Potential', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.retailers?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No retailers found</p>
                  <button onClick={openCreate} className="text-emerald-600 text-sm font-medium mt-2">Add your first retailer →</button>
                </td></tr>
              ) : (
                data?.retailers?.map((ret: any) => (
                  <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{ret.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{ret.pharmacistName ? `Ph: ${ret.pharmacistName}` : 'No pharmacist'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      <div>{ret.ownerName || '—'}</div>
                      {ret.phone && <div className="text-gray-400">{ret.phone}</div>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{[ret.city, ret.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${categoryColor[ret.category] || 'bg-gray-100 text-gray-600'}`}>{ret.category || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{ret.distributor?.name || '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">{ret.drugLicenseNumber || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ret.potentialScore}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{ret.potentialScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link href={`/dashboard/retailers/${ret.id}`} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="View details"><Eye className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => openEdit(ret)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm('Delete this retailer?')) deleteMutation.mutate(ret.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">{editingId ? 'Edit Retailer' : 'Add New Retailer'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Basic Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pharmacy / Store Name *</label>
                    <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. City Pharmacy" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name</label>
                    <input value={form.ownerName} onChange={(e) => setForm(f => ({ ...f, ownerName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Owner name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pharmacist Name</label>
                    <input value={form.pharmacistName} onChange={(e) => setForm(f => ({ ...f, pharmacistName: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Registered pharmacist" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="+91 99999 00000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="store@email.com" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
                    <input required value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Street address" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <input value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label>
                    <input value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="400001" />
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance & Licensing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
                    <input value={form.gstNumber} onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono" placeholder="27AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Drug License No.</label>
                    <input value={form.drugLicenseNumber} onChange={(e) => setForm(f => ({ ...f, drugLicenseNumber: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono" placeholder="MH-BOM-12345" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">License Expiry</label>
                    <input type="date" value={form.drugLicenseExpiry} onChange={(e) => setForm(f => ({ ...f, drugLicenseExpiry: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Classification</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c} Category</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Potential Score (0-100)</label>
                    <input type="number" min={0} max={100} value={form.potentialScore} onChange={(e) => setForm(f => ({ ...f, potentialScore: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Visit Frequency / Month</label>
                    <input type="number" min={1} max={30} value={form.visitFrequency} onChange={(e) => setForm(f => ({ ...f, visitFrequency: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Distributor Mapping</label>
                    <select value={form.distributorId} onChange={(e) => setForm(f => ({ ...f, distributorId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                      <option value="">No distributor mapped</option>
                      {distributors?.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.city}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingId ? 'Update Retailer' : 'Add Retailer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
