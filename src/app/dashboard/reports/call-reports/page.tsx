'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  PhoneCall, Users, Search, Download, Calendar,
  ChevronRight, CheckCircle2, AlertCircle, RefreshCw, X,
  Building2, ArrowLeft, TrendingUp, Sparkles, Info,
  ClipboardList, CalendarDays, ExternalLink, Stethoscope, Store
} from 'lucide-react';
import Link from 'next/link';

export default function CallReportsPage() {
  // Filters State
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'custom'>('last_7_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'AWAY' | 'OFFLINE'>('ALL');
  const [selectedHqId, setSelectedHqId] = useState<string>('ALL');

  // Selected MR for Individual Detailed Report Drilldown Modal
  const [selectedMRId, setSelectedMRId] = useState<string | null>(null);
  const [individualTab, setIndividualTab] = useState<'calls' | 'timeline'>('calls');

  // 1. Fetch Team Overview
  const {
    data: overviewData,
    isLoading: loadingOverview,
    isFetching: fetchingOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['call-reports-overview', timeRange, customStartDate, customEndDate, search, statusFilter, selectedHqId],
    queryFn: async () => {
      const res = await api.get('/mr-usage', {
        params: {
          timeRange,
          startDate: timeRange === 'custom' ? customStartDate : undefined,
          endDate: timeRange === 'custom' ? customEndDate : undefined,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          hqId: selectedHqId !== 'ALL' ? selectedHqId : undefined,
        },
      });
      return res.data.data;
    },
    refetchInterval: 30000, // refresh every 30s for live telemetry
  });

  // 2. Fetch HQs list for dropdown filter
  const { data: hqData } = useQuery({
    queryKey: ['headquarters-list'],
    queryFn: () => api.get('/headquarters').then((r) => r.data.data?.territories || r.data.data || []).catch(() => []),
  });

  // 3. Fetch Individual MR Detailed Report (when modal is open)
  const {
    data: individualData,
    isLoading: loadingIndividual,
    refetch: refetchIndividual,
  } = useQuery({
    queryKey: ['mr-individual-call-report', selectedMRId, timeRange, customStartDate, customEndDate],
    queryFn: async () => {
      if (!selectedMRId) return null;
      const res = await api.get(`/mr-usage/${selectedMRId}`, {
        params: {
          timeRange,
          startDate: timeRange === 'custom' ? customStartDate : undefined,
          endDate: timeRange === 'custom' ? customEndDate : undefined,
        },
      });
      return res.data.data;
    },
    enabled: !!selectedMRId,
  });

  // CSV Export Engine for Call Reports (Without logins, logouts, app hours, avg daily hours)
  const downloadCSV = (filename: string, rows: any[], headers: string[]) => {
    if (!rows || rows.length === 0) {
      alert('No records available to export.');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = overviewData?.summary;
  const mrList = overviewData?.mrList || [];

  const handleExportCallReports = () => {
    const headers = [
      'Medical Representative',
      'Employee Code',
      'Role',
      'Headquarter / Territory',
      'Live Field Status',
      'Total Calls Completed',
      'Doctor Calls',
      'Chemist Calls',
      'Total Planned Visits',
      'Today Calls Completed'
    ];

    const rows = mrList.map((m: any) => [
      m.name,
      m.employeeId || '—',
      m.role || 'MR',
      m.hq?.name || 'General HQ',
      m.currentStatus || (m.isOnline ? 'ONLINE' : 'OFFLINE'),
      m.totalCallsCompleted || 0,
      m.doctorCalls || 0,
      m.chemistCalls || 0,
      m.totalCalls || 0,
      m.todayVisitsCompleted || 0
    ]);

    downloadCSV(`Call_Reports_${timeRange}`, rows, headers);
  };

  const handleExportIndividualCalls = () => {
    if (!individualData?.visitsList || individualData.visitsList.length === 0) {
      alert('No field visit calls recorded for this representative in the selected period.');
      return;
    }

    const headers = [
      'Date',
      'Check-In Time',
      'Check-Out Time',
      'Target Name',
      'Target Category',
      'Call Type',
      'Duration',
      'Status',
      'Detailing Purpose',
      'Products Promoted',
      'Feedback & Remarks'
    ];

    const rows = individualData.visitsList.map((v: any) => [
      v.displayDate,
      v.checkInTime || '—',
      v.checkOutTime || '—',
      v.targetName || '—',
      v.targetSubtitle || '—',
      v.visitType || '—',
      v.durationFormatted || '—',
      v.status || '—',
      v.purpose || '—',
      Array.isArray(v.productsPromoted) ? v.productsPromoted.join(', ') : '—',
      v.feedback || '—'
    ]);

    const repCode = individualData?.mr?.employeeId || 'REP';
    downloadCSV(`MR_Call_Log_${repCode}_${timeRange}`, rows, headers);
  };

  // Aggregated call stats
  const totalPlannedVisits = useMemo(() => {
    return mrList.reduce((acc: number, m: any) => acc + (m.totalCalls || 0), 0);
  }, [mrList]);

  const totalTodayCalls = useMemo(() => {
    return mrList.reduce((acc: number, m: any) => acc + (m.todayVisitsCompleted || 0), 0);
  }, [mrList]);

  const avgCallsPerRep = useMemo(() => {
    if (!summary?.totalCallsCompleted || mrList.length === 0) return '0';
    return (summary.totalCallsCompleted / mrList.length).toFixed(1);
  }, [summary, mrList]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/dashboard/reports"
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Executive Reports
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Field MIS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Call Reports
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live Telemetry
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Individual report of each Medical Representative's field calls, doctor detailing, chemist visits, and call coverage
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => refetchOverview()}
                disabled={fetchingOverview}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingOverview ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportCallReports}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Call Reports CSV</span>
              </button>
            </div>
          </div>

          {/* ── TIME RANGE SELECTOR CHIPS ── */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Period:
              </span>
              {[
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    timeRange === t.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            {timeRange === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── KPI METRIC CARDS (Call-Specific Only) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Field Calls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Field Calls</span>
              <PhoneCall className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-emerald-700 tracking-tight flex items-baseline gap-1">
                <span>{summary?.totalCallsCompleted || 0}</span>
                <span className="text-xs font-normal text-slate-400">completed</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                {summary?.totalDoctorCalls || 0} Dr • {summary?.totalChemistCalls || 0} Chemist
              </p>
            </div>
          </div>

          {/* Card 2: Doctor Detailing Calls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Doctor Calls</span>
              <Stethoscope className="w-4 h-4 text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-blue-700 tracking-tight">
                {summary?.totalDoctorCalls || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Doctor detailing visits</p>
            </div>
          </div>

          {/* Card 3: Chemist Calls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-teal-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chemist Calls</span>
              <Store className="w-4 h-4 text-teal-600" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-teal-700 tracking-tight">
                {summary?.totalChemistCalls || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Retail pharmacy visits</p>
            </div>
          </div>

          {/* Card 4: Active Reps in Field */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Field Reps</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {summary?.onlineCount || 0}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {summary?.totalMRs || 0}</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Online & active now</p>
            </div>
          </div>

          {/* Card 5: Top Caller Rep */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Calls / Rep</span>
              <Sparkles className="w-4 h-4 text-rose-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm font-bold text-slate-900 truncate" title={summary?.topCallerMR?.name || '-'}>
                {summary?.topCallerMR?.name || 'N/A'}
              </div>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                {summary?.topCallerMR ? `${summary.topCallerMR.callsCount} calls (${summary.topCallerMR.doctorCalls} Dr)` : '0 calls'}
              </p>
            </div>
          </div>

          {/* Card 6: Average Calls per Rep */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Calls / Rep</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-amber-700 tracking-tight">
                {avgCallsPerRep}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Calls per medical rep</p>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH BAR ── */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MR by name, employee code, territory..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              {(['ALL', 'ONLINE', 'AWAY', 'OFFLINE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' && 'All Status'}
                  {st === 'ONLINE' && '🟢 Online'}
                  {st === 'AWAY' && '🟡 Away'}
                  {st === 'OFFLINE' && '⚪ Offline'}
                </button>
              ))}
            </div>

            {/* HQ Dropdown Filter */}
            {hqData && hqData.length > 0 && (
              <select
                value={selectedHqId}
                onChange={(e) => setSelectedHqId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Territories / HQ</option>
                {hqData.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code || 'HQ'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end md:self-center">
            <span>Showing:</span>
            <span className="font-semibold text-slate-800">{mrList.length} Representatives</span>
          </div>
        </div>

        {/* ── MASTER CALL REPORTS TABLE (Without Logins, Logouts, App Hours, Avg Daily Hours) ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Medical Representative</th>
                  <th className="py-3.5 px-3">HQ / Territory</th>
                  <th className="py-3.5 px-3">Live Status</th>
                  <th className="py-3.5 px-4 text-center bg-emerald-50/50">
                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Total Calls</span>
                    </span>
                  </th>
                  <th className="py-3.5 px-3 text-center">Doctor Calls</th>
                  <th className="py-3.5 px-3 text-center">Chemist Calls</th>
                  <th className="py-3.5 px-3 text-center">Today Completed</th>
                  <th className="py-3.5 px-4 text-right">Individual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {loadingOverview ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading call reports & field telemetry...
                    </td>
                  </tr>
                ) : mrList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No medical representatives found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  mrList.map((mr: any) => {
                    const isOnline = mr.currentStatus === 'ONLINE';
                    const isAway = mr.currentStatus === 'AWAY';

                    return (
                      <tr
                        key={mr.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedMRId(mr.id)}
                      >
                        {/* Column 1: Rep details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                                {mr.firstName?.[0]}
                                {mr.lastName?.[0]}
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                                  isOnline ? 'bg-emerald-500' : isAway ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                {mr.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="font-mono text-slate-600 font-medium">{mr.employeeId}</span>
                                <span>•</span>
                                <span>{mr.role}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: HQ */}
                        <td className="py-3 px-3">
                          <div className="text-xs font-medium text-slate-800">{mr.hq?.name || 'General HQ'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{mr.hq?.code || 'HQ'}</div>
                        </td>

                        {/* Column 3: Live Status */}
                        <td className="py-3 px-3">
                          {isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Online Now
                            </span>
                          ) : isAway ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Away ({mr.lastActiveFormatted})
                            </span>
                          ) : (
                            <div className="text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                Offline
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">{mr.lastActiveFormatted}</div>
                            </div>
                          )}
                        </td>

                        {/* Column 4: Total Calls (Completed & Planned) */}
                        <td className="py-3 px-4 text-center bg-emerald-50/30">
                          <div className="inline-flex flex-col items-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              mr.totalCallsCompleted > 0
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              <PhoneCall className={`w-3.5 h-3.5 ${mr.totalCallsCompleted > 0 ? 'text-emerald-700' : 'text-slate-400'}`} />
                              <span>{mr.totalCallsCompleted || 0} completed</span>
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1 font-medium">
                              {mr.totalCalls > 0 ? (
                                <span>of {mr.totalCalls} planned</span>
                              ) : (
                                <span>No plan set</span>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Column 5: Doctor Calls */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs ${
                            mr.doctorCalls > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-slate-400'
                          }`}>
                            <Stethoscope className="w-3.5 h-3.5" />
                            {mr.doctorCalls || 0} Dr
                          </span>
                        </td>

                        {/* Column 6: Chemist Calls */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs ${
                            mr.chemistCalls > 0
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'text-slate-400'
                          }`}>
                            <Store className="w-3.5 h-3.5" />
                            {mr.chemistCalls || 0} Chem
                          </span>
                        </td>

                        {/* Column 7: Today Calls Completed */}
                        <td className="py-3 px-3 text-center">
                          <div className="text-xs font-bold">
                            {mr.todayVisitsCompleted > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                                {mr.todayVisitsCompleted} calls today
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">0 calls today</span>
                            )}
                          </div>
                        </td>

                        {/* Column 8: Individual Action */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedMRId(mr.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <span>View Calls</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── INDIVIDUAL MR CALL REPORT DRILLDOWN MODAL ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {selectedMRId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/50 border border-emerald-400/30 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {individualData?.mr?.firstName?.[0]}
                  {individualData?.mr?.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                      {individualData?.mr?.name || 'Medical Representative'} - Call Report
                    </h2>
                    {individualData?.mr?.isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {individualData?.mr?.employeeId} • {individualData?.mr?.role} • HQ: {individualData?.mr?.hqName || 'General HQ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportIndividualCalls}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Export Call Log CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Calls CSV</span>
                </button>
                <button
                  onClick={() => setSelectedMRId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingIndividual ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
                  Loading field calls & doctor detailing log...
                </div>
              ) : (
                <>
                  {/* Summary Metric Strip for this Rep (Call-centric only) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Total Field Calls Done
                      </div>
                      <div className="text-xl font-bold text-emerald-700 flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-emerald-600" />
                        {individualData?.metrics?.totalCallsCompleted || 0}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        Completed field interactions
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Doctor Detailing Calls
                      </div>
                      <div className="text-xl font-bold text-blue-700 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        {individualData?.metrics?.doctorCalls || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Doctor visits logged</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Chemist Visits
                      </div>
                      <div className="text-xl font-bold text-teal-700 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-teal-600" />
                        {individualData?.metrics?.chemistCalls || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Chemist / trade calls</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Active Field Days
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {individualData?.metrics?.activeDaysCount || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Days with recorded calls</div>
                    </div>
                  </div>

                  {/* ── TAB SWITCHER ── */}
                  <div className="border-b border-slate-200 flex items-center gap-4">
                    <button
                      onClick={() => setIndividualTab('calls')}
                      className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        individualTab === 'calls'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Field Calls & Detailing Log</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                        {individualData?.visitsList?.length || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => setIndividualTab('timeline')}
                      className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        individualTab === 'timeline'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Day-by-Day Calls Summary</span>
                    </button>
                  </div>

                  {/* ── TAB 1: FIELD CALLS & DETAILING LOG ── */}
                  {individualTab === 'calls' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Field Calls & Detailing Log ({individualData?.visitsList?.length || 0} Visits in Selected Period)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {individualData?.metrics?.doctorCalls || 0} Doctor Detailing Calls • {individualData?.metrics?.chemistCalls || 0} Chemist Calls
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                              <th className="py-2.5 px-4">Date & Time</th>
                              <th className="py-2.5 px-3">Target Entity</th>
                              <th className="py-2.5 px-3 text-center">Call Type</th>
                              <th className="py-2.5 px-3 text-center">Duration</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-2.5 px-4">Detailing Purpose & Products</th>
                              <th className="py-2.5 px-4">Feedback / Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {!individualData?.visitsList || individualData.visitsList.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400">
                                  <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  No field calls recorded in this time period.
                                </td>
                              </tr>
                            ) : (
                              individualData.visitsList.map((visit: any) => {
                                const isCompleted = ['COMPLETED', 'REPORTED', 'CHECKED_OUT'].includes(visit.status);
                                const isDoctor = visit.visitType === 'DOCTOR';

                                return (
                                  <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                                    {/* Date & Time */}
                                    <td className="py-2.5 px-4">
                                      <div className="font-semibold text-slate-900">{visit.displayDate}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        {visit.checkInTime !== '-' ? `${visit.checkInTime} - ${visit.checkOutTime}` : 'Planned'}
                                      </div>
                                    </td>

                                    {/* Target Entity */}
                                    <td className="py-2.5 px-3">
                                      <div className="font-semibold text-slate-900">{visit.targetName}</div>
                                      <div className="text-[11px] text-slate-500">{visit.targetSubtitle}</div>
                                    </td>

                                    {/* Call Type */}
                                    <td className="py-2.5 px-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          isDoctor
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                      >
                                        {isDoctor ? 'DOCTOR' : 'CHEMIST / TRADE'}
                                      </span>
                                    </td>

                                    {/* Duration */}
                                    <td className="py-2.5 px-3 text-center font-mono">
                                      {visit.durationFormatted !== '0m' ? (
                                        <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          {visit.durationFormatted}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          isCompleted
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : visit.status === 'MISSED'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {visit.status}
                                      </span>
                                    </td>

                                    {/* Products & Purpose */}
                                    <td className="py-2.5 px-4 max-w-xs">
                                      <div className="font-medium text-slate-800 truncate" title={visit.purpose}>
                                        {visit.purpose}
                                      </div>
                                      {visit.productsPromoted && visit.productsPromoted.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                                          {visit.productsPromoted.map((p: string, idx: number) => (
                                            <span
                                              key={idx}
                                              className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium"
                                            >
                                              {p}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </td>

                                    {/* Feedback */}
                                    <td className="py-2.5 px-4 text-slate-600 text-[11px] max-w-xs">
                                      {visit.feedback || <span className="text-slate-300 italic">No remarks recorded</span>}
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

                  {/* ── TAB 2: DAY-BY-DAY CALL SUMMARY ── */}
                  {individualTab === 'timeline' && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Daily Call Summary ({individualData?.dateRange?.label})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Shows attendance status and calls conducted per day
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3 text-center">Attendance</th>
                                <th className="py-2.5 px-3 text-center">Completed Calls</th>
                                <th className="py-2.5 px-3 text-center">Doctor Calls</th>
                                <th className="py-2.5 px-3 text-center">Chemist Calls</th>
                                <th className="py-2.5 px-3 text-center">Planned Visits</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {individualData?.dayBreakdown?.map((day: any) => (
                                <tr
                                  key={day.date}
                                  className={`hover:bg-slate-50/70 transition-colors ${
                                    day.isWeekend ? 'bg-slate-50/40 text-slate-400' : ''
                                  }`}
                                >
                                  <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-2">
                                    <span className="font-semibold">{day.displayDate}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        day.dayOfWeek === 'Sun'
                                          ? 'bg-rose-50 text-rose-600'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {day.dayOfWeek}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        day.attendanceStatus === 'PRESENT'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : day.attendanceStatus === 'SUNDAY'
                                          ? 'bg-purple-50 text-purple-700'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {day.attendanceStatus}
                                    </span>
                                  </td>

                                  <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                                    {day.visitsCompleted > 0 ? `${day.visitsCompleted} calls` : '-'}
                                  </td>

                                  <td className="py-2.5 px-3 text-center font-medium text-blue-700">
                                    {day.doctorCalls > 0 ? `${day.doctorCalls} Dr` : '-'}
                                  </td>

                                  <td className="py-2.5 px-3 text-center font-medium text-teal-700">
                                    {day.chemistCalls > 0 ? `${day.chemistCalls} Chem` : '-'}
                                  </td>

                                  <td className="py-2.5 px-3 text-center text-slate-500">
                                    {day.visitsPlanned > 0 ? `${day.visitsPlanned} planned` : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                Call reports are synchronized in real-time from field check-ins and call submissions.
              </div>
              <button
                onClick={() => setSelectedMRId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

