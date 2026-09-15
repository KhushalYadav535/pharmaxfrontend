'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Building2, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Pencil, Trash2, MapPin, Globe, Users, Stethoscope, Store,
  Package, ExternalLink, X, Phone, Star, ShieldCheck, ArrowRight
} from 'lucide-react';
import HeadquarterForm from '@/components/masters/HeadquarterForm';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function HeadquarterMasterPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // HQ Doctor Drawer state
  const [selectedHqForDoctors, setSelectedHqForDoctors] = useState<any>(null);
  const [doctorSearch, setDoctorSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['headquarters', search, page],
    queryFn: () =>
      api.get('/headquarters', { params: { search: search || undefined, page, limit: 20 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  // Query doctors for the selected HQ drawer
  const { data: hqDoctorsData, isLoading: hqDoctorsLoading } = useQuery({
    queryKey: ['hq-doctors', selectedHqForDoctors?.id],
    queryFn: () =>
      api.get('/doctors', { params: { hqId: selectedHqForDoctors?.id, limit: 100, approvalStatus: 'ALL' } }).then(r => r.data.data),
    enabled: !!selectedHqForDoctors,
  });

  const hqDoctorsList: any[] = hqDoctorsData?.doctors || [];
  const filteredHqDoctors = hqDoctorsList.filter((d: any) => {
    if (!doctorSearch) return true;
    const q = doctorSearch.toLowerCase();
    return (
      d.firstName?.toLowerCase().includes(q) ||
      d.lastName?.toLowerCase().includes(q) ||
      d.doctorCode?.toLowerCase().includes(q) ||
      d.specialty?.toLowerCase().includes(q) ||
      d.category?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (hq: any) => {
    if (!confirm(`Delete headquarter "${hq.name}"? This cannot be undone.`)) return;
    try {
      setDeleting(hq.id);
      await api.delete(`/headquarters/${hq.id}`);
      qc.invalidateQueries({ queryKey: ['headquarters'] });
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const hqs: any[] = data?.headquarters ?? [];

  return (
    <>
      {(showForm || editData) && (
        <HeadquarterForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-6 px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-600" /> Headquarter Master & Territory Census
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Geographic territories breakdown — monitor active doctors, hospitals, retail chemists, and field force per headquarter
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/doctors"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              <Users className="w-4 h-4 text-slate-500" /> Doctor Directory
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Headquarter
            </button>
          </div>
        </div>

        {/* ── 5 Territorial Census Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Headquarters', value: data?.total ?? 0, color: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: Building2 },
            { label: 'Doctors Registered', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.doctors ?? 0), 0), color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Stethoscope },
            { label: 'Hospitals / Centers', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.hospitals ?? 0), 0), color: 'bg-sky-50 border-sky-200 text-sky-700', icon: Building2 },
            { label: 'Retail Chemists', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.retailers ?? 0), 0), color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Store },
            { label: 'Assigned Field Reps', value: hqs.reduce((sum: number, h: any) => sum + (h._count?.employees ?? 0), 0), color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Users },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`rounded-2xl p-4 border ${s.color.split(' ')[0]} ${s.color.split(' ')[1]} shadow-xs`}>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <Icon className={`w-5 h-5 ${s.color.split(' ')[2]}`} />
                </div>
                <p className={`text-xs font-bold mt-1 ${s.color.split(' ')[2]}`}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Search & Filter ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search headquarter by name, code, district, state..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing {hqs.length} territories
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['HQ Code', 'Headquarter Name', 'District & State', 'Region / Zone', 'Doctors', 'Hospitals', 'Chemists', 'Field Reps', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-3" />Loading headquarters census...
                  </td></tr>
                ) : hqs.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    {search ? 'No headquarters match your search.' : 'No headquarters found. Add your first one!'}
                  </td></tr>
                ) : hqs.map((hq: any) => (
                  <tr key={hq.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* HQ Code */}
                    <td className="px-5 py-4 font-mono text-xs font-bold text-gray-600 whitespace-nowrap">{hq.code}</td>

                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/80 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{hq.name}</span>
                          <span className="text-[11px] text-gray-400">Territory ID: {hq.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{hq.district || '—'}</div>
                          <div className="text-xs text-gray-500">{hq.state}{hq.pinCode ? ` – ${hq.pinCode}` : ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* Region / Zone */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-800">{hq.region || 'Default'}</div>
                          {hq.zone && <div className="text-xs text-gray-400">{hq.zone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Doctors Count (Clickable to view HQ Doctors) */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => { setSelectedHqForDoctors(hq); setDoctorSearch(''); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 transition-all font-bold text-xs group"
                        title="Click to view doctors in this headquarter"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{hq._count?.doctors ?? 0} Doctors</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>

                    {/* Hospitals Count */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/hospitals?hqId=${hq.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-colors font-bold text-xs"
                      >
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>{hq._count?.hospitals ?? 0} Hospitals</span>
                      </Link>
                    </td>

                    {/* Retailers */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/retailers?hqId=${hq.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors font-semibold text-xs"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>{hq._count?.retailers ?? 0} Chemists</span>
                      </Link>
                    </td>

                    {/* Employees Assigned */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-gray-700 font-semibold text-xs">
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                        <span>{hq._count?.employees ?? 0} Reps</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedHqForDoctors(hq); setDoctorSearch(''); }}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                          title="View Doctors"
                        >
                          <Stethoscope className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditData(hq)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors"
                          title="Edit Headquarter"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(hq)}
                          disabled={deleting === hq.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors disabled:opacity-50"
                          title="Delete Headquarter"
                        >
                          {deleting === hq.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
              <p className="text-gray-500 text-xs">
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} headquarters
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs font-semibold">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE-OVER DRAWER: HEADQUARTER DOCTORS DOSSIER
      ══════════════════════════════════════════════════════════════════════════ */}
      {selectedHqForDoctors && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-xs font-black">
                    {selectedHqForDoctors.code}
                  </span>
                  <h2 className="text-lg font-black text-slate-900">{selectedHqForDoctors.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Territory Doctor Census · {selectedHqForDoctors.district || selectedHqForDoctors.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedHqForDoctors(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions & Search in Drawer */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {filteredHqDoctors.length} Doctors Registered in this Headquarter
                </span>
                <Link
                  href={`/dashboard/doctors?hqId=${selectedHqForDoctors.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Open Full Doctor Directory</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="Filter doctors by name, doctor code, specialty, category..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Doctors List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {hqDoctorsLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-medium">Loading Headquarter Doctors...</p>
                </div>
              ) : filteredHqDoctors.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No doctors found for this filter</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try another search keyword or add doctors to this headquarter.</p>
                </div>
              ) : (
                filteredHqDoctors.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">Dr. {doc.firstName} {doc.lastName}</span>
                          {doc.doctorCode && (
                            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-black bg-emerald-50 border border-emerald-200 text-emerald-800">
                              {doc.doctorCode}
                            </span>
                          )}
                          {doc.isKol && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> KOL
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          {doc.qualification ? `${doc.qualification} · ` : ''}{doc.specialty || 'General Practitioner'}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/doctors/${doc.id}`}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Profile →
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                      {doc.category && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-bold text-[10px]">
                          {doc.category}
                        </span>
                      )}
                      {doc.hospital?.name && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {doc.hospital.name}
                        </span>
                      )}
                      {doc.phone && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {doc.phone}
                        </span>
                      )}
                      {doc.city && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {doc.city}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Total {hqDoctorsList.length} doctors registered
              </span>
              <button
                onClick={() => setSelectedHqForDoctors(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
