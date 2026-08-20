'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Gift, Plus, Loader2, X, Power, Tag, Clock, TrendingUp, Users, Percent, Timer, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';

const SCHEME_TYPES = ['cashback', 'free_goods', 'display_incentive', 'loyalty'];
const TYPE_LABELS: Record<string, string> = {
  cashback: 'Cashback', free_goods: 'Free Goods',
  display_incentive: 'Display Incentive', loyalty: 'Loyalty Program',
};
const TYPE_ICONS: Record<string, string> = { cashback: '💰', free_goods: '🎁', display_incentive: '🖼️', loyalty: '⭐' };

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
      {isUrgent && <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] uppercase">Ending soon!</span>}
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
  const isManager = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'MARKETING'].includes(user?.role || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', type: 'cashback',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
    targetRole: 'retailer', minPurchase: '', reward: '',
  });

  const { data: schemes, isLoading } = useQuery({
    queryKey: ['schemes'],
    queryFn: () => api.get('/schemes', { params: { active: 'false' } }).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/schemes', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schemes'] }); setShowAddForm(false); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/schemes/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schemes'] }),
  });

  const filtered = (schemes || []).filter((s: any) => {
    if (filterActive === 'active' && !s.isActive) return false;
    if (filterActive === 'inactive' && s.isActive) return false;
    if (filterType && s.type !== filterType) return false;
    return true;
  });

  const activeCount = (schemes || []).filter((s: any) => s.isActive).length;
  const endingSoon = (schemes || []).filter((s: any) => {
    if (!s.isActive || !s.endDate) return false;
    return (new Date(s.endDate).getTime() - Date.now()) < 3 * 86400000;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-600" /> Trade Promotions & Schemes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage cashback, free goods, display incentives & loyalty programs</p>
        </div>
        {isManager && (
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Create Scheme
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Schemes', value: schemes?.length ?? '—', icon: Tag, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Now', value: activeCount, icon: Power, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ending in 3 Days', value: endingSoon, icon: Timer, color: endingSoon > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400 bg-gray-50' },
          { label: 'For Retailers', value: (schemes || []).filter((s: any) => s.targetRole === 'retailer').length, icon: Users, color: 'text-purple-600 bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[1]} border border-gray-100 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} onClick={() => setFilterActive(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filterActive === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
          ))}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
          <option value="">All Types</option>
          {SCHEME_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} of {schemes?.length ?? 0} schemes</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Gift className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No schemes found</p>
          {isManager && <button onClick={() => setShowAddForm(true)} className="mt-3 text-emerald-600 text-sm font-medium">Create first scheme →</button>}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((scheme: any) => (
            <div key={scheme.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${!scheme.isActive ? 'opacity-70 border-gray-100' : 'border-gray-100 hover:-translate-y-0.5'}`}>
              {/* Top color accent */}
              <div className={`h-1.5 w-full ${scheme.isActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gray-200'}`} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
                      {TYPE_ICONS[scheme.type] || '🎁'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{scheme.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{TYPE_LABELS[scheme.type]} · {scheme.targetRole}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${scheme.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {scheme.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">{scheme.description || 'No description'}</p>

                {/* Reward box */}
                <div className="bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100 rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Min. Purchase</p>
                      <p className="text-sm font-bold text-gray-900">{scheme.minPurchase ? `₹${Number(scheme.minPurchase).toLocaleString()}` : 'No min.'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Reward</p>
                      <p className="text-sm font-bold text-emerald-700">{scheme.reward || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                {scheme.isActive && scheme.endDate && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Ends in</span>
                    <CountdownTimer endDate={scheme.endDate} />
                  </div>
                )}

                {/* Progress bar */}
                {scheme.startDate && scheme.endDate && <SchemeProgress scheme={scheme} />}

                {/* Actions */}
                {isManager && (
                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={() => toggleMutation.mutate(scheme.id)}
                      disabled={toggleMutation.isPending}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${scheme.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                    >
                      <Power className="w-3.5 h-3.5" /> {scheme.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Create Scheme</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scheme Name *</label>
                <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Diwali Cashback Offer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
                    {SCHEME_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
                  <select value={form.targetRole} onChange={(e) => setForm(f => ({ ...f, targetRole: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
                    <option value="retailer">Retailers</option>
                    <option value="distributor">Distributors</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" required value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Purchase (₹)</label>
                  <input type="number" value={form.minPurchase} onChange={(e) => setForm(f => ({ ...f, minPurchase: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Reward</label>
                  <input value={form.reward} onChange={(e) => setForm(f => ({ ...f, reward: e.target.value }))} placeholder="e.g. 5% or 1 Free" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Scheme details and eligibility criteria..." />
              </div>

              {/* Live Preview */}
              {form.name && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Preview</p>
                  <p className="font-bold text-gray-900">{TYPE_ICONS[form.type]} {form.name}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {form.minPurchase ? `Min ₹${Number(form.minPurchase).toLocaleString()} → ` : ''}{form.reward || 'Reward TBD'} · {form.startDate} to {form.endDate}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
