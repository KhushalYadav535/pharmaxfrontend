'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Package, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, Layers, DollarSign,
} from 'lucide-react';
import ProductForm from '@/components/masters/ProductForm';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductMasterPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () =>
      api.get('/products', { params: { search: search || undefined, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (prod: any) => {
    if (!confirm(`Deactivate product "${prod.name}"?`)) return;
    try {
      setDeleting(prod.id);
      await api.delete(`/products/${prod.id}`);
      qc.invalidateQueries({ queryKey: ['products'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const prods: any[] = data?.products ?? [];

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <ProductForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" /> Product Master
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage product catalog, compositions, and pricing
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: data?.total ?? 0, color: 'bg-blue-50 text-blue-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color.split(' ')[0]} border border-gray-100`}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs font-medium mt-0.5 ${s.color.split(' ')[1]}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, code..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Pricing</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading...
                    </td>
                  </tr>
                ) : prods.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No products found.</td>
                  </tr>
                ) : (
                  prods.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500 font-medium">Code: {p.productCode}</p>
                            {p.composition && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{p.composition}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {p.category && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Layers className="w-3.5 h-3.5 text-gray-400" /> {p.category}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">{p.unit}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <p className="text-gray-500">PTS: <span className="font-semibold text-gray-900">₹{p.pts?.toFixed(2)}</span></p>
                          <p className="text-gray-500">PTR: <span className="font-semibold text-gray-900">₹{p.ptr?.toFixed(2)}</span></p>
                          <p className="text-gray-500">MRP: <span className="font-bold text-blue-600">₹{p.mrp?.toFixed(2)}</span></p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditData(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deleting === p.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data?.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{data.totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
