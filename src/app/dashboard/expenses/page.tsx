'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Receipt, Plus, Loader2, Pencil, Trash2, Calendar, DollarSign,
  CheckCircle, XCircle, Clock, Eye, AlertCircle, MapPin, IndianRupee,
  Car, FileText, CheckCheck, RefreshCw, Search
} from 'lucide-react';
import ExpenseForm from '@/components/operations/ExpenseForm';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [rejectionModalItem, setRejectionModalItem] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, statusFilter],
    queryFn: () =>
      api
        .get('/expenses', {
          params: {
            page,
            limit: 20,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data.data),
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

  const handleStatusUpdate = async (item: any, newStatus: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      setProcessing(item.id + newStatus);
      await api.patch(`/expenses/${item.id}/status`, { status: newStatus, reason });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      setViewingExpense(null);
      setRejectionModalItem(null);
      setRejectionReason('');
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const expenses = data?.expenses ?? [];
  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');

  // Summary Metrics
  const totalClaimAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const approvedTotal = expenses
    .filter((e: any) => e.approvalStatus === 'APPROVED')
    .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const pendingCount = expenses.filter((e: any) => e.approvalStatus === 'PENDING').length;

  const filteredExpenses = expenses.filter((e: any) => {
    const name = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.toLowerCase();
    const hq = (e.hq?.name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase()) || hq.includes(search.toLowerCase());
  });

  return (
    <>
      {/* Create / Edit Form Modal */}
      {(showForm || editData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <ExpenseForm
            editData={editData ?? undefined}
            onClose={() => {
              setShowForm(false);
              setEditData(null);
              qc.invalidateQueries({ queryKey: ['expenses'] });
            }}
          />
        </div>
      )}

      {/* Claim Voucher Review Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Expense Claim Voucher</h3>
                  <p className="text-xs text-slate-500">Claim #{viewingExpense.id.slice(-6)} · {viewingExpense.user?.firstName} {viewingExpense.user?.lastName}</p>
                </div>
              </div>
              <button onClick={() => setViewingExpense(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tour Date</span>
                <p className="font-bold text-slate-900">{formatDate(viewingExpense.tourFromDate)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Headquarter / City</span>
                <p className="font-bold text-slate-900">{viewingExpense.hq?.name || 'Local Beat'}</p>
              </div>
            </div>

            {/* Itemized Allowance Table */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-slate-400" /> Travel Fare ({viewingExpense.fareType || 'Standard'}) {viewingExpense.distance ? `[${viewingExpense.distance} km]` : ''}</span>
                <span className="font-bold text-slate-900">₹{viewingExpense.fare || 0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Daily Allowance (DA)</span>
                <span className="font-bold text-slate-900">₹{viewingExpense.dailyAllowance || 0}</span>
              </div>
              {viewingExpense.hotelExpenses > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Hotel / Lodging</span>
                  <span className="font-bold text-slate-900">₹{viewingExpense.hotelExpenses}</span>
                </div>
              )}
              {viewingExpense.miscExpenses > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Misc / Fuel</span>
                  <span className="font-bold text-slate-900">₹{viewingExpense.miscExpenses}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Claimed Amount</span>
                <span className="text-emerald-700 text-base">₹{viewingExpense.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {viewingExpense.remarks && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <span className="font-bold text-slate-700 block mb-0.5">Claim Purpose / Notes:</span>
                {viewingExpense.remarks}
              </div>
            )}

            {isAdminOrManager && viewingExpense.approvalStatus === 'PENDING' && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setRejectionModalItem(viewingExpense);
                  }}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleStatusUpdate(viewingExpense, 'APPROVED')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Sanction & Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Reject Expense Claim</h3>
            <p className="text-xs text-slate-500">
              State the audit objection so the representative can re-submit with correct vouchers.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Travel distance exceeds allowable beat distance; fuel receipt missing."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(rejectionModalItem, 'REJECTED', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-4 px-2 sm:px-4 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" /> Travel & Daily Allowance (TA/DA) Desk
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Review, verify, and sanction field force travel claims, fares, and daily allowances
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Submit Expense Claim
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Claims Amount</span>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{totalClaimAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-0.5">{expenses.length} claims submitted</p>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Approved / Sanctioned</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">₹{approvedTotal.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Processed for disbursement</p>
          </div>

          <div className="bg-white rounded-3xl border border-amber-100 p-5 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Verification</span>
            <p className="text-2xl font-black text-amber-800 mt-1">{pendingCount}</p>
            <p className="text-xs text-amber-600 mt-0.5">Awaiting manager sanction</p>
          </div>

          <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Average Claim Size</span>
            <p className="text-2xl font-black text-blue-700 mt-1">
              ₹{expenses.length > 0 ? Math.round(totalClaimAmount / expenses.length).toLocaleString('en-IN') : 0}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Per tour claim</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by representative or HQ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing {filteredExpenses.length} expense vouchers
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Field Rep & Code</th>
                  <th className="px-6 py-4">Tour Date & HQ</th>
                  <th className="px-6 py-4">Claim Breakdown</th>
                  <th className="px-6 py-4">Total Amount (₹)</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading expense reports...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700">No expense vouchers match the criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Field force expense claims will appear here</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {e.user?.firstName} {e.user?.lastName}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {e.user?.employeeCode || e.userId?.slice(-6)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(e.tourFromDate)}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{e.hq?.name || 'Local Headquarter'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
                          {e.fare > 0 && (
                            <span>Fare: ₹{e.fare} ({e.fareType || 'Travel'}) {e.distance ? `[${e.distance}km]` : ''}</span>
                          )}
                          {e.dailyAllowance > 0 && <span>DA: ₹{e.dailyAllowance}</span>}
                          {e.miscExpenses > 0 && <span>Misc: ₹{e.miscExpenses}</span>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          ₹{e.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            e.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : e.approvalStatus === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {e.approvalStatus === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : e.approvalStatus === 'REJECTED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {e.approvalStatus || 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingExpense(e)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Inspect Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdminOrManager && e.approvalStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(e, 'APPROVED')}
                                disabled={processing === e.id + 'APPROVED'}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve Claim"
                              >
                                {processing === e.id + 'APPROVED' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setRejectionModalItem(e)}
                                disabled={processing === e.id + 'REJECTED'}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Reject Claim"
                              >
                                {processing === e.id + 'REJECTED' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setEditData(e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e)}
                            disabled={processing === e.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {processing === e.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
