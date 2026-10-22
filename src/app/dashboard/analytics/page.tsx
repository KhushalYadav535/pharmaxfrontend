'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart3, TrendingUp, Users, MapPin, DollarSign, Target, Activity,
  Gift, Package, ShoppingCart, Layers, FileSpreadsheet, Download, Search,
  Filter, X, ChevronRight, CheckCircle2, ArrowUpRight, Sparkles, Clock,
  AlertCircle, Building2, Eye, ShieldCheck, Tag, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { formatCurrency, CLASSIFICATION_COLORS } from '@/lib/utils';

const COLORS = ['#059669', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
const PIE_COLORS = ['#059669', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', change, badge }: any) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: 'from-emerald-50 to-white', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-700' },
    blue:    { bg: 'from-blue-50 to-white',    text: 'text-blue-700',    iconBg: 'bg-blue-100 text-blue-700' },
    purple:  { bg: 'from-purple-50 to-white',  text: 'text-purple-700',  iconBg: 'bg-purple-100 text-purple-700' },
    amber:   { bg: 'from-amber-50 to-white',   text: 'text-amber-700',   iconBg: 'bg-amber-100 text-amber-700' },
    violet:  { bg: 'from-violet-50 to-white',  text: 'text-violet-700',  iconBg: 'bg-violet-100 text-violet-700' },
  };
  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`bg-gradient-to-b ${theme.bg} rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge ? (
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
            {badge}
          </span>
        ) : change !== undefined ? (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${change >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change >= 0 ? '+' : ''}{change}%
          </span>
        ) : null}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'overview' | 'team' | 'expenses' | 'retailers' | 'distributors'>('sales');

  // Sales & Trade Schemes Filters
  const [period, setPeriod] = useState<'this_month' | 'this_week' | 'today' | 'last_30_days' | 'quarter' | 'all'>('this_month');
  const [selectedHq, setSelectedHq] = useState<string>('ALL');
  const [selectedMr, setSelectedMr] = useState<string>('ALL');
  const [mrSearch, setMrSearch] = useState<string>('');
  const [detailMrModal, setDetailMrModal] = useState<any | null>(null);

  const isMgr = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN', 'ADMIN'].includes(user?.role || '');

  // ── Commercial MR Sales & Trade Schemes Intelligence Query ───────────────────
  const { data: salesPerformanceData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['mr-sales-performance', { period, selectedHq, selectedMr }],
    queryFn: () => {
      const params: any = {};
      const now = new Date();
      if (period === 'today') {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        params.fromDate = d.toISOString();
      } else if (period === 'this_week') {
        const d = new Date(now);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        d.setHours(0, 0, 0, 0);
        params.fromDate = d.toISOString();
      } else if (period === 'this_month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        params.fromDate = d.toISOString();
      } else if (period === 'last_30_days') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.fromDate = d.toISOString();
      } else if (period === 'quarter') {
        const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        params.fromDate = d.toISOString();
      }
      if (selectedHq && selectedHq !== 'ALL') params.hqId = selectedHq;
      if (selectedMr && selectedMr !== 'ALL') params.mrId = selectedMr;
      return api.get('/analytics/mr-sales-performance', { params }).then((r) => r.data.data);
    },
  });

  const salesSummary = salesPerformanceData?.summary || {
    totalOrdersCount: 0,
    totalSalesValue: 0,
    totalPaidUnits: 0,
    totalFreeUnits: 0,
    totalDispatchedUnits: 0,
    overallBonusRatio: '0',
    avgOrderValue: 0,
    activeMRsCount: 0,
    totalMRsCount: 0,
  };

  const mrList: any[] = salesPerformanceData?.mrList || [];
  const schemesSummary: any[] = salesPerformanceData?.schemesSummary || [];
  const salesTrend: any[] = salesPerformanceData?.salesTrend || [];
  const headquartersList: any[] = salesPerformanceData?.headquarters || [];

  // Filter MR List by search query
  const filteredMrList = useMemo(() => {
    if (!mrSearch.trim()) return mrList;
    const q = mrSearch.toLowerCase().trim();
    return mrList.filter((m: any) =>
      (m.mrName || '').toLowerCase().includes(q) ||
      (m.employeeId || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.hqName || '').toLowerCase().includes(q)
    );
  }, [mrList, mrSearch]);

  // Handle Export CSV
  const handleExportSalesCSV = () => {
    if (!filteredMrList.length) return;
    const headers = ['MR Name', 'Employee ID', 'Headquarter', 'Role', 'Orders Count', 'Paid Units', 'Free Units', 'Total Units Dispatched', 'Bonus %', 'Total Sales (INR)', 'Top Schemes Applied'];
    const rows = filteredMrList.map((m: any) => [
      `"${m.mrName}"`,
      `"${m.employeeId}"`,
      `"${m.hqName}"`,
      m.role,
      m.ordersCount,
      m.paidUnits,
      m.freeUnits,
      m.totalUnits,
      `${m.effectiveBonusRate}%`,
      m.totalSales,
      `"${(m.schemesList || []).map((s: any) => `${s.ratio} (${s.timesUsed})`).join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pharmax_MR_Sales_and_Schemes_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Existing Standard Analytics Queries ─────────────────────────────────────
  const { data: visitCoverage } = useQuery({
    queryKey: ['visit-coverage'],
    queryFn: () => api.get('/analytics/doctor-coverage').then((r) => r.data.data),
    enabled: activeTab === 'overview',
  });

  const { data: visitTrend } = useQuery({
    queryKey: ['visit-trend'],
    queryFn: () => api.get('/analytics/visit-trend').then((r) => r.data.data),
    enabled: activeTab === 'overview',
  });

  const { data: classification } = useQuery({
    queryKey: ['doctor-classification'],
    queryFn: () => api.get('/analytics/doctor-classification').then((r) => r.data.data),
    enabled: activeTab === 'overview',
  });

  const { data: topDoctors } = useQuery({
    queryKey: ['top-doctors'],
    queryFn: () => api.get('/analytics/top-doctors').then((r) => r.data.data),
    enabled: activeTab === 'overview',
  });

  const { data: teamProductivity } = useQuery({
    queryKey: ['team-productivity'],
    queryFn: () => api.get('/analytics/team-productivity').then((r) => r.data.data),
    enabled: activeTab === 'team',
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => api.get('/analytics/expense-summary').then((r) => r.data.data),
    enabled: activeTab === 'expenses',
  });

  const { data: retailerCoverage } = useQuery({
    queryKey: ['retailer-coverage'],
    queryFn: () => api.get('/analytics/retailer-coverage').then((r) => r.data.data),
    enabled: activeTab === 'retailers',
  });

  const { data: distributorStats } = useQuery({
    queryKey: ['distributor-stats'],
    queryFn: () => api.get('/analytics/distributor-stats').then((r) => r.data.data),
    enabled: activeTab === 'distributors',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <BarChart3 className="w-7 h-7 text-emerald-600" /> Sales Analytics & Commercial BI
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black border border-emerald-200 uppercase tracking-wider">
              Executive BI
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time tracking of MR orders, billed revenue, free bonus goods dispatched, and trade scheme ROI
          </p>
        </div>

        {activeTab === 'sales' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSalesCSV}
              disabled={!filteredMrList.length}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border border-slate-200 shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Export Commercial MIS
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN TABS ── */}
      <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit flex-wrap border border-slate-200/80">
        {[
          { key: 'sales', label: 'Commercial Sales & Schemes', icon: ShoppingCart, highlight: true },
          { key: 'overview', label: 'Doctor Coverage & Calls', icon: Target },
          ...(isMgr ? [{ key: 'team', label: 'Field Team Productivity', icon: Users }] : []),
          { key: 'retailers', label: 'Retail Chemists', icon: Package },
          { key: 'distributors', label: 'Stockists & Distributors', icon: Building2 },
          { key: 'expenses', label: 'TA / DA Expenses', icon: DollarSign },
        ].map(({ key, label, icon: Icon, highlight }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Icon className={`w-4 h-4 ${activeTab === key ? (highlight ? 'text-emerald-600' : 'text-slate-900') : 'text-slate-400'}`} />
            {label}
            {highlight && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: COMMERCIAL SALES & TRADE SCHEMES (FLAGSHIP SECTION) ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* ── FILTER TOOLBAR ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Period Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Period:
              </span>
              {[
                { id: 'today', label: 'Today' },
                { id: 'this_week', label: 'This Week' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: 'Last 30 Days' },
                { id: 'quarter', label: 'Quarter (90D)' },
                { id: 'all', label: 'All Time' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    period === p.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Territory & MR Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Territory Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedHq}
                  onChange={(e) => setSelectedHq(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Territories / HQs</option>
                  {headquartersList.map((hq: any) => (
                    <option key={hq.id} value={hq.id}>
                      {hq.name} ({hq.code || 'HQ'})
                    </option>
                  ))}
                </select>
              </div>

              {/* MR Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMr}
                  onChange={(e) => setSelectedMr(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[170px] truncate"
                >
                  <option value="ALL">All Representatives ({mrList.length})</option>
                  {mrList.map((m: any) => (
                    <option key={m.mrId} value={m.mrId}>
                      {m.mrName} ({m.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={mrSearch}
                  onChange={(e) => setMrSearch(e.target.value)}
                  placeholder="Filter MR name..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white text-slate-800 w-36"
                />
              </div>
            </div>
          </div>

          {/* ── 5 EXECUTIVE KPI STAT CARDS (COMPANY TOTALS) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Billed Sales"
              value={formatCurrency(salesSummary.totalSalesValue)}
              subtitle={`${salesSummary.totalOrdersCount} Commercial Orders Booked`}
              icon={DollarSign}
              color="emerald"
              badge={`Avg: ₹${salesSummary.avgOrderValue}`}
            />
            <StatCard
              title="Paid / Billed Units"
              value={`${salesSummary.totalPaidUnits} Units`}
              subtitle="Primary & Secondary Units Billed"
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Free Goods Bonus Units"
              value={`${salesSummary.totalFreeUnits} Free`}
              subtitle="Dispatched via Trade Schemes"
              icon={Gift}
              color="purple"
              badge={`+${salesSummary.overallBonusRatio}% Extra`}
            />
            <StatCard
              title="Total Dispatched Volume"
              value={`${salesSummary.totalDispatchedUnits} Units`}
              subtitle={`${salesSummary.totalPaidUnits} Billed + ${salesSummary.totalFreeUnits} Free Units`}
              icon={Layers}
              color="amber"
            />
            <StatCard
              title="Active Sales Workforce"
              value={`${salesSummary.activeMRsCount} / ${salesSummary.totalMRsCount}`}
              subtitle="MRs with booked orders this period"
              icon={Users}
              color="violet"
            />
          </div>

          {/* ── INTERACTIVE VISUALIZATIONS & CHARTS GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Daily Revenue & Order Volume Trend (AreaChart) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Billed Sales & Revenue Velocity
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Daily commercial sales value (₹) trajectory</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sales (₹)
                  </span>
                </div>
              </div>

              {salesTrend && salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 600 }}
                      formatter={(val: any) => [formatCurrency(val), 'Billed Sales']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fill="url(#salesGrad)" name="Sales Revenue" dot={{ fill: '#059669', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-10 h-10 text-slate-200 mb-2" />
                  <p className="text-xs font-semibold">No order revenue recorded in selected timeframe</p>
                </div>
              )}
            </div>

            {/* Chart 2: Trade Scheme Breakdown (Pie / Donut) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600" /> Scheme Share
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Trade Bonus
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Revenue volume by active scheme</p>

                {schemesSummary && schemesSummary.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={schemesSummary} dataKey="revenue" nameKey="ratio" innerRadius={42} outerRadius={68} paddingAngle={4}>
                          {schemesSummary.map((_: any, index: number) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                          contentStyle={{ borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-2 mt-2">
                      {schemesSummary.map((item: any, i: number) => (
                        <div key={item.ratio || i} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="font-bold text-slate-800 truncate">{item.ratio !== 'None' ? `Scheme ${item.ratio}` : 'No Scheme'}</span>
                            <span className="text-[10px] font-semibold text-slate-400">({item.timesUsed}x)</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-black text-slate-900">{formatCurrency(item.revenue)}</p>
                            <p className="text-[10px] font-bold text-purple-700">+{item.freeUnits} Free</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                    No schemes applied yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CHART 3 & 4: PAID VS FREE BONUS UNITS COMPARISON (BARCHART) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clustered Bar: Paid vs Free Units by Scheme / Date */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" /> Paid Units vs. Free Goods Given
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Ratio of commercial billed units against complimentary bonus units</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Paid Units
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" /> Free Bonus
                  </span>
                </div>
              </div>

              {schemesSummary && schemesSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={schemesSummary} barSize={26}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="ratio" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                    <Bar dataKey="paidUnits" name="Paid Billed Units" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="freeUnits" name="Free Bonus Units" fill="#9333EA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No volume data</div>
              )}
            </div>

            {/* Representative Sales Ranking */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" /> Representative Commercial Leaderboard
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Top performing representatives by total sales (₹)</p>
                </div>
              </div>

              {mrList && mrList.length > 0 ? (
                <div className="space-y-3">
                  {mrList.slice(0, 5).map((m: any, idx: number) => {
                    const topSales = mrList[0]?.totalSales || 1;
                    const pct = Math.min(100, Math.round((m.totalSales / topSales) * 100));
                    return (
                      <div key={m.mrId || idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-black text-slate-400">#{idx + 1}</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200">
                          {((m.firstName?.[0] || 'M') + (m.lastName?.[0] || '')).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-xs font-black text-slate-900">{m.mrName}</p>
                              <p className="text-[10px] text-slate-400">{m.employeeId} • {m.hqName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-emerald-800">{formatCurrency(m.totalSales)}</p>
                              <p className="text-[10px] font-bold text-slate-500">{m.ordersCount} orders • {m.paidUnits} paid + {m.freeUnits} free</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No active sales representatives</div>
              )}
            </div>
          </div>

          {/* ── ACTIVE TRADE SCHEME PERFORMANCE MATRIX ── */}
          {schemesSummary && schemesSummary.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" /> Active Trade Schemes Performance Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Commercial impact, billed units, and complimentary goods per trade scheme</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schemesSummary.map((sc: any) => (
                  <div key={sc.schemeName} className="bg-gradient-to-br from-purple-50/60 to-white border border-purple-200 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-start justify-between mb-2">
                      <div className="bg-purple-100 text-purple-900 text-xs font-black px-2.5 py-1 rounded-lg border border-purple-300">
                        Scheme {sc.ratio}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {sc.timesUsed} Orders Applied
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-800 truncate mb-3" title={sc.schemeName}>
                      {sc.schemeName}
                    </h3>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-100 text-center">
                      <div className="bg-white rounded-xl p-2 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Paid Units</p>
                        <p className="text-sm font-black text-slate-900">{sc.paidUnits}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2 border border-purple-200">
                        <p className="text-[10px] font-bold text-purple-700 uppercase">Free Bonus</p>
                        <p className="text-sm font-black text-purple-700">+{sc.freeUnits}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase">Sales ₹</p>
                        <p className="text-xs font-black text-emerald-800 truncate">{formatCurrency(sc.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMPREHENSIVE MR PERFORMANCE TABLE (ALL MRS & INDIVIDUAL REPORTS) ── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Representative Sales & Scheme Performance Roster
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed individual breakdown of orders, billed units, complimentary free goods, and revenue
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Showing {filteredMrList.length} Representatives
              </span>
            </div>

            {isLoadingSales ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading Sales & Trade Schemes intelligence...
              </div>
            ) : filteredMrList.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Representative Records Found</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters or selecting a different date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-5">Medical Representative</th>
                      <th className="py-3.5 px-4">Headquarter / Territory</th>
                      <th className="py-3.5 px-4 text-center">Orders</th>
                      <th className="py-3.5 px-4 text-center">Paid Billed Units</th>
                      <th className="py-3.5 px-4 text-center">Free Bonus Units</th>
                      <th className="py-3.5 px-4 text-right">Total Sales (₹)</th>
                      <th className="py-3.5 px-5">Trade Schemes Applied</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMrList.map((m: any) => (
                      <tr key={m.mrId} className="hover:bg-slate-50/80 transition-colors">
                        {/* MR Profile */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 flex-shrink-0">
                              {((m.firstName?.[0] || 'M') + (m.lastName?.[0] || '')).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm">{m.mrName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                                  {m.employeeId}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{m.role}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Headquarter */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-slate-800">{m.hqName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{m.hqCode}</p>
                            </div>
                          </div>
                        </td>

                        {/* Orders Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block font-black px-2.5 py-1 rounded-lg ${
                            m.ordersCount > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {m.ordersCount}
                          </span>
                        </td>

                        {/* Paid Units */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-slate-800 text-sm">
                            {m.paidUnits} <span className="text-[10px] text-slate-400 font-normal">units</span>
                          </span>
                        </td>

                        {/* Free Bonus Units */}
                        <td className="py-3.5 px-4 text-center">
                          {m.freeUnits > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 font-black px-2.5 py-1 rounded-lg border border-purple-200">
                              <Gift className="w-3 h-3 text-purple-600" />
                              <span>+{m.freeUnits} Free</span>
                              <span className="text-[10px] text-purple-600 font-semibold">({m.effectiveBonusRate}%)</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">0 Free</span>
                          )}
                        </td>

                        {/* Total Sales (₹) */}
                        <td className="py-3.5 px-4 text-right">
                          <p className="font-black text-slate-900 text-sm">{formatCurrency(m.totalSales)}</p>
                          {m.ordersCount > 0 && (
                            <p className="text-[10px] text-slate-400 font-medium">Avg: ₹{Math.round(m.totalSales / m.ordersCount)}</p>
                          )}
                        </td>

                        {/* Trade Schemes Applied */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {m.schemesList && m.schemesList.length > 0 ? (
                              m.schemesList.map((sc: any) => (
                                <span
                                  key={sc.ratio}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    sc.ratio !== 'None' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {sc.ratio !== 'None' ? `Scheme ${sc.ratio}` : 'Standard'}
                                  <span className="bg-white/80 px-1 py-0.1 rounded text-[9px] font-mono text-purple-900">
                                    {sc.timesUsed}x
                                  </span>
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium">—</span>
                            )}
                          </div>
                        </td>

                        {/* Action: Detailed MR Report */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => setDetailMrModal(m)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all shadow-2xs hover:shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-700" /> View MR Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {/* ── INDIVIDUAL MR DEEP-DIVE MODAL ("INDIVIDUAL REPORT") ─────────────────── */}
          {/* ══════════════════════════════════════════════════════════════════════════ */}
          {detailMrModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                      {((detailMrModal.firstName?.[0] || 'M') + (detailMrModal.lastName?.[0] || '')).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">{detailMrModal.mrName}</h2>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 uppercase">
                          {detailMrModal.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Code: <span className="font-mono font-bold text-slate-700">{detailMrModal.employeeId}</span> • HQ: <span className="font-bold text-slate-700">{detailMrModal.hqName}</span> ({detailMrModal.hqCode}) • {detailMrModal.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailMrModal(null)}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* 4 Quick MR Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Total Sales (₹)</p>
                      <p className="text-xl font-black text-emerald-900 mt-0.5">{formatCurrency(detailMrModal.totalSales)}</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{detailMrModal.ordersCount} Orders Booked</p>
                    </div>
                    <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Paid / Billed Units</p>
                      <p className="text-xl font-black text-blue-900 mt-0.5">{detailMrModal.paidUnits}</p>
                      <p className="text-[10px] text-blue-600 font-medium mt-0.5">Commercial volume</p>
                    </div>
                    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Free Bonus Units</p>
                      <p className="text-xl font-black text-purple-900 mt-0.5">+{detailMrModal.freeUnits}</p>
                      <p className="text-[10px] text-purple-600 font-bold mt-0.5">{detailMrModal.effectiveBonusRate}% Free Goods Ratio</p>
                    </div>
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Total Dispatched</p>
                      <p className="text-xl font-black text-amber-900 mt-0.5">{detailMrModal.totalUnits}</p>
                      <p className="text-[10px] text-amber-600 font-medium mt-0.5">Billed + Bonus</p>
                    </div>
                  </div>

                  {/* Schemes Used By This MR */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-600" /> Schemes Applied by this Representative:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {detailMrModal.schemesList && detailMrModal.schemesList.length > 0 ? (
                        detailMrModal.schemesList.map((sc: any) => (
                          <div key={sc.ratio} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-3">
                            <span className="bg-purple-100 text-purple-900 text-xs font-black px-2 py-0.5 rounded-md">
                              {sc.ratio !== 'None' ? `Scheme ${sc.ratio}` : 'Standard'}
                            </span>
                            <div className="text-xs">
                              <span className="font-bold text-slate-800">{sc.paidUnits} Billed</span>
                              <span className="text-purple-700 font-bold ml-1.5">+{sc.freeUnits} Free</span>
                              <span className="text-slate-400 font-normal ml-2">({formatCurrency(sc.revenue)})</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">No special schemes applied on this MR&apos;s orders.</p>
                      )}
                    </div>
                  </div>

                  {/* Itemized Orders Table for this MR */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" /> Itemized Commercial Orders:
                      </h3>
                      <span className="text-xs text-slate-400 font-bold">{detailMrModal.orders?.length || 0} Orders</span>
                    </div>

                    {detailMrModal.orders && detailMrModal.orders.length > 0 ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Order # & Date</th>
                              <th className="py-2.5 px-4">Customer Account</th>
                              <th className="py-2.5 px-4">Products & Schemes Applied</th>
                              <th className="py-2.5 px-3 text-center">Billed</th>
                              <th className="py-2.5 px-3 text-center">Bonus Free</th>
                              <th className="py-2.5 px-4 text-right">Order Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detailMrModal.orders.map((ord: any) => (
                              <tr key={ord.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                  {ord.orderNumber}
                                  <p className="text-[10px] font-normal text-slate-400 font-sans">
                                    {new Date(ord.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                </td>
                                <td className="py-2.5 px-4">
                                  <p className="font-bold text-slate-800">{ord.customerName}</p>
                                  <span className="text-[10px] text-slate-400">{ord.customerType} • {ord.status}</span>
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="space-y-1">
                                    {(ord.items || []).map((it: any, i: number) => (
                                      <div key={it.id || i} className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-800">{it.productName}</span>
                                        {it.productScheme && it.ratio !== 'None' && (
                                          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                            {it.ratio} (+{it.freeUnits} Free)
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                                  {ord.paidUnits}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {ord.freeUnits > 0 ? (
                                    <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                      +{ord.freeUnits}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right font-black text-emerald-800">
                                  {formatCurrency(ord.totalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No orders booked by this representative.</p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Report scope: {period.replace('_', ' ').toUpperCase()} • {detailMrModal.hqName} Territory
                  </span>
                  <button
                    onClick={() => setDetailMrModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: DOCTOR COVERAGE & CALLS (ORIGINAL OVERVIEW) ─────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Coverage KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Visits" value={visitCoverage?.totalVisits ?? '—'} icon={MapPin} change={8} />
            <StatCard title="Completed" value={visitCoverage?.completedVisits ?? '—'} icon={Activity} color="blue" />
            <StatCard title="Coverage Rate" value={visitCoverage ? `${visitCoverage.coverageRate}%` : '—'} icon={Target} color="violet" change={visitCoverage?.coverageRate - 80} />
            <StatCard title="Doctors Covered" value={visitCoverage?.uniqueDoctors ?? '—'} icon={Users} color="amber" />
          </div>

          {/* Visit trend + Classification */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-slate-900">Visit Trend (6 Months)</h2>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={visitTrend || []}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="visits" stroke="#059669" strokeWidth={2.5} fill="url(#visitGrad)" name="Visits" dot={{ fill: '#059669', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="font-semibold text-slate-900 mb-5">Doctor Classification</h2>
              {classification && classification.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={classification} dataKey="_count" nameKey="classification" innerRadius={45} outerRadius={72} paddingAngle={3}>
                        {classification.map((_: any, index: number) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Doctors']} contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {classification.map((item: any, i: number) => (
                      <div key={item.classification} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-slate-600">{item.classification.replace('_', '+')}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{item._count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>}
            </div>
          </div>

          {/* Top Doctors */}
          {topDoctors && topDoctors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="font-semibold text-slate-900 mb-5">Most Visited Doctors</h2>
              <div className="space-y-3">
                {topDoctors.slice(0, 8).map((doc: any, i: number) => {
                  const maxVisits = topDoctors[0]?.visits || 1;
                  return (
                    <div key={doc.id || i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                        {doc.firstName?.[0]}{doc.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900">Dr. {doc.firstName} {doc.lastName}</p>
                          <span className="text-xs font-bold text-emerald-700">{doc.visits} visits</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(doc.visits / maxVisits) * 100}%` }} />
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${CLASSIFICATION_COLORS[doc.classification] || 'bg-slate-50 text-slate-600'}`}>{doc.classification?.replace('_', '+')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: FIELD TEAM PRODUCTIVITY ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team' && isMgr && (
        <div className="space-y-6">
          {teamProductivity && teamProductivity.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h2 className="font-semibold text-slate-900 mb-5">Team Visit Completion Rate (This Month)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={teamProductivity} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey={(d) => `${d.firstName} ${d.lastName}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, 'Completion Rate']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                    <Bar dataKey="rate" name="Rate" radius={[6, 6, 0, 0]}>
                      {teamProductivity.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.rate >= 80 ? '#059669' : entry.rate >= 60 ? '#F59E0B' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Team Performance Details</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['MR Name', 'Role', 'Planned Visits', 'Completed Visits', 'Completion Rate', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamProductivity.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{m.firstName} {m.lastName}</td>
                        <td className="px-5 py-3 text-slate-500">{m.role}</td>
                        <td className="px-5 py-3 text-slate-700">{m.planned}</td>
                        <td className="px-5 py-3 text-emerald-700 font-medium">{m.completed}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${m.rate >= 80 ? 'bg-emerald-500' : m.rate >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${m.rate}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{m.rate}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.rate >= 80 ? 'bg-emerald-50 text-emerald-700' : m.rate >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                            {m.rate >= 80 ? 'On Track' : m.rate >= 60 ? 'Moderate' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              No team members found under your management hierarchy.
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: EXPENSES ────────────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Expenses" value={formatCurrency(expenseSummary?.totalAmount ?? 0)} icon={DollarSign} color="emerald" />
            {(expenseSummary?.byCategory || []).map((cat: any) => (
              <div key={cat.category} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(cat._sum.amount || 0)}</p>
                <p className="text-sm text-slate-500 mt-0.5">{cat.category} ({cat._count} claims)</p>
              </div>
            ))}
          </div>

          {expenseSummary?.byCategory?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="font-semibold text-slate-900 mb-5">Expense by Category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={expenseSummary.byCategory} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Amount']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Bar dataKey="_sum.amount" name="Amount" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: RETAIL CHEMISTS ─────────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'retailers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Retailers', value: retailerCoverage?.totalRetailers ?? '—' },
              { label: 'Retailers Visited', value: retailerCoverage?.uniqueRetailers ?? '—' },
              { label: 'Coverage Rate', value: retailerCoverage?.coverageRate != null ? `${retailerCoverage.coverageRate}%` : '—' },
              { label: 'Total Retailer Visits', value: retailerCoverage?.completed ?? '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {retailerCoverage && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="font-semibold text-slate-900 mb-4">Retailer Coverage Progress</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Coverage Rate</span>
                <span className="font-bold text-slate-900">{retailerCoverage.uniqueRetailers}/{retailerCoverage.totalRetailers} ({retailerCoverage.coverageRate}%)</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${retailerCoverage.coverageRate}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 6: DISTRIBUTORS & STOCKISTS ────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'distributors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Distributors', value: distributorStats?.total ?? '—' },
              { label: 'Credit Limit', value: distributorStats?.totalCreditLimit != null ? `₹${(distributorStats.totalCreditLimit / 100000).toFixed(1)}L` : '—' },
              { label: 'Outstanding', value: distributorStats?.totalOutstanding != null ? `₹${(distributorStats.totalOutstanding / 100000).toFixed(1)}L` : '—' },
              { label: 'Credit Utilization', value: distributorStats?.utilizationRate != null ? `${distributorStats.utilizationRate}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {distributorStats && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="font-semibold text-slate-900 mb-4">Portfolio Credit Health</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Overall Credit Utilization</span>
                <span className={`font-bold ${(distributorStats.utilizationRate ?? 0) >= 80 ? 'text-rose-600' : 'text-slate-900'}`}>{distributorStats.utilizationRate ?? 0}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${(distributorStats.utilizationRate ?? 0) >= 80 ? 'bg-rose-500' : (distributorStats.utilizationRate ?? 0) >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${distributorStats.utilizationRate ?? 0}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>₹0</span><span>₹{((distributorStats.totalCreditLimit ?? 0) / 100000).toFixed(1)}L limit</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
