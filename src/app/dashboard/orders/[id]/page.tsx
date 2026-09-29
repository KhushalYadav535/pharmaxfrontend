'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingCart, ArrowLeft, Store, Truck, Calendar,
  CheckCircle, Clock, XCircle, Package, Receipt,
  UserCheck, MapPin, Phone, ShieldCheck, Printer,
  FileText, Check, AlertCircle, ArrowRight
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => api.patch(`/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-detail', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setStatusUpdating(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update order status');
      setStatusUpdating(null);
    },
  });

  const handleStatusChange = (status: string) => {
    setStatusUpdating(status);
    updateStatusMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4">
        <div className="h-36 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order Invoice Not Found</h2>
        <p className="text-xs text-slate-500">The requested commercial order could not be located.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const customer = order.retailer || order.distributor;
  const isRetailer = !!order.retailerId;
  const items = order.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Pending Confirmation</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200"><CheckCircle className="w-3.5 h-3.5" /> Confirmed / Approved</span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200"><Truck className="w-3.5 h-3.5" /> Shipped / In Transit</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Delivered</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* ── TOP ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order Management
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Print Order Slip
          </button>
        </div>
      </div>

      {/* ── ORDER INVOICE HEADER ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-2xs">
              <Receipt className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Invoice {order.orderNumber || `ORD-${order.id.slice(-6).toUpperCase()}`}
                </h1>
                {getStatusBadge(order.status)}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Booked on {formatDate(order.orderDate || order.createdAt)} · Type: {isRetailer ? 'Secondary Chemist Order' : 'Primary Distributor Order'}
              </p>

              {order.user && (
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Booked by Rep: <strong>{order.user.firstName} {order.user.lastName}</strong> ({order.user.role})</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Badge */}
          <div className="self-end sm:self-center bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grand Total</span>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(order.totalAmount || 0)}</p>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">
              {items.length} Product Line{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Status Flow Progression */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Update Order Lifecycle:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {order.status !== 'CONFIRMED' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && (
              <button
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={!!statusUpdating}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                ✓ Confirm Order
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => handleStatusChange('SHIPPED')}
                disabled={!!statusUpdating}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                🚚 Dispatch & Ship
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button
                onClick={() => handleStatusChange('DELIVERED')}
                disabled={!!statusUpdating}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                📦 Mark Delivered
              </button>
            )}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <button
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={!!statusUpdating}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all"
              >
                ✕ Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CUSTOMER & SUPPLIER DETAILS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            {isRetailer ? <Store className="w-4 h-4 text-purple-600" /> : <Truck className="w-4 h-4 text-amber-600" />}
            {isRetailer ? 'Retail Chemist Account' : 'Distributor Account'}
          </h2>

          {customer ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Business Name</span>
                <span className="font-bold text-slate-900">{customer.name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500">Territory / City</span>
                <span className="font-bold text-slate-900">{customer.city || customer.state || 'Nagpur Territory'}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Phone Contact</span>
                  <span className="font-bold text-slate-900">{customer.phone}</span>
                </div>
              )}
              {customer.drugLicense && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-semibold text-slate-500">Drug License No.</span>
                  <span className="font-mono font-bold text-slate-800">{customer.drugLicense}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Direct Field Customer</p>
          )}
        </div>

        {/* Commercial Terms */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Commercial & Billing Terms
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Payment Terms</span>
              <span className="font-bold text-slate-900">Standard 21 Days Credit</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Order Booking Mode</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Field App (Direct MR)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-500">Dispatch CFA Depot</span>
              <span className="font-bold text-slate-900">Central Hub - Nagpur Depot</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="font-semibold text-slate-500">Scheme Eligibility</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Applicable Trade Scheme</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ITEMIZED PRODUCTS TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Billed Products & Quantities
          </h2>
          <span className="text-xs font-bold text-slate-500">{items.length} Line Items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3.5">#</th>
                <th className="px-6 py-3.5">Product & SKU</th>
                <th className="px-6 py-3.5 text-center">Quantity</th>
                <th className="px-6 py-3.5 text-right">Unit Price (PTR)</th>
                <th className="px-6 py-3.5 text-right">Discount</th>
                <th className="px-6 py-3.5 text-right">Net Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No item line records on file. Total amount: {formatCurrency(order.totalAmount || 0)}
                  </td>
                </tr>
              ) : (
                items.map((item: any, idx: number) => {
                  const lineTotal = item.totalPrice || ((item.quantity || 1) * (item.unitPrice || 0));
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.product?.name || `Product ${idx + 1}`}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.product?.code || 'SKU-STD'}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">
                        {item.quantity} Units
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {formatCurrency(item.unitPrice || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {item.discountPercent ? `${item.discountPercent}%` : '0%'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Foot */}
        <div className="bg-slate-50/70 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Remarks</span>
            <p className="text-xs text-slate-600 font-medium">
              {order.notes || 'Order placed via field app for prompt delivery.'}
            </p>
          </div>

          <div className="space-y-2 text-xs w-full sm:w-64 border-t sm:border-t-0 pt-3 sm:pt-0">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">{formatCurrency(order.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (Included)</span>
              <span className="font-bold text-slate-800">12% / 18%</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Net Payable</span>
              <span className="text-emerald-700">{formatCurrency(order.totalAmount || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
