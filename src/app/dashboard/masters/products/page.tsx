'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Package, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, Layers, Thermometer, Box, FileText, Image as ImageIcon,
  Shield, Eye
} from 'lucide-react';
import ProductForm from '@/components/masters/ProductForm';
import { useAuth } from '@/lib/auth-context';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProductMasterPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);
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
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" /> Product Master
              </h1>
              {!isSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <Shield className="w-3 h-3 text-blue-600" /> Read-Only
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Browse product catalog, composition, packaging, and commercial specifications
            </p>
          </div>
          {isSuperAdmin ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3.5 py-2 rounded-xl border border-gray-200">
              <Shield className="w-3.5 h-3.5" /> Read-Only Access
            </span>
          )}
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
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Packaging & Storage</th>
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
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                            {p.productImage ? (
                              <img src={p.productImage} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-[15px] leading-tight">{p.name}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Code: <span className="text-blue-600">{p.productCode}</span></p>
                            {p.scientificName && <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1"><FileText className="w-3 h-3"/> {p.scientificName}</p>}
                            {p.composition && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{p.composition}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {p.category && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md w-max">
                              <Layers className="w-3.5 h-3.5 text-gray-400" /> {p.category}
                            </div>
                          )}
                          {p.speciality && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full w-max">
                              {p.speciality}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                            <Box className="w-4 h-4 text-blue-500" /> 
                            <span>{p.unit}</span>
                            {p.unitsInPackage && <span className="text-gray-400 font-normal">({p.unitsInPackage} units/pack)</span>}
                          </div>
                          {p.storageTemp != null && (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium mt-1">
                              <Thermometer className="w-3.5 h-3.5" /> Storage: {p.storageTemp}°C
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditData(p)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={deleting === p.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Deactivate Product"
                            >
                              {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setViewProduct(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        )}
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

      {/* ── Read-Only Product Specification Modal ── */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <h3 className="font-bold text-base">Product Details</h3>
                <span className="bg-white/20 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">Read-Only</span>
              </div>
              <button
                onClick={() => setViewProduct(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {viewProduct.productImage ? (
                    <img src={viewProduct.productImage} alt={viewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg leading-snug">{viewProduct.name}</h4>
                  <p className="text-xs text-blue-600 font-mono font-semibold">Code: {viewProduct.productCode}</p>
                  {viewProduct.scientificName && (
                    <p className="text-xs text-gray-500 italic mt-0.5">{viewProduct.scientificName}</p>
                  )}
                </div>
              </div>

              {viewProduct.composition && (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Composition</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{viewProduct.composition}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 font-medium">Category</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{viewProduct.category || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 font-medium">Speciality</p>
                  <p className="font-semibold text-blue-700 mt-0.5">{viewProduct.speciality || 'General'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 font-medium">Packaging Unit</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{viewProduct.unit || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 font-medium">Units in Pack</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{viewProduct.unitsInPackage || '1'}</p>
                </div>
                {viewProduct.storageTemp != null && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-gray-400 font-medium">Storage Temp</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{viewProduct.storageTemp}°C</p>
                  </div>
                )}
                {viewProduct.mrp != null && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <p className="text-emerald-700 font-medium">MRP</p>
                    <p className="font-bold text-emerald-900 mt-0.5">₹{viewProduct.mrp}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
