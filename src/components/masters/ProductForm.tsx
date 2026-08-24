'use client';

import React, { useState } from 'react';
import { Package, Send, AlertCircle, Hash, FileText, Tag, Layers, Database, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <Icon className="w-4 h-4 text-blue-500" />
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
    </div>
  );
}

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 bg-white';
const selectCls = inputCls;

interface ProductFormProps {
  onClose: () => void;
  editData?: any;
}

export default function ProductForm({ onClose, editData }: ProductFormProps) {
  const isEdit = !!editData;
  const [name, setName] = useState(editData?.name ?? '');
  const [composition, setComposition] = useState(editData?.composition ?? '');
  const [category, setCategory] = useState(editData?.category ?? '');
  const [type, setType] = useState(editData?.speciality ?? ''); // Stored as speciality in DB
  const [unit, setUnit] = useState(editData?.unit ?? 'Strip');
  const [pts, setPts] = useState(editData?.pts ?? '');
  const [ptr, setPtr] = useState(editData?.ptr ?? '');
  const [mrp, setMrp] = useState(editData?.mrp ?? '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name.trim()) return 'Product Name is required';
    if (!mrp) return 'MRP is required';
    if (!ptr) return 'Price to Retailer is required';
    if (!pts) return 'Price to Stockist is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        name, composition, category, speciality: type, unit,
        pts: parseFloat(pts), ptr: parseFloat(ptr), mrp: parseFloat(mrp)
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
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            {isEdit ? 'Edit Product Master' : 'New Product Master'}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <AlertCircle className="w-5 h-5 text-transparent" /> {/* placeholder to balance header */}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form id="productForm" onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Basic Details */}
          <section>
            <SectionHeader icon={FileText} label="Basic Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEdit && editData?.productCode && (
                <Field label="Product Code (Auto)" span2>
                  <input type="text" value={editData.productCode} disabled className={`${inputCls} bg-gray-50 opacity-70`} />
                </Field>
              )}
              <Field label="Product Name" required>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Paracetamol 500mg" />
              </Field>
              <Field label="Composition">
                <input type="text" value={composition} onChange={e => setComposition(e.target.value)} className={inputCls} placeholder="e.g. Paracetamol" />
              </Field>
            </div>
          </section>

          {/* 2. Classification */}
          <section>
            <SectionHeader icon={Layers} label="Classification" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Category">
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className={inputCls} placeholder="e.g. Tablet" />
              </Field>
              <Field label="Type">
                <input type="text" value={type} onChange={e => setType(e.target.value)} className={inputCls} placeholder="e.g. Analgesic" />
              </Field>
              <Field label="Unit">
                <select value={unit} onChange={e => setUnit(e.target.value)} className={selectCls}>
                  <option value="Strip">Strip</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Box">Box</option>
                  <option value="Vial">Vial</option>
                  <option value="Tube">Tube</option>
                </select>
              </Field>
            </div>
          </section>

          {/* 3. Pricing Details */}
          <section>
            <SectionHeader icon={DollarSign} label="Pricing Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Price to Stockist (PTS)" required>
                <div className="relative">
                  <span className="absolute left-3 top-[11px] text-gray-500 text-sm font-medium">₹</span>
                  <input type="number" step="0.01" value={pts} onChange={e => setPts(e.target.value)} className={`${inputCls} pl-7`} placeholder="0.00" />
                </div>
              </Field>
              <Field label="Price to Retailer (PTR)" required>
                <div className="relative">
                  <span className="absolute left-3 top-[11px] text-gray-500 text-sm font-medium">₹</span>
                  <input type="number" step="0.01" value={ptr} onChange={e => setPtr(e.target.value)} className={`${inputCls} pl-7`} placeholder="0.00" />
                </div>
              </Field>
              <Field label="M.R.P" required>
                <div className="relative">
                  <span className="absolute left-3 top-[11px] text-gray-500 text-sm font-medium">₹</span>
                  <input type="number" step="0.01" value={mrp} onChange={e => setMrp(e.target.value)} className={`${inputCls} pl-7`} placeholder="0.00" />
                </div>
              </Field>
            </div>
          </section>
        </form>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" form="productForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Saving...' : <><Send className="w-4 h-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>}
        </button>
      </div>
    </div>
  );
}
