'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles, Send, Mic, MicOff, X, Minimize2, Maximize2,
  Bot, User, ArrowUpRight, CheckCircle2, AlertTriangle,
  Stethoscope, Activity, Building2, Ban, Search, RefreshCw,
  ChevronRight, ArrowRight, MessageSquare, ShieldCheck
} from 'lucide-react';

interface ActionData {
  actionType:
    | 'DOCTOR_CREATED'
    | 'DOCTOR_UPDATED'
    | 'DOCTOR_DEACTIVATED'
    | 'DOCTOR_SEARCH'
    | 'MR_REPORT'
    | 'REP_LIST'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_LIST'
    | 'EMPLOYEE_CREATED'
    | 'EMPLOYEE_UPDATED'
    | 'RETAILER_CREATED'
    | 'RETAILER_LIST'
    | 'TERRITORY_CREATED'
    | 'TERRITORY_LIST'
    | 'VISIT_ASSIGNED'
    | 'VISITS_CANCELLED'
    | 'ORDERS_SUMMARY'
    | 'APPROVAL_ACTION'
    | 'HOSPITAL_CREATED'
    | 'HOSPITAL_LIST'
    | 'STOCKIST_CREATED'
    | 'STOCKIST_LIST'
    | 'ATTENDANCE_SUMMARY'
    | 'SCHEME_CREATED'
    | 'SCHEME_LIST'
    | 'SAMPLE_SUMMARY'
    | 'TOUR_PLAN_ACTION'
    | 'BROADCAST_SENT'
    | 'TARGET_ACTION'
    | 'EXPENSES_SUMMARY'
    | 'TASK_CREATED'
    | 'DASHBOARD_STATS'
    | 'NAVIGATION';
  title: string;
  data: any;
  message: string;
  link?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionData[];
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: '🩺 Add Doctor', prompt: 'Dr. Rajesh Sharma ko Nagpur me add kar do, Cardiology, MBBS MD' },
  { label: '🏥 Add Hospital', prompt: 'Naya hospital add karo Apollo Care Clinic, Indore, 80 beds' },
  { label: '📦 Add Stockist', prompt: 'Naya stockist register karo Agarwal Medicos, Indore' },
  { label: '🕒 Attendance', prompt: 'Aaj ki field team attendance summary dikhao' },
  { label: '🏷️ Add Scheme', prompt: 'Nayi trade scheme add karo Monsoon Dhamaka 12% discount' },
  { label: '💊 Add Medicine', prompt: 'Naya product add karo Biocros-500, MRP 120, Tablet' },
  { label: '👥 Onboard MR', prompt: 'Naya MR onboard karo Rahul Verma Indore headquarter' },
  { label: '📢 Broadcast', prompt: 'Team ko broadcast message bhejo: Focus on primary orders and hospital calls today' },
  { label: '🎯 Set Target', prompt: 'Indore headquarter ka target 1000000 set karo' },
  { label: '🧾 Expenses', prompt: 'Is mahine ke field expenses claims dikhao' },
  { label: '🏪 Add Chemist', prompt: 'Naya chemist add karo Sharma Medical Store, Indore' },
  { label: '📍 Add Territory', prompt: 'Naya headquarter create karo Raipur, Chhattisgarh' },
  { label: '💰 Orders Telemetry', prompt: 'Aaj ke orders aur sales summary dikhao' },
  { label: '📋 Pending Approvals', prompt: 'Pending approvals dikhao' },
  { label: '📊 MR Daily Report', prompt: 'MR Rahul ki aaj ki report dikhao' },
  { label: '🚫 Cancel MR Visits', prompt: 'Rahul ki aaj ki saari planned visits cancel kar do' },
  { label: '📈 Field Overview', prompt: 'Aaj ka live field summary aur overview dikhao' },
];

// ── Helper to format text without raw '**' asterisks ──────────────────────────
function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-1" />;

        // Tokenize by **bold text**
        const parts = line.split(/(\*\*.*?\*\*)/g);

        const renderedLine = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
              <strong
                key={partIdx}
                className={isUser ? 'font-black text-white' : 'font-bold text-slate-900'}
              >
                {boldText}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        });

        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ');

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-1">
              <span className={isUser ? 'text-white/80 font-bold' : 'text-emerald-600 font-bold'}>•</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={lineIdx}>{renderedLine}</div>;
      })}
    </div>
  );
}

export default function FloatingAICopilot() {
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `नमस्ते **${user?.firstName || 'Admin'}**! मैं आपका **Pharmax Autonomous AI Copilot** हूँ। 
आप मुझे सीधे बोलकर या लिखकर पोर्टल के कार्य करवा सकते हैं—जैसे:
- किसी भी टेरिटरी में डॉक्टर ऐड करना
- किसी भी MR की आज की लाइव रिपोर्ट या DCR देखना
- गलत रूट पर प्लान हुई विजिट्स को बल्क में कैंसिल करना`,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Global hotkey: Ctrl + Space or Alt + A to toggle (Super Admin only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (user?.role !== 'SUPER_ADMIN') return;
      if ((e.ctrlKey && e.code === 'Space') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user?.role]);

  // AI Command Mutation
  const agentMutation = useMutation({
    mutationFn: async (chatHistory: { role: string; content: string }[]) => {
      const res = await api.post('/ai/agent', { messages: chatHistory });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (!data) return;
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply || 'Action executed successfully.',
        actions: data.actions || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (err: any) => {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `क्षमा करें, कमांड प्रोसेस करने में त्रुटि हुई: ${err?.response?.data?.message || err?.message || 'Server error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || agentMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // Prepare history for API
    const historyPayload = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    agentMutation.mutate(historyPayload);
  };

  // Voice Input (Speech-to-Text)
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Supports Hindi & Hinglish
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Only show and render AI Copilot for Super Admin
  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON (Bottom-Right) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 p-3.5 pr-4.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-700/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20"
          title="Open Pharmax AI Copilot (Alt + A)"
        >
          <div className="relative w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-ping" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-black tracking-tight leading-none text-white">AI Copilot</p>
            <p className="text-[10px] text-emerald-100 font-medium leading-tight mt-0.5">Admin Action Agent</p>
          </div>
        </button>
      )}

      {/* ── FLOATING CHAT WINDOW ── */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white border border-slate-200/90 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] h-[640px] max-h-[calc(100vh-3rem)] rounded-3xl'
          }`}
        >
          {/* ── HEADER ── */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:px-5 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white">Pharmax AI Copilot</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    Hostinger-Style Agent
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Direct database actions & telemetry via natural voice/chat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                title={isExpanded ? 'Restore Size' : 'Expand Full Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── MESSAGES CONTAINER ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isAssistant
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs space-y-2 shadow-2xs ${
                      isAssistant
                        ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                        : 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                    }`}
                  >
                    <FormattedMessage content={msg.content} isUser={!isAssistant} />

                    {/* ── INTERACTIVE ACTION CARDS ── */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        {msg.actions.map((act, index) => (
                          <div
                            key={index}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {act.title}
                              </span>
                            </div>

                            {/* Specific Card Layouts */}
                            {act.actionType === 'DOCTOR_CREATED' && (
                              <div className="space-y-1 text-slate-700">
                                <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {act.data.specialty} · {act.data.qualification} · Code: {act.data.doctorCode}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  HQ: <strong>{act.data.hqName}</strong>
                                </p>
                              </div>
                            )}

                            {act.actionType === 'DOCTOR_UPDATED' && (
                              <div className="space-y-1.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                    Updated
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {act.data.specialty} · {act.data.qualification} · Code: {act.data.doctorCode}
                                </p>
                                <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                                  <span>HQ: <strong>{act.data.hq}</strong></span>
                                  <span>Phone: <strong>{act.data.phone}</strong></span>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'DOCTOR_DEACTIVATED' && (
                              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-xs">{act.data.name} ({act.data.doctorCode})</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">Deactivated</span>
                                </div>
                                <p className="text-[11px] text-rose-600">{act.data.reason}</p>
                              </div>
                            )}

                            {act.actionType === 'PRODUCT_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                                    {act.data.productCode}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">{act.data.composition}</p>
                                <div className="flex items-center gap-2 text-[11px] pt-1">
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    MRP: ₹{act.data.mrp}
                                  </span>
                                  {act.data.ptr && (
                                    <span className="text-slate-600">PTR: ₹{act.data.ptr}</span>
                                  )}
                                  <span className="text-slate-500">{act.data.category}</span>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'PRODUCT_UPDATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">Updated</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] pt-1 font-semibold">
                                  <span>MRP: ₹{act.data.mrp}</span>
                                  <span>PTR: ₹{act.data.ptr}</span>
                                  <span className={act.data.isActive ? 'text-emerald-600' : 'text-rose-600'}>
                                    {act.data.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'PRODUCT_LIST' && act.data.products && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Products Found</span>
                                  <span className="px-2 py-0.5 bg-slate-200 rounded-md text-[10px]">{act.data.total} items</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.products.map((p: any) => (
                                    <div key={p.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{p.name}</p>
                                        <p className="text-[10px] text-slate-500">{p.composition || p.category}</p>
                                      </div>
                                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                                        ₹{p.mrp}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'EMPLOYEE_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                    {act.data.role} · {act.data.employeeId}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 space-y-0.5">
                                  <p>Email: <strong className="text-slate-800 font-mono">{act.data.email}</strong></p>
                                  <p>HQ: <strong>{act.data.hq}</strong></p>
                                  <p className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[10px] font-semibold border border-amber-200">
                                    Default Password: <strong>{act.data.defaultPassword}</strong>
                                  </p>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'EMPLOYEE_UPDATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">Updated</span>
                                </div>
                                <div className="text-[11px] text-slate-600 flex items-center gap-3 pt-0.5">
                                  <span>Role: <strong>{act.data.role}</strong></span>
                                  <span>HQ: <strong>{act.data.hq}</strong></span>
                                  <span>Phone: <strong>{act.data.phone}</strong></span>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'RETAILER_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold">
                                    {act.data.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  City: <strong>{act.data.city}</strong> · HQ: <strong>{act.data.hq}</strong>
                                </p>
                              </div>
                            )}

                            {act.actionType === 'RETAILER_LIST' && act.data.retailers && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Retailers / Chemists</span>
                                  <span className="px-2 py-0.5 bg-slate-200 rounded-md text-[10px]">{act.data.total} total</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.retailers.map((r: any) => (
                                    <div key={r.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{r.name}</p>
                                        <p className="text-[10px] text-slate-500">{r.city} · {r.hq}</p>
                                      </div>
                                      {r.phone && <span className="text-[10px] text-slate-400">{r.phone}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'TERRITORY_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                                    {act.data.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">State: <strong>{act.data.state}</strong></p>
                              </div>
                            )}

                            {act.actionType === 'TERRITORY_LIST' && act.data.headquarters && (
                              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                {act.data.headquarters.map((h: any) => (
                                  <div key={h.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                    <div>
                                      <p className="font-bold text-slate-800">{h.name}</p>
                                      <p className="text-[10px] text-slate-500">{h.state} · Code: {h.code}</p>
                                    </div>
                                    <div className="text-right text-[10px] text-slate-500">
                                      <p className="font-bold text-emerald-700">{h.doctorCount} Doctors</p>
                                      <p>{h.repCount} Reps</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {act.actionType === 'VISIT_ASSIGNED' && (
                              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                                <p className="font-bold text-xs">
                                  Visit Assigned to {act.data.repName}
                                </p>
                                <p className="text-[11px] text-emerald-700">
                                  Target: <strong>{act.data.targetTitle}</strong> ({act.data.type})
                                </p>
                                <p className="text-[10px] text-emerald-600">Date: {act.data.date}</p>
                              </div>
                            )}

                            {act.actionType === 'ORDERS_SUMMARY' && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-center">
                                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</p>
                                    <p className="text-base font-black text-slate-900">{act.data.totalCount}</p>
                                  </div>
                                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Total Revenue</p>
                                    <p className="text-base font-black text-emerald-700">₹{(act.data.totalRevenue || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                                {act.data.orders && act.data.orders.length > 0 && (
                                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                                    {act.data.orders.map((o: any) => (
                                      <div key={o.id} className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                        <div>
                                          <p className="font-bold text-slate-800">{o.retailer}</p>
                                          <p className="text-[10px] text-slate-400">{o.mr}</p>
                                        </div>
                                        <span className="font-extrabold text-emerald-700 text-[11px]">₹{(o.amount || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'APPROVAL_ACTION' && (
                              <div className="space-y-2">
                                {act.data.status ? (
                                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-slate-900">{act.data.docName || act.data.repName}</p>
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                        act.data.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {act.data.status}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 text-xs">
                                    {act.data.doctors && act.data.doctors.length > 0 && (
                                      <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                                        <p className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                                          <span>Doctors Pending Approval</span>
                                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">{act.data.doctors.length}</span>
                                        </p>
                                        {act.data.doctors.map((d: any) => (
                                          <p key={d.id} className="text-[11px] text-slate-600">• Dr. {d.firstName} {d.lastName} ({d.specialty}, {d.city})</p>
                                        ))}
                                      </div>
                                    )}
                                    {act.data.leaves && act.data.leaves.length > 0 && (
                                      <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                                        <p className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                                          <span>Leaves Pending Approval</span>
                                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">{act.data.leaves.length}</span>
                                        </p>
                                        {act.data.leaves.map((l: any) => (
                                          <p key={l.id} className="text-[11px] text-slate-600">• {l.repName}: {l.type} ({l.days} days)</p>
                                        ))}
                                      </div>
                                    )}
                                    {act.data.expenses && act.data.expenses.length > 0 && (
                                      <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                                        <p className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                                          <span>Expense Claims Pending</span>
                                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">{act.data.expenses.length}</span>
                                        </p>
                                        {act.data.expenses.map((e: any) => (
                                          <p key={e.id} className="text-[11px] text-slate-600">• {e.repName}: ₹{e.amount} ({e.category})</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'DASHBOARD_STATS' && act.data && (
                              <div className="grid grid-cols-2 gap-1.5 text-center">
                                <div className="p-2 rounded-xl bg-white border border-slate-200">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Calls</p>
                                  <p className="text-base font-black text-slate-900">{act.data.totalVisits}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Completed</p>
                                  <p className="text-base font-black text-emerald-700">{act.data.completedVisits}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                                  <p className="text-[10px] text-amber-600 font-bold uppercase">In-Clinic Live</p>
                                  <p className="text-base font-black text-amber-700">{act.data.liveVisits}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                                  <p className="text-[10px] text-blue-600 font-bold uppercase">Total Doctors</p>
                                  <p className="text-base font-black text-blue-700">{act.data.totalDoctors}</p>
                                </div>
                              </div>
                            )}

                            {act.actionType === 'MR_REPORT' && act.data.stats && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold">Total</p>
                                    <p className="text-sm font-black text-slate-800">{act.data.stats.total}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <p className="text-[10px] text-emerald-600 font-bold">Done</p>
                                    <p className="text-sm font-black text-emerald-700">{act.data.stats.completed}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-[10px] text-amber-600 font-bold">Live</p>
                                    <p className="text-sm font-black text-amber-700">{act.data.stats.live}</p>
                                  </div>
                                </div>
                                {act.data.stats.totalPob > 0 && (
                                  <p className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                    POB Booked: ₹{act.data.stats.totalPob}
                                  </p>
                                )}
                              </div>
                            )}

                            {act.actionType === 'VISITS_CANCELLED' && (
                              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                                <p className="font-bold text-xs">
                                  {act.data.count} Visits Cancelled for {act.data.repName}
                                </p>
                                <p className="text-[11px] text-rose-600">
                                  Reason: {act.data.reason}
                                </p>
                              </div>
                            )}

                            {act.actionType === 'DOCTOR_SEARCH' && (
                              <div className="space-y-2">
                                {act.data.totalDoctors !== undefined && (
                                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                                    <span className="text-xs font-bold text-emerald-900">
                                      {act.data.headquarter ? `${act.data.headquarter} Headquarter` : 'Total Registered'}
                                    </span>
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                                      {act.data.totalDoctors} Doctors
                                    </span>
                                  </div>
                                )}

                                {act.data.topSpecialties && act.data.topSpecialties.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {act.data.topSpecialties.map((s: any, idx: number) => (
                                      <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                        {s.specialty}: {s.count}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {act.data.doctors && (
                                  <div className="space-y-1.5">
                                    {act.data.doctors.map((d: any) => (
                                      <div key={d.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                        <div>
                                          <p className="font-bold text-slate-800">{d.name}</p>
                                          <p className="text-[10px] text-slate-500">{d.specialty} · {d.hq}</p>
                                        </div>
                                        <Link
                                          href={`/dashboard/doctors/${d.id}`}
                                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        >
                                          <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'REP_LIST' && act.data.representatives && (
                              <div className="space-y-2">
                                {act.data.totalCalls !== undefined && (
                                  <div className="grid grid-cols-3 gap-1.5 text-center">
                                    <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                                      <p className="text-[10px] text-slate-400 font-bold">Total Calls</p>
                                      <p className="text-sm font-black text-slate-800">{act.data.totalCalls}</p>
                                    </div>
                                    <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                      <p className="text-[10px] text-emerald-600 font-bold">Completed</p>
                                      <p className="text-sm font-black text-emerald-700">{act.data.totalCompleted}</p>
                                    </div>
                                    <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                                      <p className="text-[10px] text-amber-600 font-bold">In Clinic</p>
                                      <p className="text-sm font-black text-amber-700">{act.data.totalLive}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.representatives.map((r: any, idx: number) => (
                                    <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{r.name}</p>
                                        <p className="text-[10px] text-slate-500">{r.role} · {r.hq}</p>
                                      </div>
                                      {r.total !== undefined ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          {r.total} visits {r.completed > 0 ? `(${r.completed} done)` : ''}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-mono">{r.code || 'ACTIVE'}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'HOSPITAL_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                                    {act.data.code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                                  <span>HQ: <strong>{act.data.hq}</strong> · {act.data.city}</span>
                                  {act.data.beds && <span className="font-semibold text-emerald-800">{act.data.beds} Beds</span>}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'HOSPITAL_LIST' && act.data.hospitals && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Hospitals ({act.data.total})</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.hospitals.map((h: any) => (
                                    <div key={h.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{h.name}</p>
                                        <p className="text-[10px] text-slate-500">{h.city} · {h.hq}</p>
                                      </div>
                                      {h.beds && <span className="text-[10px] font-semibold text-slate-600">{h.beds} Beds</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'STOCKIST_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900 text-sm">{act.data.name}</p>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                                    {act.data.code}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600">
                                  City: <strong>{act.data.city}</strong> · HQ: <strong>{act.data.hq}</strong>
                                </p>
                              </div>
                            )}

                            {act.actionType === 'STOCKIST_LIST' && act.data.stockists && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Stockists & Distributors</span>
                                  <span className="px-2 py-0.5 bg-slate-200 rounded-md text-[10px]">{act.data.total} total</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.stockists.map((s: any) => (
                                    <div key={s.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{s.name}</p>
                                        <p className="text-[10px] text-slate-500">{s.city} · {s.hq}</p>
                                      </div>
                                      {s.phone && <span className="text-[10px] text-slate-400 font-mono">{s.phone}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'ATTENDANCE_SUMMARY' && act.data && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-4 gap-1 text-center">
                                  <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Staff</p>
                                    <p className="text-xs font-black text-slate-800">{act.data.totalFieldUsers}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <p className="text-[9px] text-emerald-600 font-bold uppercase">Present</p>
                                    <p className="text-xs font-black text-emerald-700">{act.data.presentCount}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-[9px] text-amber-600 font-bold uppercase">Leave</p>
                                    <p className="text-xs font-black text-amber-700">{act.data.onLeaveCount}</p>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200">
                                    <p className="text-[9px] text-rose-600 font-bold uppercase">Absent</p>
                                    <p className="text-xs font-black text-rose-700">{act.data.absentCount}</p>
                                  </div>
                                </div>
                                {act.data.attendances && act.data.attendances.length > 0 && (
                                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 no-scrollbar text-xs">
                                    {act.data.attendances.map((a: any, idx: number) => (
                                      <div key={idx} className="p-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                        <span className="font-semibold text-slate-800">{a.name}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                          a.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                          {a.status} {a.checkIn !== 'N/A' ? `(${a.checkIn})` : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'SCHEME_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-xs">{act.data.name}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-800">
                                    {act.data.discountValue}% OFF
                                  </span>
                                </div>
                                <p className="text-[11px] text-purple-700">
                                  Type: <strong>{act.data.discountType}</strong> · Min Qty: <strong>{act.data.minQuantity}</strong>
                                </p>
                              </div>
                            )}

                            {act.actionType === 'SCHEME_LIST' && act.data.schemes && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Promotional Trade Schemes</span>
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold">{act.data.schemes.length} active</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                  {act.data.schemes.map((s: any) => (
                                    <div key={s.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="font-bold text-slate-800">{s.name}</p>
                                        <p className="text-[10px] text-slate-500">Min Qty: {s.minQuantity}</p>
                                      </div>
                                      <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                        {s.discountValue}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'SAMPLE_SUMMARY' && act.data.distributions && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
                                  <span>Sample Distribution Logs</span>
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">{act.data.total} records</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar text-xs">
                                  {act.data.distributions.map((d: any) => (
                                    <div key={d.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                      <div>
                                        <p className="font-bold text-slate-800">{d.sample} ({d.qty} units)</p>
                                        <p className="text-[10px] text-slate-500">By {d.mr} → {d.doctor}</p>
                                      </div>
                                      <span className="text-[10px] text-slate-400">{d.date}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {act.actionType === 'TOUR_PLAN_ACTION' && (
                              <div className="space-y-1.5 text-xs">
                                {act.data.status ? (
                                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-slate-900">{act.data.repName}</p>
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                        act.data.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {act.data.status}
                                      </span>
                                    </div>
                                  </div>
                                ) : act.data.plans && (
                                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                                    {act.data.plans.map((p: any) => (
                                      <div key={p.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                        <div>
                                          <p className="font-bold text-slate-800">{p.repName}</p>
                                          <p className="text-[10px] text-slate-500">{p.hq} · Month: {p.month}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                          p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                          {p.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'BROADCAST_SENT' && (
                              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900">{act.data.title}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                    Sent to {act.data.count} Reps
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-700 italic">"{act.data.body}"</p>
                              </div>
                            )}

                            {act.actionType === 'TARGET_ACTION' && (
                              <div className="space-y-1.5 text-xs">
                                {act.data.hq ? (
                                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-emerald-950">{act.data.hq} Target</p>
                                      <span className="font-extrabold text-emerald-700">₹{act.data.targetAmount?.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-600">Year: {act.data.year}</p>
                                  </div>
                                ) : act.data.targets && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between font-bold text-slate-700 px-0.5">
                                      <span>Targets ({act.data.year})</span>
                                      <span className="text-emerald-700 font-extrabold">₹{(act.data.totalTarget || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                                      {act.data.targets.map((t: any) => (
                                        <div key={t.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                          <span className="font-bold text-slate-800">{t.hq}</span>
                                          <span className="font-bold text-emerald-700">₹{(t.amount || 0).toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'EXPENSES_SUMMARY' && act.data && (
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200">
                                  <span className="font-bold text-amber-900">Total Claims ({act.data.count})</span>
                                  <span className="font-extrabold text-amber-800">₹{(act.data.totalClaimed || 0).toLocaleString()}</span>
                                </div>
                                {act.data.expenses && (
                                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                                    {act.data.expenses.map((e: any) => (
                                      <div key={e.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                                        <div>
                                          <p className="font-bold text-slate-800">{e.mr}</p>
                                          <p className="text-[10px] text-slate-500">{e.category} · {e.hq}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-slate-900">₹{e.amount}</p>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            e.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                          }`}>{e.status}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {act.actionType === 'TASK_CREATED' && (
                              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-slate-900">{act.data.title}</p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-200 text-indigo-800">
                                    {act.data.priority}
                                  </span>
                                </div>
                                <p className="text-[11px] text-indigo-700">Assigned To: <strong>{act.data.assignedTo}</strong></p>
                              </div>
                            )}

                            {/* Action Redirect Link */}
                            {act.link && (
                              <Link
                                href={act.link}
                                className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors group"
                              >
                                <span>Open Full Details</span>
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {agentMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>AI Copilot is processing command and querying database...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── QUICK PROMPTS CHIPS ── */}
          <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-1.5 flex-shrink-0 no-scrollbar">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-semibold transition-all border border-slate-200/60 flex-shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* ── INPUT BOX & VOICE CONTROLS ── */}
          <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic / Voice Button */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 ring-2 ring-rose-500/20 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
                title={isListening ? 'Listening (Click to stop)' : 'Speak in Hindi / English'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? 'बोलिए... (Listening in Hindi/English)...'
                    : "कमांड लिखें... e.g. 'Dr. Sharma ko add karo'..."
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || agentMutation.isPending}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-all flex-shrink-0 shadow-sm shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
