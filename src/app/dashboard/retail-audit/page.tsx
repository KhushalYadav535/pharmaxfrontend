'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CheckSquare, Plus, X, Loader2, Star, Store, BarChart2, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';

const scoreColor = (s: number) => s >= 75 ? 'text-emerald-600 bg-emerald-50' : s >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
const scoreBar = (s: number) => s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';

const PRODUCTS = ['Amoxil', 'Paracip', 'Calpol', 'Augmentin', 'Azithral', 'Pantop', 'Ecosprin', 'Clopilet'];

const EMPTY_FORM = {
  retailerId: '', auditDate: new Date().toISOString().slice(0, 10),
  shelfSharePercent: 20, productPlacement: 3,
  priceCompliance: false, competitorVisibility: false, displayCompliance: false,
  stockAvailability: [] as string[], outOfStock: [] as string[],
  competitorSchemes: '', notes: '',
};

export default function RetailAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [viewAudit, setViewAudit] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['retail-audits', page, search],
    queryFn: () => api.get('/retail-audit', { params: { page, limit: 15 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: statsData } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => api.get('/retail-audit/stats/summary').then((r) => r.data.data),
  });

  const { data: retailers } = useQuery({
    queryKey: ['retailers-for-audit'],
    queryFn: () => api.get('/retailers', { params: { limit: 100 } }).then((r) => r.data.data.retailers),
    enabled: showForm,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/retail-audit', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail-audits'] });
      qc.invalidateQueries({ queryKey: ['audit-stats'] });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  const toggleProduct = (list: string[], product: string) =>
    list.includes(product) ? list.filter((p) => p !== product) : [...list, product];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  // Estimate score for form preview
  const previewScore = () => {
    let s = 0;
    if (form.shelfSharePercent >= 30) s += 25;
    else if (form.shelfSharePercent >= 15) s += 15;
    if (form.productPlacement >= 4) s += 20;
    else if (form.productPlacement >= 3) s += 12;
    if (form.priceCompliance) s += 20;
    if (form.displayCompliance) s += 20;
    if (!form.competitorVisibility) s += 15;
    return s;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" /> Retail Audit
          </h1>
          <p className="text-gray-500 text-sm mt-1">Shelf share, display compliance, price check & photo audits</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Audit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Audits', value: statsData?.totalAudits ?? '—', icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
          { label: 'Avg. Score', value: statsData?.avgScore ? `${Math.round(statsData.avgScore)}/100` : '—', icon: BarChart2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'This Month', value: data?.audits?.length ?? '—', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Low Scores (<50)', value: data?.audits?.filter((a: any) => a.totalScore < 50).length ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
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

      {/* Audit List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Audit History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Retailer', 'Auditor', 'Date', 'Shelf Share', 'Placement', 'Price ✓', 'Display ✓', 'Score', 'Action'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.audits?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No audits conducted yet</p>
                  <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Conduct first audit →</button>
                </td></tr>
              ) : (
                data?.audits?.map((audit: any) => (
                  <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{audit.retailer?.name}</p>
                        <p className="text-xs text-gray-400">{audit.retailer?.city}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{audit.user?.firstName} {audit.user?.lastName}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(audit.auditDate)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${audit.shelfSharePercent || 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{audit.shelfSharePercent ?? '—'}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (audit.productPlacement || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${audit.priceCompliance ? 'text-emerald-600' : 'text-red-500'}`}>{audit.priceCompliance ? '✓' : '✗'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${audit.displayCompliance ? 'text-emerald-600' : 'text-red-500'}`}>{audit.displayCompliance ? '✓' : '✗'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${scoreColor(audit.totalScore)}`}>{audit.totalScore}/100</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setViewAudit(audit)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><Eye className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">← Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* New Audit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">New Retail Audit</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Retailer & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Retailer *</label>
                  <select required value={form.retailerId} onChange={(e) => setForm(f => ({ ...f, retailerId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Choose retailer...</option>
                    {retailers?.map((r: any) => <option key={r.id} value={r.id}>{r.name} — {r.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Audit Date</label>
                  <input type="date" value={form.auditDate} onChange={(e) => setForm(f => ({ ...f, auditDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>

              {/* Shelf Share */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shelf & Visibility</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label className="font-medium text-gray-700">Shelf Share %</label>
                      <span className="font-bold text-emerald-600">{form.shelfSharePercent}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={form.shelfSharePercent} onChange={(e) => setForm(f => ({ ...f, shelfSharePercent: parseInt(e.target.value) }))} className="w-full accent-emerald-600" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Product Placement Quality</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button key={rating} type="button" onClick={() => setForm(f => ({ ...f, productPlacement: rating }))} className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${form.productPlacement >= rating ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                          {'★'.repeat(rating)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Checkboxes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compliance Checks</h3>
                <div className="space-y-3">
                  {[
                    { key: 'priceCompliance', label: 'Price Compliance', desc: 'All products priced as per MRP' },
                    { key: 'displayCompliance', label: 'Display Compliance', desc: 'Brand display standards followed' },
                    { key: 'competitorVisibility', label: 'Competitor Visible', desc: 'Check if competitor brands are prominently displayed (negative)' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${(form as any)[key] ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))} className="mt-0.5 w-4 h-4 text-emerald-600 rounded" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stock Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Products In Stock</label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCTS.map((p) => (
                        <button key={p} type="button" onClick={() => setForm(f => ({ ...f, stockAvailability: toggleProduct(f.stockAvailability, p) }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.stockAvailability.includes(p) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Out of Stock</label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCTS.map((p) => (
                        <button key={p} type="button" onClick={() => setForm(f => ({ ...f, outOfStock: toggleProduct(f.outOfStock, p) }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.outOfStock.includes(p) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Competitor & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Competitor Schemes Visible</label>
                  <input value={form.competitorSchemes} onChange={(e) => setForm(f => ({ ...f, competitorSchemes: e.target.value }))} placeholder="e.g. Cipla offering 10+2 on Aerocort" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Any other observations..." />
                </div>
              </div>

              {/* Score Preview */}
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Estimated Audit Score</p>
                  <p className="text-xs text-gray-400 mt-0.5">Based on current selections</p>
                </div>
                <div className={`text-3xl font-black ${previewScore() >= 75 ? 'text-emerald-600' : previewScore() >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {previewScore()}/100
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Submit Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Audit Detail Modal */}
      {viewAudit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Audit Details</h2>
              <button onClick={() => setViewAudit(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{viewAudit.retailer?.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(viewAudit.auditDate)} · {viewAudit.user?.firstName} {viewAudit.user?.lastName}</p>
                </div>
                <span className={`text-2xl font-black ${scoreColor(viewAudit.totalScore).split(' ')[0]}`}>{viewAudit.totalScore}/100</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${scoreBar(viewAudit.totalScore)}`} style={{ width: `${viewAudit.totalScore}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Shelf Share', value: `${viewAudit.shelfSharePercent ?? '—'}%` },
                  { label: 'Product Placement', value: '★'.repeat(viewAudit.productPlacement || 0) },
                  { label: 'Price Compliance', value: viewAudit.priceCompliance ? '✓ Yes' : '✗ No' },
                  { label: 'Display Compliance', value: viewAudit.displayCompliance ? '✓ Yes' : '✗ No' },
                  { label: 'Competitor Visible', value: viewAudit.competitorVisibility ? '⚠ Yes' : '✓ No' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {viewAudit.stockAvailability?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">In Stock</p>
                  <div className="flex flex-wrap gap-1.5">{viewAudit.stockAvailability.map((p: string) => <span key={p} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">{p}</span>)}</div>
                </div>
              )}
              {viewAudit.outOfStock?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Out of Stock</p>
                  <div className="flex flex-wrap gap-1.5">{viewAudit.outOfStock.map((p: string) => <span key={p} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{p}</span>)}</div>
                </div>
              )}
              {viewAudit.competitorSchemes && (
                <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-800">
                  <p className="text-xs font-semibold text-amber-600 mb-1">Competitor Schemes</p>
                  {viewAudit.competitorSchemes}
                </div>
              )}
              {viewAudit.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewAudit.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
