'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ReportsHubPage() {
  const router = useRouter();

  const reports = [
    {
      title: 'Daily Reports',
      description: 'View and export daily MR activity logs, calls made, and expenses.',
      icon: FileText,
      href: '/dashboard/daily-reports',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Stock Reports',
      description: 'Monitor stockist inventory, pending orders, and supply chain metrics.',
      icon: BarChart3,
      href: '/dashboard/stock-reports',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Sales Analytics',
      description: 'Deep dive into sales trends, target achievements, and regional growth.',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Tour Plans',
      description: 'Review historical tour plans, approvals, and deviations.',
      icon: Calendar,
      href: '/dashboard/tour-planning',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports Hub</h1>
            <p className="text-sm text-gray-500">Access all your analytics and exportable reports</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, i) => (
          <Link 
            key={i} 
            href={report.href}
            className="group flex flex-col bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 ${report.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <report.icon className={`w-7 h-7 ${report.color}`} />
              </div>
              <button className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full flex items-center justify-center transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
              {report.title}
            </h2>
            <p className="text-gray-500 leading-relaxed">
              {report.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
