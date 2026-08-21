'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Cloud, User, Building2, Store, Clock, 
  ThumbsUp, MessageSquare, TrendingUp, Presentation, IndianRupee,
  MoreHorizontal, FileText, Gift, Calendar, Check, Stethoscope, Briefcase, Send, Truck
} from 'lucide-react';
import { api } from '@/lib/api';

interface VisitReportFormProps {
  visit: any;
}

export default function VisitReportForm({ visit }: VisitReportFormProps) {
  const router = useRouter();
  
  // Theme configuration based on VisitType
  const typeConfig = {
    DOCTOR: {
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200',
      title: 'Visit Report (Doctor)',
      icon: Stethoscope,
      name: visit.doctor ? `${visit.doctor.firstName} ${visit.doctor.lastName}` : 'Unknown Doctor',
      sub: visit.doctor?.specialty || 'Doctor',
      address: visit.doctor?.city || 'City',
      objectives: [
        { id: 'Detailing', icon: User, label: 'Detailing' },
        { id: 'Order', icon: Briefcase, label: 'Order' },
        { id: 'Sample', icon: Gift, label: 'Sample' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      businessSignals: [
        { id: 'Will Prescribe', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'Needs Samples', icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'Needs More Information', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        { id: 'Price Concern', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Uses Competitor', icon: User, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Stock Issue', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Budget Constraint', icon: IndianRupee, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        { id: 'Not Interested', icon: Check, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
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
      textColor: 'text-teal-700',
      lightBg: 'bg-teal-50',
      borderColor: 'border-teal-200',
      title: 'Visit Report (Hospital)',
      icon: Building2,
      name: visit.hospital?.name || 'Unknown Hospital',
      sub: visit.hospital?.type || 'Hospital',
      address: visit.hospital?.city || 'City',
      objectives: [
        { id: 'Detailing', icon: Presentation, label: 'Detailing' },
        { id: 'Institutional Order', icon: Briefcase, label: 'Institutional Order' },
        { id: 'Product Presentation', icon: Presentation, label: 'Product Presentation' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      businessSignals: [
        { id: 'Likely to Purchase', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'Needs Proposal', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'Budget Approval Pending', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        { id: 'Tender in Progress', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Prefers Competitor', icon: User, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Pricing Concern', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Low Priority', icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
        { id: 'Not Interested', icon: Check, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
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
      textColor: 'text-purple-700',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200',
      title: 'Visit Report (Pharmacy)',
      icon: Store,
      name: visit.retailer?.name || 'Unknown Pharmacy',
      sub: 'Retail Pharmacy',
      address: visit.retailer?.city || 'City',
      objectives: [
        { id: 'Detailing', icon: Presentation, label: 'Detailing' },
        { id: 'Secondary Order', icon: Briefcase, label: 'Secondary Order' },
        { id: 'Scheme Discussion', icon: MessageSquare, label: 'Scheme Discussion' },
        { id: 'Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      businessSignals: [
        { id: 'Interested in Our Products', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'Needs Stock', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'Price Sensitive', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Demand Low', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        { id: 'Competitor Stocked', icon: User, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Payment Issue', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Fast Moving Product', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'Not Interested', icon: Check, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      ],
      followUpActions: [
        { id: 'Revisit', icon: Calendar, label: 'Revisit' },
        { id: 'Take Order', icon: Briefcase, label: 'Take Order' },
        { id: 'Send Scheme Details', icon: FileText, label: 'Send Scheme Details' },
        { id: 'Bring Stock', icon: Briefcase, label: 'Bring Stock' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    },
    DISTRIBUTOR: {
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      title: 'Visit Report (Distributor)',
      icon: Truck,
      name: visit.distributor?.name || 'Unknown Distributor',
      sub: 'Wholesale Distributor',
      address: visit.distributor?.city || 'City',
      objectives: [
        { id: 'Stock Check', icon: Presentation, label: 'Stock Check' },
        { id: 'Primary Order', icon: Briefcase, label: 'Primary Order' },
        { id: 'Payment Collection', icon: IndianRupee, label: 'Collection' },
        { id: 'Claims Settlement', icon: FileText, label: 'Claims' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
      businessSignals: [
        { id: 'Good Liquidity', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'High Inventory', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'Payment Delayed', icon: IndianRupee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'Competitor Push', icon: User, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'Requires Support', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        { id: 'Excellent Growth', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      ],
      followUpActions: [
        { id: 'Process Order', icon: Briefcase, label: 'Process Order' },
        { id: 'Clear Claims', icon: FileText, label: 'Clear Claims' },
        { id: 'Follow Up Payment', icon: IndianRupee, label: 'Follow Up Payment' },
        { id: 'Next Visit', icon: Calendar, label: 'Next Visit' },
        { id: 'Other', icon: MoreHorizontal, label: 'Other' },
      ],
    }
  };

  const config = typeConfig[visit.visitType as keyof typeof typeConfig] || typeConfig.DOCTOR;
  const TopIcon = config.icon;

  // Form State
  const [objectives, setObjectives] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<string>('');
  const [signals, setSignals] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], val: string) => {
    if (current.includes(val)) {
      setter(current.filter(item => item !== val));
    } else {
      setter([...current, val]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        lat: visit.checkInLat || 0,
        lng: visit.checkInLng || 0,
        visitObjective: objectives,
        engagement,
        businessSignal: signals,
        followUpAction: followUp,
        notes,
        nextFollowUpDate: followUpDate || undefined,
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

  // Format Duration
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
    <div className="w-full max-w-4xl mx-auto bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:mt-6 md:mb-12 overflow-hidden font-sans pb-8">
      {/* Header */}
      <div className={`${config.color} text-white px-4 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-[17px] leading-tight">{config.title}</h1>
            <p className="text-[11px] text-white/80">Quick Report (20-30 sec)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-[11px] font-medium">
          <Cloud className="w-3.5 h-3.5" /> Online
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full ${config.lightBg} ${config.textColor} flex items-center justify-center shrink-0`}>
          <TopIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 leading-tight">{config.name}</h2>
          <p className="text-[11px] text-gray-600 mt-0.5">{config.sub}</p>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
            <User className="w-3 h-3" /> {config.address}
          </div>
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
        
        {/* 1. Visit Objective */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">1. Visit Objective <span className="font-normal text-gray-500">(Purpose of the visit)</span></h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pb-2">
            {config.objectives.map(obj => {
              const Icon = obj.icon;
              const isSelected = objectives.includes(obj.id);
              return (
                <button
                  key={obj.id}
                  onClick={() => toggleArray(setObjectives, objectives, obj.id)}
                  className={`flex flex-col items-center justify-center w-full py-4 rounded-xl border ${isSelected ? `border-2 ${config.borderColor} ${config.lightBg}` : 'border-gray-200 bg-white'} transition-all hover:bg-gray-50`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? config.textColor : 'text-blue-600'}`} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? config.textColor : 'text-gray-700'}`}>{obj.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Visit Feedback */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">2. Visit Feedback</h3>
          
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-gray-900 mb-2.5">A. Engagement <span className="font-normal text-gray-500">(Overall interaction level)</span></p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Excellent', color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
                { id: 'Positive', color: 'text-green-500', border: 'border-green-200', bg: 'bg-green-50' },
                { id: 'Neutral', color: 'text-orange-400', border: 'border-orange-200', bg: 'bg-orange-50' },
                { id: 'Negative', color: 'text-red-500', border: 'border-red-200', bg: 'bg-red-50' }
              ].map(eng => {
                const isSelected = engagement === eng.id;
                return (
                  <button
                    key={eng.id}
                    onClick={() => setEngagement(eng.id)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border ${isSelected ? `border-2 ${eng.bg}` : 'border-gray-100 bg-white shadow-sm'} transition-all`}
                  >
                    <div className={`w-7 h-7 rounded-full border-[1.5px] ${eng.color} border-current flex items-center justify-center mb-1.5`}>
                      <span className="text-[10px] font-bold">
                        {eng.id === 'Excellent' ? ':-)' : eng.id === 'Positive' ? ':-)' : eng.id === 'Neutral' ? ':-|' : ':-('}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold ${isSelected ? eng.color : 'text-gray-600'}`}>{eng.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-900 mb-2.5">B. Business Signal <span className="font-normal text-gray-500">({config.title.replace('Visit Report (', '').replace(')', '')}&apos;s response / business outlook)</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.businessSignals.map(sig => {
                const Icon = sig.icon;
                const isSelected = signals.includes(sig.id);
                return (
                  <button
                    key={sig.id}
                    onClick={() => toggleArray(setSignals, signals, sig.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border ${isSelected ? `border-2 ${sig.border} ${sig.bg}` : 'border-gray-100 bg-white shadow-sm'} text-left transition-all`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? sig.color : 'text-gray-400'}`} />
                    <span className={`text-[10px] font-semibold leading-tight ${isSelected ? sig.color : 'text-gray-700'}`}>{sig.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
            <div className="bg-blue-50 p-1 rounded">
              <MoreHorizontal className="w-3 h-3" />
            </div>
            Add Note (Optional)
          </button>
        </section>

        {/* 3. Follow-up Action */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">3. Follow-up Action <span className="font-normal text-gray-500">(Next step decided)</span></h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pb-2">
            {config.followUpActions.map(act => {
              const Icon = act.icon;
              const isSelected = followUp === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setFollowUp(act.id)}
                  className={`flex flex-col items-center justify-center w-full py-4 rounded-xl border ${isSelected ? `border-2 ${config.borderColor} ${config.lightBg}` : 'border-gray-200 bg-white'} transition-all hover:bg-gray-50`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? config.textColor : 'text-blue-600'}`} />
                  <span className={`text-[10px] font-semibold text-center leading-tight ${isSelected ? config.textColor : 'text-gray-700'}`}>{act.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Follow-up Date */}
        <section>
          <h3 className="text-[13px] font-bold text-gray-900 mb-3">4. Follow-up Date</h3>
          <div className="relative">
            <input 
              type="date" 
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-semibold text-gray-900 outline-none focus:border-blue-500 pl-11"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          </div>
        </section>

      </div>

      {/* Footer / Submit */}
      <div className="mt-6 px-4 flex flex-col gap-3">
        <div className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
          <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-600 leading-tight">
            All location, time and visit duration are auto captured. You just need to provide the above information.
          </p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full ${config.color} hover:opacity-90 text-white font-bold text-[13px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md`}
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
