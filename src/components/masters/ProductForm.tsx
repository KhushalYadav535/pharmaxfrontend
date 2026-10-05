'use client';

import React, { useState } from 'react';
import {
  Package, Send, AlertCircle, Hash, FileText, Tag, Layers,
  Database, DollarSign, X, Percent, Calendar, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-150">
      <Icon className="w-4 h-4 text-blue-600" />
      <h3 className="text-sm font-bold text-gray-800 tracking-tight">{label}</h3>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  span2,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  span2?: boolean;
  hint?: string;
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-white font-medium text-gray-900 placeholder:text-gray-400';
const selectCls = inputCls;

interface ProductFormProps {
  onClose: () => void;
  editData?: any;
}

export default function ProductForm({ onClose, editData }: ProductFormProps) {
  const isEdit = !!editData;
  const [name, setName] = useState(editData?.name ?? '');
  const [composition, setComposition] = useState(editData?.composition ?? '');
  const [scientificName, setScientificName] = useState(editData?.scientificName ?? '');
  const [category, setCategory] = useState(editData?.category ?? '');
  const [speciality, setSpeciality] = useState(editData?.speciality ?? '');
  const [unitsInPackage, setUnitsInPackage] = useState(editData?.unitsInPackage ? String(editData.unitsInPackage) : '');
  const [unit, setUnit] = useState(editData?.unit ?? 'Strip');
  const [storageTemp, setStorageTemp] = useState(editData?.storageTemp ? String(editData.storageTemp) : '');
  const [productDetails, setProductDetails] = useState(editData?.productDetails ?? '');
  const [productImage, setProductImage] = useState(editData?.productImage ?? '');

  // Commercial Pricing State
  const [mrp, setMrp] = useState(editData?.mrp ? String(editData.mrp) : '');
  const [ptr, setPtr] = useState(editData?.ptr ? String(editData.ptr) : '');
  const [pts, setPts] = useState(editData?.pts ? String(editData.pts) : '');

  const [applicableFrom, setApplicableFrom] = useState(
    editData?.applicableFrom ? editData.applicableFrom.split('T')[0] : ''
  );
  const [applicableTo, setApplicableTo] = useState(
    editData?.applicableTo ? editData.applicableTo.split('T')[0] : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live margin calculation
  const numMrp = parseFloat(mrp) || 0;
  const numPtr = parseFloat(ptr) || 0;
  const numPts = parseFloat(pts) || 0;

  const retailerMarginPct = numMrp > 0 && numPtr > 0 ? (((numMrp - numPtr) / numMrp) * 100).toFixed(1) : null;
  const stockistMarginPct = numPtr > 0 && numPts > 0 ? (((numPtr - numPts) / numPtr) * 100).toFixed(1) : null;

  const validate = () => {
    if (!name.trim()) return 'Product Name is required';
    if (numMrp < 0 || numPtr < 0 || numPts < 0) return 'Prices cannot be negative numbers';
    if (numPtr > numMrp && numMrp > 0) return 'PTR (Price to Retailer) should typically be less than or equal to MRP';
    if (numPts > numPtr && numPtr > 0) return 'PTS (Price to Stockist) should typically be less than or equal to PTR';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: name.trim(),
        composition: composition.trim() || undefined,
        scientificName: scientificName.trim() || undefined,
        category: category.trim() || undefined,
        speciality: speciality.trim() || undefined,
        unitsInPackage: unitsInPackage ? parseFloat(unitsInPackage) : undefined,
        unit,
        storageTemp: storageTemp ? parseFloat(storageTemp) : undefined,
        productDetails: productDetails.trim() || undefined,
        productImage: productImage.trim() || undefined,
        mrp: numMrp >= 0 ? numMrp : 0,
        ptr: numPtr >= 0 ? numPtr : 0,
        pts: numPts >= 0 ? numPts : 0,
        applicableFrom: applicableFrom ? new Date(applicableFrom).toISOString() : undefined,
        applicableTo: applicableTo ? new Date(applicableTo).toISOString() : undefined,
      };

      if (isEdit) {
        await api.put(`/products/${editData.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
      {/* ── Modal Top Header ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs border border-white/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              {isEdit ? 'Update Product Master & Price' : 'Add New Product Master'}
            </h2>
            <p className="text-xs text-blue-100 font-medium">
              {isEdit ? `Editing #${editData?.productCode || editData?.name}` : 'Create a pharmaceutical SKU in the formulary catalog'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Modal Form Body ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-bold">{error}</p>
          </div>
        )}

        <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Commercial Pricing Section (PRIMARY FOCUS) */}
          <section className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader icon={DollarSign} label="Commercial Pricing, Rate List & Margins" />
              {(retailerMarginPct || stockistMarginPct) && (
                <div className="flex items-center gap-2">
                  {retailerMarginPct && (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Retailer: {retailerMarginPct}%
                    </span>
                  )}
                  {stockistMarginPct && (
                    <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      Stockist: {stockistMarginPct}%
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="MRP (₹) - Max Retail Price" required hint="Maximum customer billing rate">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className={`${inputCls} pl-7 font-bold text-base text-gray-900`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </Field>

              <Field label="PTR (₹) - Price to Retailer" hint="Chemist purchase rate">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ptr}
                    onChange={(e) => setPtr(e.target.value)}
                    className={`${inputCls} pl-7 font-bold text-base text-emerald-800`}
                    placeholder="0.00"
                  />
                </div>
              </Field>

              <Field label="PTS (₹) - Price to Stockist" hint="CFA / Stockist billing rate">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pts}
                    onChange={(e) => setPts(e.target.value)}
                    className={`${inputCls} pl-7 font-bold text-base text-indigo-800`}
                    placeholder="0.00"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <Field label="Rate Applicable From">
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={applicableFrom}
                    onChange={(e) => setApplicableFrom(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>

              <Field label="Rate Applicable To (Optional)">
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={applicableTo}
                    onChange={(e) => setApplicableTo(e.target.value)}
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* 2. Basic Identification */}
          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <SectionHeader icon={FileText} label="Product Identification & Formula" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEdit && editData?.productCode && (
                <Field label="Product Code (System Generated)" span2>
                  <input
                    type="text"
                    value={editData.productCode}
                    disabled
                    className={`${inputCls} bg-gray-50 opacity-70 font-mono`}
                  />
                </Field>
              )}
              <Field label="Product Brand Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. BIOSPORE 4 TABLET"
                  required
                />
              </Field>
              <Field label="Active Composition / Salts">
                <input
                  type="text"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Bacillus Clausii 2 Billion Spores"
                />
              </Field>
            </div>
          </section>

          {/* 3. Classification & Packaging */}
          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <SectionHeader icon={Layers} label="Classification & Packaging Specifications" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Formulation Category">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Tablets, Syrup, Injectable"
                />
              </Field>

              <Field label="Target Specialty">
                <input
                  type="text"
                  value={speciality}
                  onChange={(e) => setSpeciality(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Gastroenterology, Pediatric"
                />
              </Field>

              <Field label="Scientific / Generic Name">
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  className={inputCls}
                  placeholder="Generic Pharmacopeia Name"
                />
              </Field>

              <Field label="Unit Pack Type">
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectCls}>
                  <option value="Strip">Strip</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Box">Box</option>
                  <option value="Vial">Vial</option>
                  <option value="Ampoule">Ampoule</option>
                  <option value="Tube">Tube</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Nano Shot">Nano Shot</option>
                </select>
              </Field>

              <Field label="No. of Units in Package">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={unitsInPackage}
                  onChange={(e) => setUnitsInPackage(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 10"
                />
              </Field>

              <Field label="Storage Temp (°C)">
                <input
                  type="number"
                  step="0.1"
                  value={storageTemp}
                  onChange={(e) => setStorageTemp(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 25"
                />
              </Field>

              <Field label="Product Image URL" span2>
                <input
                  type="text"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  className={inputCls}
                  placeholder="https://... or uploaded image path"
                />
              </Field>

              <Field label="Therapeutic Indications & Details" span2>
                <textarea
                  rows={2}
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  className={inputCls}
                  placeholder="Clinical usage instructions, dosage guidelines, precautions..."
                />
              </Field>
            </div>
          </section>
        </form>
      </div>

      {/* ── Modal Footer Controls ── */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
        <div className="text-xs text-gray-500 font-medium">
          {numMrp > 0 ? (
            <span>
              Configuring rate: <strong>₹{numMrp.toFixed(2)}</strong> MRP
              {numPtr > 0 ? ` · ₹${numPtr.toFixed(2)} PTR` : ''}
              {numPts > 0 ? ` · ₹${numPts.toFixed(2)} PTS` : ''}
            </span>
          ) : (
            <span>Please enter MRP, PTR, and PTS commercial pricing</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="productForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              'Saving SKU...'
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                {isEdit ? 'Update Price & Specs' : 'Save New Product'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
