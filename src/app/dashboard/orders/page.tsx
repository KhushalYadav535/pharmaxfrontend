'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatCurrency, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import { ShoppingCart, Plus, Loader2, X, Package, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-amber-50 text-amber-700',
  DISPATCHED: 'bg-violet-50 text-violet-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, page],
    queryFn: () => api.get('/orders', { params: { status: statusFilter || undefined, page, limit: 15 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: retailers } = useQuery({
    queryKey: ['retailers-list'],
    queryFn: () => api.get('/retailers', { params: { limit: 100 } }).then((r) => r.data.data?.retailers || []),
  });

  const [form, setForm] = useState({ retailerId: '', notes: '', items: [{ productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }] });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/orders', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); setShowForm(false); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const updateItem = (i: number, field: string, value: any) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      items[i].totalPrice = items[i].quantity * items[i].unitPrice;
    }
    setForm((f) => ({ ...f, items }));
  };

  const totalAmount = form.items.reduce((s, i) => s + i.totalPrice, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" /> Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage retailer and distributor orders</p>
        </div>
        <button onClick={() => setShowForm(true)} id="create-order-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'SUBMITTED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Order', 'Retailer', 'Items', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.orders?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No orders found</p>
                  <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Create your first order →</button>
                </td></tr>
              ) : data?.orders?.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">#{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">{order.retailer?.name || order.distributor?.name || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600'}`}>{order.status}</span></td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4">
                    {order.status === 'SUBMITTED' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'PROCESSING' })} disabled={updateStatusMutation.isPending} className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        Process
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'DISPATCHED' })} disabled={updateStatusMutation.isPending} className="text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        Dispatch
                      </button>
                    )}
                    {order.status === 'DISPATCHED' && (
                      <button onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'DELIVERED' })} disabled={updateStatusMutation.isPending} className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <CheckCircle className="w-3 h-3" /> Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">Create New Order</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, status: 'SUBMITTED' }); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Retailer</label>
                <select required value={form.retailerId} onChange={(e) => setForm(f => ({ ...f, retailerId: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  <option value="">Select retailer...</option>
                  {retailers?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-gray-700">Order Items</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }] }))} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2">
                        <input value={item.productName} onChange={(e) => updateItem(i, 'productName', e.target.value)} placeholder="Product name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      </div>
                      <div>
                        <input type="number" value={item.quantity} min={1} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))} placeholder="Qty" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      </div>
                      <div>
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value))} placeholder="Price" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700">{formatCurrency(item.totalPrice)}</span>
                        {form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <p className="text-sm font-bold text-gray-900">Total: {formatCurrency(totalAmount)}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Placing...</> : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
