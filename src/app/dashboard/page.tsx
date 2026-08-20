'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { formatDate, formatRole } from '@/lib/utils';
import {
  Users, MapPin, CheckCircle, Clock, TrendingUp, AlertCircle,
  ArrowRight, Brain, Calendar, Activity, Target,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#059669', '#34d399', '#6ee7b7', '#a7f3d0'];

function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isMgr = ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(user?.role || '');

  const { data: visitStats } = useQuery({
    queryKey: ['visit-today-stats'],
    queryFn: () => api.get('/visits/today-stats').then((r) => r.data.data),
  });

  const { data: doctorStats } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => api.get('/doctors/stats').then((r) => r.data.data),
  });

  const { data: visitTrend } = useQuery({
    queryKey: ['visit-trend'],
    queryFn: () => api.get('/analytics/visit-trend').then((r) => r.data.data),
  });

  const { data: teamProductivity } = useQuery({
    queryKey: ['team-productivity'],
    queryFn: () => api.get('/analytics/team-productivity').then((r) => r.data.data),
    enabled: isMgr,
  });

  const { data: doctorClassification } = useQuery({
    queryKey: ['doctor-classification'],
    queryFn: () => api.get('/analytics/doctor-classification').then((r) => r.data.data),
  });

  const { data: recentVisits } = useQuery({
    queryKey: ['recent-visits'],
    queryFn: () => api.get('/visits?limit=5').then((r) => r.data.data.visits),
  });

  const { data: retailerCoverage } = useQuery({
    queryKey: ['retailer-coverage-dash'],
    queryFn: () => api.get('/analytics/retailer-coverage').then((r) => r.data.data),
  });

  const { data: distributorStats } = useQuery({
    queryKey: ['distributor-stats-dash'],
    queryFn: () => api.get('/analytics/distributor-stats').then((r) => r.data.data),
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats-dash'],
    queryFn: () => api.get('/analytics/order-stats').then((r) => r.data.data),
  });

  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats-dash'],
    queryFn: () => api.get('/retail-audit/stats/summary').then((r) => r.data.data),
  });


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(new Date())} · {formatRole(user?.role || '')}</p>
        </div>
        <Link
          href="/dashboard/visits"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <MapPin className="w-4 h-4" /> Check In
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Visits Today"
          value={visitStats?.completed ?? '—'}
          subtitle={`${visitStats?.planned ?? 0} planned`}
          icon={MapPin}
          trend={visitStats?.planned ? `${Math.round(((visitStats?.completed || 0) / visitStats.planned) * 100)}%` : undefined}
        />
        <KpiCard
          title="Total Doctors"
          value={doctorStats?.total ?? '—'}
          subtitle={`${doctorStats?.kolCount ?? 0} KOLs`}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Pending Approvals"
          value={visitStats?.pending ?? '—'}
          subtitle="Visits awaiting review"
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Missed Today"
          value={visitStats?.missed ?? '—'}
          subtitle="Requires follow-up"
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* CRM KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Retailers"
          value={retailerCoverage?.totalRetailers ?? '—'}
          subtitle={`${retailerCoverage?.uniqueRetailers ?? 0} visited`}
          icon={Activity}
          color="emerald"
        />
        <KpiCard
          title="Retailer Coverage"
          value={retailerCoverage?.coverageRate != null ? `${retailerCoverage.coverageRate}%` : '—'}
          subtitle="Field coverage rate"
          icon={Target}
          color="blue"
        />
        <KpiCard
          title="Distributors"
          value={distributorStats?.total ?? '—'}
          subtitle={`${distributorStats?.utilizationRate ?? 0}% credit used`}
          icon={Calendar}
          color="violet"
        />
        <KpiCard
          title="Orders Delivered"
          value={orderStats?.byStatus?.find((s: any) => s.status === 'DELIVERED')?._count ?? 0}
          subtitle={`₹${((orderStats?.totalRevenue ?? 0) / 100000).toFixed(1)}L revenue`}
          icon={CheckCircle}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Visit Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Monthly Visit Trend</h2>
            <Link href="/dashboard/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {visitTrend ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={visitTrend} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#F0FDF4' }}
                />
                <Bar dataKey="visits" fill="#059669" radius={[4, 4, 0, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Loading analytics...</p>
              </div>
            </div>
          )}
        </div>

        {/* Doctor Classification Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5">Doctor Classification</h2>
          {doctorClassification && doctorClassification.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={doctorClassification} dataKey="_count" nameKey="classification" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {doctorClassification.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Doctors']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {doctorClassification.map((item: any, i: number) => (
                  <div key={item.classification} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{item.classification.replace('_', '+')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item._count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-gray-400 text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Visits */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Visits</h2>
            <Link href="/dashboard/visits" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              All visits <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentVisits && recentVisits.length > 0 ? (
            <div className="space-y-3">
              {recentVisits.map((visit: any) => (
                <div key={visit.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    visit.status === 'COMPLETED' ? 'bg-emerald-500' :
                    visit.status === 'PLANNED' ? 'bg-blue-400' : 'bg-red-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {visit.doctor ? `Dr. ${visit.doctor.firstName} ${visit.doctor.lastName}` :
                       visit.retailer ? visit.retailer.name :
                       visit.distributor ? visit.distributor.name : 'Visit'}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(visit.plannedDate)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0 ${
                    visit.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    visit.status === 'PLANNED' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No visits yet</p>
              <Link href="/dashboard/visits" className="text-emerald-600 text-sm font-medium mt-1 hover:text-emerald-700">Plan your first visit →</Link>
            </div>
          )}
        </div>

        {/* Team / AI Panel */}
        {isMgr && teamProductivity && teamProductivity.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Team Productivity</h2>
              <Link href="/dashboard/analytics" className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {teamProductivity.slice(0, 5).map((member: any) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.firstName} {member.lastName}</p>
                      <span className="text-xs font-semibold text-gray-700">{member.rate}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${member.rate}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-emerald-200" />
              <h2 className="font-semibold">AI Daily Insight</h2>
            </div>
            <p className="text-emerald-100 text-sm leading-relaxed mb-4">
              You have {visitStats?.planned || 0} visits planned today.
              {visitStats?.missed ? ` ${visitStats.missed} visit(s) from yesterday are unresolved.` : ' Great start — all visits from yesterday are resolved!'}
            </p>
            <Link href="/dashboard/ai" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-emerald-100 transition-colors">
              Open AI Copilot <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
