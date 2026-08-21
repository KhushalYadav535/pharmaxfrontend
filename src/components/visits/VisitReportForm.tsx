'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Cloud, User, Building2, Store, Clock,
  MessageSquare, TrendingUp, Presentation, IndianRupee,
  MoreHorizontal, FileText, Gift, Calendar, Check, Stethoscope,
  Briefcase, Send, Truck, MapPin, Package, CheckSquare, Square, ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Visit Report Form (Check-out) ───────────────────────────────────────────
// Fields aligned with FFMS-Data-Fields.xlsx visit sheets:
// visitPurpose, visitFeedback, nextVisit, remarks, jointVisit (radio),
// jointVisitWith (conditional), productsPromoted, locationDetails (auto)

interface VisitReportFormProps {
  visit: any;
}

const JOINT_VISIT_OPTIONS = ['ASM', 'RSM', 'ZM', 'NSM', 'Product Manager', 'Management', 'Other'];

export default function VisitReportForm({ visit }: VisitReportFormProps) {
  const router = useRouter();

  // ── Theme config per VisitType ──────────────────────────────────────────────
  const typeConfig = {
    DOCTOR: {
      color: 'bg-blue-600',
      gradient: 'from-blue-600 to-blue-700',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      accentHex: '#2563eb',
      title: 'Doctor Visit Report',
      icon: Stethoscope,
      name: visit.doctor ? `${visit.doctor.firstName} ${visit.doctor.lastName}` : 'Unknown Doctor',
      sub: visit.doctor?.specialty || 'Doctor',
      address: visit.doctor?.city || '',
      // Visit Objective options per FFMS
      objectives: [
        { id: 'Detailing', icon: Presentation, label: 'Detailing' },
        { id: 'Order', icon: Briefcase, label: 'Order' },
        { id: 'Sample', icon: Gift, label: 'Sample' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      followUpActions: [
        { id: 'Revisit', icon: Calendar, label: 'Revisit' },
        { id: 'Take Order', icon: Briefcase, label: 'Take Order' },
        { id: 'Send Literature', icon: FileText, label: 'Send Literature' },
        { id: 'CME Invite', icon: Presentation, label: 'CME Invite' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
    HOSPITAL: {
      color: 'bg-teal-700',
      gradient: 'from-teal-600 to-teal-700',
      textColor: 'text-teal-700',
      lightBg: 'bg-teal-50',
      borderColor: 'border-teal-200',
      accentHex: '#0f766e',
      title: 'Hospital Visit Report',
      icon: Building2,
      name: visit.hospital?.name || 'Unknown Hospital',
      sub: visit.hospital?.type || 'Hospital',
      address: visit.hospital?.city || '',
      objectives: [
        { id: 'Detailing', icon: Presentation, label: 'Detailing' },
        { id: 'Institutional Order', icon: Briefcase, label: 'Inst. Order' },
        { id: 'Product Presentation', icon: Presentation, label: 'Presentation' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      followUpActions: [
        { id: 'Revisit', icon: Calendar, label: 'Revisit' },
        { id: 'Send Proposal', icon: FileText, label: 'Send Proposal' },
        { id: 'Arrange Meeting', icon: User, label: 'Arrange Meeting' },
        { id: 'Send Literature', icon: FileText, label: 'Send Literature' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
    RETAILER: {
      color: 'bg-purple-700',
      gradient: 'from-purple-600 to-purple-700',
      textColor: 'text-purple-700',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      accentHex: '#6d28d9',
      title: 'Retailer Visit Report',
      icon: Store,
      name: visit.retailer?.name || 'Unknown Pharmacy',
      sub: 'Retail Pharmacy',
      address: visit.retailer?.city || '',
      objectives: [
        { id: 'Detailing', icon: Presentation, label: 'Detailing' },
        { id: 'Secondary Order', icon: Briefcase, label: 'Sec. Order' },
        { id: 'Scheme Discussion', icon: MessageSquare, label: 'Scheme' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      followUpActions: [
        { id: 'Revisit', icon: Calendar, label: 'Revisit' },
        { id: 'Take Order', icon: Briefcase, label: 'Take Order' },
        { id: 'Send Scheme Details', icon: FileText, label: 'Scheme Details' },
        { id: 'Bring Stock', icon: Briefcase, label: 'Bring Stock' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
    DISTRIBUTOR: {
      color: 'bg-emerald-600',
      gradient: 'from-emerald-600 to-emerald-700',
      textColor: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      accentHex: '#047857',
      title: 'Distributor Visit Report',
      icon: Truck,
      name: visit.distributor?.name || 'Unknown Distributor',
      sub: 'Wholesale Distributor',
      address: visit.distributor?.city || '',
      objectives: [
        { id: 'Stock Check', icon: Presentation, label: 'Stock Check' },
        { id: 'Primary Order', icon: Briefcase, label: 'Primary Order' },
        { id: 'Payment Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Claims Settlement', icon: FileText, label: 'Claims' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      followUpActions: [
        { id: 'Process Order', icon: Briefcase, label: 'Process Order' },
        { id: 'Clear Claims', icon: FileText, label: 'Clear Claims' },
        { id: 'Follow Up Payment', icon: IndianRupee, label: 'Follow Payment' },
        { id: 'Next Visit', icon: Calendar, label: 'Next Visit' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
    STOCKIST: {
      color: 'bg-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-700',
      lightBg: 'bg-orange-50',
      borderColor: 'border-orange-200',
      accentHex: '#c2410c',
      title: 'Stockist Visit Report',
      icon: Package,
      name: visit.stockist?.name || 'Unknown Stockist',
      sub: 'Stockist',
      address: visit.stockist?.city || '',
      objectives: [
        { id: 'Stock Check', icon: Presentation, label: 'Stock Check' },
        { id: 'Primary Order', icon: Briefcase, label: 'Primary Order' },
        { id: 'Payment Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      followUpActions: [
        { id: 'Process Order', icon: Briefcase, label: 'Process Order' },
        { id: 'Follow Up Payment', icon: IndianRupee, label: 'Follow Payment' },
        { id: 'Next Visit', icon: Calendar, label: 'Next Visit' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
  };

  const config = typeConfig[visit.visitType as keyof typeof typeConfig] || typeConfig.DOCTOR;
  const TopIcon = config.icon;

  // ── FFMS Form State ──────────────────────────────────────────────────────────
  // Visit Purpose (FFMS Field)
  const [visitPurpose, setVisitPurpose] = useState('');
  // Visit Feedback (FFMS Field)
  const [visitFeedback, setVisitFeedback] = useState('');
  // Next Visit (FFMS Field)
  const [nextVisit, setNextVisit] = useState('');
  // Remarks (FFMS Field)
  const [remarks, setRemarks] = useState('');
  // Joint Visit — Radio Button (FFMS Field)
  const [jointVisit, setJointVisit] = useState<'Yes' | 'No' | ''>('');
  // Joint Visit With — List enabled only when jointVisit=Yes (FFMS Field)
  const [jointVisitWith, setJointVisitWith] = useState('');
  // Products Promoted — multi-select FK to Product Master (FFMS Field)
  const [productsPromoted, setProductsPromoted] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);

  // Legacy CRM fields kept for visit check-out flow
  const [objectives, setObjectives] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available products (would be fetched from API in real use)
  const availableProducts: { id: string; name: string }[] = visit.availableProducts || [];
  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], val: string) => {
    setter(current.includes(val) ? current.filter(i => i !== val) : [...current, val]);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        lat: visit.checkInLat || 0,
        lng: visit.checkInLng || 0,
        // FFMS Fields
        visitPurpose,
        visitFeedback,
        nextVisit: nextVisit || undefined,
        remarks,
        jointVisit: jointVisit === 'Yes',
        jointVisitWith: jointVisit === 'Yes' ? jointVisitWith : undefined,
        productsPromoted,
        // Legacy CRM fields
        visitObjective: objectives,
        followUpAction: followUp,
        notes,
        nextFollowUpDate: nextVisit || undefined,
      };
      await api.patch(`/visits/${visit.id}/check-out`, payload);
      alert('Visit Report Submitted Successfully!');
      router.push('/dashboard/visits');
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duration display
  let duration = '00:00 min';
  if (visit.checkInTime) {
    const diff = new Date().getTime() - new Date(visit.checkInTime).getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    duration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
  }
  const checkedInAt = visit.checkInTime
    ? new Date(visit.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Not Checked In';

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden font-sans pb-8">

      {/* ── Header ── */}
      <div className={`${config.color} text-white px-6 py-6 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-[20px] tracking-tight leading-tight drop-shadow-sm">{config.title}</h1>
            <p className="text-[12px] font-medium text-white/80 mt-1 uppercase tracking-wider">Check-out Report</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-inner">
          <Cloud className="w-3.5 h-3.5" /> Online
        </div>
      </div>

      {/* ── Entity Card ── */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full ${config.lightBg} ${config.textColor} flex items-center justify-center shrink-0`}>
          <TopIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 leading-tight">{config.name}</h2>
          <p className="text-[11px] text-gray-600 mt-0.5">{config.sub}</p>
          {config.address && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
              <User className="w-3 h-3" /> {config.address}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-600">
            <Check className="w-3.5 h-3.5" /> Checked-in: {checkedInAt}
          </div>
          <p className="text-[10px] text-gray-700 mt-0.5">Duration: {duration}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">(Auto captured)</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-7">

        {/* ── 1. Visit Objective (CRM, kept) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">
            1. Visit Objective <span className="font-normal text-gray-500">(Purpose of the visit)</span>
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {config.objectives.map((obj: any) => {
              const Icon = obj.icon;
              const isSelected = objectives.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  onClick={() => toggleArray(setObjectives, objectives, obj.id)}
                  className={`flex flex-col items-center justify-center w-full py-4 rounded-xl border transition-all hover:bg-gray-50 ${isSelected ? `border-2 ${config.borderColor} ${config.lightBg}` : 'border-gray-200 bg-white'}`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? config.textColor : 'text-blue-600'}`} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? config.textColor : 'text-gray-700'}`}>{obj.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Visit Purpose (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">
            2. Visit Purpose <span className="font-normal text-gray-500">(FFMS Field)</span>
          </h3>
          <textarea
            value={visitPurpose}
            onChange={e => setVisitPurpose(e.target.value)}
            rows={2}
            placeholder="Enter the purpose of this visit..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-900 outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </section>

        {/* ── 3. Visit Feedback (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">
            3. Visit Feedback <span className="font-normal text-gray-500">(FFMS Field)</span>
          </h3>
          <textarea
            value={visitFeedback}
            onChange={e => setVisitFeedback(e.target.value)}
            rows={2}
            placeholder="Feedback from this visit..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-900 outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </section>

        {/* ── 4. Remarks (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">4. Remarks</h3>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={2}
            placeholder="Additional remarks..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-900 outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </section>

        {/* ── 5. Joint Visit — Radio Button (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">
            5. Joint Visit <span className="font-normal text-gray-500">(Joint with Managers)</span>
          </h3>
          <div className="flex gap-3 mb-3">
            {(['Yes', 'No'] as const).map((opt: any) => (
              <button
                key={opt}
                onClick={() => { setJointVisit(opt); if (opt === 'No') setJointVisitWith(''); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${jointVisit === opt ? `border-2 ${config.borderColor} ${config.lightBg} ${config.textColor}` : 'border-gray-200 bg-white text-gray-700'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${jointVisit === opt ? config.borderColor.replace('border-', 'border-') : 'border-gray-400'}`}>
                  {jointVisit === opt && <div className={`w-2 h-2 rounded-full ${config.color}`} />}
                </div>
                {opt}
              </button>
            ))}
          </div>

          {/* Joint Visit With — conditional dropdown (FFMS: enabled only if jointVisit=Yes) */}
          {jointVisit === 'Yes' && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-gray-700 mb-1.5">
                Joint Visit With <span className="font-normal text-gray-400">(ASM, Management etc.)</span>
              </p>
              <div className="relative">
                <select
                  value={jointVisitWith}
                  onChange={e => setJointVisitWith(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-[13px] text-gray-900 outline-none appearance-none ${config.borderColor}`}
                >
                  <option value="">Select person...</option>
                  {JOINT_VISIT_OPTIONS.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}
        </section>

        {/* ── 6. Products Promoted — multi-select FK to Product Master (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">
            6. Products Promoted <span className="font-normal text-gray-500">(Reference to Product Master)</span>
          </h3>
          {/* Selected chips */}
          {productsPromoted.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {productsPromoted.map((pid: any) => {
                const p = availableProducts.find(x => x.id === pid);
                return p ? (
                  <span key={pid} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.lightBg} ${config.textColor}`}>
                    {p.name}
                    <button onClick={() => toggleArray(setProductsPromoted, productsPromoted, pid)} className="ml-0.5 text-[10px] font-bold">×</button>
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
              onFocus={() => setShowProductDrop(true)}
              placeholder="Search products..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-blue-400 pr-10"
            />
            <Package className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            {showProductDrop && filteredProducts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { toggleArray(setProductsPromoted, productsPromoted, p.id); setProductSearch(''); setShowProductDrop(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-gray-800 hover:bg-gray-50 text-left"
                  >
                    {productsPromoted.includes(p.id)
                      ? <CheckSquare className={`w-3.5 h-3.5 shrink-0 ${config.textColor}`} />
                      : <Square className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 7. Follow-up Action (CRM, kept) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">
            7. Follow-up Action <span className="font-normal text-gray-500">(Next step)</span>
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {config.followUpActions.map((act: any) => {
              const Icon = act.icon;
              const isSelected = followUp === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setFollowUp(act.id)}
                  className={`flex flex-col items-center justify-center w-full py-4 rounded-xl border transition-all hover:bg-gray-50 ${isSelected ? `border-2 ${config.borderColor} ${config.lightBg}` : 'border-gray-200 bg-white'}`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? config.textColor : 'text-blue-600'}`} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? config.textColor : 'text-gray-700'}`}>{act.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 8. Next Visit Date (FFMS Field) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">8. Next Visit Date</h3>
          <div className="relative">
            <input
              type="date"
              value={nextVisit}
              onChange={e => setNextVisit(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 outline-none focus:border-blue-500 pl-11"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          </div>
        </section>

        {/* ── 9. Location Details (auto-captured, non-editable per FFMS) ── */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">
            9. Location Details <span className="font-normal text-gray-500">(Auto-captured)</span>
          </h3>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500">
              {visit.checkInAddress || (visit.checkInLat ? `${visit.checkInLat?.toFixed(4)}, ${visit.checkInLng?.toFixed(4)}` : 'Location auto-captured on check-in')}
            </span>
          </div>
        </section>

        {/* Notes (internal) */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">
            Notes <span className="font-normal text-gray-500">(Internal)</span>
          </h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal notes (not shown in report)..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-900 outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </section>

      </div>

      {/* ── Footer / Submit ── */}
      <div className="mt-4 px-4 flex flex-col gap-3">
        <div className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
          <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-600 leading-tight">
            Location, time and duration are auto-captured. Joint Visit with field is enabled only when Joint Visit = Yes.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full ${config.color} hover:opacity-90 text-white font-bold text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60`}
        >
          {isSubmitting ? 'SUBMITTING...' : (
            <>
              <Send className="w-4 h-4" /> SUBMIT VISIT REPORT
            </>
          )}
        </button>
      </div>

    </div>
  );
}
