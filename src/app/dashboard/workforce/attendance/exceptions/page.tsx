'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Clock, Calendar, Users, Filter, RefreshCw,
  CheckSquare, ArrowLeft, ArrowUpRight, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AttendanceExceptionsPage() {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await api.get(`/hrms/attendance/exceptions?${params.toString()}`);
      if (res.data?.success) {
        setExceptions(res.data.data.exceptions);
        setTotal(res.data.data.totalExceptions);
      }
    } catch (err) {
      console.error('Error fetching exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [fromDate, toDate]);

  const filteredExceptions = exceptions.filter((ex) => {
    if (selectedType === 'ALL') return true;
    return ex.exceptionType === selectedType;
  });

  const lateCount = exceptions.filter((e) => e.exceptionType === 'LATE_START').length;
  const noCloseCount = exceptions.filter((e) => e.exceptionType === 'NO_CLOSE_DAY').length;
  const shortCount = exceptions.filter((e) => e.exceptionType === 'SHORT_DURATION').length;

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
            <span className="text-amber-700 font-medium">Exceptions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Exceptions & Audits</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated detection of late field startings, unclosed days, and short working hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Register
          </Link>
          <Link
            href="/dashboard/workforce/attendance/regularization"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <CheckSquare className="w-4 h-4" />
            Regularization Queue
          </Link>
          <button
            onClick={() => fetchExceptions()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Exceptions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedType('ALL')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedType === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold tracking-wider opacity-70 block mb-1">
            Total Flagged
          </span>
          <div className="text-3xl font-bold">{total}</div>
          <span className="text-xs opacity-70 block mt-1">Across active date range</span>
        </div>

        <div
          onClick={() => setSelectedType('LATE_START')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedType === 'LATE_START'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-amber-900 border-amber-200/80 bg-amber-50/20 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-semibold tracking-wider">Late Starts</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold">{lateCount}</div>
          <span className="text-xs opacity-80 block mt-1">Checked in past grace period</span>
        </div>

        <div
          onClick={() => setSelectedType('NO_CLOSE_DAY')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedType === 'NO_CLOSE_DAY'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white text-red-900 border-red-200/80 bg-red-50/20 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-semibold tracking-wider">No Close Day</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold">{noCloseCount}</div>
          <span className="text-xs opacity-80 block mt-1">Left day open overnight</span>
        </div>

        <div
          onClick={() => setSelectedType('SHORT_DURATION')}
          className={`cursor-pointer p-5 rounded-2xl border transition-all ${
            selectedType === 'SHORT_DURATION'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
              : 'bg-white text-purple-900 border-purple-200/80 bg-purple-50/20 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-semibold tracking-wider">Short Duration</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold">{shortCount}</div>
          <span className="text-xs opacity-80 block mt-1">Worked &lt; 4 hours</span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredExceptions.length} exceptions of {total} total
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Exception Category</th>
                <th className="px-5 py-3.5">Audit Details</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Auditing attendance exceptions...
                  </td>
                </tr>
              ) : filteredExceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No attendance exceptions found for the selected timeframe. All field force timings are compliant!
                  </td>
                </tr>
              ) : (
                filteredExceptions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{item.employeeName}</div>
                      <div className="text-xs text-slate-400 font-mono">{item.employeeCode || 'ID Pending'}</div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-800">
                      {new Date(item.date).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.exceptionType === 'LATE_START'
                            ? 'bg-amber-100 text-amber-900'
                            : item.exceptionType === 'NO_CLOSE_DAY'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.exceptionType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {item.details}
                    </td>

                    <td className="px-5 py-4">
                      {item.durationMinutes ? (
                        <span className="font-medium text-slate-800">
                          {Math.floor(item.durationMinutes / 60)}h {item.durationMinutes % 60}m
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not Closed</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {item.isRegularized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Regularized
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Regularization
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href="/dashboard/workforce/attendance/regularization"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Regularize
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
