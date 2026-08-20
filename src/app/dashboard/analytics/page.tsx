'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BarChart3, TrendingUp, Users, MapPin, DollarSign, Target, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { formatCurrency, CLASSIFICATION_COLORS } from '@/lib/utils';
import { useState } from 'react';

const COLORS = ['#059669', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];
const PIE_COLORS = ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', change }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'expenses' | 'retailers' | 'distributors'>('overview');

  const { data: visitCoverage } = useQuery({
    queryKey: ['visit-coverage'],
    queryFn: () => api.get('/analytics/doctor-coverage').then((r) => r.data.data),
  });

  const { data: visitTrend } = useQuery({
    queryKey: ['visit-trend'],
    queryFn: () => api.get('/analytics/visit-trend').then((r) => r.data.data),
  });

  const { data: classification } = useQuery({
    queryKey: ['doctor-classification'],
    queryFn: () => api.get('/analytics/doctor-classification').then((r) => r.data.data),
  });

  const { data: topDoctors } = useQuery({
    queryKey: ['top-doctors'],
    queryFn: () => api.get('/analytics/top-doctors').then((r) => r.data.data),
  });

  const { data: teamProductivity } = useQuery({
    queryKey: ['team-productivity'],
    queryFn: () => api.get('/analytics/team-productivity').then((r) => r.data.data),
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => api.get('/analytics/expense-summary').then((r) => r.data.data),
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

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => api.get('/analytics/order-stats').then((r) => r.data.data),
    enabled: activeTab === 'overview',
  });

  const { data: visitTypeBreakdown } = useQuery({
    queryKey: ['visit-type-breakdown'],
    queryFn: () => api.get('/analytics/visit-type-breakdown').then((r) => r.data.data),
  });

  const isMgr = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(user?.role || '');


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" /> Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Performance insights and team metrics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'retailers', label: 'Retailers' },
          { key: 'distributors', label: 'Distributors' },
          ...(isMgr ? [{ key: 'team', label: 'Team' }] : []),
          { key: 'expenses', label: 'Expenses' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Coverage KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Visits" value={visitCoverage?.totalVisits ?? '—'} icon={MapPin} change={8} />
            <StatCard title="Completed" value={visitCoverage?.completedVisits ?? '—'} icon={Activity} color="blue" />
            <StatCard title="Coverage Rate" value={visitCoverage ? `${visitCoverage.coverageRate}%` : '—'} icon={Target} color="violet" change={visitCoverage?.coverageRate - 80} />
            <StatCard title="Doctors Covered" value={visitCoverage?.uniqueDoctors ?? '—'} icon={Users} color="amber" />
          </div>

          {/* Visit trend + Classification */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900">Visit Trend (6 Months)</h2>
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

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-5">Doctor Classification</h2>
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
                          <span className="text-gray-600">{item.classification.replace('_', '+')}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{item._count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>}
            </div>
          </div>

          {/* Top Doctors */}
          {topDoctors && topDoctors.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-5">Most Visited Doctors</h2>
              <div className="space-y-3">
                {topDoctors.slice(0, 8).map((doc: any, i: number) => {
                  const maxVisits = topDoctors[0]?.visits || 1;
                  return (
                    <div key={doc.id || i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                        {doc.firstName?.[0]}{doc.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                          <span className="text-xs font-bold text-emerald-700">{doc.visits} visits</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(doc.visits / maxVisits) * 100}%` }} />
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${CLASSIFICATION_COLORS[doc.classification] || 'bg-gray-50 text-gray-600'}`}>{doc.classification?.replace('_', '+')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'team' && isMgr && (
        <div className="space-y-6">
          {teamProductivity && teamProductivity.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-5">Team Visit Completion Rate (This Month)</h2>
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

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Team Performance Details</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['MR Name', 'Role', 'Planned', 'Completed', 'Rate', 'Status'].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teamProductivity.map((member: any) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{member.firstName[0]}{member.lastName[0]}</div>
                            <span className="font-medium text-gray-900">{member.firstName} {member.lastName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{member.role}</td>
                        <td className="px-5 py-3.5 text-gray-600">{member.planned}</td>
                        <td className="px-5 py-3.5 text-gray-600">{member.completed}</td>
                        <td className="px-5 py-3.5 font-semibold">{member.rate}%</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${member.rate >= 80 ? 'bg-emerald-50 text-emerald-700' : member.rate >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                            {member.rate >= 80 ? 'On Track' : member.rate >= 60 ? 'Needs Attention' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">No team members found. You may need to be assigned as a manager.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm col-span-2 lg:col-span-1">
              <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(expenseSummary?.totalAmount || 0)}</p>
            </div>
            {expenseSummary?.byCategory?.slice(0, 4).map((cat: any) => (
              <div key={cat.category} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{cat.category}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(cat._sum.amount || 0)}</p>
                <p className="text-xs text-gray-400">{cat._count} claims</p>
              </div>
            ))}
          </div>

          {expenseSummary?.byCategory?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-5">Expense by Category</h2>
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

      {activeTab === 'retailers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Retailers', value: retailerCoverage?.totalRetailers ?? '—' },
              { label: 'Retailers Visited', value: retailerCoverage?.uniqueRetailers ?? '—' },
              { label: 'Coverage Rate', value: retailerCoverage?.coverageRate != null ? `${retailerCoverage.coverageRate}%` : '—' },
              { label: 'Total Retailer Visits', value: retailerCoverage?.completed ?? '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {retailerCoverage && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Retailer Coverage Progress</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Coverage Rate</span>
                <span className="font-bold text-gray-900">{retailerCoverage.uniqueRetailers}/{retailerCoverage.totalRetailers} ({retailerCoverage.coverageRate}%)</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${retailerCoverage.coverageRate}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'distributors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Distributors', value: distributorStats?.total ?? '—' },
              { label: 'Credit Limit', value: distributorStats?.totalCreditLimit != null ? `₹${(distributorStats.totalCreditLimit / 100000).toFixed(1)}L` : '—' },
              { label: 'Outstanding', value: distributorStats?.totalOutstanding != null ? `₹${(distributorStats.totalOutstanding / 100000).toFixed(1)}L` : '—' },
              { label: 'Credit Utilization', value: distributorStats?.utilizationRate != null ? `${distributorStats.utilizationRate}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {distributorStats && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio Credit Health</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Credit Utilization</span>
                <span className={`font-bold ${(distributorStats.utilizationRate ?? 0) >= 80 ? 'text-red-600' : 'text-gray-900'}`}>{distributorStats.utilizationRate ?? 0}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${(distributorStats.utilizationRate ?? 0) >= 80 ? 'bg-red-500' : (distributorStats.utilizationRate ?? 0) >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${distributorStats.utilizationRate ?? 0}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>₹0</span><span>₹{((distributorStats.totalCreditLimit ?? 0) / 100000).toFixed(1)}L limit</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
