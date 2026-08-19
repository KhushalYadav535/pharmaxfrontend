'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, VISIT_STATUS_COLORS, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import { ClipboardList, Plus, MapPin, Loader2, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const isManager = (role: string) => ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(role);

export default function VisitsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['visits', page],
    queryFn: () => api.get('/visits', { params: { page, limit: 20 } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const [form, setForm] = useState({ visitType: 'DOCTOR', plannedDate: new Date().toISOString().slice(0, 10), notes: '' });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data.data.doctors),
  });

  const [selectedDoctor, setSelectedDoctor] = useState('');

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/visits', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setShowForm(false); },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id, lat, lng }: { id: string; lat: number; lng: number }) =>
      api.patch(`/visits/${id}/check-in`, { lat, lng, address: 'GPS location' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setCheckingIn(null); },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/visits/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  });

  const handleCheckIn = (visitId: string) => {
    setCheckingIn(visitId);
    navigator.geolocation.getCurrentPosition(
      (pos) => checkInMutation.mutate({ id: visitId, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => checkInMutation.mutate({ id: visitId, lat: 19.076, lng: 72.877 }),
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, doctorId: selectedDoctor || undefined });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" /> Visit Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all your field visits</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Plan Visit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Visit', 'Type', 'Date', 'Duration', 'Products', 'Status', 'Approval', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : data?.visits?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No visits planned yet</p>
                  <button onClick={() => setShowForm(true)} className="text-emerald-600 text-sm font-medium mt-2">Plan your first visit →</button>
                </td></tr>
              ) : (
                data?.visits?.map((visit: any) => (
                  <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {visit.doctor ? `Dr. ${visit.doctor.firstName} ${visit.doctor.lastName}` :
                       visit.retailer ? visit.retailer.name :
                       visit.distributor ? visit.distributor.name : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{visit.visitType}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(visit.plannedDate)}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{visit.durationMinutes ? `${visit.durationMinutes}m` : '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{visit.productsDiscussed?.slice(0, 2).join(', ') || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${VISIT_STATUS_COLORS[visit.status]}`}>{visit.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${APPROVAL_STATUS_COLORS[visit.approvalStatus]}`}>{visit.approvalStatus}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {visit.status === 'PLANNED' && (
                          <button
                            onClick={() => handleCheckIn(visit.id)}
                            disabled={checkingIn === visit.id || checkInMutation.isPending}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {checkingIn === visit.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                            Check In
                          </button>
                        )}
                        {isManager(user?.role || '') && visit.approvalStatus === 'PENDING' && visit.status === 'COMPLETED' && (
                          <button onClick={() => approveMutation.mutate(visit.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Page {page} of {data.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Visit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Plan New Visit</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visit Type</label>
                <select value={form.visitType} onChange={(e) => setForm(f => ({ ...f, visitType: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                  {['DOCTOR', 'RETAILER', 'DISTRIBUTOR', 'HOSPITAL'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              {form.visitType === 'DOCTOR' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Doctor</label>
                  <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Select doctor...</option>
                    {doctors?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Planned Date</label>
                <input type="date" value={form.plannedDate} onChange={(e) => setForm(f => ({ ...f, plannedDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Purpose of visit, products to discuss..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Planning...</> : 'Plan Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
