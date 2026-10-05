'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CheckSquare, Send, Star, Check, ChevronLeft,
  Store, Calendar, ShieldCheck, AlertTriangle,
  Eye, Award, Sparkles, Percent, Package, CheckCircle2,
  XCircle, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function RetailAuditForm() {
  const router = useRouter();
  const qc = useQueryClient();

  const [retailerId, setRetailerId] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [shelfSharePercent, setShelfSharePercent] = useState(25);
  const [productPlacement, setProductPlacement] = useState(4);
  const [priceCompliance, setPriceCompliance] = useState(true);
  const [displayCompliance, setDisplayCompliance] = useState(true);
  const [competitorVisibility, setCompetitorVisibility] = useState(false);
  const [stockAvailability, setStockAvailability] = useState<string[]>([]);
  const [outOfStock, setOutOfStock] = useState<string[]>([]);
  const [competitorSchemes, setCompetitorSchemes] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Retailers
  const { data: retailers = [] } = useQuery({
    queryKey: ['retailers-list-audit'],
    queryFn: () => api.get('/retailers', { params: { limit: 200 } }).then((r) => r.data.data.retailers || []),
  });

  // Fetch Real Products
  const { data: products = [] } = useQuery({
    queryKey: ['products-list-audit'],
    queryFn: () => api.get('/products', { params: { limit: 100 } }).then((r) => r.data.data.products || []),
  });

  const productNames: string[] = useMemo(() => {
    if (products.length > 0) {
      return products.map((p: any) => p.name);
    }
    return [
      'HEMOVAC SYRUP', 'HEMOVAC TABLET', 'BIOSPORE SACHET', 'BIOSPORE TABLET',
      'PNCROS DRS CAPSULE', 'RINOVAC SUSPENSION', 'VEEPROS D3 CAPSULE', 'CALCICAL TABLET'
    ];
  }, [products]);

  const selectedRetailer = useMemo(() => {
    return retailers.find((r: any) => r.id === retailerId);
  }, [retailers, retailerId]);

  const calculateScore = () => {
    let s = 0;
    if (shelfSharePercent >= 30) s += 25;
    else if (shelfSharePercent >= 15) s += 15;
    else s += 5;

    if (productPlacement >= 4) s += 20;
    else if (productPlacement >= 3) s += 12;
    else s += 5;

    if (priceCompliance) s += 20;
    if (displayCompliance) s += 20;
    if (!competitorVisibility) s += 15;
    return Math.min(100, s);
  };

  const currentScore = calculateScore();

  const submitMutation = useMutation({
    mutationFn: (payload: any) => api.post('/retail-audit', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail-audits'] });
      qc.invalidateQueries({ queryKey: ['audit-stats'] });
      router.push('/dashboard/retail-audit');
    },
  });

  const toggleAvailability = (productName: string) => {
    if (stockAvailability.includes(productName)) {
      setStockAvailability(stockAvailability.filter((p) => p !== productName));
    } else {
      setStockAvailability([...stockAvailability, productName]);
      setOutOfStock(outOfStock.filter((p) => p !== productName));
    }
  };

  const toggleOutOfStock = (productName: string) => {
    if (outOfStock.includes(productName)) {
      setOutOfStock(outOfStock.filter((p) => p !== productName));
    } else {
      setOutOfStock([...outOfStock, productName]);
      setStockAvailability(stockAvailability.filter((p) => p !== productName));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retailerId) {
      alert('Please select a Retail Chemist / Pharmacy account');
      return;
    }

    submitMutation.mutate({
      retailerId,
      auditDate,
      shelfSharePercent,
      productPlacement,
      priceCompliance,
      displayCompliance,
      competitorVisibility,
      stockAvailability,
      outOfStock,
      competitorSchemes,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/retail-audit"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Retail Pharmacy Audit</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Compliance Protocol
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect shelf share, visibility score, price compliance & out-of-stock items
            </p>
          </div>
        </div>

        {/* Live Score Pill */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
            currentScore >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            currentScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {currentScore}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Compliance Score</div>
            <div className="text-xs font-black text-slate-800">
              {currentScore >= 75 ? 'Optimal Storefront' : currentScore >= 50 ? 'Moderate Compliance' : 'Deficient Placement'}
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 1: STORE & DATE ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          1. Store & Inspection Details
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Retail Chemist Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={retailerId}
              onChange={(e) => setRetailerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
              required
            >
              <option value="">-- Choose Retail Pharmacy --</option>
              {retailers.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.city || 'Store'} · DL: {r.drugLicense || 'On File'})
                </option>
              ))}
            </select>

            {selectedRetailer && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900">{selectedRetailer.name}</div>
                <div>Address: {selectedRetailer.address || selectedRetailer.city || 'Registered territory'}</div>
                <div>Contact: {selectedRetailer.phone || 'N/A'}</div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Audit Date</label>
            <input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* ── STEP 2: SHELF SHARE & PLACEMENT ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          2. Shelf Share & Visual Merchandising
        </span>

        {/* Shelf Share Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              Shelf Share Percentage (Our Brands vs Total Shelf)
            </label>
            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              {shelfSharePercent}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={shelfSharePercent}
            onChange={(e) => setShelfSharePercent(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>0% (No Presence)</span>
            <span>25% (Average)</span>
            <span>50%+ (Dominant)</span>
          </div>
        </div>

        {/* Placement Rating */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 block">
            Product Placement Level (Tier Rating)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setProductPlacement(star)}
                className={`p-2 rounded-xl border transition-all ${
                  productPlacement >= star
                    ? 'bg-amber-50 border-amber-300 text-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300'
                }`}
              >
                <Star className={`w-5 h-5 ${productPlacement >= star ? 'fill-amber-400' : ''}`} />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-600 ml-2">
              {productPlacement === 5 ? 'Eye-Level Center Shelf (Premium)' :
               productPlacement === 4 ? 'Eye-Level Adjacent' :
               productPlacement === 3 ? 'Mid-Counter / Shelf' :
               productPlacement === 2 ? 'Lower Shelf' : 'Floor / Obscured'}
            </span>
          </div>
        </div>
      </div>

      {/* ── STEP 3: COMPLIANCE CHECKLIST ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          3. Commercial & Display Compliance
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => setPriceCompliance(!priceCompliance)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              priceCompliance ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Price Compliance</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                priceCompliance ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {priceCompliance && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Billing matches official MRP and trade rate</p>
          </div>

          <div
            onClick={() => setDisplayCompliance(!displayCompliance)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              displayCompliance ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Display Compliance</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                displayCompliance ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {displayCompliance && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Stickers, danglers & POS displays properly posted</p>
          </div>

          <div
            onClick={() => setCompetitorVisibility(!competitorVisibility)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              competitorVisibility ? 'bg-rose-50/60 border-rose-300 shadow-2xs' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Competitor Dominance</span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                competitorVisibility ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {competitorVisibility && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Heavy competitor banners or aggressive counter push</p>
          </div>
        </div>
      </div>

      {/* ── STEP 4: STOCK AUDIT (AVAILABLE VS OOS) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          4. Product Inventory & Out-of-Stock Status
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Available in Stock */}
          <div className="space-y-2">
            <label className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Available in Pharmacy
            </label>
            <div className="border border-slate-200 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-1.5 bg-slate-50">
              {productNames.map((pName) => {
                const checked = stockAvailability.includes(pName);
                return (
                  <div
                    key={pName}
                    onClick={() => toggleAvailability(pName)}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{pName}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Out of Stock */}
          <div className="space-y-2">
            <label className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Identified Out of Stock (OOS)
            </label>
            <div className="border border-slate-200 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-1.5 bg-slate-50">
              {productNames.map((pName) => {
                const checked = outOfStock.includes(pName);
                return (
                  <div
                    key={pName}
                    onClick={() => toggleOutOfStock(pName)}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-between transition-all ${
                      checked
                        ? 'bg-rose-100/70 border-rose-300 text-rose-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{pName}</span>
                    {checked && <XCircle className="w-3.5 h-3.5 text-rose-700 stroke-[3]" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 5: NOTES & COMPETITOR SCHEMES ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
          5. Market Intelligence & Observations
        </span>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Competitor Schemes & Trade Offers</label>
          <input
            type="text"
            value={competitorSchemes}
            onChange={(e) => setCompetitorSchemes(e.target.value)}
            placeholder="e.g. Rival brand offering 10+2 bonus or 12% cash rebate on syrup..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Auditor Remarks</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="General observations, pharmacist feedback, upcoming stock replenishments..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          />
        </div>
      </div>

      {/* ── SUBMIT ACTION ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/retail-audit"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitMutation.isPending ? 'Recording Audit...' : `Submit Audit (Score: ${currentScore}/100)`}
        </button>
      </div>
    </form>
  );
}
