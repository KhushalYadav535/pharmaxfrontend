'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Package, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, Layers, Thermometer, Box, FileText, Image as ImageIcon,
  Shield, Eye, DollarSign, Percent, TrendingUp, CheckCircle2, X
} from 'lucide-react';
import ProductForm from '@/components/masters/ProductForm';
import { useAuth } from '@/lib/auth-context';

export default function ProductMasterPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  // Allow admin and manager roles to create, edit, update prices, and manage products
  const canEdit = ['SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'NSM', 'ZM', 'RSM'].includes(
    user?.role || ''
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () =>
      api.get('/products', { params: { search: search || undefined, page, limit: 15 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (prod: any) => {
    if (!confirm(`Are you sure you want to deactivate product "${prod.name}"?`)) return;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs">
          <ProductForm
            editData={editData ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditData(null);
              qc.invalidateQueries({ queryKey: ['products'] });
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4 pb-20">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" /> Product Master & Commercial Pricing
              </h1>
              {canEdit ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Admin Controls Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <Shield className="w-3 h-3 text-blue-600" /> Read-Only
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Manage formulary SKUs, commercial pricing (MRP, PTR, PTS), packaging, and clinical indications
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                onClick={() => {
                  setEditData(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Product SKU
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-3.5 py-2 rounded-xl border border-gray-200">
                <Shield className="w-3.5 h-3.5" /> Read-Only Access
              </span>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 bg-blue-50 border border-blue-100">
            <p className="text-2xl font-black text-blue-900">{data?.total ?? 0}</p>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">Total Formulations</p>
          </div>
          <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100">
            <p className="text-2xl font-black text-emerald-900">{prods.filter((p) => p.mrp > 0).length}</p>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Priced SKUs</p>
          </div>
          <div className="rounded-2xl p-4 bg-purple-50 border border-purple-100">
            <p className="text-2xl font-black text-purple-900">{prods.filter((p) => p.category).length}</p>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mt-0.5">Categorized</p>
          </div>
          <div className="rounded-2xl p-4 bg-amber-50 border border-amber-100">
            <p className="text-2xl font-black text-amber-900">
              {prods.filter((p) => p.mrp && p.ptr && p.mrp > p.ptr).length}
            </p>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-0.5">Trade Margins Active</p>
          </div>
        </div>

        {/* ── Search & Filter ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by product name, salt composition, code..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Commercial Rates</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Packaging & Storage</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" /> Loading products catalog...
                    </td>
                  </tr>
                ) : prods.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  prods.map((p) => {
                    const numMrp = Number(p.mrp || 0);
                    const numPtr = Number(p.ptr || 0);
                    const numPts = Number(p.pts || 0);
                    const retMargin = numMrp > 0 && numPtr > 0 ? (((numMrp - numPtr) / numMrp) * 100).toFixed(0) : null;

                    return (
                      <tr key={p.id} className={`hover:bg-blue-50/30 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                        {/* Product Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                              {p.productImage ? (
                                <img src={p.productImage} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm leading-tight">{p.name}</p>
                              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                Code: <span className="font-mono font-bold text-blue-600">{p.productCode || 'AUTO'}</span>
                              </p>
                              {p.composition && (
                                <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{p.composition}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Commercial Pricing Column */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900">
                                MRP: ₹{numMrp > 0 ? numMrp.toFixed(2) : '0.00'}
                              </span>
                              {retMargin && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {retMargin}% ret.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                              <span className="font-semibold text-emerald-700">PTR: ₹{numPtr.toFixed(2)}</span>
                              <span className="font-semibold text-indigo-700">PTS: ₹{numPts.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Classification */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {p.category && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg w-max">
                                <Layers className="w-3 h-3 text-gray-400" /> {p.category}
                              </div>
                            )}
                            {p.speciality && (
                              <div className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md w-max">
                                {p.speciality}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Packaging & Storage */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                              <Box className="w-3.5 h-3.5 text-blue-500" />
                              <span>{p.unit || 'Strip'}</span>
                              {p.unitsInPackage && (
                                <span className="text-gray-400 font-normal">({p.unitsInPackage} units/pack)</span>
                              )}
                            </div>
                            {p.storageTemp != null && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                                <Thermometer className="w-3 h-3" /> Storage: {p.storageTemp}°C
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && (
                              <button
                                onClick={() => setEditData(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 shadow-2xs"
                                title="Update Price & Details"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit Price
                              </button>
                            )}

                            <button
                              onClick={() => setViewProduct(p)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                              title="View Full Product Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleDelete(p)}
                                disabled={deleting === p.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                title="Deactivate Product"
                              >
                                {deleting === p.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {data?.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page <span className="font-bold text-gray-900">{page}</span> of{' '}
                <span className="font-bold text-gray-900">{data.totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 text-xs font-bold"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Specification Modal ── */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-base leading-tight">Product Specifications</h3>
                  <span className="text-blue-100 text-xs font-mono">Code: {viewProduct.productCode}</span>
                </div>
              </div>
              <button
                onClick={() => setViewProduct(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {viewProduct.productImage ? (
                    <img src={viewProduct.productImage} alt={viewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-base leading-snug">{viewProduct.name}</h4>
                  {viewProduct.scientificName && (
                    <p className="text-xs text-gray-500 italic mt-0.5">{viewProduct.scientificName}</p>
                  )}
                </div>
              </div>

              {/* Commercial Pricing Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-200 space-y-2">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                  Commercial Price Structure
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">MRP</span>
                    <span className="text-sm font-black text-gray-900">₹{Number(viewProduct.mrp || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-emerald-600 font-bold block uppercase">PTR</span>
                    <span className="text-sm font-black text-emerald-800">₹{Number(viewProduct.ptr || 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase">PTS</span>
                    <span className="text-sm font-black text-indigo-800">₹{Number(viewProduct.pts || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {viewProduct.composition && (
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Salt Composition</p>
                  <p className="text-xs text-gray-800 font-medium leading-relaxed">{viewProduct.composition}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Category</p>
                  <p className="font-bold text-gray-800 mt-0.5">{viewProduct.category || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Speciality</p>
                  <p className="font-bold text-blue-700 mt-0.5">{viewProduct.speciality || 'General'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Packaging Unit</p>
                  <p className="font-bold text-gray-800 mt-0.5">{viewProduct.unit || 'Strip'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Units per Pack</p>
                  <p className="font-bold text-gray-800 mt-0.5">{viewProduct.unitsInPackage || '1'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              {canEdit ? (
                <button
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    setEditData(p);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Price & Details
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setViewProduct(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-colors"
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
