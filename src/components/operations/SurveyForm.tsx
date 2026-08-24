'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ClipboardList, Send, AlertCircle, X, MapPin, Package, Building2, Beaker, Tag } from 'lucide-react';
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

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400 bg-white transition-all';
const selectCls = inputCls;

interface SurveyFormProps {
  onClose: () => void;
  editData?: any;
}

export default function SurveyForm({ onClose, editData }: SurveyFormProps) {
  const qc = useQueryClient();
  const isEdit = !!editData;

  const [hqId, setHqId] = useState(editData?.hqId ?? '');
  const [surveyDate, setSurveyDate] = useState(editData?.surveyDate ? new Date(editData.surveyDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [productId, setProductId] = useState(editData?.productId ?? '');
  
  const [competitorCompanyName, setCompetitorCompanyName] = useState(editData?.competitorCompanyName ?? '');
  const [competitorProductName, setCompetitorProductName] = useState(editData?.competitorProductName ?? '');
  const [competitorProductComposition, setCompetitorProductComposition] = useState(editData?.competitorProductComposition ?? '');
  
  const [maximumRetailPrice, setMaximumRetailPrice] = useState(editData?.maximumRetailPrice ?? '');
  const [priceToStockist, setPriceToStockist] = useState(editData?.priceToStockist ?? '');
  const [priceToRetailer, setPriceToRetailer] = useState(editData?.priceToRetailer ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Data
  const { data: hqList = [] } = useQuery({ queryKey: ['headquarters-list'], queryFn: () => api.get('/headquarters', { params: { limit: 500 } }).then(r => r.data.data.headquarters || []) });
  const { data: products = [] } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products', { params: { limit: 500 } }).then(r => r.data.data.products || []) });

  const selectedProduct = products.find((p: any) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hqId) { setError('Headquarter is required'); return; }
    if (!productId) { setError('Our Product is required for comparison'); return; }
    if (!competitorCompanyName || !competitorProductName) { setError('Competitor details are required'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        hqId,
        surveyDate,
        productId,
        competitorCompanyName,
        competitorProductName,
        competitorProductComposition,
        maximumRetailPrice: maximumRetailPrice ? Number(maximumRetailPrice) : undefined,
        priceToStockist: priceToStockist ? Number(priceToStockist) : undefined,
        priceToRetailer: priceToRetailer ? Number(priceToRetailer) : undefined,
      };

      if (isEdit) {
        await api.put(`/surveys/${editData.id}`, payload);
      } else {
        await api.post('/surveys', payload);
      }
      
      qc.invalidateQueries({ queryKey: ['surveys'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-orange-600 to-rose-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Market Survey' : 'New Market Survey'}
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

        <form id="surveyForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="md:col-span-2 flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Survey Scope</span>
            </div>

            <Field label="Headquarter" required>
              <select value={hqId} onChange={e => setHqId(e.target.value)} className={selectCls}>
                <option value="">Select Headquarter</option>
                {hqList.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>

            <Field label="Survey Date" required>
              <input type="date" value={surveyDate} min={!isEdit ? today : undefined} onChange={e => setSurveyDate(e.target.value)} className={inputCls} />
            </Field>

            <div className="md:col-span-2 pt-4 flex items-center gap-2 mb-1 border-t border-gray-200">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span className="text-[12px] font-bold text-orange-600 uppercase tracking-widest">Competitor Details</span>
            </div>

            <Field label="Competitor Company Name" required>
              <input type="text" value={competitorCompanyName} onChange={e => setCompetitorCompanyName(e.target.value)} placeholder="e.g. Cipla, Sun Pharma" className={inputCls} />
            </Field>

            <Field label="Competitor Product Name" required>
              <input type="text" value={competitorProductName} onChange={e => setCompetitorProductName(e.target.value)} placeholder="e.g. Dolo 650" className={inputCls} />
            </Field>

            <Field label="Competitor Composition" span2>
              <div className="relative">
                <Beaker className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input type="text" value={competitorProductComposition} onChange={e => setCompetitorProductComposition(e.target.value)} placeholder="e.g. Paracetamol 650mg" className={`${inputCls} pl-10`} />
              </div>
            </Field>

            <div className="md:col-span-2 pt-4 flex items-center gap-2 mb-1 border-t border-gray-200">
              <Tag className="w-4 h-4 text-indigo-500" />
              <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest">Pricing Comparison</span>
            </div>

            <Field label="Our Product to Compare" required span2>
              <select value={productId} onChange={e => setProductId(e.target.value)} className={selectCls}>
                <option value="">Select Our Product</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
            </Field>

            {/* Pricing Side-by-Side */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              
              {/* Our Product Specs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide pb-2 border-b border-indigo-100 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Pharmax Product
                </h4>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-3">
                  {selectedProduct ? (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">MRP</p>
                        <p className="text-sm font-black text-gray-900">₹{selectedProduct.mrp}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">PTR (To Retailer)</p>
                        <p className="text-sm font-black text-gray-900">₹{selectedProduct.ptr}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">PTS (To Stockist)</p>
                        <p className="text-sm font-black text-gray-900">₹{selectedProduct.pts}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic py-4 text-center">Select our product to see prices</p>
                  )}
                </div>
              </div>

              {/* Competitor Inputs */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wide pb-2 border-b border-orange-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Competitor Product
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">MRP</label>
                    <input type="number" step="any" value={maximumRetailPrice} onChange={e => setMaximumRetailPrice(e.target.value)} className={`${inputCls} py-1.5`} placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">PTR (To Retailer)</label>
                    <input type="number" step="any" value={priceToRetailer} onChange={e => setPriceToRetailer(e.target.value)} className={`${inputCls} py-1.5`} placeholder="₹" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">PTS (To Stockist)</label>
                    <input type="number" step="any" value={priceToStockist} onChange={e => setPriceToStockist(e.target.value)} className={`${inputCls} py-1.5`} placeholder="₹" />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="surveyForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Survey' : 'Save Survey'}</>}
        </button>
      </div>
    </div>
  );
}
