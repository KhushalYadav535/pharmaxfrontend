'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ShieldCheck, Search, Filter, Calendar, Loader2, ArrowLeft,
  ChevronLeft, ChevronRight, User, Eye, AlertCircle, RefreshCw,
  FileText, Activity, Clock, Database, Globe
} from 'lucide-react';
import Link from 'next/link';

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE:        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  UPDATE:        { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  DELETE:        { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  APPROVE:       { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200' },
  REJECT:        { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  START_DAY:     { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  CLOSE_DAY:     { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-300' },
  BULK_IMPORT:   { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
  BULK_TRANSFER: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
};

function formatDateTime(d: string | null) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch {
    return '—';
  }
}

function formatTimeAgo(d: string | null) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    const diffSec = Math.floor((Date.now() - dt.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMin % 60}m ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '—';
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch audit logs
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter, entityFilter, startDate, endDate],
    queryFn: () =>
      api.get('/audit-logs', {
        params: {
          page,
          limit: 20,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          entity: entityFilter !== 'ALL' ? entityFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      }).then((r) => r.data.data),
  });

  // Fetch stats summary
  const { data: stats } = useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: () => api.get('/audit-logs/stats').then((r) => r.data.data),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-blue-600" /> System Security & Audit Trail
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              21 CFR Part 11 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable chronological audit log of all system changes, entity mutations, logins, and field approvals
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh Feed
        </button>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Logged Events
          </span>
          <span className="text-2xl font-black text-slate-900">{stats?.total ?? total}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Across all system entities</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Events Today
          </span>
          <span className="text-2xl font-black text-blue-600">{stats?.todayCount ?? 0}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Real-time activities</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Top Mutations
          </span>
          <span className="text-sm font-bold text-slate-800">
            {stats?.byAction?.[0]?.action || 'CREATE'}: {stats?.byAction?.[0]?.count || 0}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            2nd: {stats?.byAction?.[1]?.action || 'UPDATE'} ({stats?.byAction?.[1]?.count || 0})
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Most Active Entity
          </span>
          <span className="text-sm font-bold text-slate-800">
            {stats?.byEntity?.[0]?.entity || 'Visit'} ({stats?.byEntity?.[0]?.count || 0})
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            2nd: {stats?.byEntity?.[1]?.entity || 'Doctor'}
          </span>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, entity ID or IP address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="START_DAY">START_DAY</option>
            <option value="CLOSE_DAY">CLOSE_DAY</option>
            <option value="BULK_IMPORT">BULK_IMPORT</option>
            <option value="BULK_TRANSFER">BULK_TRANSFER</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="ALL">All Entities</option>
            <option value="Doctor">Doctor</option>
            <option value="Retailer">Retailer / Chemist</option>
            <option value="Visit">Visit / Call</option>
            <option value="Product">Product</option>
            <option value="Attendance">Attendance</option>
            <option value="Hospital">Hospital</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none bg-white text-slate-700"
            title="Start Date"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none bg-white text-slate-700"
            title="End Date"
          />
          {(startDate || endDate || actionFilter !== 'ALL' || entityFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setActionFilter('ALL');
                setEntityFilter('ALL');
                setSearch('');
                setPage(1);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── AUDIT LOGS TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor (User)</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Target ID</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading secure audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const actionStyle = ACTION_COLORS[log.action] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{formatDateTime(log.createdAt)}</div>
                        <div className="text-[10px] text-slate-400">{formatTimeAgo(log.createdAt)}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                            {log.user?.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {log.user?.firstName} {log.user?.lastName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {log.user?.role} {log.user?.employeeId ? `· ${log.user.employeeId}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {log.entity}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {log.entityId ? `${log.entityId.slice(0, 8)}...` : '—'}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} events
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-bold"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── INSPECT MODAL ── */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Audit Payload Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Action & Entity</span>
                  <span className="font-bold text-slate-800">{selectedLog.action} on {selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Timestamp</span>
                  <span className="font-bold text-slate-800">{formatDateTime(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Actor</span>
                  <span className="font-bold text-slate-800">{selectedLog.user?.firstName} {selectedLog.user?.lastName} ({selectedLog.user?.role})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Entity ID</span>
                  <span className="font-mono text-slate-700">{selectedLog.entityId || 'N/A'}</span>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Previous Values (Before Change)</span>
                  <pre className="bg-slate-950 text-slate-100 p-3 rounded-xl text-[11px] overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Mutated Values (After Change)</span>
                  <pre className="bg-slate-950 text-slate-100 p-3 rounded-xl text-[11px] overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {!selectedLog.oldValues && !selectedLog.newValues && (
                <div className="text-center py-6 text-slate-400">
                  <Database className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p>Standard audit event record with verified execution timestamp.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
