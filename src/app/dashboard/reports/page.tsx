'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileSpreadsheet, ArrowLeft, Download, Filter, Calendar,
  Activity, Users, ShoppingCart, Gift, Receipt, Search,
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, RefreshCw, Loader2, PhoneCall
} from 'lucide-react';

export default function ReportsHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dcr' | 'coverage' | 'pva' | 'samples' | 'expenses'>('dcr');
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'ALL'>('THIS_MONTH');

  // 1. Fetch DCR Reports
  const { data: dcrData, isLoading: loadingDCR } = useQuery({
    queryKey: ['reports-dcr', timeRange],
    queryFn: () => api.get('/daily-reports', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  // 2. Fetch Frequency & Coverage compliance
  const { data: complianceData, isLoading: loadingCompliance } = useQuery({
    queryKey: ['reports-compliance'],
    queryFn: () => api.get('/analytics/doctor-frequency-compliance').then((r) => r.data.data),
  });

  // 3. Fetch Doctors list
  const { data: doctorsData } = useQuery({
    queryKey: ['reports-doctors'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data.data),
  });

  // 4. Fetch Sample allocations
  const { data: samplesData, isLoading: loadingSamples } = useQuery({
    queryKey: ['reports-samples'],
    queryFn: () => api.get('/samples/rep-allocations').then((r) => r.data.data).catch(() => []),
  });

  // 5. Fetch Expenses
  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['reports-expenses'],
    queryFn: () => api.get('/expenses', { params: { limit: 100 } }).then((r) => r.data.data).catch(() => []),
  });

  // 6. Fetch Orders / Targets
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['reports-orders'],
    queryFn: () => api.get('/orders', { params: { limit: 100 } }).then((r) => r.data.data).catch(() => []),
  });

  // ── CSV EXPORT ENGINE ──────────────────────────────────────────────────────
  const exportToCSV = (filename: string, rows: any[], headers: string[]) => {
    if (!rows || rows.length === 0) {
      alert('No data available to export.');
      return;
    }
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val: any) => `"${String(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrentTab = () => {
    if (activeTab === 'dcr') {
      const rows = (dcrData?.reports || []).map((r: any) => [
        new Date(r.reportDate || r.createdAt).toLocaleDateString('en-IN'),
        r.user ? `${r.user.firstName} ${r.user.lastName}` : 'MR',
        r.visitType,
        r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : (r.retailer?.name || r.hospital?.name || 'Direct'),
        r.doctor?.specialty || 'General',
        r.productsDiscussed?.join('; ') || 'Standard Detailing',
        r.feedback || 'Completed',
      ]);
      exportToCSV('Pharmax_Consolidated_DCR_MIS', rows, ['Date', 'Medical Rep', 'Call Type', 'Entity Name', 'Specialty', 'Products Discussed', 'Call Feedback']);
    } else if (activeTab === 'coverage') {
      const zeroCalls = complianceData?.zeroCallDoctors || [];
      const rows = zeroCalls.map((d: any) => [
        d.doctorCode || 'DOC',
        `Dr. ${d.firstName} ${d.lastName}`,
        d.specialty,
        d.classification || 'A',
        d.city || 'Nagpur',
        d.territory?.name || 'Central',
        d.visitsThisMonth || 0,
        d.classification === 'A_PLUS' ? 4 : d.classification === 'A' ? 3 : 2,
        d.visitsThisMonth === 0 ? 'Zero-Call (Missed)' : 'Partial',
      ]);
      exportToCSV('Pharmax_Doctor_Coverage_ZeroCall_MIS', rows, ['Doctor Code', 'Doctor Name', 'Specialty', 'Class', 'City', 'Territory', 'Visits Conducted', 'Target Frequency', 'Compliance Status']);
    } else if (activeTab === 'pva') {
      const orders = ordersData?.orders || [];
      const rows = orders.map((o: any) => [
        o.orderNumber || o.id.slice(0, 8),
        new Date(o.createdAt).toLocaleDateString('en-IN'),
        o.retailer?.name || 'Chemist',
        o.user ? `${o.user.firstName} ${o.user.lastName}` : 'MR',
        o.status,
        o.totalAmount || 0,
      ]);
      exportToCSV('Pharmax_Sales_Orders_PvA_MIS', rows, ['Order No', 'Order Date', 'Retail Chemist', 'Booked By MR', 'Status', 'Total Value (INR)']);
    } else if (activeTab === 'samples') {
      const allocs = samplesData || [];
      const rows: any[] = [];
      allocs.forEach((rep: any) => {
        (rep.products || []).forEach((p: any) => {
          rows.push([
            rep.repName,
            rep.hqName,
            p.productName,
            p.batchNumber || 'B-2026',
            p.quota,
            p.distributed,
            p.bagBalance,
          ]);
        });
      });
      exportToCSV('Pharmax_Samples_Gifts_Ledger_MIS', rows, ['MR Name', 'HQ Base', 'Sample Brand', 'Batch Number', 'Allocated Quota', 'Given to Doctors', 'Bag Balance']);
    } else if (activeTab === 'expenses') {
      const expenses = expensesData?.expenses || expensesData || [];
      const rows = (Array.isArray(expenses) ? expenses : []).map((e: any) => [
        new Date(e.date || e.createdAt).toLocaleDateString('en-IN'),
        e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Field Staff',
        e.expenseType || 'TA/DA',
        e.amount,
        e.status || 'SUBMITTED',
        e.description || 'Field Travel',
      ]);
      exportToCSV('Pharmax_Expenses_TADA_Audit_MIS', rows, ['Claim Date', 'Employee', 'Expense Type', 'Amount (INR)', 'Approval Status', 'Purpose']);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" /> Executive MIS & Reporting Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated Management Information System (MIS) reports with 1-click exportable Excel/CSV formats
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrentTab}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" /> Export Active Report (.CSV)
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit flex-wrap">
          {[
            { key: 'dcr', label: 'Consolidated DCR', icon: Activity },
            { key: 'coverage', label: 'Doctor Coverage & Zero-Calls', icon: Users, badge: `${complianceData?.zeroCallCount || 0} Missed` },
            { key: 'pva', label: 'Sales & Orders MIS', icon: ShoppingCart },
            { key: 'samples', label: 'Samples & Gifts Ledger', icon: Gift },
            { key: 'expenses', label: 'Expense & TA/DA Claims', icon: Receipt },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/reports/call-reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-200 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Reports</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider">
              Live
            </span>
          </Link>
          <Link
            href="/dashboard/reports/mr-activity"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>MR Login & App Usage Report</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider">
              Live
            </span>
          </Link>
        </div>
      </div>

      {/* ── TAB 1: CONSOLIDATED DCR ── */}
      {activeTab === 'dcr' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Consolidated Daily Call Reports (DCR)</h2>
              <p className="text-xs text-slate-500">Record of field visits conducted by medical representatives</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{dcrData?.reports?.length || 0} DCR Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">MR (Staff)</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Products Detailed</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingDCR ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />Loading DCR MIS...</td></tr>
                ) : (dcrData?.reports || []).length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No DCR records found.</td></tr>
                ) : (
                  (dcrData?.reports || []).slice(0, 30).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {new Date(r.reportDate || r.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Field Rep'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-800">
                          {r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : (r.retailer?.name || r.hospital?.name || 'Direct')}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.doctor?.specialty || ''}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {r.visitType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {Array.isArray(r.productsDiscussed) ? r.productsDiscussed.join(', ') : 'Paracetamol, Hemovac'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: DOCTOR COVERAGE & ZERO-CALLS ── */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                Zero-Call Doctors (0 Visits This Month)
              </span>
              <span className="text-2xl font-black text-rose-900">{complianceData?.zeroCallCount || 0}</span>
              <p className="text-xs text-rose-600 mt-1">High priority doctors needing immediate visit</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Territory Coverage Rate
              </span>
              <span className="text-2xl font-black text-emerald-900">{complianceData?.coverageRate || 0}%</span>
              <p className="text-xs text-emerald-600 mt-1">{complianceData?.coveredDoctors || 0} of {complianceData?.totalDoctors || 0} Doctors visited</p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Over-Visited Doctors (4+ Visits)
              </span>
              <span className="text-2xl font-black text-amber-900">{complianceData?.overVisitedCount || 0}</span>
              <p className="text-xs text-amber-600 mt-1">Check for visit imbalance</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Zero-Call Doctors Action List</h2>
                <p className="text-xs text-slate-500">List of assigned doctors not visited even once in the current monthly cycle</p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                Requires Urgent Attention
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="px-5 py-3">Doctor Code</th>
                    <th className="px-5 py-3">Doctor Name</th>
                    <th className="px-5 py-3">Specialty</th>
                    <th className="px-5 py-3">Class</th>
                    <th className="px-5 py-3">Territory</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCompliance ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-600 mb-2" />Loading compliance data...</td></tr>
                  ) : (complianceData?.zeroCallDoctors || []).length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-emerald-600 font-bold"><CheckCircle2 className="w-6 h-6 mx-auto mb-1" />Excellent! All assigned doctors have received visits.</td></tr>
                  ) : (
                    (complianceData?.zeroCallDoctors || []).map((d: any) => (
                      <tr key={d.id} className="hover:bg-rose-50/30">
                        <td className="px-5 py-3 font-mono text-slate-600">{d.doctorCode || 'DOC-PX'}</td>
                        <td className="px-5 py-3 font-bold text-slate-900">Dr. {d.firstName} {d.lastName}</td>
                        <td className="px-5 py-3 text-slate-700">{d.specialty}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-800">
                            {d.classification || 'A'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{d.territory?.name || 'Nagpur'}</td>
                        <td className="px-5 py-3 text-slate-600">{d.phone || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> 0 Calls Done
                          </span>
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

      {/* ── TAB 3: SALES & ORDERS MIS ── */}
      {activeTab === 'pva' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Commercial Primary & Chemist Orders</h2>
              <p className="text-xs text-slate-500">Order bookings generated by the field force</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{(ordersData?.orders || []).length} Orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Chemist / Retailer</th>
                  <th className="px-5 py-3">Booked By</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingOrders ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />Loading Orders MIS...</td></tr>
                ) : (ordersData?.orders || []).length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No commercial orders booked yet.</td></tr>
                ) : (
                  (ordersData?.orders || []).slice(0, 30).map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono font-bold text-blue-600">{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="px-5 py-3 text-slate-700">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{o.retailer?.name || 'Chemist Partner'}</td>
                      <td className="px-5 py-3 text-slate-700">{o.user ? `${o.user.firstName} ${o.user.lastName}` : 'MR'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">
                        ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: SAMPLES & GIFTS LEDGER ── */}
      {activeTab === 'samples' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Physician Samples & LBL Bag Balance Ledger</h2>
              <p className="text-xs text-slate-500">Stock quotas allocated to MRs vs delivered to clinics</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{(samplesData || []).length} Field Representatives</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="px-5 py-3">Medical Rep</th>
                  <th className="px-5 py-3">Headquarter</th>
                  <th className="px-5 py-3">Sample Products</th>
                  <th className="px-5 py-3 text-center">Allocated Quota</th>
                  <th className="px-5 py-3 text-center">Given to Doctors</th>
                  <th className="px-5 py-3 text-center">Bag Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingSamples ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />Loading samples ledger...</td></tr>
                ) : (samplesData || []).length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No representative sample allocations recorded.</td></tr>
                ) : (
                  (samplesData || []).map((rep: any) => (
                    <tr key={rep.repId} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-bold text-slate-900">{rep.repName}</td>
                      <td className="px-5 py-3 text-slate-600">{rep.hqName}</td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          {(rep.products || []).slice(0, 3).map((p: any) => (
                            <div key={p.productId} className="text-[11px] text-slate-700">
                              <strong>{p.productName}</strong> ({p.batchNumber || 'Batch-A'})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">
                        {(rep.products || []).reduce((s: number, p: any) => s + p.quota, 0)} units
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-emerald-700">
                        {rep.totalDistributed} units
                      </td>
                      <td className="px-5 py-3 text-center font-black text-blue-700">
                        {(rep.products || []).reduce((s: number, p: any) => s + p.bagBalance, 0)} units
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: EXPENSE & TA/DA CLAIMS ── */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Field Travel & TA/DA Claims MIS</h2>
              <p className="text-xs text-slate-500">Reimbursement requests submitted by field force</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{(expensesData?.expenses || expensesData || []).length} Claims</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="px-5 py-3">Claim Date</th>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Expense Type</th>
                  <th className="px-5 py-3">Purpose / Remarks</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingExpenses ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />Loading expenses...</td></tr>
                ) : (Array.isArray(expensesData?.expenses || expensesData) ? (expensesData?.expenses || expensesData) : []).length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-400">No expense claims logged.</td></tr>
                ) : (
                  (expensesData?.expenses || expensesData || []).slice(0, 30).map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 text-slate-700">{new Date(e.date || e.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{e.user ? `${e.user.firstName} ${e.user.lastName}` : 'MR'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {e.expenseType || 'TA/DA'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{e.description || 'Clinic travel reimbursement'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {e.status || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">
                        ₹{Number(e.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
