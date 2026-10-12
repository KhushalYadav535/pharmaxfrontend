'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare, Clock, Calendar, Users, Filter, RefreshCw, CheckCircle2,
  XCircle, Plus, AlertCircle, ArrowLeft, MessageSquare, ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RegularizationQueuePage() {
  const [loading, setLoading] = useState(true);
  const [regularizations, setRegularizations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // Review Modal state
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Request Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({
    userId: '',
    attendanceDate: new Date().toISOString().slice(0, 10),
    regularizationType: 'FORGOT_START_DAY',
    requestedCheckIn: '09:30',
    requestedCheckOut: '18:00',
    reason: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/employees?limit=100');
      if (res.data?.success) setUsers(res.data.data.employees || res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRegularizations = async () => {
    setLoading(true);
    try {
      const statusParam = tab === 'PENDING' ? 'PENDING' : '';
      const res = await api.get(`/hrms/attendance/regularizations?${statusParam ? `status=${statusParam}` : ''}`);
      if (res.data?.success) {
        setRegularizations(res.data.data.records);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Error fetching regularizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRegularizations();
  }, [tab]);

  const handleReview = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/hrms/attendance/regularizations/${selectedReq.id}/review`, {
        action: reviewAction,
        remarks,
      });
      if (res.data?.success) {
        setSelectedReq(null);
        setRemarks('');
        fetchRegularizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating regularization request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const checkInIso = `${createForm.attendanceDate}T${createForm.requestedCheckIn}:00.000Z`;
      const checkOutIso = `${createForm.attendanceDate}T${createForm.requestedCheckOut}:00.000Z`;

      const res = await api.post('/hrms/attendance/regularizations', {
        attendanceDate: createForm.attendanceDate,
        regularizationType: createForm.regularizationType,
        requestedCheckIn: checkInIso,
        requestedCheckOut: checkOutIso,
        reason: createForm.reason,
      });

      if (res.data?.success) {
        setShowCreateModal(false);
        setCreateForm({
          userId: '',
          attendanceDate: new Date().toISOString().slice(0, 10),
          regularizationType: 'FORGOT_START_DAY',
          requestedCheckIn: '09:30',
          requestedCheckOut: '18:00',
          reason: '',
        });
        fetchRegularizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting regularization request');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = regularizations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = regularizations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = regularizations.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/workforce/attendance" className="hover:text-slate-800">Attendance</Link>
            <span>/</span>
            <span className="text-indigo-700 font-medium">Regularization Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Regularization Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve attendance adjustments, forgotten clock-outs, and On-Duty requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Attendance Register
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Request Regularization
          </button>
          <button
            onClick={() => fetchRegularizations()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('PENDING')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            tab === 'PENDING'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Approvals
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('HISTORY')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            tab === 'HISTORY'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit History & All Requests
        </button>
      </div>

      {/* Regularizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Target Date</th>
                <th className="px-5 py-3.5">Reason / Type</th>
                <th className="px-5 py-3.5">Requested Timings</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Manager / Approver</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading regularization requests...
                  </td>
                </tr>
              ) : regularizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No regularization requests found in this queue.
                  </td>
                </tr>
              ) : (
                regularizations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.user?.firstName} {item.user?.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {item.user?.employeeId || 'ID Pending'} • {item.user?.departmentRel?.name || 'Field'}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {new Date(item.attendanceDate).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {item.regularizationType.replace(/_/g, ' ')}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {item.reason}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-800">
                          In:{' '}
                          <span className="font-semibold">
                            {item.requestedCheckIn
                              ? new Date(item.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '09:30 AM'}
                          </span>
                        </div>
                        <div className="text-slate-800">
                          Out:{' '}
                          <span className="font-semibold">
                            {item.requestedCheckOut
                              ? new Date(item.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '06:00 PM'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'MANAGER_APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {item.approvedBy ? (
                        <div className="text-xs">
                          <span className="text-slate-700 font-medium">
                            {item.approvedBy.firstName} {item.approvedBy.lastName}
                          </span>
                          {item.managerRemarks && (
                            <div className="text-slate-400 italic">"{item.managerRemarks}"</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Awaiting Manager</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.status === 'PENDING' || item.status === 'MANAGER_APPROVED' ? (
                        <button
                          onClick={() => {
                            setSelectedReq(item);
                            setReviewAction('APPROVE');
                            setRemarks('');
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                        >
                          Review & Act
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Action Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Review Regularization</h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedReq.user?.firstName} {selectedReq.user?.lastName} ({selectedReq.user?.employeeId})
              </div>
              <div className="text-xs text-slate-500">
                Date: {new Date(selectedReq.attendanceDate).toLocaleDateString()} • Type: {selectedReq.regularizationType}
              </div>
              <div className="text-xs text-slate-700 pt-1">
                <strong>Reason:</strong> {selectedReq.reason}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVE')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                    reviewAction === 'APPROVE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Approve Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECT')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                    reviewAction === 'REJECT'
                      ? 'border-red-600 bg-red-50 text-red-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  Reject Request
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manager Remarks / Audit Note
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional explanation or condition for approval/rejection..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-24 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReview}
                disabled={submitting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors ${
                  reviewAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {submitting ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateRequest}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Request Regularization</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={createForm.attendanceDate}
                  onChange={(e) => setCreateForm({ ...createForm, attendanceDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Regularization Type</label>
                <select
                  value={createForm.regularizationType}
                  onChange={(e) => setCreateForm({ ...createForm, regularizationType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="FORGOT_START_DAY">Forgot to Start Day</option>
                  <option value="FORGOT_CLOSE_DAY">Forgot to Close Day</option>
                  <option value="ON_DUTY_MEETING">On Duty (Doctor/HQ Meeting)</option>
                  <option value="TECHNICAL_GLITCH">GPS / Device Connectivity Issue</option>
                  <option value="LATE_MARK_WAIVER">Late Mark Waiver</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested In</label>
                  <input
                    type="time"
                    required
                    value={createForm.requestedCheckIn}
                    onChange={(e) => setCreateForm({ ...createForm, requestedCheckIn: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Out</label>
                  <input
                    type="time"
                    required
                    value={createForm.requestedCheckOut}
                    onChange={(e) => setCreateForm({ ...createForm, requestedCheckOut: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Explanation</label>
                <textarea
                  required
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  placeholder="Explain why regularization is requested..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
