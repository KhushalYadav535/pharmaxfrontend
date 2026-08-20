'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Clock, MapPin, Loader2, Calendar, CheckCircle, AlertCircle, Coffee } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700',
  ABSENT: 'bg-red-50 text-red-700',
  HALF_DAY: 'bg-amber-50 text-amber-700',
  ON_LEAVE: 'bg-blue-50 text-blue-700',
  HOLIDAY: 'bg-purple-50 text-purple-700',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  const { data: today, isLoading: todayLoading, refetch: refetchToday } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: monthly } = useQuery({
    queryKey: ['attendance-monthly'],
    queryFn: () => api.get('/attendance/monthly-summary').then((r) => r.data.data),
  });

  const { data: history } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => api.get('/attendance', { params: { limit: 30 } }).then((r) => r.data.data),
  });

  const clockIn = () => {
    setClockingIn(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.post('/attendance/clock-in', { lat: pos.coords.latitude, lng: pos.coords.longitude, address: 'GPS Location' })
          .then(() => { qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-history'] }); })
          .catch((err) => alert(err.response?.data?.message || 'Clock-in failed'))
          .finally(() => setClockingIn(false));
      },
      () => {
        api.post('/attendance/clock-in', { lat: 19.076, lng: 72.877, address: 'Office' })
          .then(() => { qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-history'] }); })
          .catch((err) => alert(err.response?.data?.message || 'Clock-in failed'))
          .finally(() => setClockingIn(false));
      }
    );
  };

  const clockOut = () => {
    setClockingOut(true);
    api.patch('/attendance/clock-out')
      .then(() => { qc.invalidateQueries({ queryKey: ['attendance-today'] }); qc.invalidateQueries({ queryKey: ['attendance-history'] }); })
      .catch((err) => alert(err.response?.data?.message || 'Clock-out failed'))
      .finally(() => setClockingOut(false));
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isCheckedIn = !!today?.checkInTime;
  const isCheckedOut = !!today?.checkOutTime;

  function calcHours(checkIn: string, checkOut?: string) {
    const start = new Date(checkIn).getTime();
    const end = checkOut ? new Date(checkOut).getTime() : Date.now();
    const hours = (end - start) / (1000 * 60 * 60);
    return hours.toFixed(1);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-emerald-600" /> Attendance
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your daily attendance and leaves</p>
      </div>

      {/* Clock In/Out Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
        <div className="relative">
          <div className="text-4xl font-bold mb-1">{timeStr}</div>
          <p className="text-emerald-200 text-sm">{formatDate(new Date())}</p>

          <div className="mt-6 flex items-center gap-4">
            {todayLoading ? (
              <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
            ) : isCheckedOut ? (
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="text-sm font-semibold">Day Complete</p>
                  <p className="text-xs text-emerald-200">{calcHours(today.checkInTime, today.checkOutTime)}h worked</p>
                </div>
              </div>
            ) : isCheckedIn ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  <div>
                    <p className="text-sm font-semibold">Clocked In</p>
                    <p className="text-xs text-emerald-200">{new Date(today.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {calcHours(today.checkInTime)}h elapsed</p>
                  </div>
                </div>
                <button onClick={clockOut} disabled={clockingOut} className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60">
                  {clockingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Clock Out
                </button>
              </div>
            ) : (
              <button onClick={clockIn} disabled={clockingIn} className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl transition-all hover:shadow-lg text-sm disabled:opacity-60">
                {clockingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Clock In with GPS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {monthly && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: monthly.summary.present, icon: CheckCircle, color: 'emerald' },
            { label: 'Absent', value: monthly.summary.absent, icon: AlertCircle, color: 'red' },
            { label: 'Half Day', value: monthly.summary.halfDay, icon: Coffee, color: 'amber' },
            { label: 'On Leave', value: monthly.summary.onLeave, icon: Calendar, color: 'blue' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 text-${color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label} this month</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Calendar Heatmap */}
      {history?.records && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">This Month — Attendance Calendar</h2>
          </div>
          <div className="p-5">
            {(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDay = new Date(year, month, 1).getDay();
              const recordMap: Record<string, any> = {};
              (history.records || []).forEach((r: any) => {
                const key = new Date(r.date).getDate().toString();
                recordMap[key] = r;
              });
              const statusColor: Record<string, string> = {
                PRESENT: 'bg-emerald-500 text-white', ABSENT: 'bg-red-400 text-white',
                HALF_DAY: 'bg-amber-400 text-white', ON_LEAVE: 'bg-blue-400 text-white',
                HOLIDAY: 'bg-purple-400 text-white',
              };
              return (
                <div>
                  <div className="grid grid-cols-7 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const d = i + 1;
                      const rec = recordMap[d.toString()];
                      const isToday = d === today.getDate();
                      const isFuture = d > today.getDate();
                      return (
                        <div key={d} title={rec?.status || (isFuture ? 'Upcoming' : 'No record')} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all ${isToday ? 'ring-2 ring-emerald-500' : ''} ${rec ? (statusColor[rec.status] || 'bg-gray-100 text-gray-600') : isFuture ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 flex-wrap">
                    {[['PRESENT', 'bg-emerald-500', 'Present'], ['ABSENT', 'bg-red-400', 'Absent'], ['HALF_DAY', 'bg-amber-400', 'Half Day'], ['ON_LEAVE', 'bg-blue-400', 'On Leave'], ['HOLIDAY', 'bg-purple-400', 'Holiday']].map(([, color, label]) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className={`w-3 h-3 rounded-md ${color}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Attendance History</h2>
          <span className="text-xs text-gray-500">Last 30 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date', 'Status', 'Clock In', 'Clock Out', 'Hours'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history?.records?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No attendance records yet</td></tr>
              ) : history?.records?.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{formatDate(record.date)}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[record.status] || 'bg-gray-50 text-gray-600'}`}>{record.status.replace('_', ' ')}</span></td>
                  <td className="px-5 py-4 text-gray-600">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4 font-medium text-gray-700">
                    {record.checkInTime ? `${calcHours(record.checkInTime, record.checkOutTime)}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
