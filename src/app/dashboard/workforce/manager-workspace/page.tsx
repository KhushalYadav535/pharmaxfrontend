'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Clock, Calendar, AlertTriangle,
  Receipt, CalendarOff, CheckSquare, RefreshCw, Filter,
  Phone, MapPin, ChevronRight, Check, X, Building2,
  TrendingUp, Award, DollarSign, Activity, FileText, ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ManagerWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'APPROVALS' | 'PERFORMANCE'>('ROSTER');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [snapshot, setSnapshot] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settlement remarks modal state
  const [settlingExpenseId, setSettlingExpenseId] = useState<string | null>(null);
  const [settlementAction, setSettlementAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [managerRemarks, setManagerRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const [snapshotRes, pendingRes, monthlyRes] = await Promise.all([
        api.get('/hrms/manager-workspace/snapshot', { params: { date: selectedDate } }),
        api.get('/hrms/manager-workspace/pending-approvals'),
        api.get('/hrms/manager-workspace/monthly-performance', {
          params: { month: selectedDate.slice(0, 7) },
        }),
      ]);

      if (snapshotRes.data?.success) setSnapshot(snapshotRes.data.data);
      if (pendingRes.data?.success) setPending(pendingRes.data.data);
      if (monthlyRes.data?.success) setMonthly(monthlyRes.data.data);
    } catch (err) {
      console.error('Error fetching manager workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [selectedDate]);

  // Handle Expense Settlement
  const handleSettleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingExpenseId) return;
    setProcessing(true);
    try {
      const res = await api.patch(`/hrms/manager-workspace/expenses/${settlingExpenseId}/settle`, {
        status: settlementAction,
        remarks: managerRemarks,
      });
      if (res.data?.success) {
        setSettlingExpenseId(null);
        setManagerRemarks('');
        fetchWorkspaceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Settlement failed');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Leave Approval
  const handleApproveLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/hrms/leave/applications/${id}/review`, { status });
      if (res.data?.success) {
        fetchWorkspaceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Leave review failed');
    }
  };

  // Handle Regularization Approval
  const handleApproveRegularization = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/hrms/attendance/regularizations/${id}/review`, { status });
      if (res.data?.success) {
        fetchWorkspaceData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Regularization review failed');
    }
  };

  const summary = snapshot?.summary;
  const roster = snapshot?.roster || [];
  const totalPending = pending?.totalPending || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Manager Command Center & Team Workspace</h1>
              <p className="text-sm text-slate-500">
                Live field roster, instant multi-tier approvals, and monthly performance scorecard
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm"
          />
          <button
            onClick={() => fetchWorkspaceData()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Team Strength</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.totalMembers || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Field force under span</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Present in Field</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{summary?.presentCount || 0}</div>
          <div className="text-xs text-emerald-600 mt-1">
            {summary?.fieldActiveCount || 0} currently on calls
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">On Leave</span>
            <CalendarOff className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{summary?.onLeaveCount || 0}</div>
          <div className="text-xs text-purple-600 mt-1">Approved leaves today</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Not Started</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{summary?.notStartedCount || 0}</div>
          <div className="text-xs text-amber-600 mt-1">No punch recorded</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{totalPending}</div>
          <div className="text-xs text-indigo-600 mt-1">
            {pending?.expenses?.length || 0} Exp • {pending?.leaves?.length || 0} Leaves
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ROSTER')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ROSTER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Today&apos;s Field Roster
        </button>

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'APPROVALS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Pending Approvals Queue
          {totalPending > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
              {totalPending}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'PERFORMANCE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Monthly Performance & Coverage
        </button>
      </div>

      {/* Tab 1: Today's Field Roster */}
      {activeTab === 'ROSTER' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Live Team Status on {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <span className="text-xs text-slate-500">{roster.length} Representatives Listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Headquarter</th>
                  <th className="py-3 px-4">Today&apos;s Attendance</th>
                  <th className="py-3 px-4">First Punch / Duration</th>
                  <th className="py-3 px-4">Today&apos;s Calls</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No team members mapped under your reporting hierarchy.
                    </td>
                  </tr>
                ) : (
                  roster.map((m: any) => {
                    const isPresent = m.attendance?.status === 'PRESENT';
                    const isFieldActive = m.attendance?.dayStatus === 'IN_PROGRESS';
                    const isOnLeave = m.attendance?.status === 'ON_LEAVE';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>
                            {m.firstName} {m.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {m.employeeId || 'ID: -'} • {m.role}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {m.hq?.name || 'Headquarter Not Assigned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isFieldActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPresent
                                ? 'bg-blue-100 text-blue-800'
                                : isOnLeave
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFieldActive
                                  ? 'bg-emerald-600 animate-pulse'
                                  : isPresent
                                  ? 'bg-blue-600'
                                  : isOnLeave
                                  ? 'bg-purple-600'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {isFieldActive
                              ? 'Active in Field'
                              : isPresent
                              ? 'Present (Day Closed)'
                              : isOnLeave
                              ? 'On Leave'
                              : 'Not Started'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {m.attendance?.checkInTime ? (
                            <div>
                              <div className="font-medium text-slate-900">
                                {new Date(m.attendance.checkInTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              <div className="text-slate-400">
                                {m.attendance.durationMinutes
                                  ? `${Math.floor(m.attendance.durationMinutes / 60)}h ${
                                      m.attendance.durationMinutes % 60
                                    }m`
                                  : 'Ongoing'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {m.visits?.completed} / {m.visits?.planned} Completed
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {m.phone && (
                            <a
                              href={`tel:${m.phone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Approvals Queue */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-6">
          {/* Section A: Field Expenses Settlement */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Field Expenses for Review & Settlement ({pending?.expenses?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">TA/DA, Local Conveyance & Lodging claims</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Claim Category</th>
                    <th className="py-3 px-4">Amount Claimed</th>
                    <th className="py-3 px-4">Related Tour / Visit</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4 text-right">Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {(!pending?.expenses || pending.expenses.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No pending expense claims at this time.
                      </td>
                    </tr>
                  ) : (
                    pending.expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>
                            {exp.user?.firstName} {exp.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{exp.user?.employeeId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {exp.claimCategory || exp.expenseType || 'TA_DA'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{exp.amount?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {exp.tourPlan?.planMonth
                            ? `TP: ${exp.tourPlan.planMonth}`
                            : exp.visit?.visitType
                            ? `Visit: ${exp.visit.visitType}`
                            : 'General Field Work'}
                        </td>
                        <td className="py-3.5 px-4">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View Bill
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Self Declared</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSettlingExpenseId(exp.id);
                                setSettlementAction('APPROVED');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              Settle / Approve
                            </button>
                            <button
                              onClick={() => {
                                setSettlingExpenseId(exp.id);
                                setSettlementAction('REJECTED');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              Reject
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

          {/* Section B: Leave Applications */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/40">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Pending Leave Applications ({pending?.leaves?.length || 0})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Session</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {(!pending?.leaves || pending.leaves.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No pending leave requests.
                      </td>
                    </tr>
                  ) : (
                    pending.leaves.map((lv: any) => (
                      <tr key={lv.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {lv.user?.firstName} {lv.user?.lastName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                            {lv.leaveTypeRel?.name || lv.leaveType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          {new Date(lv.startDate).toLocaleDateString()} to{' '}
                          {new Date(lv.endDate).toLocaleDateString()}
                          <span className="block text-slate-400 font-semibold">
                            {lv.totalDays} day(s) {lv.isHalfDay ? `(${lv.halfDaySession})` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{lv.reason || '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveLeave(lv.id, 'APPROVED')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveLeave(lv.id, 'REJECTED')}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              Reject
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

          {/* Section C: Attendance Regularizations */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Attendance Regularization Requests ({pending?.regularizations?.length || 0})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Attendance Date</th>
                    <th className="py-3 px-4">Regularization Type</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {(!pending?.regularizations || pending.regularizations.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No pending regularizations.
                      </td>
                    </tr>
                  ) : (
                    pending.regularizations.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {reg.user?.firstName} {reg.user?.lastName}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                          {new Date(reg.attendanceDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {reg.regularizationType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{reg.reason}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveRegularization(reg.id, 'APPROVED')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveRegularization(reg.id, 'REJECTED')}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              Reject
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
      )}

      {/* Tab 3: Monthly Performance & Coverage */}
      {activeTab === 'PERFORMANCE' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Team Performance & Field Activity Summary ({monthly?.period || selectedDate.slice(0, 7)})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Days Worked</th>
                  <th className="py-3 px-4">Call Coverage</th>
                  <th className="py-3 px-4">Expenses Claimed / Approved</th>
                  <th className="py-3 px-4">Target Achieved %</th>
                  <th className="py-3 px-4 text-right">Incentive Accrued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(!monthly?.performance || monthly.performance.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No monthly records found.
                    </td>
                  </tr>
                ) : (
                  monthly.performance.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{p.role}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {p.daysWorked} Days
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-slate-900">
                          {p.completedVisits} / {p.plannedVisits} Calls
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            p.coveragePct >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.coveragePct}% Coverage
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900">
                          ₹{p.totalExpenseApproved.toLocaleString()}
                        </div>
                        <div className="text-slate-400">
                          Claimed: ₹{p.totalExpenseClaimed.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {p.targetAchievementPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                        ₹{p.incentiveEarned.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Settlement Modal */}
      {settlingExpenseId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {settlementAction === 'APPROVED' ? 'Approve & Settle Expense' : 'Reject Expense Claim'}
              </h3>
              <button
                onClick={() => setSettlingExpenseId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manager Remarks / Settlement Note
                </label>
                <textarea
                  rows={3}
                  required={settlementAction === 'REJECTED'}
                  placeholder={
                    settlementAction === 'APPROVED'
                      ? 'Approved as per field tour policy.'
                      : 'Provide reason for rejection...'
                  }
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingExpenseId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-lg shadow-sm disabled:opacity-50 ${
                    settlementAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processing ? 'Processing...' : `Confirm ${settlementAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
