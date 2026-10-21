'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Gift, Plus, Loader2, X, Power, Tag, Clock, TrendingUp, 
  Users, Percent, Timer, AlertTriangle, Edit3, Trash2, CheckCircle2,
  Package, Search, Sparkles, Filter, ChevronRight, Layers, ArrowUpRight
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const SCHEME_TYPES = [
  { id: 'free_goods', label: '10+1 Free Goods / Bonus', icon: '🎁', desc: 'Buy X units get Y free complimentary' },
  { id: 'discount', label: 'Trade Discount %', icon: '🏷️', desc: 'Percentage invoice discount on billing' },
  { id: 'cashback', label: 'Cashback / Credit Note', icon: '💰', desc: 'Direct credit note incentive for chemists' },
  { id: 'display_incentive', label: 'Display Incentive', icon: '🖼️', desc: 'Counter and shelf merchandising bonus' },
  { id: 'loyalty', label: 'Quarterly Loyalty Program', icon: '⭐', desc: 'Volume tier quarterly bonus' },
];

const TYPE_LABELS: Record<string, string> = {
  free_goods: 'Free Goods (10+1)',
  discount: 'Trade Discount',
  cashback: 'Cashback',
  display_incentive: 'Display Incentive',
  loyalty: 'Loyalty Program',
};

const TYPE_ICONS: Record<string, string> = {
  free_goods: '🎁',
  discount: '🏷️',
  cashback: '💰',
  display_incentive: '🖼️',
  loyalty: '⭐'
};

const QUICK_TEMPLATES = [
  { name: '10+1 Free Goods Offer', type: 'free_goods', minPurchase: 10, reward: '10+1 Free Goods (1 Unit Free)' },
  { name: '20+2 Mega Bonus Deal', type: 'free_goods', minPurchase: 20, reward: '20+2 Free Goods (2 Units Free)' },
  { name: '50+6 Stockist Bulk Scheme', type: 'free_goods', minPurchase: 50, reward: '50+6 Free Goods (6 Units Free)' },
  { name: '5% Prompt Payment Discount', type: 'discount', minPurchase: 5000, reward: '5% Instant Cash Discount' },
  { name: '10% Monsoon Volume Rebate', type: 'cashback', minPurchase: 10000, reward: '10% Quarterly Credit Note' },
];

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, mins: 0, expired: true }); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, mins, expired: false });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [endDate]);

  if (timeLeft.expired) return <span className="text-xs text-red-500 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expired</span>;
  const isUrgent = timeLeft.days <= 3;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
      <Timer className={`w-3 h-3 ${isUrgent ? 'animate-pulse' : ''}`} />
      {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
      <span>{timeLeft.hours}h</span>
      <span>{timeLeft.mins}m</span>
      {isUrgent && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] uppercase font-bold">Ending soon!</span>}
    </div>
  );
}

function SchemeProgress({ scheme }: { scheme: any }) {
  const start = new Date(scheme.startDate).getTime();
  const end = new Date(scheme.endDate).getTime();
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{formatDate(scheme.startDate)}</span>
        <span>{Math.round(pct)}% elapsed</span>
        <span>{formatDate(scheme.endDate)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SchemesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isManager = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'MARKETING'].includes(user?.role || '');

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState = {
    name: '',
    description: '',
    type: 'free_goods',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    targetRole: 'ALL',
    minPurchase: '10',
    reward: '10+1 Free Goods (1 Unit Free)',
    isActive: true,
  };

  const [form, setForm] = useState(initialFormState);

  // Queries
  const { data: schemes, isLoading } = useQuery({
    queryKey: ['schemes'],
    queryFn: () => api.get('/schemes', { params: { active: 'false' } }).then((r) => r.data.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products', { params: { limit: 200 } }).then(r => r.data.data?.products || []),
  });
  const products: any[] = productsData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/schemes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schemes'] });
      setModalOpen(false);
      setForm(initialFormState);
      alert('Trade Scheme created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create scheme');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/schemes/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schemes'] });
      setModalOpen(false);
      setEditingId(null);
      setForm(initialFormState);
      alert('Trade Scheme updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update scheme');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schemes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schemes'] });
      alert('Trade Scheme deleted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete scheme');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/schemes/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schemes'] }),
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const handleOpenEdit = (scheme: any) => {
    setEditingId(scheme.id);
    setForm({
      name: scheme.name || '',
      description: scheme.description || '',
      type: scheme.type || 'free_goods',
      startDate: scheme.startDate ? new Date(scheme.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate: scheme.endDate ? new Date(scheme.endDate).toISOString().slice(0, 10) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      targetRole: scheme.targetRole || 'ALL',
      minPurchase: scheme.minPurchase ? String(scheme.minPurchase) : '10',
      reward: scheme.reward || '',
      isActive: scheme.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleDelete = (scheme: any) => {
    if (confirm(`Are you sure you want to permanently delete scheme "${scheme.name}"?\nThis action cannot be undone.`)) {
      deleteMutation.mutate(scheme.id);
    }
  };

  const handleApplyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setForm(f => ({
      ...f,
      name: tpl.name,
      type: tpl.type,
      minPurchase: String(tpl.minPurchase),
      reward: tpl.reward,
    }));
  };

  const handleSelectProduct = (product: any) => {
    if (!product) return;
    setForm(f => ({
      ...f,
      name: `${product.name} - 10+1 Trade Scheme`,
      description: `Buy 10 units of ${product.name} and receive 1 unit complimentary. Valid for trade pharmacies & stockists.`,
      reward: `10+1 Free Goods (${product.name})`,
      minPurchase: '10',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Scheme name is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // Filtered List
  const schemesList: any[] = schemes || [];
  const filtered = schemesList.filter((s: any) => {
    if (filterActive === 'active' && !s.isActive) return false;
    if (filterActive === 'inactive' && s.isActive) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const n = (s.name || '').toLowerCase();
      const d = (s.description || '').toLowerCase();
      const r = (s.reward || '').toLowerCase();
      return n.includes(q) || d.includes(q) || r.includes(q);
    }
    return true;
  });

  const activeCount = schemesList.filter((s: any) => s.isActive).length;
  const freeGoodsCount = schemesList.filter((s: any) => s.type === 'free_goods' && s.isActive).length;
  const endingSoon = schemesList.filter((s: any) => {
    if (!s.isActive || !s.endDate) return false;
    return (new Date(s.endDate).getTime() - Date.now()) < 7 * 86400000;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-7 h-7 text-emerald-600" /> Commercial Trade Schemes & Offers
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Full Admin Control
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Create, customize, edit, and delete trade promotions (10+1 free goods, volume discounts, cash rebates)
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Trade Scheme
            </button>
          </div>
        )}
      </div>

      {/* ── 4 KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4 bg-blue-50/70 border border-blue-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{schemesList.length}</p>
            <p className="text-xs font-medium text-slate-500">Total Schemes</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{activeCount}</p>
            <p className="text-xs font-medium text-slate-500">Active in Field</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-purple-50/70 border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{freeGoodsCount}</p>
            <p className="text-xs font-medium text-slate-500">10+1 Free Goods</p>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-amber-50/70 border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{endingSoon}</p>
            <p className="text-xs font-medium text-slate-500">Ending in 7 Days</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scheme name, reward, or product..."
            className="bg-transparent text-xs text-slate-900 font-medium focus:outline-none flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterActive === f ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none bg-white text-slate-800"
          >
            <option value="all">All Types</option>
            {SCHEME_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>

          <span className="text-xs font-bold text-slate-400">
            {filtered.length} of {schemesList.length} Schemes
          </span>
        </div>
      </div>

      {/* ── SCHEMES GRID ── */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Gift className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-900">No Trade Schemes Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search ? `No schemes match query "${search}". Try clearing search.` : 'Create promotional 10+1 free goods or discount slabs for field reps to use.'}
          </p>
          {isManager && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              + Create First Scheme
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((scheme: any) => (
            <div
              key={scheme.id}
              className={`bg-white rounded-3xl border shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${
                !scheme.isActive ? 'opacity-70 border-slate-200' : 'border-slate-200 hover:-translate-y-0.5'
              }`}
            >
              {/* Top Accent Stripe */}
              <div
                className={`h-1.5 w-full ${
                  scheme.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'
                }`}
              />

              <div className="p-5 flex-1">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0 border border-emerald-100">
                      {TYPE_ICONS[scheme.type] || '🎁'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{scheme.name}</h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {TYPE_LABELS[scheme.type] || scheme.type} • Target: {scheme.targetRole || 'All'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md flex-shrink-0 ${
                      scheme.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {scheme.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2 min-h-[32px]">
                  {scheme.description || 'Standard pharmaceutical trade scheme applicable on secondary bookings.'}
                </p>

                {/* Reward & Criteria Box */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Min. Order Qty</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {scheme.minPurchase ? `${scheme.minPurchase} Units` : 'No Minimum'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Scheme Offer / Bonus</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        {scheme.reward || '10+1 Free'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                {scheme.isActive && scheme.endDate && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400 font-medium">Validity Ends:</span>
                    <CountdownTimer endDate={scheme.endDate} />
                  </div>
                )}

                {/* Progress Bar */}
                {scheme.startDate && scheme.endDate && <SchemeProgress scheme={scheme} />}
              </div>

              {/* Action Buttons Row */}
              {isManager && (
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleMutation.mutate(scheme.id)}
                    disabled={toggleMutation.isPending}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      scheme.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3 h-3" /> {scheme.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(scheme)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Scheme"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(scheme)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Scheme"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ADD / EDIT SCHEME MODAL (FULL CUSTOMIZATION) ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">
                    {editingId ? 'Edit Trade Scheme' : 'Customize New Trade Scheme'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure free bonus units, minimum purchase slabs, and validity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Quick Template Selector (only in Add Mode) */}
              {!editingId && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Quick Preset Templates (Tap to autofill):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                      >
                        ⚡ {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Association Helper */}
              {products.length > 0 && (
                <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">Link Specific Product Formulary SKU (Optional):</span>
                  </div>
                  <select
                    onChange={(e) => {
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) handleSelectProduct(p);
                    }}
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white text-slate-800 focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select Medicine to auto-generate Scheme Title & Reward --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (PTR: ₹{p.ptr || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scheme Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheme Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. PNCROS 40 - 10+1 Trade Scheme"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Scheme Type & Target Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none bg-white text-slate-800"
                  >
                    {SCHEME_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Account Role</label>
                  <select
                    value={form.targetRole}
                    onChange={(e) => setForm(f => ({ ...f, targetRole: e.target.value }))}
                    className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none bg-white text-slate-800"
                  >
                    <option value="ALL">All Trade Accounts (Chemists & Stockists)</option>
                    <option value="retailer">Retail Chemists Only</option>
                    <option value="distributor">Stockists / Distributors Only</option>
                  </select>
                </div>
              </div>

              {/* Min Purchase Qty & Scheme Reward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Purchase Quantity (Threshold Units)
                  </label>
                  <input
                    type="number"
                    value={form.minPurchase}
                    onChange={(e) => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Trigger for MR mobile app auto-suggestion
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheme Reward / Free Unit Benefit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={form.reward}
                    onChange={(e) => setForm(f => ({ ...f, reward: e.target.value }))}
                    placeholder="e.g. 10+1 Free Goods (1 Unit Free) or 10% Off"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Appears directly on the MR order line item
                  </span>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Terms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Notes & Terms</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Details for medical reps and stockists..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="schemeActiveCheckbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="schemeActiveCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Activate Scheme Immediately in Mobile App for Reps
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingId ? 'Save Scheme Changes' : 'Publish Trade Scheme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
