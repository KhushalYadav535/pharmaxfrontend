'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Clock, Activity, LogIn, LogOut, Users, Search, Filter, Download,
  Calendar, ArrowUpDown, ChevronRight, CheckCircle2, AlertCircle,
  Eye, RefreshCw, X, ShieldCheck, Phone, Mail, Building2, Smartphone,
  Monitor, Laptop, FileText, ArrowLeft, BarChart2, TrendingUp, Sparkles,
  Info, Check, CalendarDays, ExternalLink, Printer
} from 'lucide-react';
import Link from 'next/link';

export default function MRActivityReportPage() {
  // Filters State
  const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'custom'>('last_7_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'AWAY' | 'OFFLINE'>('ALL');
  const [selectedHqId, setSelectedHqId] = useState<string>('ALL');

  // Selected MR for Individual Detailed Report Drilldown Modal
  const [selectedMRId, setSelectedMRId] = useState<string | null>(null);
  const [individualTab, setIndividualTab] = useState<'timeline' | 'sessions'>('timeline');

  // 1. Fetch Team Overview
  const {
    data: overviewData,
    isLoading: loadingOverview,
    isFetching: fetchingOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['mr-usage-overview', timeRange, customStartDate, customEndDate, search, statusFilter, selectedHqId],
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
    queryKey: ['mr-individual-report', selectedMRId, timeRange, customStartDate, customEndDate],
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

  // CSV Export Engine
  const downloadCSV = (url: string, filename: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => alert('Export failed: ' + err.message));
  };

  const handleExportTeamOverview = () => {
    const params = new URLSearchParams({
      timeRange,
      ...(timeRange === 'custom' && customStartDate ? { startDate: customStartDate } : {}),
      ...(timeRange === 'custom' && customEndDate ? { endDate: customEndDate } : {}),
      ...(search ? { search } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(selectedHqId !== 'ALL' ? { hqId: selectedHqId } : {}),
    });
    const url = `${api.defaults.baseURL}/mr-usage/export?${params.toString()}`;
    downloadCSV(url, `MR_Usage_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportIndividualReport = () => {
    if (!selectedMRId) return;
    const params = new URLSearchParams({
      timeRange,
      ...(timeRange === 'custom' && customStartDate ? { startDate: customStartDate } : {}),
      ...(timeRange === 'custom' && customEndDate ? { endDate: customEndDate } : {}),
    });
    const url = `${api.defaults.baseURL}/mr-usage/${selectedMRId}/export?${params.toString()}`;
    downloadCSV(url, `MR_Session_Log_${individualData?.mr?.employeeId || 'REP'}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const summary = overviewData?.summary;
  const mrList = overviewData?.mrList || [];

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
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Field MIS</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    MR App Usage & Login Reports
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live Telemetry
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Individual report of each Medical Representative's login duration, active hours, login/logout count, and app engagement
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
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingOverview ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportTeamOverview}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Team CSV</span>
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
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── KPI METRIC CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Online Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Online Now</span>
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
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active field reps</p>
            </div>
          </div>

          {/* Card 2: Total App Usage Hours */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Usage</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-indigo-700 tracking-tight">
                {summary?.totalAppHoursFormatted || '0h'}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Total logged in time</p>
            </div>
          </div>

          {/* Card 3: Total Logins */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Logins</span>
              <LogIn className="w-4 h-4 text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {summary?.totalLogins || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">App sessions initiated</p>
            </div>
          </div>

          {/* Card 4: Total Logouts */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Logouts</span>
              <LogOut className="w-4 h-4 text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {summary?.totalLogouts || 0}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Explicit logouts</p>
            </div>
          </div>

          {/* Card 5: Avg Daily Hours */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Usage/MR</span>
              <BarChart2 className="w-4 h-4 text-purple-500" />
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {summary?.avgDailyHoursFormatted || '0h'}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Per representative</p>
            </div>
          </div>

          {/* Card 6: Top Active MR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-0 opacity-60"></div>
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Most Active</span>
              <Sparkles className="w-4 h-4 text-rose-500" />
            </div>
            <div className="relative z-10">
              <div className="text-sm font-bold text-slate-900 truncate" title={summary?.topActiveMR?.name || '-'}>
                {summary?.topActiveMR?.name || 'N/A'}
              </div>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                {summary?.topActiveMR?.hoursFormatted || '0h'} ({summary?.topActiveMR?.logins || 0} logins)
              </p>
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
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

        {/* ── MASTER MR USAGE & LOGIN REPORT TABLE ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Medical Representative</th>
                  <th className="py-3.5 px-3">HQ / Territory</th>
                  <th className="py-3.5 px-3">Live Status</th>
                  <th className="py-3.5 px-3 text-center">Total Logins</th>
                  <th className="py-3.5 px-3 text-center">Total Logouts</th>
                  <th className="py-3.5 px-4 text-center">App Logged In Hours</th>
                  <th className="py-3.5 px-3 text-center">Avg Daily Hours</th>
                  <th className="py-3.5 px-3 text-center">Today Activity</th>
                  <th className="py-3.5 px-4 text-right">Individual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {loadingOverview ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading MR usage reports & telemetry...
                    </td>
                  </tr>
                ) : mrList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
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
                              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
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
                              <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
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

                        {/* Column 4: Total Logins */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-sm">
                            <LogIn className="w-3.5 h-3.5 text-blue-500" />
                            {mr.totalLogins}
                            <span className="text-[11px] font-normal text-slate-400">times</span>
                          </span>
                        </td>

                        {/* Column 5: Total Logouts */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-sm">
                            <LogOut className="w-3.5 h-3.5 text-amber-500" />
                            {mr.totalLogouts}
                            <span className="text-[11px] font-normal text-slate-400">times</span>
                          </span>
                        </td>

                        {/* Column 6: App Usage Hours */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              {mr.totalHoursFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {mr.activeDaysCount} active days
                            </span>
                          </div>
                        </td>

                        {/* Column 7: Avg Daily Hours */}
                        <td className="py-3 px-3 text-center font-medium text-slate-700 text-xs">
                          {mr.avgDailyHoursFormatted}
                        </td>

                        {/* Column 8: Today Activity */}
                        <td className="py-3 px-3 text-center">
                          <div className="text-xs font-semibold text-slate-800">
                            {mr.todayHoursFormatted !== '0m' ? (
                              <span className="text-emerald-700 font-bold">{mr.todayHoursFormatted}</span>
                            ) : (
                              <span className="text-slate-400">0m today</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {mr.todayLogins} logins • {mr.todayVisitsCompleted} calls
                          </div>
                        </td>

                        {/* Column 9: Action */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedMRId(mr.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <span>View Report</span>
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
      {/* ── INDIVIDUAL MR DETAILED REPORT DRILLDOWN MODAL ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {selectedMRId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/50 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {individualData?.mr?.firstName?.[0]}
                  {individualData?.mr?.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                      {individualData?.mr?.name || 'Medical Representative'}
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
                  <div className="text-xs text-indigo-200/80 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-200">
                      {individualData?.mr?.employeeId}
                    </span>
                    <span>•</span>
                    <span>{individualData?.mr?.designation}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-300" />
                      {individualData?.mr?.hq?.name} ({individualData?.mr?.hq?.code})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-indigo-300" />
                      {individualData?.mr?.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportIndividualReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  title="Export this MR's logs to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => setSelectedMRId(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {loadingIndividual ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
                  Generating detailed individual report and session history...
                </div>
              ) : (
                <>
                  {/* Individual Metrics Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Total App Hours
                      </div>
                      <div className="text-xl font-bold text-indigo-600">
                        {individualData?.metrics?.totalHoursFormatted || '0h'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {individualData?.metrics?.totalMinutes || 0} minutes logged
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Login Count
                      </div>
                      <div className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                        <LogIn className="w-4 h-4 text-blue-500" />
                        {individualData?.metrics?.totalLogins || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Times logged in</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Logout Count
                      </div>
                      <div className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                        <LogOut className="w-4 h-4 text-amber-500" />
                        {individualData?.metrics?.totalLogouts || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Times logged out</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Active Days
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {individualData?.metrics?.activeDaysCount || 0}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Days with app usage</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Avg Daily Hours
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {individualData?.metrics?.avgDailyHoursFormatted || '0h'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Per active day</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Avg Session Length
                      </div>
                      <div className="text-xl font-bold text-slate-900">
                        {individualData?.metrics?.avgSessionFormatted || '0m'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Per login session</div>
                    </div>
                  </div>

                  {/* ── TAB SWITCHER ── */}
                  <div className="border-b border-slate-200 flex items-center gap-4">
                    <button
                      onClick={() => setIndividualTab('timeline')}
                      className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        individualTab === 'timeline'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Day-by-Day Usage Breakdown</span>
                    </button>

                    <button
                      onClick={() => setIndividualTab('sessions')}
                      className={`pb-3 text-xs sm:text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        individualTab === 'sessions'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Individual Session History Logs</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                        {individualData?.sessionLogs?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* ── TAB 1: DAY-BY-DAY USAGE TIMELINE ── */}
                  {individualTab === 'timeline' && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Daily Activity Timeline ({individualData?.dateRange?.label})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Shows first login, last logout, hours, and visits per day
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3 text-center">First Login</th>
                                <th className="py-2.5 px-3 text-center">Last Logout</th>
                                <th className="py-2.5 px-3 text-center">Logins</th>
                                <th className="py-2.5 px-3 text-center">Logouts</th>
                                <th className="py-2.5 px-3 text-center">Total Active Hours</th>
                                <th className="py-2.5 px-3 text-center">Attendance</th>
                                <th className="py-2.5 px-3 text-center">Field Calls</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {individualData?.dayBreakdown?.map((day: any) => {
                                const hasActivity = day.totalMinutes > 0 || day.loginCount > 0;
                                return (
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

                                    <td className="py-2.5 px-3 text-center font-mono">
                                      {day.firstLoginTime !== '-' ? (
                                        <span className="font-semibold text-slate-700">{day.firstLoginTime}</span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-3 text-center font-mono">
                                      {day.lastLogoutTime === 'Active Now' ? (
                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          Active Now
                                        </span>
                                      ) : day.lastLogoutTime !== '-' ? (
                                        <span className="font-semibold text-slate-700">{day.lastLogoutTime}</span>
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>

                                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                                      {day.loginCount > 0 ? `${day.loginCount} times` : '-'}
                                    </td>

                                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                                      {day.logoutCount > 0 ? `${day.logoutCount} times` : '-'}
                                    </td>

                                    <td className="py-2.5 px-3 text-center">
                                      {hasActivity ? (
                                        <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                          {day.totalHoursFormatted}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300">0h</span>
                                      )}
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

                                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                                      {day.visitsCompleted > 0 ? (
                                        <span className="font-bold text-emerald-700">{day.visitsCompleted} calls</span>
                                      ) : (
                                        <span className="text-slate-300">0</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 2: DETAILED SESSION HISTORY LOGS ── */}
                  {individualTab === 'sessions' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Complete Individual Login & Logout Session Trail ({individualData?.sessionLogs?.length || 0} Sessions)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Logged with exact timestamps, platform, device, and duration
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-[460px]">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 bg-slate-100 z-10">
                            <tr className="text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                              <th className="py-2.5 px-3">Login Date & Time</th>
                              <th className="py-2.5 px-3">Logout Date & Time</th>
                              <th className="py-2.5 px-3 text-center">Session Duration</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Logout Reason</th>
                              <th className="py-2.5 px-3">Device & Platform</th>
                              <th className="py-2.5 px-3 font-mono">IP Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {individualData?.sessionLogs?.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                  No session activity logged in this period.
                                </td>
                              </tr>
                            ) : (
                              individualData?.sessionLogs?.map((sess: any) => {
                                const isActive = sess.status === 'ACTIVE';
                                return (
                                  <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                                    {/* Login timestamp */}
                                    <td className="py-2.5 px-3 font-medium text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <LogIn className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <div>
                                          <div className="font-semibold">{sess.loginDateStr}</div>
                                          <div className="text-[11px] text-slate-500 font-mono">
                                            {sess.loginTimeStr}
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Logout timestamp */}
                                    <td className="py-2.5 px-3">
                                      {isActive ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          Active Now
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                          <LogOut className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                          <div>
                                            <div className="font-medium">{sess.logoutDateStr}</div>
                                            <div className="text-[11px] text-slate-500 font-mono">
                                              {sess.logoutTimeStr}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </td>

                                    {/* Duration */}
                                    <td className="py-2.5 px-3 text-center">
                                      <span
                                        className={`px-2 py-1 rounded-md font-bold text-xs ${
                                          isActive
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        }`}
                                      >
                                        {sess.durationFormatted}
                                      </span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                          isActive
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : sess.status === 'TIMED_OUT'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {sess.status}
                                      </span>
                                    </td>

                                    {/* Logout Reason */}
                                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                      {sess.logoutReason || (isActive ? '-' : 'MANUAL')}
                                    </td>

                                    {/* Device info */}
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1.5 text-slate-700">
                                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-medium">{sess.deviceModel}</span>
                                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                                          {sess.platform}
                                        </span>
                                      </div>
                                    </td>

                                    {/* IP */}
                                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                                      {sess.ipAddress}
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
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                This data is recorded in real-time from mobile check-ins and session heartbeats.
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
