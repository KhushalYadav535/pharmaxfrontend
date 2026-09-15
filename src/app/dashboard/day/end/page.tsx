'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Calendar as CalendarIcon, MapPin, CheckCircle, Clock, 
  FileText, ShoppingCart, Activity, Store, Building2, Package, ArrowRight, Home
} from 'lucide-react';
import Link from 'next/link';

export default function DayEndSummaryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));

  // Mocked data mirroring the mobile implementation
  const summaryData = {
    performance: { planned: 12, completed: 10, missed: 2, totalDuration: 345, totalTravel: 24 },
    callBreakdown: { doctors: 6, hospitals: 1, retailers: 2, stockists: 1 },
    business: { productsDetailed: 18, ordersBooked: 3, samplesDistributed: 45, newOpportunities: 2 },
    engagement: { positive: 8, neutral: 2, negative: 0 },
  };

  const { performance, callBreakdown, business } = summaryData;

  const completedPct = performance.planned > 0 ? Math.round((performance.completed / performance.planned) * 100) : 0;
  const formatDuration = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Day End Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Review your performance for today</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl bg-white shadow-sm">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-700">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2 border border-emerald-200 px-4 py-2 rounded-xl bg-emerald-50 shadow-sm">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-700 leading-none">GPS On</p>
              <p className="text-[10px] text-emerald-600/80">Location Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Performance Overview */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50" />
          
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Performance</h3>
          
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="text-gray-100 stroke-current" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="40" className="text-emerald-500 stroke-current" strokeWidth="8" fill="none" strokeDasharray={`${completedPct * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-gray-900">{completedPct}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Target</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Planned Calls</p>
                <p className="text-2xl font-bold text-gray-900">{performance.planned}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                  {performance.completed}
                  <CheckCircle className="w-5 h-5" />
                </p>
              </div>
              <div>
                <p className="text-xs text-red-500 mb-1">Missed</p>
                <p className="text-xl font-bold text-red-500">{performance.missed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Time & Travel</p>
                <p className="text-sm font-semibold text-gray-900">{formatDuration(performance.totalDuration)}</p>
                <p className="text-xs text-gray-400">{performance.totalTravel} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Impact */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Business Impact</h3>
          
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{business.productsDetailed}</p>
                <p className="text-xs text-gray-500">Products Detailed</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{business.ordersBooked}</p>
                <p className="text-xs text-gray-500">Orders Booked</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{business.samplesDistributed}</p>
                <p className="text-xs text-gray-500">Samples Given</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Breakdown */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Call Breakdown</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <Activity className="w-6 h-6 text-emerald-600 mb-2" />
            <p className="text-2xl font-black text-emerald-700">{callBreakdown.doctors}</p>
            <p className="text-xs font-semibold text-emerald-600/80">Doctors</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <Building2 className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-black text-blue-700">{callBreakdown.hospitals}</p>
            <p className="text-xs font-semibold text-blue-600/80">Hospitals</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <Store className="w-6 h-6 text-amber-600 mb-2" />
            <p className="text-2xl font-black text-amber-700">{callBreakdown.retailers}</p>
            <p className="text-xs font-semibold text-amber-600/80">Retailers</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex flex-col items-center text-center">
            <Package className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-black text-purple-700">{callBreakdown.stockists}</p>
            <p className="text-xs font-semibold text-purple-600/80">Stockists</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link 
          href="/dashboard/day/close"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md group"
        >
          Proceed to Close Day
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
