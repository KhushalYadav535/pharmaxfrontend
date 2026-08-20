'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, Plus, ChevronLeft, ChevronRight, CheckCircle, X, Loader2, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { APPROVAL_STATUS_COLORS, formatDate } from '@/lib/utils';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TourPlanningPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isManager = ['ASM','RSM','ZM','NSM','SUPER_ADMIN','SALES_ADMIN'].includes(user?.role || '');

  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addNotes, setAddNotes] = useState('');
  const [addBeat, setAddBeat] = useState('');

  const currentMonth = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: plans, isLoading } = useQuery({
    queryKey: ['tour-plans', currentMonth],
    queryFn: () => api.get('/tour-plans', { params: { month: currentMonth } }).then((r) => r.data.data),
  });

  const { data: beats } = useQuery({
    queryKey: ['beats'],
    queryFn: () => api.get('/tour-plans/beats').then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: (body: any) => api.post('/tour-plans', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tour-plans'] }); setShowAddForm(false); setAddNotes(''); setAddBeat(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tour-plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tour-plans'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tour-plans/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tour-plans'] }),
  });

  // Calendar helpers
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const plansByDate = (plans || []).reduce((acc: Record<string, any[]>, p: any) => {
    const key = new Date(p.planDate).toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(p);
    return acc;
  }, {});

  const selectedDayPlans = selectedDay ? (plansByDate[selectedDay.toDateString()] || []) : [];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDay = (d: number) => {
    const date = new Date(year, month, d);
    setSelectedDay(date);
    setShowAddForm(false);
  };

  const STATUS_DOT: Record<string, string> = {
    PENDING: 'bg-amber-400',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Tour Planning
          </h1>
          <p className="text-gray-500 text-sm mt-1">Plan and manage your daily field visits</p>
        </div>
        {selectedDay && !isManager && (
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
            <h2 className="font-bold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((d) => (
              <div key={d} className="text-center py-2.5 text-xs font-semibold text-gray-400">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-50" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const date = new Date(year, month, d);
              const key = date.toDateString();
              const dayPlans = plansByDate[key] || [];
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDay?.toDateString() === date.toDateString();
              const isPast = date < new Date(today.toDateString());
              const isSun = date.getDay() === 0;

              return (
                <div
                  key={d}
                  onClick={() => selectDay(d)}
                  className={`h-20 border-b border-r border-gray-50 p-1.5 cursor-pointer transition-all relative ${isSelected ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-400' : 'hover:bg-gray-50'} ${isSun ? 'bg-red-50/30' : ''}`}
                >
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : isSun ? 'text-red-400' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>{d}</span>
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayPlans.slice(0, 2).map((p: any, pi: number) => (
                      <div key={pi} className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[p.approvalStatus] || 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600 truncate leading-tight">{p.beat?.name || p.notes || 'Visit'}</span>
                      </div>
                    ))}
                    {dayPlans.length > 2 && <span className="text-xs text-gray-400">+{dayPlans.length - 2} more</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-6 py-3 border-t border-gray-100 bg-gray-50">
            {[['Pending', 'bg-amber-400'], ['Approved', 'bg-emerald-500'], ['Rejected', 'bg-red-500']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${c}`} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {selectedDay ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50">
                <p className="font-bold text-emerald-800">{formatDate(selectedDay)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{selectedDayPlans.length} plan{selectedDayPlans.length !== 1 ? 's' : ''}</p>
              </div>

              {showAddForm ? (
                <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate({ planDate: selectedDay.toISOString(), beatId: addBeat || undefined, notes: addNotes }); }} className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">Add Plan for {formatDate(selectedDay)}</p>
                  {beats && beats.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Beat Area</label>
                      <select value={addBeat} onChange={(e) => setAddBeat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                        <option value="">No specific beat</option>
                        {beats.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Purpose</label>
                    <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)} rows={3} placeholder="e.g. Visit 5 A-class doctors in Andheri..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={addMutation.isPending} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded-xl disabled:opacity-60">
                      {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                    </button>
                  </div>
                </form>
              ) : selectedDayPlans.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No plans for this day</p>
                  {!isManager && <button onClick={() => setShowAddForm(true)} className="text-emerald-600 text-xs font-medium mt-1">Add plan →</button>}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {selectedDayPlans.map((plan: any) => (
                    <div key={plan.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{plan.beat?.name || 'General Visit'}</p>
                          {plan.notes && <p className="text-xs text-gray-500 mt-0.5">{plan.notes}</p>}
                          {plan.user && <p className="text-xs text-gray-400 mt-0.5">{plan.user.firstName} {plan.user.lastName}</p>}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${APPROVAL_STATUS_COLORS[plan.approvalStatus]}`}>{plan.approvalStatus}</span>
                      </div>
                      <div className="flex gap-2">
                        {isManager && plan.approvalStatus === 'PENDING' && (
                          <button onClick={() => approveMutation.mutate(plan.id)} disabled={approveMutation.isPending} className="flex-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {!isManager && plan.approvalStatus === 'PENDING' && (
                          <button onClick={() => deleteMutation.mutate(plan.id)} disabled={deleteMutation.isPending} className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <X className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Select a date to view or add plans</p>
            </div>
          )}

          {/* Month Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Month Summary</h3>
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => {
              const count = (plans || []).filter((p: any) => p.approvalStatus === status).length;
              return (
                <div key={status} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                    <span className="text-sm text-gray-600">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
            <div className="border-t border-gray-100 mt-2 pt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Total</span>
              <span className="font-bold text-gray-900">{(plans || []).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
