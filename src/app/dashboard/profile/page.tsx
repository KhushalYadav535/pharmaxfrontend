'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getInitials, formatRole } from '@/lib/utils';
import {
  ArrowLeft, Mail, Shield, MapPin, Building, LogOut, Phone,
  User, Briefcase, Calendar, CreditCard, Award, Users, CheckCircle2,
  Copy, Check, Sparkles, QrCode, PhoneCall, MessageSquare, Building2,
  ShieldCheck, Heart, Key, ExternalLink, ChevronRight, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'org' | 'contact' | 'personal' | 'kyc'>('org');
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['my-web-profile', user?.id],
    queryFn: () => api.get(`/employees/${user?.id}`).then(r => r.data.data),
    enabled: !!user?.id,
  });

  const profile = employeeData || user;
  if (!user) return null;

  const roleTheme: Record<string, { bg: string; text: string; border: string }> = {
    'SUPER_ADMIN': { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-400/40' },
    'NSM': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-400/40' },
    'ZM': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-400/40' },
    'RSM': { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-400/40' },
    'ASM': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-400/40' },
    'MR': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-400/40' },
    'TRADE_REP': { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-400/40' },
  };

  const currentRoleStyle = roleTheme[profile?.role || 'MR'] || { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-400/40' };

  const formatDate = (val?: string | Date | null) => {
    if (!val) return 'Not Provided';
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(val);
    }
  };

  const calculateTenure = (doj?: string | Date | null) => {
    if (!doj) return 'Active';
    try {
      const start = new Date(doj);
      if (isNaN(start.getTime())) return 'Active';
      const now = new Date();
      const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (months < 1) return '< 1 mo';
      if (months < 12) return `${months} mos`;
      const yrs = (months / 12).toFixed(1);
      return `${yrs} yrs`;
    } catch {
      return 'Active';
    }
  };

  const maskAadhar = (aadhar?: string | null) => {
    if (!aadhar) return 'Not Provided';
    const clean = aadhar.replace(/\s+/g, '');
    if (clean.length < 8) return aadhar;
    return `•••• •••• ${clean.slice(-4)}`;
  };

  const handleCopy = (field: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-slate-200 shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Identity</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Read-Only Master
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Official human resources and operational master profile</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIdCardModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-200 shadow-sm"
          >
            <QrCode className="w-4 h-4 text-emerald-600" /> View Smart ID
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all border border-red-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* EXECUTIVE SMART CREDENTIAL HERO CARD */}
      <div className="bg-gradient-to-br from-[#064E3B] via-[#022C22] to-[#0F172A] rounded-3xl p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden text-white">
        {/* Subtle decorative mesh background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Security Strip */}
        <div className="flex items-center justify-between bg-black/30 border border-emerald-400/20 px-4 py-2 rounded-full mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-xs font-black uppercase tracking-widest">
              PHARMAX SFA • OFFICIAL DIGITAL CREDENTIAL
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider">Active on Field</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar with Dual Gold/Emerald Ring */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-3xl p-1 bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-300 shadow-xl flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-[#022C22] border-2 border-white flex items-center justify-center">
                <span className="text-4xl font-black text-emerald-300 tracking-wider">
                  {getInitials(profile?.firstName, profile?.lastName)}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#064E3B] flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white stroke-[3]" />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl font-black tracking-tight text-white">
                {profile?.prefix ? `${profile.prefix} ` : ''}{profile?.firstName} {profile?.middleName ? `${profile.middleName} ` : ''}{profile?.lastName}
              </h2>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-100 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>{profile?.designation || formatRole(profile?.role)}</span>
              </div>

              {profile?.employeeId && (
                <button
                  onClick={() => handleCopy('Employee Code', profile.employeeId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold hover:bg-black/50 transition-colors"
                  title="Click to copy employee ID"
                >
                  <span>EMP: {profile.employeeId}</span>
                  {copiedField === 'Employee Code' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              )}

              <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}>
                {formatRole(profile?.role)}
              </span>

              {profile?.department && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                  {profile.department}
                </span>
              )}

              {profile?.grade && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                  Grade {profile.grade}
                </span>
              )}
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 border border-white/10 rounded-2xl p-3.5 mt-4">
              <div className="text-center sm:text-left sm:border-r sm:border-white/10 sm:pr-3">
                <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Service Tenure</p>
                <p className="text-base font-black text-white mt-0.5">{calculateTenure(profile?.dateOfJoining)}</p>
              </div>

              <div className="text-center sm:text-left sm:border-r sm:border-white/10 sm:pr-3">
                <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Base HQ</p>
                <p className="text-base font-black text-white mt-0.5 truncate">{profile?.hq?.code || profile?.hq?.name || 'Base'}</p>
              </div>

              <div className="text-center sm:text-left sm:border-r sm:border-white/10 sm:pr-3">
                <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">Assigned Beats</p>
                <p className="text-base font-black text-white mt-0.5">{profile?.territories?.length || 0} Territories</p>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">KYC Compliance</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">100% Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENTED TAB NAVIGATION */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        {[
          { key: 'org', label: 'Organization & Hierarchy', icon: Briefcase },
          { key: 'contact', label: 'HQ & Territory Beats', icon: MapPin },
          { key: 'personal', label: 'Personal & Vitals', icon: User },
          { key: 'kyc', label: 'KYC & Compliance', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black tracking-wide transition-all ${
                active
                  ? 'bg-[#064E3B] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORGANIZATION & REPORTING */}
      {activeTab === 'org' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Employment Specifications</h3>
                  <p className="text-[10px] text-slate-400">Designation & Cadre Standing</p>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                Active Confirmed
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Designation</span>
                <span className="font-bold text-slate-900">{profile?.designation || formatRole(profile?.role)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Department / Division</span>
                <span className="font-bold text-slate-900">{profile?.department || 'Field Sales & Operations'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Employee Grade</span>
                <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                  {profile?.grade || 'Executive L2'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Date of Joining</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{formatDate(profile?.dateOfJoining)}</span>
                  <p className="text-[10px] text-emerald-600 font-semibold">{calculateTenure(profile?.dateOfJoining)} with Pharmax</p>
                </div>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Employment Standing</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Good Standing
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Executive Reporting Line</h3>
                <p className="text-[10px] text-slate-400">Direct Manager & Operational Approver</p>
              </div>
            </div>

            {profile?.manager ? (
              <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-100 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {profile.manager.firstName?.[0] || ''}{profile.manager.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Reporting Manager</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {profile.manager.firstName} {profile.manager.lastName}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">{formatRole(profile.manager.role)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                  {profile.manager.phone && (
                    <a
                      href={`tel:${profile.manager.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call
                    </a>
                  )}

                  {profile.manager.phone && (
                    <a
                      href={`https://wa.me/${profile.manager.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-green-700 hover:bg-green-50 transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}

                  {profile.manager.email && (
                    <a
                      href={`mailto:${profile.manager.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Direct Executive Cadre</p>
                <p className="text-xs text-slate-400">Reports directly to Corporate Leadership / Board of Directors.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACT & HEADQUARTERS */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-100">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Base Headquarter & Beats</h3>
                <p className="text-[10px] text-slate-400">Primary Station & Territory Mapping</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Assigned Base HQ</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{profile?.hq?.name || 'Central Corporate HQ'}</p>
                </div>
                {profile?.hq?.code && (
                  <span className="bg-white border border-amber-200 px-3 py-1 rounded-xl text-xs font-mono font-bold text-amber-800 shadow-xs">
                    {profile.hq.code}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-amber-200/40 text-[11px] text-slate-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Daily allowance, tour plans, and ex-station claims calculate from this Base HQ.</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Assigned Beats</p>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {profile?.territories?.length || 0} Territories
                </span>
              </div>

              {profile?.territories && profile.territories.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {profile.territories.map((t: any, i: number) => {
                    const terr = t.territory || t;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900">{terr.name}</span>
                        </div>
                        {terr.code && (
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono font-bold text-emerald-700 text-[11px]">
                            {terr.code}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">General territory coverage mapped under assigned HQ.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Communications & Dispatch</h3>
                <p className="text-[10px] text-slate-400">Official Contact & Courier Address</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Official Email</p>
                    <p className="font-bold text-slate-900">{profile?.email}</p>
                  </div>
                </div>
                {profile?.email && (
                  <button
                    onClick={() => handleCopy('Email', profile.email)}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    title="Copy email"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                    <p className="font-bold text-slate-900">{profile?.phone || 'Not Registered'}</p>
                  </div>
                </div>
                {profile?.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-emerald-700 transition-colors"
                    title="Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {profile?.whatsappNumber && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">WhatsApp Business</p>
                      <p className="font-bold text-slate-900">{profile.whatsappNumber}</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-green-700 transition-colors"
                    title="Open WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Residential Courier Address</p>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {[profile?.address1, profile?.address2, profile?.city, profile?.district, profile?.state]
                    .filter(Boolean)
                    .join(', ') || 'Address not updated in employee master'}
                </p>
                {profile?.pin && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Postal PIN</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {profile.pin}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL VITALS */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 rounded-3xl p-6 shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Heart className="w-5 h-5 fill-white text-white" />
                <h3 className="text-xs font-black uppercase tracking-widest">Workplace Emergency Medical Profile</h3>
              </div>
              <p className="text-xs text-rose-100">
                Registered blood group maintained for employee health insurance, occupational safety, and clinical emergencies.
              </p>
            </div>
            <div className="bg-white text-rose-700 px-6 py-3 rounded-2xl shadow-sm text-center shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider">Blood Group</p>
              <p className="text-2xl font-black mt-0.5">{profile?.bloodGroup || 'O+'}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 border border-purple-100">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Personal Demographics</h3>
                <p className="text-[10px] text-slate-400">Demographic & Family Information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs divide-y md:divide-y-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Gender</span>
                  <span className="font-bold text-slate-900">{profile?.gender || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Date of Birth</span>
                  <span className="font-bold text-slate-900">{formatDate(profile?.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Marital Status</span>
                  <span className="font-bold text-slate-900">{profile?.maritalStatus || 'Not Specified'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {profile?.marriageAnniversary && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Marriage Anniversary</span>
                    <span className="font-bold text-slate-900">{formatDate(profile.marriageAnniversary)}</span>
                  </div>
                )}
                {profile?.spouseName && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">Spouse Name</span>
                    <span className="font-bold text-slate-900">{profile.spouseName}</span>
                  </div>
                )}
                {profile?.dependents != null && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-400 font-medium">No. of Dependents</span>
                    <span className="font-bold text-slate-900">{profile.dependents}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Highest Qualification</span>
                  <span className="font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded">
                    {profile?.qualification || 'Graduate'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KYC & COMPLIANCE */}
      {activeTab === 'kyc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Virtual Metallic PAN Card */}
          <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] rounded-3xl p-6 border border-slate-700 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                  INCOME TAX DEPARTMENT • GOVT OF INDIA
                </p>
                <h4 className="text-xs font-bold text-white mt-0.5">Permanent Account Number (PAN)</h4>
              </div>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            {/* EMV Chip Simulation */}
            <div className="w-10 h-7 rounded-md bg-amber-400/80 border border-amber-300 flex flex-col justify-center px-1">
              <div className="h-px bg-amber-600 mb-1" />
              <div className="h-px bg-amber-600" />
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-400 font-mono">PAN NUMBER</p>
                <p className="text-lg font-mono font-black text-amber-300 tracking-wider">
                  {profile?.panNumber || 'ABCDE1234F'}
                </p>
                <p className="text-xs font-bold text-slate-200 mt-0.5 uppercase">
                  {profile?.firstName} {profile?.lastName}
                </p>
              </div>

              {profile?.panNumber && (
                <button
                  onClick={() => handleCopy('PAN Number', profile.panNumber)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors"
                  title="Copy PAN"
                >
                  <Copy className="w-4 h-4 text-slate-200" />
                </button>
              )}
            </div>
          </div>

          {/* Masked Aadhaar Identity Card */}
          <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 border border-slate-700 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between h-56">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                  UNIQUE IDENTIFICATION AUTHORITY OF INDIA
                </p>
                <h4 className="text-xs font-bold text-white mt-0.5">Aadhaar Identity (Secured)</h4>
              </div>
              <span className="bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
                Encrypted
              </span>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-mono">MASKED UID</p>
              <p className="text-xl font-mono font-black text-slate-100 tracking-widest mt-1">
                {maskAadhar(profile?.aadharNumber)}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Aadhaar tokenized and stored in UIDAI statutory vault for compliance.</span>
            </div>
          </div>

          <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400 shrink-0" />
            <span>
              Employee Master records are strictly read-only under Corporate HR & SFA Policy. To update any statutory identity details, submit an HR request.
            </span>
          </div>
        </div>
      )}

      {/* VIRTUAL CORPORATE ID BADGE MODAL */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#0F172A] rounded-3xl p-6 border-2 border-emerald-400/50 shadow-2xl relative text-white space-y-4">
            <button
              onClick={() => setShowIdCardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-3 border-b border-emerald-600/40">
              <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> PHARMAX HEALTHCARE
              </div>
              <p className="text-[10px] text-emerald-300 font-bold uppercase mt-0.5">Official Executive Field Credential</p>
            </div>

            {/* Avatar on Card */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-emerald-400 shadow-xl">
                <div className="w-full h-full rounded-full bg-[#064E3B] border-2 border-white flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{getInitials(profile?.firstName, profile?.lastName)}</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white">
                {profile?.prefix ? `${profile.prefix} ` : ''}{profile?.firstName} {profile?.lastName}
              </h3>
              <p className="text-emerald-300 text-xs font-bold">{profile?.designation || formatRole(profile?.role)}</p>
              <div className="inline-block bg-white/10 px-3 py-0.5 rounded-full border border-white/15 text-xs font-mono font-bold mt-1">
                ID: {profile?.employeeId || 'PHX-FIELD-01'}
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Division</span>
                <span className="font-bold text-white">{profile?.department || 'Field Sales'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Base HQ</span>
                <span className="font-bold text-white">{profile?.hq?.name || 'Central HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Blood Group</span>
                <span className="font-bold text-rose-400">{profile?.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Valid Thru</span>
                <span className="font-bold text-emerald-300">DEC 2027</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl flex items-center gap-3 text-slate-900">
              <QrCode className="w-10 h-10 shrink-0 text-slate-900" />
              <div className="text-left">
                <p className="text-[9px] font-mono text-slate-500 uppercase">DIGITAL VERIFICATION</p>
                <p className="text-xs font-bold font-mono text-slate-900">
                  {profile?.employeeId ? `PHARMAX:${profile.employeeId}` : 'VERIFIED-REP'}
                </p>
                <p className="text-[9px] text-emerald-700 font-bold">Authorized Field Representative</p>
              </div>
            </div>

            <button
              onClick={() => setShowIdCardModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm text-white transition-colors shadow-md"
            >
              Close ID Badge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
