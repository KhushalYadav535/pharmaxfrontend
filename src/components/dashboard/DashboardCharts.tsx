'use client';

import React from 'react';
import { useVisitTrend, useOrderStats, useDoctorClassification } from '@/lib/dashboard.api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Loader2, TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';

export default function DashboardCharts() {
  const { data: visitTrend, isLoading: isLoadingVisits } = useVisitTrend();
  const { data: orderStats, isLoading: isLoadingOrders } = useOrderStats();
  const { data: docClass, isLoading: isLoadingDocs } = useDoctorClassification();

  // Color Palette
  const COLORS = {
    brand: '#00B45A',     // Green
    brandLight: '#CCF0DE',
    blue: '#3B82F6',
    blueLight: '#DBEAFE',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    violet: '#8B5CF6',
    violetLight: '#EDE9FE',
    pink: '#EC4899',
    gray: '#E5E7EB'
  };

  // Prepare Order Data for Pie Chart
  const orderData = React.useMemo(() => {
    if (!orderStats?.byStatus) return [];
    return orderStats.byStatus.map((s: any) => ({
      name: s.status,
      value: s._count,
      color: s.status === 'DELIVERED' ? COLORS.brand : s.status === 'SHIPPED' ? COLORS.blue : s.status === 'CONFIRMED' ? COLORS.violet : s.status === 'CANCELLED' ? '#EF4444' : COLORS.amber
    }));
  }, [orderStats]);

  // Prepare Doctor Classification Data for Bar Chart
  const docData = React.useMemo(() => {
    if (!docClass) return [];
    return docClass.map((d: any) => ({
      name: `Class ${d.classification || 'Unknown'}`,
      count: d._count,
      fill: d.classification === 'A' ? COLORS.brand : d.classification === 'B' ? COLORS.blue : COLORS.amber
    }));
  }, [docClass]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-bold text-gray-800 mb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-gray-600 capitalize">{entry.name}:</span>
              <span className="font-bold text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* 1. Visit Trend Area Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2 flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-50 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
          <h3 className="font-bold text-gray-900">Visit Trends (Last 6 Months)</h3>
        </div>
        <div className="flex-1 w-full relative">
          {isLoadingVisits ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : !visitTrend || visitTrend.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="visits" name="Visits" stroke={COLORS.blue} strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Order Pipeline Donut Chart */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-brand-50 rounded-lg"><PieChartIcon className="w-4 h-4 text-brand-600" /></div>
          <h3 className="font-bold text-gray-900">Order Pipeline</h3>
        </div>
        <div className="flex-1 w-full relative">
          {isLoadingOrders ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : orderData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">No orders found</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {orderData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Doctor Classification Bar Chart (Span Full Row) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm col-span-1 lg:col-span-3 flex flex-col h-[280px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg"><BarChart2 className="w-4 h-4 text-amber-600" /></div>
          <h3 className="font-bold text-gray-900">Doctor Classifications in Territory</h3>
        </div>
        <div className="flex-1 w-full relative">
          {isLoadingDocs ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : docData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">No doctors classified</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.gray} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: COLORS.gray, opacity: 0.2 }} content={<CustomTooltip />} />
                <Bar dataKey="count" name="Doctors" radius={[0, 4, 4, 0]} barSize={30}>
                  {docData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
