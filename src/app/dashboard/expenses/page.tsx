'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatCurrency, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import { DollarSign, Plus, Loader2, X, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const EXPENSE_TYPES = ['TA', 'DA', 'ACCOMMODATION', 'ENTERTAINMENT', 'MISCELLANEOUS'];
const TYPE_LABELS: Record<string, string> = {
  TA: 'Travel Allowance', DA: 'Daily Allowance', ACCOMMODATION: 'Accommodation',
  ENTERTAINMENT: 'Entertainment', MISCELLANEOUS: 'Miscellaneous',
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const isManager = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(user?.role || '');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses').then((r) => r.data.data),
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => api.get('/analytics/expense-summary').then((r) => r.data.data),
  });

  const [form, setForm] = useState({
    expenseType: 'TA', expenseDate: new Date().toISOString().slice(0, 10),
    amount: '', description: '', fromCity: '', toCity: '',
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/expenses', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['expense-summary'] }); setShowForm(false); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/expenses/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/expenses/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const totalPending = expenses?.filter((e: any) => e.approvalStatus === 'PENDING').length || 0;
  const totalApproved = expenses?.filter((e: any) => e.approvalStatus === 'APPROVED').reduce((s: number, e: any) => s + e.amount, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" /> Expenses
          </h1>
          <p className="text-gray-500 text-sm mt-1">Submit and track your field expenses</p>
        </div>
        <button onClick={() => setShowForm(true)} id="add-expense-btn" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Approved This Month</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalApproved)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
        </div>
        {expenseSummary?.byCategory?.slice(0, 2).map((cat: any) => (
          <div key={cat.category} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{TYPE_LABELS[cat.category] || cat.category}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(cat._sum.amount || 0)}</p>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Type', 'Date', 'Amount', 'Description', isManager ? 'Submitted By' : '', 'Status', 'Actions'].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : expenses?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No expenses submitted yet</p>
                  <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Add your first expense →</button>
                </td></tr>
              ) : expenses?.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">{TYPE_LABELS[expense.expenseType] || expense.expenseType}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(expense.expenseDate)}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-5 py-4 text-gray-600 max-w-xs truncate">{expense.description || '—'}</td>
                  {isManager && <td className="px-5 py-4 text-gray-600 text-xs">{expense.user?.firstName} {expense.user?.lastName}</td>}
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${APPROVAL_STATUS_COLORS[expense.approvalStatus]}`}>{expense.approvalStatus}</span>
                  </td>
                  <td className="px-5 py-4">
                    {isManager && expense.approvalStatus === 'PENDING' && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => approveMutation.mutate(expense.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => rejectMutation.mutate({ id: expense.id, reason: 'Rejected' })} className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Submit Expense</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, amount: parseFloat(form.amount) }); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expense Type</label>
                  <select value={form.expenseType} onChange={(e) => setForm(f => ({ ...f, expenseType: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.expenseDate} onChange={(e) => setForm(f => ({ ...f, expenseDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input required type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 500" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              {form.expenseType === 'TA' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From City</label>
                    <input value={form.fromCity} onChange={(e) => setForm(f => ({ ...f, fromCity: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To City</label>
                    <input value={form.toCity} onChange={(e) => setForm(f => ({ ...f, toCity: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Details about this expense..." className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
              </div>
              {createMutation.isError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{(createMutation.error as any)?.response?.data?.message || 'Failed to submit expense'}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
