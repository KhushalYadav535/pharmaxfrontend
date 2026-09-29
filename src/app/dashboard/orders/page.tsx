'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ShoppingCart, Plus, Loader2, Pencil, Trash2, Calendar, ChevronDown, ChevronUp, Store, Truck, Package, CheckCircle, Clock, Truck as DeliveryTruck, XCircle } from 'lucide-react';
import OrderForm from '@/components/operations/OrderForm';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function OrdersPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => api.get('/orders', { 
      params: { 
        page, 
        limit: 15,
        status: statusFilter || undefined
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      setProcessing(item.id);
      await api.delete(`/orders/${item.id}`);
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete order');
    } finally {
      setProcessing(null);
    }
  };

  const handleStatusUpdate = async (item: any, newStatus: string) => {
    try {
      setProcessing(item.id + newStatus);
      await api.patch(`/orders/${item.id}/status`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const orders = data?.orders ?? [];
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
      case 'CONFIRMED': return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700"><CheckCircle className="w-3 h-3" /> Confirmed</span>;
      case 'SHIPPED': return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700"><DeliveryTruck className="w-3 h-3" /> Shipped</span>;
      case 'DELIVERED': return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Delivered</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default: return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">Draft</span>;
    }
  };

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <OrderForm onClose={() => setShowForm(false)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" /> Order Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Create and manage product orders from Retailers and Distributors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/orders/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Book New Order
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />No orders found.</td></tr>
                ) : (
                  orders.map((o: any) => (
                    <React.Fragment key={o.id}>
                      <tr className={`hover:bg-blue-50/20 transition-colors cursor-pointer ${expandedRow === o.id ? 'bg-blue-50/30' : ''}`} onClick={() => toggleRow(o.id)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {expandedRow === o.id ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            <div>
                              <Link
                                href={`/dashboard/orders/${o.id}`}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                              >
                                <span>{o.orderNumber || `ORD-${o.id.slice(-6)}`}</span>
                              </Link>
                              <p className="text-[10px] text-gray-500">By: {o.user?.firstName} {o.user?.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            {o.retailerId ? <Store className="w-3.5 h-3.5 text-blue-600" /> : <Truck className="w-3.5 h-3.5 text-indigo-600" />}
                            <span className="font-bold text-gray-900 text-xs">
                              {o.retailerId ? o.retailer?.name : o.distributor?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(o.orderDate).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-gray-900 text-sm">₹{o.totalAmount.toFixed(2)}</p>
                          {o.discount > 0 && <p className="text-[10px] text-green-600 font-semibold">Disc: ₹{o.discount}</p>}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(o.status)}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            
                            <Link
                              href={`/dashboard/orders/${o.id}`}
                              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Invoice
                            </Link>

                            {/* Status Change for Admins/Managers */}
                            {isAdminOrManager ? (
                              <select
                                value={o.status}
                                onChange={(e) => handleStatusUpdate(o, e.target.value)}
                                disabled={processing?.startsWith(o.id)}
                                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            ) : null}

                            <button onClick={() => handleDelete(o)} disabled={processing === o.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                              {processing === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {expandedRow === o.id && (
                        <tr>
                          <td colSpan={6} className="p-0 border-b border-gray-100">
                            <div className="bg-gray-50/80 px-14 py-4 border-l-4 border-blue-500">
                              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Order Items ({o.items?.length || 0})</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {o.items?.map((item: any) => (
                                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded text-blue-600 shrink-0"><Package className="w-4 h-4" /></div>
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-gray-900 truncate">{item.product?.name}</p>
                                      <p className="text-[10px] text-gray-500 font-medium">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                                      {item.productScheme && <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{item.productScheme}</span>}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-black text-gray-900">₹{item.totalPrice}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {o.notes && (
                                <div className="mt-4 text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-200">
                                  <strong>Notes:</strong> {o.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
