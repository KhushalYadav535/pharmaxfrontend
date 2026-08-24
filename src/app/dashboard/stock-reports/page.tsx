'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Package, Plus, Loader2, Pencil, Trash2, Store, Calendar, ArrowRight } from 'lucide-react';
import StockReportForm from '@/components/operations/StockReportForm';

export default function StockReportsPage() {
  const qc = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-reports', page, typeFilter],
    queryFn: () => api.get('/stock-reports', { 
      params: { 
        page, 
        limit: 15,
        entityType: typeFilter || undefined
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this stock report?')) return;
    try {
      setDeleting(item.id);
      await api.delete(`/stock-reports/${item.id}`);
      qc.invalidateQueries({ queryKey: ['stock-reports'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete report');
    } finally {
      setDeleting(null);
    }
  };

  const reports = data?.reports ?? [];

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <StockReportForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-violet-600" /> Stock Reporting
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track and manage product inventory at Stockist and Retailer level.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Stock Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Entity:</span>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50">
              <option value="">All Entities</option>
              <option value="STOCKIST">Stockists</option>
              <option value="RETAILER">Retailers</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Entity & Product</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-4 py-4 text-center text-gray-600">Opening (Q/V)</th>
                  <th className="px-4 py-4 text-center text-emerald-600">Receipt (Q/V)</th>
                  <th className="px-4 py-4 text-center text-orange-600">Issue (Q/V)</th>
                  <th className="px-4 py-4 text-center text-violet-600">Closing (Q/V)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-500" />Loading reports...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400"><Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />No stock reports found.</td></tr>
                ) : (
                  reports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-violet-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {r.stockistId ? <Package className="w-3.5 h-3.5 text-blue-600" /> : <Store className="w-3.5 h-3.5 text-orange-600" />}
                          <span className="font-bold text-gray-900 text-xs">
                            {r.stockistId ? r.stockist?.name : r.retailer?.name}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{r.product?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.reportFromDate).toLocaleDateString('en-GB')}
                          <ArrowRight className="w-3 h-3 text-gray-300 mx-0.5" />
                          {new Date(r.reportToDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      
                      {/* Metric columns */}
                      <td className="px-4 py-4 text-center">
                        <p className="font-bold text-gray-700">{r.openingQty}</p>
                        <p className="text-[10px] text-gray-500">₹{r.openingValue}</p>
                      </td>
                      <td className="px-4 py-4 text-center bg-emerald-50/30">
                        <p className="font-bold text-emerald-700">{r.receiptQty}</p>
                        <p className="text-[10px] text-emerald-600/70">₹{r.receiptValue}</p>
                      </td>
                      <td className="px-4 py-4 text-center bg-orange-50/30">
                        <p className="font-bold text-orange-700">{r.issueQty}</p>
                        <p className="text-[10px] text-orange-600/70">₹{r.issueValue}</p>
                      </td>
                      <td className="px-4 py-4 text-center bg-violet-50/50">
                        <p className="font-bold text-violet-700">{r.closingQty}</p>
                        <p className="text-[10px] text-violet-600/70">₹{r.closingValue}</p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditData(r)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r)} disabled={deleting === r.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
