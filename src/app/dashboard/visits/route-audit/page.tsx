'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MapPin, Navigation, Calendar, Users, Clock, AlertTriangle,
  CheckCircle, ExternalLink, ArrowRight, Route, ShieldCheck,
  Stethoscope, Store, Building2, Truck, RefreshCw, Car
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

// Haversine distance in KM between 2 lat/lng pairs
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RouteAuditPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 1. Fetch Field Force Representatives
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-route-audit'],
    queryFn: () => api.get('/employees', { params: { limit: 100 } }).then((r) => r.data.data?.employees || []),
  });

  // 2. Fetch visits on the selected date
  const { data: visitsData, isLoading, refetch } = useQuery({
    queryKey: ['visits-route-audit', selectedDate, selectedUserId],
    queryFn: async () => {
      const fromDate = `${selectedDate}T00:00:00.000Z`;
      const toDate = `${selectedDate}T23:59:59.999Z`;
      const res = await api.get('/visits', {
        params: {
          fromDate,
          toDate,
          userId: selectedUserId || undefined,
          limit: 100,
        },
      });
      return res.data?.data?.visits || [];
    },
  });

  const rawVisits: any[] = Array.isArray(visitsData) ? visitsData : [];

  // Sort chronologically by check-in time or planned time
  const timelineVisits = useMemo(() => {
    return [...rawVisits].sort((a, b) => {
      const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : new Date(a.plannedDate).getTime();
      const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : new Date(b.plannedDate).getTime();
      return timeA - timeB;
    });
  }, [rawVisits]);

  // Calculate route distance and stop count
  const gpsStops = timelineVisits.filter((v) => v.checkInLat && v.checkInLng);

  let totalDistanceKm = 0;
  for (let i = 0; i < gpsStops.length - 1; i++) {
    const lat1 = Number(gpsStops[i].checkInLat);
    const lon1 = Number(gpsStops[i].checkInLng);
    const lat2 = Number(gpsStops[i + 1].checkInLat);
    const lon2 = Number(gpsStops[i + 1].checkInLng);
    if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
      totalDistanceKm += haversineDistance(lat1, lon1, lat2, lon2);
    }
  }

  // Google Maps multi-stop URL
  const googleMapsUrl = useMemo(() => {
    if (gpsStops.length < 2) return null;
    const origin = `${gpsStops[0].checkInLat},${gpsStops[0].checkInLng}`;
    const destination = `${gpsStops[gpsStops.length - 1].checkInLat},${gpsStops[gpsStops.length - 1].checkInLng}`;
    const waypoints = gpsStops
      .slice(1, -1)
      .map((s) => `${s.checkInLat},${s.checkInLng}`)
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=driving`;
  }, [gpsStops]);

  const selectedRep = employeesData?.find((e: any) => e.id === selectedUserId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Route className="w-6 h-6 text-emerald-600" /> Daily GPS Travel & Route Breadcrumb Audit
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Audit sequential doctor calls, calculate travel distance, and verify GPS coordinate integrity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/visits/monitor"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Live Field Monitor
          </Link>
          <Link
            href="/dashboard/attendance"
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
          >
            Team Attendance
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Representative Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="">All Representatives</option>
              {employeesData?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.role || 'MR'})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <label className="text-[11px] font-bold text-slate-400 uppercase">Field Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setSelectedDate(todayStr);
              refetch();
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" /> Open Full Route in Google Maps
            </a>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
            title="Refresh Route"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Calls on Date</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{timelineVisits.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Sequential stops logged</p>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-sm bg-gradient-to-br from-emerald-50/40 to-white">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">GPS Verified Calls</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{gpsStops.length}</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {timelineVisits.length > 0 ? Math.round((gpsStops.length / timelineVisits.length) * 100) : 0}% geofence verified
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Estimated Displacement</span>
            <Car className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1">{totalDistanceKm.toFixed(1)} km</p>
          <p className="text-xs text-blue-600 mt-0.5">Point-to-point travel trail</p>
        </div>

        <div className="bg-white rounded-3xl border border-purple-100 p-5 shadow-sm bg-gradient-to-br from-purple-50/40 to-white">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Audited Representative</span>
          <p className="text-lg font-black text-purple-900 mt-1 truncate">
            {selectedRep ? `${selectedRep.firstName} ${selectedRep.lastName}` : 'All Representatives'}
          </p>
          <p className="text-xs text-purple-600 mt-0.5">{selectedRep?.role || 'Field Force'}</p>
        </div>
      </div>

      {/* Sequential Route Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Chronological Field Trail</h2>
            <p className="text-xs text-slate-500">Sequential stops in order of doctor/chemist check-in</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            {formatDate(selectedDate)}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-semibold">Tracing field calls and coordinates...</p>
          </div>
        ) : timelineVisits.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Route className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <p className="font-bold text-slate-700">No calls found for this date and representative</p>
            <p className="text-xs text-slate-400">Select another date or representative to inspect previous trails.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timelineVisits.map((v: any, idx: number) => {
              const hasGps = v.checkInLat && v.checkInLng;
              const docName = v.doctor ? `Dr. ${v.doctor.firstName} ${v.doctor.lastName}` : null;
              const retName = v.retailer?.name || null;
              const hospName = v.hospital?.name || null;
              const entityName = docName || retName || hospName || 'Target Entity';

              // Calculate distance from previous stop
              let legDistance = 0;
              if (idx > 0 && hasGps && timelineVisits[idx - 1].checkInLat) {
                legDistance = haversineDistance(
                  Number(timelineVisits[idx - 1].checkInLat),
                  Number(timelineVisits[idx - 1].checkInLng),
                  Number(v.checkInLat),
                  Number(v.checkInLng)
                );
              }

              return (
                <div key={v.id} className="relative group">
                  {/* Step Marker */}
                  <div
                    className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center font-bold text-[10px] text-white shadow-sm ${
                      v.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 p-4 transition-all space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                          {docName ? (
                            <Stethoscope className="w-4 h-4 text-emerald-600" />
                          ) : retName ? (
                            <Store className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{entityName}</h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {v.visitType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Rep: {v.user?.firstName} {v.user?.lastName} ({v.user?.role || 'MR'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {v.checkInTime && (
                          <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(v.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <Link
                          href={`/dashboard/visits/${v.id}`}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Dossier
                        </Link>
                      </div>
                    </div>

                    {/* GPS Coordinates & Map Link */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {hasGps ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://www.google.com/maps?q=${v.checkInLat},${v.checkInLng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-mono text-[11px]"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {Number(v.checkInLat).toFixed(4)}, {Number(v.checkInLng).toFixed(4)}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                          {v.checkInAddress && (
                            <span className="text-slate-500 text-[11px] truncate max-w-xs">{v.checkInAddress}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> No GPS telemetry captured
                        </span>
                      )}

                      {idx > 0 && legDistance > 0 && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          +{legDistance.toFixed(1)} km from stop #{idx}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
