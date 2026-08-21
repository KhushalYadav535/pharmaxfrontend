'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Send, AlertCircle, ChevronDown, Package, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface StockReportFormProps {
  stockistList?: { id: string; name: string }[];
  retailerList?: { id: string; name: string }[];
  productList?: { id: string; name: string }[];
  onSuccess?: () => void;
}

interface ProductRow {
  productId: string;
  openingQty: string; openingValue: string;
  receiptQty: string; receiptValue: string;
  issueQty: string; issueValue: string;
  closingQty: string; closingValue: string;
  dumpQty: string;
}

const emptyRow = (): ProductRow => ({
  productId: '', openingQty: '', openingValue: '',
  receiptQty: '', receiptValue: '', issueQty: '', issueValue: '',
  closingQty: '', closingValue: '', dumpQty: '',
});

const RING = '#0891b233';

const PRODUCT_FIELDS: { label: string; field: keyof ProductRow }[] = [
  { label: 'Opening Qty',    field: 'openingQty' },
  { label: 'Opening Value',  field: 'openingValue' },
  { label: 'Receipt Qty',    field: 'receiptQty' },
  { label: 'Receipt Value',  field: 'receiptValue' },
  { label: 'Issue Qty',      field: 'issueQty' },
  { label: 'Issue Value',    field: 'issueValue' },
  { label: 'Closing Qty',    field: 'closingQty' },
  { label: 'Closing Value',  field: 'closingValue' },
  { label: 'Dump Qty',       field: 'dumpQty' },
];

export default function StockReportForm({ stockistList = [], retailerList = [], productList = [], onSuccess }: StockReportFormProps) {
  const router = useRouter();

  const [stockistId, setStockistId] = useState('');
  const [retailerId, setRetailerId] = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const [rows, setRows]             = useState<ProductRow[]>([emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const updateRow = (idx: number, field: keyof ProductRow, val: string) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const handleSubmit = async () => {
    if (!fromDate || !toDate) { setError('Report date range is required'); return; }
    const validRows = rows.filter(r => r.productId);
    if (validRows.length === 0) { setError('Add at least one product'); return; }
    try {
      setIsSubmitting(true); setError('');
      await Promise.all(validRows.map((r: any) =>
        api.post('/stock-reports', {
          stockistId: stockistId || undefined,
          retailerId: retailerId || undefined,
          productId: r.productId,
          reportFromDate: fromDate,
          reportToDate: toDate,
          openingQty: Number(r.openingQty || 0), openingValue: Number(r.openingValue || 0),
          receiptQty: Number(r.receiptQty || 0), receiptValue: Number(r.receiptValue || 0),
          issueQty: Number(r.issueQty || 0), issueValue: Number(r.issueValue || 0),
          closingQty: Number(r.closingQty || 0), closingValue: Number(r.closingValue || 0),
          dumpQty: Number(r.dumpQty || 0),
        })
      ));
      if (onSuccess) onSuccess();
      else router.push('/dashboard/reports');
    } catch (e: any) { setError(e.message || 'Failed to submit'); }
    finally { setIsSubmitting(false); }
  };

  const selectCls = `w-full bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-semibold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 appearance-none transition-all cursor-pointer`;
  const dateCls   = `w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3.5 text-[14px] font-medium text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 pl-12 transition-all`;
  const labelCls  = `block text-[12px] font-bold text-gray-800 mb-2 uppercase tracking-wide`;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden font-sans">

      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 text-white px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">Stock Report</h1>
          <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">FFMS Stock Reporting</p>
        </div>
        <Package className="w-6 h-6 opacity-70" />
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Row 1: Stockist, Retailer, From Date, To Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelCls}>Stockist</label>
            <div className="relative group">
              <select value={stockistId} onChange={e => setStockistId(e.target.value)}
                className={selectCls} style={{ '--tw-ring-color': RING } as any}>
                <option value="" className="text-gray-400">Select Stockist...</option>
                {stockistList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Retailer</label>
            <div className="relative group">
              <select value={retailerId} onChange={e => setRetailerId(e.target.value)}
                className={selectCls} style={{ '--tw-ring-color': RING } as any}>
                <option value="" className="text-gray-400">Select Retailer...</option>
                {retailerList.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-[14px] pointer-events-none group-hover:text-gray-600 transition-colors" />
            </div>
          </div>

          <div>
            <label className={labelCls}>From Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className={dateCls} style={{ '--tw-ring-color': RING } as any} />
              <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelCls}>To Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)}
                className={dateCls} style={{ '--tw-ring-color': RING } as any} />
              <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-[14px] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Product Lines</span>
          <button onClick={() => setRows(prev => [...prev, emptyRow()])}
            className="flex items-center gap-1.5 text-[12px] font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-xl transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Product Rows */}
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">

              {/* Product selector header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 text-[12px] font-extrabold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 relative group">
                  <select value={row.productId} onChange={e => updateRow(idx, 'productId', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-semibold text-gray-900 outline-none focus:border-cyan-300 focus:ring-4 appearance-none transition-all cursor-pointer"
                    style={{ '--tw-ring-color': RING } as any}>
                    <option value="" className="text-gray-400">Select Product (FK: Product Master)...</option>
                    {productList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>
                {rows.length > 1 && (
                  <button onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Stock fields grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {PRODUCT_FIELDS.map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                    <input type="number" value={row[field]} onChange={e => updateRow(idx, field, e.target.value)}
                      placeholder="0" min={0}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-900 outline-none focus:border-cyan-300 focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': RING } as any} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-6 border-t border-gray-100 flex justify-end">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full md:w-auto px-10 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:to-cyan-600 text-white font-extrabold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none">
          {isSubmitting ? 'SUBMITTING...' : <><Send className="w-5 h-5" /> SUBMIT STOCK REPORT</>}
        </button>
      </div>
    </div>
  );
}
