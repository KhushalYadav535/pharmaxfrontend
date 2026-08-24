'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ShoppingCart, Send, AlertCircle, X, Plus, Trash2, Calculator, Store, Truck } from 'lucide-react';
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

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 bg-white transition-all';
const selectCls = inputCls;

interface OrderFormProps {
  onClose: () => void;
  editData?: any; // For MVP, we might only allow creating orders, editing is complex but we structure for it
}

export default function OrderForm({ onClose, editData }: OrderFormProps) {
  const qc = useQueryClient();

  const [customerType, setCustomerType] = useState<'RETAILER' | 'DISTRIBUTOR'>('RETAILER');
  const [retailerId, setRetailerId] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([
    { id: Date.now(), productId: '', quantity: 1, productScheme: '', unitPrice: 0, discount: 0, totalPrice: 0 }
  ]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Dropdowns
  const { data: retailers = [] } = useQuery({ queryKey: ['retailers-list'], queryFn: () => api.get('/retailers', { params: { limit: 500 } }).then(r => r.data.data.retailers || []), enabled: customerType === 'RETAILER' });
  const { data: distributors = [] } = useQuery({ queryKey: ['distributors-list'], queryFn: () => api.get('/distributors', { params: { limit: 500 } }).then(r => r.data.data.distributors || []), enabled: customerType === 'DISTRIBUTOR' });
  const { data: products = [] } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products', { params: { limit: 500 } }).then(r => r.data.data.products || []) });

  // Auto-calculation logic for items
  useEffect(() => {
    let grandTotal = 0;
    const updatedItems = items.map(item => {
      const lineTotal = (Number(item.quantity) * Number(item.unitPrice)) - Number(item.discount);
      grandTotal += lineTotal > 0 ? lineTotal : 0;
      return { ...item, totalPrice: lineTotal > 0 ? lineTotal : 0 };
    });
    
    // Check if we need to update state to prevent infinite loops
    const needsUpdate = items.some((item, i) => item.totalPrice !== updatedItems[i].totalPrice);
    if (needsUpdate) setItems(updatedItems);

    const finalTotal = grandTotal - Number(orderDiscount);
    setTotalAmount(finalTotal > 0 ? finalTotal : 0);
  }, [items, orderDiscount]);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    const newItems = [...items];
    newItems[index].productId = productId;
    newItems[index].unitPrice = product ? Number(product.ptr) : 0; // Default to PTR
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: '', quantity: 1, productScheme: '', unitPrice: 0, discount: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerType === 'RETAILER' && !retailerId) { setError('Please select a Retailer'); return; }
    if (customerType === 'DISTRIBUTOR' && !distributorId) { setError('Please select a Distributor'); return; }
    if (items.some(i => !i.productId)) { setError('Please select a product for all rows'); return; }
    if (items.some(i => Number(i.quantity) <= 0)) { setError('Quantity must be greater than zero'); return; }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        retailerId: customerType === 'RETAILER' ? retailerId : undefined,
        distributorId: customerType === 'DISTRIBUTOR' ? distributorId : undefined,
        orderDate,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        totalAmount,
        discount: Number(orderDiscount),
        notes,
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          productScheme: i.productScheme,
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          totalPrice: Number(i.totalPrice)
        }))
      };

      await api.post('/orders', payload);
      qc.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Create Order
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

        <form id="orderForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <Field label="Customer Type" required span2>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${customerType === 'RETAILER' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="customerType" checked={customerType === 'RETAILER'} onChange={() => { setCustomerType('RETAILER'); setDistributorId(''); }} />
                  <Store className="w-4 h-4" /> Retailer
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${customerType === 'DISTRIBUTOR' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <input type="radio" className="hidden" name="customerType" checked={customerType === 'DISTRIBUTOR'} onChange={() => { setCustomerType('DISTRIBUTOR'); setRetailerId(''); }} />
                  <Truck className="w-4 h-4" /> Distributor
                </label>
              </div>
            </Field>

            {customerType === 'RETAILER' ? (
              <Field label="Select Retailer" required>
                <select value={retailerId} onChange={e => setRetailerId(e.target.value)} className={selectCls}>
                  <option value="">Select a Retailer</option>
                  {retailers.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Select Distributor" required>
                <select value={distributorId} onChange={e => setDistributorId(e.target.value)} className={selectCls}>
                  <option value="">Select a Distributor</option>
                  {distributors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Order Date" required>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={inputCls} />
            </Field>

            {/* Dynamic Items Grid */}
            <div className="md:col-span-2 pt-4 flex items-center gap-2 mb-1 border-t border-gray-200">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">Order Items</span>
            </div>

            <div className="md:col-span-2 space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap md:flex-nowrap items-start gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Product *</label>
                    <select value={item.productId} onChange={e => handleProductChange(index, e.target.value)} className={selectCls}>
                      <option value="">Select Product...</option>
                      {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty *</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className={inputCls} />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">PTR (₹) *</label>
                    <input type="number" min="0" step="any" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className={inputCls} />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Scheme</label>
                    <input type="text" value={item.productScheme} onChange={e => handleItemChange(index, 'productScheme', e.target.value)} placeholder="e.g. 10+1" className={inputCls} />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total (₹)</label>
                    <input type="number" readOnly value={item.totalPrice} className={`${inputCls} bg-gray-50 border-transparent font-bold text-gray-700`} />
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="mt-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl transition-colors w-max">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="md:col-span-2 pt-4 grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-gray-200">
              <div className="col-span-2">
                <Field label="Notes / Special Instructions">
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Any delivery instructions or notes..." />
                </Field>
                <div className="mt-4">
                  <Field label="Expected Delivery Date">
                    <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200 shadow-sm flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wide">Extra Discount</span>
                  <input type="number" min="0" step="any" value={orderDiscount} onChange={e => setOrderDiscount(e.target.value)} className="w-24 border border-blue-200 rounded-lg px-2 py-1 text-sm font-bold text-right outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="h-px bg-blue-200/50 my-2 w-full" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-black text-blue-900 uppercase tracking-wide">Grand Total</span>
                  </div>
                  <span className="text-2xl font-black text-blue-700">₹{totalAmount.toFixed(2)}</span>
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
        <button type="submit" form="orderForm" disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-sm">
          {isSubmitting ? 'Processing...' : <><Send className="w-4 h-4" /> Place Order</>}
        </button>
      </div>
    </div>
  );
}
