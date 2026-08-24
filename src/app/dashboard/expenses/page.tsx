'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Loader2, Pencil, Trash2, Calendar, Receipt, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import ExpenseForm from '@/components/operations/ExpenseForm';
import { useAuth } from '@/lib/auth-context';

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, statusFilter],
    queryFn: () => api.get('/expenses', { 
      params: { 
        page, 
        limit: 15,
        status: statusFilter || undefined
      } 
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this expense report?')) return;
    try {
      setProcessing(item.id);
      await api.delete(`/expenses/${item.id}`);
      qc.invalidateQueries({ queryKey: ['expenses'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete report');
    } finally {
      setProcessing(null);
    }
  };

  const handleStatusUpdate = async (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessing(item.id + newStatus);
      await api.patch(`/expenses/${item.id}/status`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ['expenses'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const expenses = data?.expenses ?? [];
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  return (
    <>
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <ExpenseForm
            editData={editData ?? undefined}
            onClose={() => { setShowForm(false); setEditData(null); }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" /> Expense Reporting
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Submit and manage travel and daily allowance claims.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Submit Expense
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-gray-50"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Tour Date & Location</th>
                  <th className="px-6 py-4">Expense Details</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />Loading expenses...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Receipt className="w-10 h-10 mx-auto mb-3 text-gray-200" />No expenses found.</td></tr>
                ) : (
                  expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{e.user?.firstName} {e.user?.lastName}</p>
                        <p className="text-xs text-gray-500">Code: {e.user?.employeeCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs mb-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(e.tourFromDate).toLocaleDateString('en-GB')}
                        </div>
                        <p className="text-xs text-gray-600 font-semibold">{e.hq?.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] text-gray-600">
                          {e.fare > 0 && <span>Fare: ₹{e.fare} ({e.fareType || 'N/A'}) {e.distance ? `[${e.distance}km]` : ''}</span>}
                          {e.dailyAllowance > 0 && <span>DA: ₹{e.dailyAllowance}</span>}
                          {e.miscExpenses > 0 && <span>Misc: ₹{e.miscExpenses}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-emerald-700 font-black text-lg bg-emerald-50 w-max px-2 py-0.5 rounded-lg border border-emerald-100">
                          <DollarSign className="w-4 h-4" /> {e.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {e.approvalStatus === 'APPROVED' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Approved</span>}
                        {e.approvalStatus === 'REJECTED' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>}
                        {e.approvalStatus === 'PENDING' && <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Approval Actions for Managers */}
                          {isAdminOrManager && e.approvalStatus === 'PENDING' && (
                            <>
                              <button onClick={() => handleStatusUpdate(e, 'APPROVED')} disabled={processing === e.id + 'APPROVED'} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                {processing === e.id + 'APPROVED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleStatusUpdate(e, 'REJECTED')} disabled={processing === e.id + 'REJECTED'} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                {processing === e.id + 'REJECTED' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </button>
                              <div className="w-px h-4 bg-gray-200 mx-1" />
                            </>
                          )}

                          {/* Standard Actions */}
                          <button onClick={() => setEditData(e)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(e)} disabled={processing === e.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete">
                            {processing === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
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
