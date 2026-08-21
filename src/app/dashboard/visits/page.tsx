'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, VISIT_STATUS_COLORS, APPROVAL_STATUS_COLORS } from '@/lib/utils';
import {
  ClipboardList, Plus, MapPin, Loader2, X, CheckCircle, Users,
  Store, Truck, Building2, Mic, Camera, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const isManager = (role: string) => ['ASM', 'RSM', 'ZM', 'NSM', 'SUPER_ADMIN', 'SALES_ADMIN'].includes(role);

type VisitTab = 'DOCTOR' | 'RETAILER' | 'DISTRIBUTOR' | 'HOSPITAL';

const TABS: { type: VisitTab; label: string; icon: any }[] = [
  { type: 'DOCTOR', label: 'Doctor Visits', icon: Users },
  { type: 'HOSPITAL', label: 'Hospital Visits', icon: Building2 },
  { type: 'RETAILER', label: 'Retailer Visits', icon: Store },
  { type: 'DISTRIBUTOR', label: 'Distributor Visits', icon: Truck },
];

export default function VisitsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<VisitTab>('DOCTOR');
  const [showForm, setShowForm] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [page, setPage] = useState(1);

  // Common visit fields
  const [form, setForm] = useState({ visitType: 'DOCTOR' as VisitTab, plannedDate: new Date().toISOString().slice(0, 10), notes: '' });
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Doctor checkout fields
  const [doctorCheckout, setDoctorCheckout] = useState({
    productsDiscussed: '', objectionsRaised: '', competitorActivity: '', doctorFeedback: '',
    nextFollowUpDate: '', voiceNote: '',
  });

  // Retailer checkout fields
  const [retailerCheckout, setRetailerCheckout] = useState({
    stockAvailability: '', outOfStockProducts: '', shelfVisibility: '',
    displayCompliance: false, competitorSchemes: '', retailerFeedback: '',
    orderNotes: '', notes: '',
  });

  // Distributor checkout fields
  const [distributorCheckout, setDistributorCheckout] = useState({
    inventoryReview: '', stockAgeing: '', batchAvailability: '',
    primarySales: '', secondarySales: '', outstandingPayments: '',
    pendingOrders: '', claims: '', marketIntelligence: '', notes: '',
  });

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['visits', activeTab, page],
    queryFn: () => api.get('/visits', { params: { page, limit: 15, visitType: activeTab } }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data.data.doctors),
    enabled: showForm && activeTab === 'DOCTOR',
  });
  const { data: retailersList } = useQuery({
    queryKey: ['retailers-list'],
    queryFn: () => api.get('/retailers', { params: { limit: 100 } }).then((r) => r.data.data.retailers),
    enabled: showForm && activeTab === 'RETAILER',
  });
  const { data: distributorsList } = useQuery({
    queryKey: ['distributors-list'],
    queryFn: () => api.get('/distributors', { params: { limit: 100 } }).then((r) => r.data.data.distributors),
    enabled: showForm && activeTab === 'DISTRIBUTOR',
  });
  const { data: hospitalsList } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: () => api.get('/hospitals', { params: { limit: 100 } }).then((r) => r.data.data.hospitals),
    enabled: showForm && activeTab === 'HOSPITAL',
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/visits', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setShowForm(false); setSelectedEntityId(''); },
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id, lat, lng }: { id: string; lat: number; lng: number }) =>
      api.patch(`/visits/${id}/check-in`, { lat, lng, address: 'GPS location' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setCheckingIn(null); },
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ id, lat, lng, payload }: any) =>
      api.patch(`/visits/${id}/check-out`, { lat, lng, ...payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); setCheckingOut(null); setShowCheckoutForm(false); },
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
    const payload: any = { ...form, visitType: activeTab };
    if (activeTab === 'DOCTOR') payload.doctorId = selectedEntityId;
    if (activeTab === 'HOSPITAL') payload.hospitalId = selectedEntityId;
    if (activeTab === 'RETAILER') payload.retailerId = selectedEntityId;
    if (activeTab === 'DISTRIBUTOR') payload.distributorId = selectedEntityId;
    createMutation.mutate(payload);
  };

  const handleCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingOut) return;
    let payload: any = {};
    if (activeTab === 'DOCTOR') {
      payload = {
        ...doctorCheckout,
        productsDiscussed: doctorCheckout.productsDiscussed ? doctorCheckout.productsDiscussed.split(',').map(s => s.trim()) : [],
      };
    } else if (activeTab === 'RETAILER') {
      payload = {
        notes: `RETAILER_REPORT | Stock: ${retailerCheckout.stockAvailability} | OOS: ${retailerCheckout.outOfStockProducts} | Shelf: ${retailerCheckout.shelfVisibility} | Display: ${retailerCheckout.displayCompliance ? 'Yes' : 'No'} | Feedback: ${retailerCheckout.retailerFeedback} | Orders: ${retailerCheckout.orderNotes}`,
        competitorActivity: retailerCheckout.competitorSchemes,
        productsDiscussed: [],
      };
    } else {
      payload = {
        notes: `DIST_REPORT | Inventory: ${distributorCheckout.inventoryReview} | Ageing: ${distributorCheckout.stockAgeing} | Primary: ${distributorCheckout.primarySales} | Secondary: ${distributorCheckout.secondarySales} | Outstanding: ${distributorCheckout.outstandingPayments} | Pending Orders: ${distributorCheckout.pendingOrders} | Claims: ${distributorCheckout.claims} | Intel: ${distributorCheckout.marketIntelligence}`,
        productsDiscussed: [],
      };
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => checkOutMutation.mutate({ id: checkingOut, lat: pos.coords.latitude, lng: pos.coords.longitude, payload }),
      () => checkOutMutation.mutate({ id: checkingOut, lat: 19.076, lng: 72.877, payload }),
    );
  };

  const tabCounts: Record<VisitTab, number> = {
    DOCTOR: 0, RETAILER: 0, DISTRIBUTOR: 0, HOSPITAL: 0
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" /> Visit Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">GPS-tracked field visits across doctors, retailers & distributors</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, visitType: activeTab })); }} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Plan Visit
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.type}
              onClick={() => { setActiveTab(tab.type); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === tab.type ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Target', 'Date', 'Duration', activeTab === 'DOCTOR' ? 'Products' : 'Notes Summary', 'GPS', 'Status', 'Approval', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : data?.visits?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No {activeTab.toLowerCase()} visits yet</p>
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
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(visit.plannedDate)}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{visit.durationMinutes ? `${visit.durationMinutes}m` : '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs max-w-xs truncate">
                      {activeTab === 'DOCTOR' ? (visit.productsDiscussed?.slice(0, 2).join(', ') || '—') : (visit.notes ? visit.notes.slice(0, 60) + '…' : '—')}
                    </td>
                    <td className="px-5 py-4">
                      {visit.checkInLat ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><MapPin className="w-3 h-3" />GPS</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${VISIT_STATUS_COLORS[visit.status]}`}>{visit.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${APPROVAL_STATUS_COLORS[visit.approvalStatus]}`}>{visit.approvalStatus}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {visit.status === 'PLANNED' && (
                          <button onClick={() => handleCheckIn(visit.id)} disabled={checkingIn === visit.id} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg disabled:opacity-50">
                            {checkingIn === visit.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />} Check In
                          </button>
                        )}
                        {visit.status === 'CHECKED_IN' && (
                          <Link href={`/dashboard/visits/${visit.id}/report`} className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">
                            Submit Report
                          </Link>
                        )}
                        {isManager(user?.role || '') && visit.approvalStatus === 'PENDING' && visit.status === 'COMPLETED' && (
                          <button onClick={() => approveMutation.mutate(visit.id)} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg">
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
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Visit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Plan New {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Visit</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {activeTab === 'DOCTOR' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Doctor *</label>
                  <select required value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Choose doctor...</option>
                    {doctors?.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</option>)}
                  </select>
                </div>
              )}
              {activeTab === 'HOSPITAL' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Hospital *</label>
                  <select required value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Choose hospital...</option>
                    {hospitalsList?.map((h: any) => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
                  </select>
                </div>
              )}
              {activeTab === 'RETAILER' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Retailer / Pharmacy *</label>
                  <select required value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Choose retailer...</option>
                    {retailersList?.map((r: any) => <option key={r.id} value={r.id}>{r.name} — {r.city}</option>)}
                  </select>
                </div>
              )}
              {activeTab === 'DISTRIBUTOR' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Distributor *</label>
                  <select required value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                    <option value="">Choose distributor...</option>
                    {distributorsList?.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.city}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Planned Date</label>
                <input type="date" value={form.plannedDate} onChange={(e) => setForm(f => ({ ...f, plannedDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Purpose</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Purpose of visit..." />
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

      {/* Checkout / Submit Report Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">Submit {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Visit Report</h2>
              <button onClick={() => setShowCheckoutForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCheckOut} className="p-6 space-y-4">
              {/* Doctor Report Fields */}
              {activeTab === 'DOCTOR' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Products Discussed</label>
                    <input value={doctorCheckout.productsDiscussed} onChange={(e) => setDoctorCheckout(f => ({ ...f, productsDiscussed: e.target.value }))} placeholder="e.g. Amoxil, Paracip (comma separated)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Doctor Feedback</label>
                    <textarea value={doctorCheckout.doctorFeedback} onChange={(e) => setDoctorCheckout(f => ({ ...f, doctorFeedback: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Doctor's response and feedback..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Objections Raised</label>
                    <input value={doctorCheckout.objectionsRaised} onChange={(e) => setDoctorCheckout(f => ({ ...f, objectionsRaised: e.target.value }))} placeholder="Any objections or concerns?" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Competitor Activity</label>
                    <input value={doctorCheckout.competitorActivity} onChange={(e) => setDoctorCheckout(f => ({ ...f, competitorActivity: e.target.value }))} placeholder="Competitor brands/reps mentioned?" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                    <input type="date" value={doctorCheckout.nextFollowUpDate} onChange={(e) => setDoctorCheckout(f => ({ ...f, nextFollowUpDate: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </>
              )}

              {/* Retailer Report Fields */}
              {activeTab === 'RETAILER' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Products In Stock</label>
                      <input value={retailerCheckout.stockAvailability} onChange={(e) => setRetailerCheckout(f => ({ ...f, stockAvailability: e.target.value }))} placeholder="Products available (comma separated)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Out-of-Stock Products</label>
                      <input value={retailerCheckout.outOfStockProducts} onChange={(e) => setRetailerCheckout(f => ({ ...f, outOfStockProducts: e.target.value }))} placeholder="OOS products (comma separated)" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shelf Visibility</label>
                      <select value={retailerCheckout.shelfVisibility} onChange={(e) => setRetailerCheckout(f => ({ ...f, shelfVisibility: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white">
                        <option value="">Select...</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <input type="checkbox" id="displayCompliance" checked={retailerCheckout.displayCompliance} onChange={(e) => setRetailerCheckout(f => ({ ...f, displayCompliance: e.target.checked }))} className="w-4 h-4 text-emerald-600 rounded" />
                      <label htmlFor="displayCompliance" className="text-sm text-gray-700 font-medium">Display Compliance ✓</label>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Competitor Schemes</label>
                      <input value={retailerCheckout.competitorSchemes} onChange={(e) => setRetailerCheckout(f => ({ ...f, competitorSchemes: e.target.value }))} placeholder="Any competitor promotions/schemes?" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Retailer Feedback</label>
                      <textarea value={retailerCheckout.retailerFeedback} onChange={(e) => setRetailerCheckout(f => ({ ...f, retailerFeedback: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Retailer's feedback or concerns..." />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Order Captured</label>
                      <textarea value={retailerCheckout.orderNotes} onChange={(e) => setRetailerCheckout(f => ({ ...f, orderNotes: e.target.value }))} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Orders placed during this visit..." />
                    </div>
                  </div>
                </>
              )}

              {/* Distributor Report Fields */}
              {activeTab === 'DISTRIBUTOR' && (
                <div className="space-y-3">
                  {[
                    { key: 'inventoryReview', label: 'Inventory Review', placeholder: 'Current stock levels summary' },
                    { key: 'stockAgeing', label: 'Stock Ageing / Near Expiry', placeholder: 'Products nearing expiry or slow moving' },
                    { key: 'batchAvailability', label: 'Batch Availability', placeholder: 'Batch numbers checked' },
                    { key: 'primarySales', label: 'Primary Sales (₹)', placeholder: 'Primary sales this period' },
                    { key: 'secondarySales', label: 'Secondary Sales (₹)', placeholder: 'Secondary sales this period' },
                    { key: 'outstandingPayments', label: 'Outstanding Payments', placeholder: 'Pending payment status' },
                    { key: 'pendingOrders', label: 'Pending Orders', placeholder: 'Orders not yet fulfilled' },
                    { key: 'claims', label: 'Claims', placeholder: 'Breakage/expiry claims raised' },
                    { key: 'marketIntelligence', label: 'Market Intelligence', placeholder: 'Competitor activity, market trends...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                      <input value={(distributorCheckout as any)[key]} onChange={(e) => setDistributorCheckout(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCheckoutForm(false)} className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" disabled={checkOutMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-60">
                  {checkOutMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
