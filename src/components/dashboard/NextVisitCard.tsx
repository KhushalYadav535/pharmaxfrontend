// ─── VIS-001: Next Visit Card ─────────────────────────────────────────────────
// 3 cols, 260px height — doctor profile, stats grid, Start Navigation CTA

'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Calendar, Navigation, Pill, Stethoscope } from 'lucide-react';

interface NextVisitCardProps {
  visit: any | null;
}

export default function NextVisitCard({ visit }: NextVisitCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card" id="VIS-001">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Next Visit</h2>
        {visit && (
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg font-medium">
            {visit.distance ?? '1.2'} km
          </span>
        )}
      </div>

      {visit ? (
        <div>
          {/* Doctor profile */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {visit.doctor?.firstName?.[0] || 'D'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {visit.doctor?.specialization || 'General'} • {visit.doctor?.hospital || 'Clinic'}
              </p>
            </div>
          </div>

          {/* Appointment time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Clock className="w-3.5 h-3.5" />
            {new Date(visit.plannedDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} appointment
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-2.5 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900">{visit.lastVisitDays ?? '—'}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">Last Visit</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Pill className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900">{visit.lastRx ?? '—'}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">Last Rx</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {visit.doctor?.classification?.replace('_', '+') || 'A'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">Class</p>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard/visits"
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors shadow-md shadow-brand-600/20"
          >
            <Navigation className="w-4 h-4" /> Start Navigation
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-7 h-7 text-brand-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No upcoming visits</p>
          <p className="text-xs text-gray-400 mt-1">All visits for today are completed!</p>
          <Link href="/dashboard/visits" className="text-brand-600 text-sm font-medium mt-3 hover:text-brand-700">
            Plan a new visit →
          </Link>
        </div>
      )}
    </div>
  );
}
