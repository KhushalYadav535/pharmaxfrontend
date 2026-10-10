'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Bell, CheckCircle2, AlertTriangle, Info, Megaphone, Send,
  Plus, Check, Trash2, Loader2, Sparkles, Radio, Users, Clock, Filter
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  ANNOUNCEMENT: { icon: Megaphone, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  CIRCULAR:     { icon: Megaphone, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  SCHEME:       { icon: Sparkles,  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  INFO:         { icon: Info,      color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  ALERT:        { icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  SUCCESS:      { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  // Broadcast composer state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    body: '',
    type: 'ANNOUNCEMENT',
    targetRole: 'ALL',
  });

  // Query notifications from backend
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filterType],
    queryFn: () =>
      api.get('/notifications', { params: { limit: 50, type: filterType !== 'ALL' ? filterType : undefined } })
        .then((r) => r.data.data),
    refetchInterval: 20000,
  });

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: (body: any) => api.post('/notifications/broadcast', body),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Circular broadcasted successfully!');
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', body: '', type: 'ANNOUNCEMENT', targetRole: 'ALL' });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to broadcast announcement');
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const isManager = ['SUPER_ADMIN', 'ADMIN', 'SALES_ADMIN', 'ASM', 'RSM', 'ZM', 'NSM'].includes(user?.role || '');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7 text-blue-600" /> Notifications & Broadcast Desk
            </h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time field notifications, system alerts, and company-wide circular broadcasts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-2xs"
            >
              <Megaphone className="w-3.5 h-3.5" /> Broadcast Announcement
            </button>
          )}
        </div>
      </div>

      {/* ── BROADCAST HERO BANNER (FOR ADMINS) ── */}
      {isManager && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 shadow-md shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Field Force Dispatch</span>
            </div>
            <h3 className="text-base font-bold text-white">Broadcast Circular or Incentive Policy</h3>
            <p className="text-xs text-blue-100 max-w-lg">
              Push immediate company announcements, price list revisions, or target directives directly to all MRs.
            </p>
          </div>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-xs flex-shrink-0"
          >
            Create Circular Now
          </button>
        </div>
      )}

      {/* ── NOTIFICATIONS FEED ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900">Recent Notifications Feed</h2>
          <span className="text-xs text-slate-500 font-medium">{notifications.length} messages</span>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              Loading notifications feed...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No notifications right now</p>
              <p className="text-xs text-slate-400 mt-0.5">You are completely up-to-date.</p>
            </div>
          ) : (
            notifications.map((n: any) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
              const Icon = cfg.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                    n.isRead ? 'hover:bg-slate-50/60' : 'bg-blue-50/30 hover:bg-blue-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${n.isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {n.body}
                    </p>

                    {n.fromUser && (
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <span>From:</span>
                        <strong className="text-slate-600">{n.fromUser.firstName} {n.fromUser.lastName} ({n.fromUser.role})</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── BROADCAST COMPOSER MODAL ── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Compose Field Broadcast</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={broadcastForm.targetRole}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">Entire Field Force (All Staff)</option>
                  <option value="MR">Medical Representatives (MR Only)</option>
                  <option value="ASM">Area Sales Managers (ASM Only)</option>
                  <option value="TRADE_REP">Trade Representatives</option>
                  <option value="DISTRIBUTOR_REP">Distributor Reps</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Announcement Category</label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ANNOUNCEMENT">General Announcement</option>
                  <option value="CIRCULAR">Official Headquarter Circular</option>
                  <option value="SCHEME">Trade Scheme / Incentive Update</option>
                  <option value="ALERT">High Priority Directive</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Circular Title</label>
                <input
                  type="text"
                  placeholder="e.g., Q3 Incentive Scheme Announced for Nagpur Zone"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={4}
                  placeholder="Enter details of the circular, incentive slab, or directive for field staff..."
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100"
              >
                Dismiss
              </button>
              <button
                onClick={() => broadcastMutation.mutate(broadcastForm)}
                disabled={broadcastMutation.isPending || !broadcastForm.title || !broadcastForm.body}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
              >
                {broadcastMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Live Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
