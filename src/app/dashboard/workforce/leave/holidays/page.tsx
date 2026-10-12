'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Plus, RefreshCw, CheckCircle2, Trash2, Edit3,
  ArrowLeft, Flag, Building2, MapPin
} from 'lucide-react';
import { api } from '@/lib/api';

export default function HolidayCalendarPage() {
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    holidayType: 'NATIONAL',
    state: '',
    isOptional: false,
    description: '',
  });

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hrms/leave/holidays?year=${selectedYear}`);
      if (res.data?.success) {
        setHolidays(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/hrms/leave/holidays', form);
      if (res.data?.success) {
        setShowModal(false);
        setForm({
          name: '',
          date: new Date().toISOString().slice(0, 10),
          holidayType: 'NATIONAL',
          state: '',
          isOptional: false,
          description: '',
        });
        fetchHolidays();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this holiday?')) return;
    try {
      await api.delete(`/hrms/leave/holidays/${id}`);
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting holiday');
    }
  };

  const filteredHolidays = holidays.filter((h) => {
    if (selectedType === 'ALL') return true;
    return h.holidayType === selectedType;
  });

  const nationalCount = holidays.filter((h) => h.holidayType === 'NATIONAL').length;
  const regionalCount = holidays.filter((h) => h.holidayType === 'REGIONAL').length;
  const companyCount = holidays.filter((h) => h.holidayType === 'COMPANY').length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/workforce/leave/applications" className="hover:text-slate-800">Leave</Link>
            <span>/</span>
            <span className="text-purple-700 font-medium">Holiday Calendar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedYear} Holiday Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official statutory, national, and regional field holidays recognized across FFMS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workforce/leave/applications"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Applications
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
          <button
            onClick={() => fetchHolidays()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Holidays
          </span>
          <div className="text-3xl font-bold text-slate-900">{holidays.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Scheduled for {selectedYear}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-1">
            National / Statutory
          </span>
          <div className="text-3xl font-bold text-purple-900">{nationalCount}</div>
          <span className="text-xs text-purple-600 mt-1 block">Pan-India mandatory</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
            Regional / State
          </span>
          <div className="text-3xl font-bold text-blue-900">{regionalCount}</div>
          <span className="text-xs text-blue-600 mt-1 block">State & festival specific</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Company Declared
          </span>
          <div className="text-3xl font-bold text-emerald-900">{companyCount}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Pharma annual breaks</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="ALL">All Categories</option>
              <option value="NATIONAL">National Only</option>
              <option value="REGIONAL">Regional Only</option>
              <option value="COMPANY">Company Only</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredHolidays.length} holidays
        </span>
      </div>

      {/* Holidays List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              Loading holiday calendar...
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No holidays found matching selected criteria.
            </div>
          ) : (
            filteredHolidays.map((holiday) => {
              const dateObj = new Date(holiday.date);
              return (
                <div
                  key={holiday.id}
                  className="p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex flex-col items-center justify-center font-bold border border-purple-100 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {dateObj.toLocaleDateString([], { month: 'short' })}
                      </span>
                      <span className="text-xl leading-none">
                        {dateObj.getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{holiday.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            holiday.holidayType === 'NATIONAL'
                              ? 'bg-purple-100 text-purple-800'
                              : holiday.holidayType === 'COMPANY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {holiday.holidayType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dateObj.toLocaleDateString([], { weekday: 'long' })}
                        {holiday.description ? ` • ${holiday.description}` : ''}
                        {holiday.state ? ` • Applicable in ${holiday.state}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove Holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Holiday</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Founder's Day"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={form.holidayType}
                  onChange={(e) => setForm({ ...form, holidayType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="NATIONAL">National / Statutory</option>
                  <option value="REGIONAL">Regional / State Festival</option>
                  <option value="COMPANY">Company Declared Break</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State Applicability (Optional)</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Maharashtra, Tamil Nadu (leave empty for Pan-India)"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Notes..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                {submitting ? 'Saving...' : 'Add Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
