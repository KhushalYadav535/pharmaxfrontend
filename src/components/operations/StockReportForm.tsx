'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Package, Send, AlertCircle, X, Store, Calculator } from 'lucide-react';
import { api } from '@/lib/api';

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 bg-white transition-all';
const selectCls = inputCls;

interface StockReportFormProps {
  onClose: () => void;
  editData?: any;
}

export default function StockReportForm({ onClose, editData }: StockReportFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [entityType, setEntityType] = useState<'STOCKIST' | 'RETAILER'>(editData?.stockistId ? 'STOCKIST' : 'RETAILER');
  const [stockistId, setStockistId] = useState(editData?.stockistId ?? '');
  const [retailerId, setRetailerId] = useState(editData?.retailerId ?? '');
  const [productId, setProductId] = useState(editData?.productId ?? '');
  const [reportFromDate, setReportFromDate] = useState(editData?.reportFromDate ? new Date(editData.reportFromDate).toISOString().split('T')[0] : '');
  const [reportToDate, setReportToDate] = useState(editData?.reportToDate ? new Date(editData.reportToDate).toISOString().split('T')[0] : '');
  
  const [openingQty, setOpeningQty] = useState(editData?.openingQty ?? 0);
  const [openingValue, setOpeningValue] = useState(editData?.openingValue ?? 0);
  const [receiptQty, setReceiptQty] = useState(editData?.receiptQty ?? 0);
  const [receiptValue, setReceiptValue] = useState(editData?.receiptValue ?? 0);
  const [issueQty, setIssueQty] = useState(editData?.issueQty ?? 0);
  const [issueValue, setIssueValue] = useState(editData?.issueValue ?? 0);
  const [dumpQty, setDumpQty] = useState(editData?.dumpQty ?? 0);

  const [closingQty, setClosingQty] = useState(editData?.closingQty ?? 0);
  const [closingValue, setClosingValue] = useState(editData?.closingValue ?? 0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Dropdown Data
  const { data: stockists = [] } = useQuery({ queryKey: ['stockists-list'], queryFn: () => api.get('/stockists', { params: { limit: 500 } }).then(r => r.data.data.stockists || []), enabled: entityType === 'STOCKIST' });
  const { data: retailers = [] } = useQuery({ queryKey: ['retailers-list'], queryFn: () => api.get('/retailers', { params: { limit: 500 } }).then(r => r.data.data.retailers || []), enabled: entityType === 'RETAILER' });
  const { data: products = [] } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products', { params: { limit: 500 } }).then(r => r.data.data.products || []) });

  // Auto-calculation logic
  useEffect(() => {
    const calcQty = Number(openingQty) + Number(receiptQty) - Number(issueQty);
    setClosingQty(calcQty);

    const calcVal = Number(openingValue) + Number(receiptValue) - Number(issueValue);
    setClosingValue(calcVal);
  }, [openingQty, receiptQty, issueQty, openingValue, receiptValue, issueValue]);

  // Handle Product Selection (Auto-fetch PTR/PTS for value calculation if user enters quantity)
  // To keep it simple and robust, we let the user enter value or we can calculate it based on product if needed.
  // For now, user inputs it or we assume they know it.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !reportFromDate || !reportToDate) { setError('Product and Dates are required'); return; }
    if (entityType === 'STOCKIST' && !stockistId) { setError('Please select a Stockist'); return; }
    if (entityType === 'RETAILER' && !retailerId) { setError('Please select a Retailer'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        entityType,
        stockistId: entityType === 'STOCKIST' ? stockistId : undefined,
        retailerId: entityType === 'RETAILER' ? retailerId : undefined,
        productId,
        reportFromDate,
        reportToDate,
        openingQty: Number(openingQty),
        openingValue: Number(openingValue),
        receiptQty: Number(receiptQty),
        receiptValue: Number(receiptValue),
        issueQty: Number(issueQty),
        issueValue: Number(issueValue),
        closingQty: Number(closingQty),
        closingValue: Number(closingValue),
        dumpQty: Number(dumpQty)
      };

      if (isEdit) {
        await api.put(`/stock-reports/${editData.id}`, payload);
      } else {
        await api.post('/stock-reports', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['stock-reports'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numProps = { min: 0, step: 'any' };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Stock Report' : 'Add Stock Report'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form id="stockReportForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <Field label="Entity Type" required span2>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${entityType === 'STOCKIST' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="entityType" checked={entityType === 'STOCKIST'} onChange={() => { setEntityType('STOCKIST'); setRetailerId(''); }} />
                  <Package className="w-4 h-4" /> Stockist
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${entityType === 'RETAILER' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="entityType" checked={entityType === 'RETAILER'} onChange={() => { setEntityType('RETAILER'); setStockistId(''); }} />
                  <Store className="w-4 h-4" /> Retailer
                </label>
              </div>
            </Field>

            {entityType === 'STOCKIST' ? (
              <Field label="Select Stockist" required>
                <select value={stockistId} onChange={e => setStockistId(e.target.value)} className={selectCls}>
                  <option value="">Select a Stockist</option>
                  {stockists.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Select Retailer" required>
                <select value={retailerId} onChange={e => setRetailerId(e.target.value)} className={selectCls}>
                  <option value="">Select a Retailer</option>
                  {retailers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Select Product" required>
              <select value={productId} onChange={e => setProductId(e.target.value)} className={selectCls}>
                <option value="">Select a Product</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
            </Field>

            <Field label="From Date" required>
              <input type="date" value={reportFromDate} onChange={e => setReportFromDate(e.target.value)} className={inputCls} />
            </Field>

            <Field label="To Date" required>
              <input type="date" value={reportToDate} onChange={e => setReportToDate(e.target.value)} className={inputCls} />
            </Field>

            <div className="md:col-span-2 pt-4 pb-2 border-t border-gray-200">
              <span className="text-[12px] font-bold text-violet-600 uppercase tracking-widest block bg-violet-50 w-max px-3 py-1 rounded-full border border-violet-100">Inventory Metrics (Qty & Value)</span>
            </div>

            {/* Metrics Grid */}
            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Opening Stock</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Quantity</label>
                    <input type="number" {...numProps} value={openingQty} onChange={e => setOpeningQty(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Value (₹)</label>
                    <input type="number" {...numProps} value={openingValue} onChange={e => setOpeningValue(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Receipt (+)</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Quantity</label>
                    <input type="number" {...numProps} value={receiptQty} onChange={e => setReceiptQty(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Value (₹)</label>
                    <input type="number" {...numProps} value={receiptValue} onChange={e => setReceiptValue(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">Issue (-)</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Quantity</label>
                    <input type="number" {...numProps} value={issueQty} onChange={e => setIssueQty(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase">Value (₹)</label>
                    <input type="number" {...numProps} value={issueValue} onChange={e => setIssueValue(e.target.value)} className={`${inputCls} py-1.5`} />
                  </div>
                </div>
              </div>

              <div className="bg-violet-50 p-4 rounded-xl border-2 border-violet-200 shadow-sm col-span-2 relative">
                <Calculator className="absolute top-4 right-4 w-4 h-4 text-violet-400" />
                <h4 className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">Closing Stock (Auto)</h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-violet-400 font-bold uppercase">Quantity</label>
                    <input type="number" readOnly value={closingQty} className={`${inputCls} py-1.5 bg-violet-100/50 text-violet-900 font-bold border-transparent`} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-violet-400 font-bold uppercase">Value (₹)</label>
                    <input type="number" readOnly value={closingValue} className={`${inputCls} py-1.5 bg-violet-100/50 text-violet-900 font-bold border-transparent`} />
                  </div>
                </div>
              </div>
              
              <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:col-start-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Dump Quantity</h4>
                <input type="number" {...numProps} value={dumpQty} onChange={e => setDumpQty(e.target.value)} className={`${inputCls} py-1.5`} placeholder="Spoiled / Expired qty" />
              </div>

            </div>
          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="stockReportForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Stock' : 'Save Stock'}</>}
        </button>
      </div>
    </div>
  );
}
