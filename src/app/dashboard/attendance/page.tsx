'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Clock, MapPin, Loader2, Calendar, CheckCircle, AlertCircle, Coffee,
  Users, Search, Filter, ShieldCheck, ArrowRight, ExternalLink, CalendarDays,
  UserCheck, UserX, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  HALF_DAY: 'bg-amber-50 text-amber-700 border-amber-200',
  ON_LEAVE: 'bg-sky-50 text-sky-700 border-sky-200',
  HOLIDAY: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isAdminOrManager = ['SUPER_ADMIN', 'SALES_ADMIN', 'NSM', 'ZM', 'RSM', 'ASM'].includes(user?.role || '');
  const [activeTab, setActiveTab] = useState<'team' | 'personal'>(isAdminOrManager ? 'team' : 'personal');

  // Personal clock state
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  // Team view state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [teamSearch, setTeamSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // 1. Personal status queries
  const { data: today, isLoading: todayLoading } = useQuery({
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

  // 2. Team attendance query for managers
  const { data: teamAttendance, isLoading: teamLoading, refetch: refetchTeam } = useQuery({
    queryKey: ['team-attendance', selectedDate],
    queryFn: async () => {
      const fromDate = `${selectedDate}T00:00:00.000Z`;
      const toDate = `${selectedDate}T23:59:59.999Z`;
      const res = await api.get('/attendance', {
        params: { fromDate, toDate, limit: 100 },
      });
      return res.data.data;
    },
    enabled: isAdminOrManager,
  });

  // Employees master list to show roll-call completeness
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-attendance'],
    queryFn: () => api.get('/employees', { params: { limit: 100 } }).then((r) => r.data.data?.employees || []),
    enabled: isAdminOrManager,
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
    return Math.max(0, hours).toFixed(1);
  }

  // Team roll-call calculations
  const teamRecords = teamAttendance?.records || [];
  const clockedInIds = new Set(teamRecords.map((r: any) => r.userId));

  const totalEmployees = employeesData?.length || teamRecords.length || 0;
  const presentCount = teamRecords.filter((r: any) => r.status === 'PRESENT').length;
  const activeInField = teamRecords.filter((r: any) => r.checkInTime && !r.checkOutTime).length;
  const dayEndedCount = teamRecords.filter((r: any) => r.checkOutTime).length;
  const notClockedCount = Math.max(0, totalEmployees - teamRecords.length);

  const filteredTeamRecords = useMemo(() => {
    return teamRecords.filter((r: any) => {
      const name = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.toLowerCase();
      const matchSearch = !teamSearch || name.includes(teamSearch.toLowerCase()) || r.user?.role?.toLowerCase().includes(teamSearch.toLowerCase());
      const matchStatus = !statusFilter || r.status === statusFilter || (statusFilter === 'ACTIVE' && r.checkInTime && !r.checkOutTime);
      return matchSearch && matchStatus;
    });
  }, [teamRecords, teamSearch, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" /> Field Attendance & Roll-Call
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Real-time daily field force presence, GPS check-in audit, and attendance records
          </p>
        </div>

        {isAdminOrManager && (
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'team'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Team Roster (Roll-Call)
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'personal'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" /> My Clock-In
            </button>
          </div>
        )}
      </div>

      {/* ── MODE 1: ADMIN TEAM ROLL-CALL BOARD ── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Field Reps</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalEmployees}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active field staff</p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Present Today</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{presentCount}</p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">
                {totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}% attendance rate
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">In Field (Active)</span>
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              </div>
              <p className="text-2xl font-black text-blue-700">{activeInField}</p>
              <p className="text-[11px] text-blue-600/80 mt-0.5">Currently calling doctors</p>
            </div>

            <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm bg-gradient-to-br from-purple-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Day Closed</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-700">{dayEndedCount}</p>
              <p className="text-[11px] text-purple-600/80 mt-0.5">Clocked out for day</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Not Yet Clocked</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700">{notClockedCount}</p>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Pending morning check-in</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <label className="text-[11px] font-bold text-slate-400 uppercase">Roll-Call Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => { setSelectedDate(todayStr); refetchTeam(); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search MR name or role..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ACTIVE">Currently Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
              </select>

              <button
                onClick={() => refetchTeam()}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Refresh team records"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Team Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="text-left px-5 py-3.5">Field Rep & Role</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-left px-5 py-3.5">Check-In Time</th>
                    <th className="text-left px-5 py-3.5">GPS Location / Address</th>
                    <th className="text-left px-5 py-3.5">Check-Out</th>
                    <th className="text-left px-5 py-3.5">Field Duration</th>
                    <th className="text-right px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-5 py-4">
                          <div className="h-6 bg-slate-100 rounded-xl animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTeamRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-bold text-slate-700">No attendance records found for this date</p>
                        <p className="text-xs text-slate-400 mt-1">Field force may not have clocked in yet</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeamRecords.map((r: any) => {
                      const isActive = r.checkInTime && !r.checkOutTime;
                      const hasGps = r.checkInLat && r.checkInLng;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                                {r.user?.firstName?.[0] || 'M'}{r.user?.lastName?.[0] || 'R'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs">
                                  {r.user?.firstName} {r.user?.lastName}
                                </p>
                                <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                                  {r.user?.role || 'Medical Rep'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                STATUS_COLORS[r.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              {r.status?.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {r.checkInTime ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{new Date(r.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {hasGps ? (
                              <a
                                href={`https://www.google.com/maps?q=${r.checkInLat},${r.checkInLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{r.notes || `${Number(r.checkInLat).toFixed(4)}, ${Number(r.checkInLng).toFixed(4)}`}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">{r.notes || 'Office / Manual'}</span>
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {r.checkOutTime ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-purple-600" />
                                <span>{new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                In Progress
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 font-bold text-slate-800">
                            {r.checkInTime ? `${calcHours(r.checkInTime, r.checkOutTime)} hrs` : '—'}
                          </td>

                          <td className="px-5 py-4 text-right">
                            {r.userId && (
                              <Link
                                href={`/dashboard/masters/employees/${r.userId}`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" /> Dossier
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: PERSONAL CLOCK-IN / OUT & HEATMAP ── */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          {/* Clock In/Out Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24" />
            <div className="relative">
              <div className="text-4xl font-black tracking-tight mb-1">{timeStr}</div>
              <p className="text-emerald-200 text-sm font-medium">{formatDate(new Date())}</p>

              <div className="mt-6 flex items-center gap-4">
                {todayLoading ? (
                  <div className="h-10 w-32 bg-white/20 rounded-xl animate-pulse" />
                ) : isCheckedOut ? (
                  <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-5 py-3">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-bold">Field Day Complete</p>
                      <p className="text-xs text-emerald-200">{calcHours(today.checkInTime, today.checkOutTime)}h worked</p>
                    </div>
                  </div>
                ) : isCheckedIn ? (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-white/20 rounded-2xl px-5 py-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse" />
                      <div>
                        <p className="text-sm font-bold">Clocked In (Active in Field)</p>
                        <p className="text-xs text-emerald-200">
                          {new Date(today.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {calcHours(today.checkInTime)}h elapsed
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clockOut}
                      disabled={clockingOut}
                      className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-2xl transition-colors text-xs uppercase tracking-wider shadow-sm disabled:opacity-60"
                    >
                      {clockingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Clock Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={clockIn}
                    disabled={clockingIn}
                    className="flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-7 py-3.5 rounded-2xl transition-all hover:shadow-lg text-sm disabled:opacity-60"
                  >
                    {clockingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-emerald-600" />}
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
                { label: 'Absent', value: monthly.summary.absent, icon: AlertCircle, color: 'rose' },
                { label: 'Half Day', value: monthly.summary.halfDay, icon: Coffee, color: 'amber' },
                { label: 'On Leave', value: monthly.summary.onLeave, icon: Calendar, color: 'blue' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 text-${color}-600`} />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label} this month</p>
                </div>
              ))}
            </div>
          )}

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-sm">Personal Attendance History</h2>
              <span className="text-xs text-slate-500 font-medium">Last 30 days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="text-left px-5 py-3.5">Date</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-left px-5 py-3.5">Clock In</th>
                    <th className="text-left px-5 py-3.5">Clock Out</th>
                    <th className="text-left px-5 py-3.5">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history?.records?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        No attendance records yet
                      </td>
                    </tr>
                  ) : (
                    history?.records?.map((record: any) => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">{formatDate(record.date)}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[record.status] || 'bg-slate-50 text-slate-600'}`}>
                            {record.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-semibold">
                          {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-semibold">
                          {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-5 py-4 font-black text-slate-800">
                          {record.checkInTime ? `${calcHours(record.checkInTime, record.checkOutTime)}h` : '—'}
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
    </div>
  );
}
