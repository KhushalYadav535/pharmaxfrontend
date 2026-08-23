'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MapPin, Plus, Search, Loader2, ChevronLeft, ChevronRight,
  Navigation, Grid3X3, CheckCircle2, XCircle, Pencil, PowerOff, Power,
} from 'lucide-react';
import LocationForm from '@/components/masters/LocationForm';
import InteriorForm from '@/components/masters/InteriorForm';
import AreaForm from '@/components/masters/AreaForm';

type Tab = 'locations' | 'interiors' | 'areas';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />Active</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><XCircle className="w-3 h-3" />Inactive</span>;
}

// ─── LOCATIONS TAB ────────────────────────────────────────────────────────────
function LocationsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['locations', search, page],
    queryFn: () => api.get('/locations', { params: { search, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const toggleActive = async (item: any) => {
    await (item.isActive ? api.patch(`/locations/${item.id}/deactivate`) : api.patch(`/locations/${item.id}/reactivate`));
    qc.invalidateQueries({ queryKey: ['locations'] });
  };

  return (
    <>
      {(showForm || editData) && (
        <LocationForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search locations..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#059669' }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Code', 'Name', 'District', 'State', 'Pin', 'HQ', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500 mb-2" />Loading...
                </td></tr>
              ) : data?.locations?.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />No locations found.
                </td></tr>
              ) : data?.locations?.map((loc: any) => (
                <tr key={loc.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{loc.locationCode ?? '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{loc.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{loc.district || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{loc.state || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{loc.pinCode || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{loc.hq?.name || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge active={loc.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditData(loc)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(loc)}
                        className={`p-1.5 rounded-lg transition-colors ${loc.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
                        title={loc.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {loc.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── INTERIORS TAB ────────────────────────────────────────────────────────────
function InteriorsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interiors', search, page],
    queryFn: () => api.get('/interiors', { params: { search, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const toggleActive = async (item: any) => {
    await (item.isActive ? api.patch(`/interiors/${item.id}/deactivate`) : api.patch(`/interiors/${item.id}/reactivate`));
    qc.invalidateQueries({ queryKey: ['interiors'] });
  };

  return (
    <>
      {(showForm || editData) && (
        <InteriorForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search interiors..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#7c3aed' }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Interior
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Code', 'Name', 'Location', 'District', 'State', 'Pin', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-500 mb-2" />Loading...
                </td></tr>
              ) : data?.interiors?.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                  <Navigation className="w-8 h-8 mx-auto mb-2 text-gray-300" />No interiors found.
                </td></tr>
              ) : data?.interiors?.map((item: any) => (
                <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{item.interiorCode ?? '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.location?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.district || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.state || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.pinCode || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge active={item.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditData(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`} title={item.isActive ? 'Deactivate' : 'Activate'}>
                        {item.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── AREAS TAB ───────────────────────────────────────────────────────────────
function AreasTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['areas', search, page],
    queryFn: () => api.get('/areas', { params: { search, page, limit: 15 } }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const toggleActive = async (item: any) => {
    await (item.isActive ? api.patch(`/areas/${item.id}/deactivate`) : api.patch(`/areas/${item.id}/reactivate`));
    qc.invalidateQueries({ queryKey: ['areas'] });
  };

  return (
    <>
      {(showForm || editData) && (
        <AreaForm
          editData={editData ?? undefined}
          onClose={() => { setShowForm(false); setEditData(null); }}
        />
      )}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search areas..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#d97706' }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Area
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Code', 'Name', 'Location', 'HQ', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />Loading...
                </td></tr>
              ) : data?.areas?.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                  <Grid3X3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />No areas found.
                </td></tr>
              ) : data?.areas?.map((item: any) => (
                <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{item.areaCode ?? '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{item.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.location?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{item.hq?.name || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge active={item.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditData(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg transition-colors ${item.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`} title={item.isActive ? 'Deactivate' : 'Activate'}>
                        {item.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data.total)} of {data.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs"><ChevronLeft className="w-3 h-3" /> Prev</button>
              <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 text-xs">Next <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function LocationMasterPage() {
  const [activeTab, setActiveTab] = useState<Tab>('locations');

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; color: string; activeColor: string }[] = [
    { key: 'locations', label: 'Locations', icon: MapPin, color: 'text-gray-500', activeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'interiors', label: 'Interiors', icon: Navigation, color: 'text-gray-500', activeColor: 'text-violet-600 bg-violet-50 border-violet-200' },
    { key: 'areas',     label: 'Areas',     icon: Grid3X3, color: 'text-gray-500', activeColor: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="space-y-6 py-6 px-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" /> Location Master
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage Locations, Interiors and Areas — used across all CRM and field modules
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                isActive ? tab.activeColor : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'locations' && <LocationsTab />}
      {activeTab === 'interiors' && <InteriorsTab />}
      {activeTab === 'areas' && <AreasTab />}
    </div>
  );
}
