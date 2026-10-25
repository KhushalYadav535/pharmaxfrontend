'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Loader2, ArrowRight } from 'lucide-react';

export default function AttendanceRegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/attendance');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
        <Clock className="w-7 h-7 text-emerald-600 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Redirecting to Field Attendance...</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Daily Attendance has been consolidated under Field Operations & Roll-Call for unified daily presence tracking.
      </p>
      <Link
        href="/dashboard/attendance"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors"
      >
        <span>Open Field Attendance</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
