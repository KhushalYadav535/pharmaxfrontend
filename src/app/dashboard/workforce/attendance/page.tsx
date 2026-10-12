'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Clock, Calendar, Users, Filter, Search, AlertTriangle, CheckCircle2,
  MapPin, ChevronRight, RefreshCw, Eye, ArrowUpRight, CheckSquare,
  Building2, Briefcase, ExternalLink, ShieldAlert, Award
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AttendanceRegisterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);

  // Filter states
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDiv, setSelectedDiv] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Map / Details modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const fetchFilters = async () => {
    try {
      const [deptRes, divRes] = await Promise.all([
        api.get('/hrms/org/departments'),
        api.get('/hrms/org/divisions'),
      ]);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (divRes.data?.success) setDivisions(divRes.data.data);
    } catch (e) {
      console.error('Error fetching org filters:', e);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('fromDate', selectedDate);
        params.append('toDate', selectedDate);
      }
      if (selectedDept) params.append('departmentId', selectedDept);
      if (selectedDiv) params.append('divisionId', selectedDiv);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', String(page));
      params.append('limit', '40');

      const res = await api.get(`/hrms/attendance/register?${params.toString()}`);
      if (res.data?.success) {
        setData(res.data.data.records);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Error fetching attendance register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedDept, selectedDiv, selectedStatus, page]);

  // Client-side search filtering
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.toLowerCase();
    const code = (item.user?.employeeId || '').toLowerCase();
    const dept = (item.user?.departmentRel?.name || '').toLowerCase();
    return fullName.includes(q) || code.includes(q) || dept.includes(q);
  });

  // Calculate high-level KPIs
  const presentCount = data.filter((d) => d.status === 'PRESENT').length;
  const halfDayCount = data.filter((d) => d.status === 'HALF_DAY').length;
  const inProgressCount = data.filter((d) => d.dayStatus === 'IN_PROGRESS').length;
  const exceptionsCount = data.reduce((acc, curr) => acc + (curr.exceptions?.length || 0), 0);
  const totalMinutes = data.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalHoursLogged = (totalMinutes / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Workforce & HRMS</span>
            <span>/</span>
            <span className="text-emerald-700 font-medium">Attendance Register</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Attendance Register</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time biometric & GPS field check-ins, working durations, and attendance exceptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/attendance/exceptions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Exceptions ({exceptionsCount})
          </Link>
          <Link
            href="/dashboard/workforce/attendance/regularization"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            Regularization Queue
          </Link>
          <button
            onClick={() => fetchAttendance()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh Register"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Records</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{total}</div>
          <p className="text-xs text-slate-500 mt-1">Logged for {selectedDate}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{presentCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Full-day credit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Half Day</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{halfDayCount}</div>
          <p className="text-xs text-amber-600 mt-1">&lt; 4 hours duration</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Field In-Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{inProgressCount}</div>
          <p className="text-xs text-blue-600 mt-1">Yet to close day</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Field Hours</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{totalHoursLogged} hrs</div>
          <p className="text-xs text-purple-600 mt-1">Cumulative duration</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Division</label>
            <select
              value={selectedDiv}
              onChange={(e) => setSelectedDiv(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Divisions</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>{div.name} ({div.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Search Employee</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Name, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Department / Role</th>
                <th className="px-5 py-3.5">Check-In</th>
                <th className="px-5 py-3.5">Check-Out</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Exceptions / Notes</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading attendance register...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No attendance records found for the selected date and filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => {
                  const checkIn = record.checkInTime ? new Date(record.checkInTime) : null;
                  const checkOut = record.checkOutTime ? new Date(record.checkOutTime) : null;
                  const durationH = record.durationMinutes ? Math.floor(record.durationMinutes / 60) : 0;
                  const durationM = record.durationMinutes ? record.durationMinutes % 60 : 0;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {record.user?.firstName?.[0] || 'U'}{record.user?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {record.user?.firstName} {record.user?.lastName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {record.user?.employeeId || 'ID Pending'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-800 font-medium">
                          {record.user?.departmentRel?.name || 'General Field'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {record.user?.designationRel?.name || record.user?.role}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {checkIn ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {record.checkInLat ? `${record.checkInLat.toFixed(3)}, ${record.checkInLng?.toFixed(3)}` : 'GPS Verified'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Checked In</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {checkOut ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {record.checkOutLat ? `${record.checkOutLat.toFixed(3)}, ${record.checkOutLng?.toFixed(3)}` : 'Closed'}
                            </div>
                          </div>
                        ) : record.dayStatus === 'IN_PROGRESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            In Field
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {record.durationMinutes !== null && record.durationMinutes !== undefined ? (
                          <span className="font-medium text-slate-800">
                            {durationH}h {durationM}m
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              record.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : record.status === 'HALF_DAY'
                                ? 'bg-amber-100 text-amber-800'
                                : record.status === 'ON_LEAVE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {record.status}
                          </span>
                          {record.isRegularized && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md">
                              <CheckSquare className="w-2.5 h-2.5" /> Regularized
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {record.exceptions && record.exceptions.length > 0 ? (
                            record.exceptions.map((ex: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {ex}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Regular</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details / Geo-Trace Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Attendance Log Details</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-semibold text-slate-800">
                  {selectedRecord.user?.firstName} {selectedRecord.user?.lastName} ({selectedRecord.user?.employeeId})
                </div>
                <div className="text-xs text-slate-500">
                  {selectedRecord.user?.departmentRel?.name} • {selectedRecord.user?.designationRel?.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 block">Check-In Time</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.checkInTime ? new Date(selectedRecord.checkInTime).toLocaleTimeString() : 'N/A'}
                  </span>
                  {selectedRecord.checkInLat && (
                    <span className="text-xs text-emerald-700 block mt-1">
                      Lat: {selectedRecord.checkInLat.toFixed(5)}, Lng: {selectedRecord.checkInLng?.toFixed(5)}
                    </span>
                  )}
                </div>

                <div className="p-3 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 block">Check-Out Time</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.checkOutTime ? new Date(selectedRecord.checkOutTime).toLocaleTimeString() : 'Not Closed'}
                  </span>
                  {selectedRecord.checkOutLat && (
                    <span className="text-xs text-blue-700 block mt-1">
                      Lat: {selectedRecord.checkOutLat.toFixed(5)}, Lng: {selectedRecord.checkOutLng?.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 block">Address / Notes</span>
                  <span className="text-xs text-slate-700">{selectedRecord.notes}</span>
                </div>
              )}

              {selectedRecord.isRegularized && selectedRecord.regularization && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-indigo-900 block">Regularization Details</span>
                  <div className="text-xs text-indigo-700">Type: {selectedRecord.regularization.regularizationType}</div>
                  <div className="text-xs text-indigo-700">Reason: {selectedRecord.regularization.reason}</div>
                  {selectedRecord.regularization.managerRemarks && (
                    <div className="text-xs text-indigo-600">Remarks: {selectedRecord.regularization.managerRemarks}</div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
