'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarOff, Calendar, Users, Filter, RefreshCw, CheckCircle2,
  XCircle, Plus, AlertCircle, ArrowLeft, MessageSquare, ShieldCheck,
  Award, Layers, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LeaveApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');

  // Review Modal state
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Apply Leave Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    isHalfDay: false,
    halfDaySession: 'FIRST_HALF',
    reason: '',
  });

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get('/hrms/leave/types');
      if (res.data?.success) {
        setLeaveTypes(res.data.data);
        if (res.data.data.length > 0 && !applyForm.leaveTypeId) {
          setApplyForm((prev) => ({ ...prev, leaveTypeId: res.data.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const statusParam = tab === 'ALL' ? '' : tab;
      const res = await api.get(`/hrms/leave/applications?${statusParam ? `status=${statusParam}` : ''}`);
      if (res.data?.success) {
        setLeaves(res.data.data.records);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [tab]);

  const handleReview = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/hrms/leave/applications/${selectedLeave.id}/review`, {
        action: reviewAction,
        remarks,
      });
      if (res.data?.success) {
        setSelectedLeave(null);
        setRemarks('');
        fetchLeaves();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/hrms/leave/applications', applyForm);
      if (res.data?.success) {
        setShowApplyModal(false);
        setApplyForm({
          leaveTypeId: leaveTypes[0]?.id || '',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          isHalfDay: false,
          halfDaySession: 'FIRST_HALF',
          reason: '',
        });
        fetchLeaves();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaves.filter((l) => l.approvalStatus === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.approvalStatus === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Workforce & HRMS</span>
            <span>/</span>
            <span className="text-purple-700 font-medium">Leave Applications</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management & Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review field force leave applications, half-day quotas, and automated balance deductions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/leave/policies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Layers className="w-4 h-4" />
            Policies & Types
          </Link>
          <Link
            href="/dashboard/workforce/leave/holidays"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Holiday Calendar
          </Link>
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
          <button
            onClick={() => fetchLeaves()}
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
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Approvals
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('APPROVED')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            tab === 'APPROVED'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Approved Leaves
        </button>
        <button
          onClick={() => setTab('ALL')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${
            tab === 'ALL'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Leave History
        </button>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Date Range</th>
                <th className="px-5 py-3.5">Total Days</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Approver</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Loading leave applications...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No leave applications found in this queue.
                  </td>
                </tr>
              ) : (
                leaves.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.user?.firstName} {item.user?.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {item.user?.employeeId || 'ID Pending'} • {item.user?.departmentRel?.name || 'Field'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                        {item.leaveTypeRel?.name || item.leaveType}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      <div>
                        {new Date(item.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        {' — '}
                        {new Date(item.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      {item.isHalfDay && (
                        <div className="text-[11px] text-amber-700 font-semibold">
                          Half Day ({item.halfDaySession === 'FIRST_HALF' ? 'First Session' : 'Second Session'})
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {item.totalDays} day{item.totalDays > 1 ? 's' : ''}
                    </td>

                    <td className="px-5 py-4 text-slate-700 max-w-xs">
                      <p className="line-clamp-2 text-xs">{item.reason || 'No reason provided'}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.approvalStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : item.approvalStatus === 'MANAGER_APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.approvalStatus.replace(/_/g, ' ')}
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
                        <span className="text-xs text-slate-400 italic">Awaiting Approval</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.approvalStatus === 'PENDING' || item.approvalStatus === 'MANAGER_APPROVED' ? (
                        <button
                          onClick={() => {
                            setSelectedLeave(item);
                            setReviewAction('APPROVE');
                            setRemarks('');
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs"
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
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Review Leave Application</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedLeave.user?.firstName} {selectedLeave.user?.lastName} ({selectedLeave.user?.employeeId})
              </div>
              <div className="text-xs text-slate-500">
                Type: {selectedLeave.leaveTypeRel?.name || selectedLeave.leaveType} • {selectedLeave.totalDays} day(s)
              </div>
              <div className="text-xs text-slate-700 pt-1">
                <strong>Reason:</strong> {selectedLeave.reason || 'No reason provided'}
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
                  Approve Leave
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
                  Reject Leave
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewer Remarks / Reason
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional explanation for approval or reason for rejection..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-24 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
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

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleApplyLeave}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  required
                  value={applyForm.leaveTypeId}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code}) — {lt.daysAllowedPerYear} days/yr
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-purple-900">
                  <input
                    type="checkbox"
                    checked={applyForm.isHalfDay}
                    onChange={(e) => setApplyForm({ ...applyForm, isHalfDay: e.target.checked })}
                    className="rounded-sm border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  Half Day Application (0.5 Day credit)
                </label>
                {applyForm.isHalfDay && (
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs text-purple-800">
                      <input
                        type="radio"
                        name="session"
                        checked={applyForm.halfDaySession === 'FIRST_HALF'}
                        onChange={() => setApplyForm({ ...applyForm, halfDaySession: 'FIRST_HALF' })}
                      />
                      First Session (Morning)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-purple-800">
                      <input
                        type="radio"
                        name="session"
                        checked={applyForm.halfDaySession === 'SECOND_HALF'}
                        onChange={() => setApplyForm({ ...applyForm, halfDaySession: 'SECOND_HALF' })}
                      />
                      Second Session (Afternoon)
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  required
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="State the reason for leave..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
