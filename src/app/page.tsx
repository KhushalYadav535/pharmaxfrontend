'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Users, Store, Truck, Brain, CheckCircle,
  TrendingUp, MapPin, FileText, Star, Phone, Mail,
  Stethoscope, BarChart3, Shield, Zap, ChevronRight,
  PlayCircle, Activity,
} from 'lucide-react';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Section wrapper with fade-in ────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Px</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Pharmax</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'AI Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link href="/login" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Request Demo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Pharma Sales Platform
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
                Supercharge your
                <span className="text-emerald-600 block">pharma sales team</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-lg">
                The complete commercial excellence platform for MRs, managers, and distributors.
                AI-powered insights, real-time tracking, and seamless CRM — all in one place.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link href="/login" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-200 text-sm">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="flex items-center gap-2 text-gray-700 font-semibold px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm">
                  <PlayCircle className="w-4 h-4 text-emerald-600" /> Watch demo
                </button>
              </div>
              <div className="mt-10 flex items-center gap-6">
                {[
                  { label: 'No setup fee', icon: CheckCircle },
                  { label: 'GDPR compliant', icon: Shield },
                  { label: '99.9% uptime SLA', icon: Activity },
                ].map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Icon className="w-4 h-4 text-emerald-500" /> {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl -rotate-2 scale-105" />
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden border border-gray-100">
                {/* Mini dashboard preview */}
                <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="flex-1 mx-4 bg-white rounded-lg text-xs text-gray-400 px-3 py-1 text-center">
                    app.pharmax.com/dashboard
                  </div>
                </div>
                <div className="flex" style={{ height: '380px' }}>
                  {/* Sidebar mini */}
                  <div className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-4">
                    <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Px</span>
                    </div>
                    {[BarChart3, Users, MapPin, FileText, Brain].map((Icon, i) => (
                      <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                        <Icon className={`w-4 h-4 ${i === 0 ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                    ))}
                  </div>
                  {/* Main content mini */}
                  <div className="flex-1 p-4 overflow-hidden">
                    <p className="text-xs font-semibold text-gray-900 mb-3">Today&apos;s Overview</p>
                    {/* KPI cards */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'Doctors', value: '342', change: '+12' },
                        { label: 'Visits', value: '18', change: '5 due' },
                        { label: 'Target', value: '84%', change: 'On track' },
                      ].map((kpi) => (
                        <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
                          <p className="text-xs text-gray-400">{kpi.label}</p>
                          <p className="text-base font-bold text-gray-900">{kpi.value}</p>
                          <p className="text-xs text-emerald-600 font-medium">{kpi.change}</p>
                        </div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-2">Monthly Visits</p>
                      <div className="flex items-end gap-1 h-16">
                        {[60, 72, 85, 68, 90, 95, 88, 76, 92, 105, 98, 115].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${(h / 115) * 100}%`, background: i >= 9 ? '#059669' : '#D1FAE5' }} />
                        ))}
                      </div>
                    </div>
                    {/* Recent activity */}
                    <div className="space-y-1.5">
                      {['Dr. Suresh Mehta — Completed ✓', 'Dr. Kavita Sharma — Planned', 'Medplus Pharmacy — Visited ✓'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-2.5 py-1.5 border border-gray-50">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -right-4 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI Suggestion</p>
                    <p className="text-gray-500">Visit Dr. Mehta today</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-4 bottom-16 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900">+32% visits</p>
                    <p className="text-gray-500">vs last quarter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-emerald-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Medical Reps' },
              { value: 10000, suffix: '+', label: 'Visits Tracked Daily' },
              { value: 25000, suffix: '+', label: 'Doctors in CRM' },
              { value: 98, suffix: '%', label: 'Customer Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center text-white">
                <div className="text-4xl font-bold mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-emerald-100 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-emerald-600 font-semibold text-sm mb-3">PLATFORM MODULES</p>
              <h2 className="text-4xl font-bold text-gray-900">Everything your team needs</h2>
              <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">One platform to manage every touchpoint — from doctors and retailers to distributors and analytics.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Stethoscope, color: 'emerald', title: 'Doctor CRM',
                desc: 'Classify, track, and engage doctors. Visit history, prescription potential, KOL mapping, and sample management.',
                features: ['Doctor classification (A+/A/B/C)', 'Prescription potential scoring', 'Visit history & follow-ups'],
              },
              {
                icon: Store, color: 'blue', title: 'Retail Excellence',
                desc: 'Complete pharmacy and retailer management with audit tools, shelf tracking, and order capture.',
                features: ['GST & drug license tracking', 'Retail audit & shelf share', 'Order capture & schemes'],
              },
              {
                icon: Truck, color: 'violet', title: 'Distributor Excellence',
                desc: 'Manage your distributor network with credit tracking, delivery routes, and secondary sales analysis.',
                features: ['Credit limit & payment tracking', 'Delivery route optimization', 'Secondary sales analytics'],
              },
              {
                icon: Brain, color: 'amber', title: 'AI Copilot',
                desc: 'Voice-to-report, call summaries, next-best-action recommendations, and manager copilot chat.',
                features: ['Voice note transcription', 'AI visit summaries', 'Next-best-action engine'],
              },
            ].map(({ icon: Icon, color, title, desc, features }) => (
              <FadeIn key={title}>
                <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center bg-${color}-50`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-emerald-600 font-semibold text-sm mb-3">HOW IT WORKS</p>
              <h2 className="text-4xl font-bold text-gray-900">Live in 3 simple steps</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Onboard your team', desc: 'Import your territory, assign MRs, configure roles and permissions in minutes. No IT required.' },
              { step: '02', title: 'Track every visit', desc: 'GPS check-in, product detailing, sample management, and AI-powered report generation — all from one screen.' },
              { step: '03', title: 'Get AI insights', desc: 'Manager dashboards surface missed visits, coaching insights, and team productivity in real time.' },
            ].map(({ step, title, desc }, i) => (
              <FadeIn key={step} delay={i * 150}>
                <div className="relative text-center">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px border-t-2 border-dashed border-emerald-200 z-0" style={{ width: 'calc(100% - 3rem)', left: '60%' }} />
                  )}
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                    {step}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Spotlight ────────────────────────────────────────────────────── */}
      <section id="ai-features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <p className="text-emerald-600 font-semibold text-sm mb-3">AI FEATURES</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Your AI sales co-pilot</h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">
                  Pharmax AI does the heavy lifting — transcribes voice notes, writes visit reports, suggests the next best action, and gives managers a real-time coaching dashboard.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: '🎙️', title: 'Voice-to-Report', desc: 'Record a voice note post-visit. AI transcribes and structures it into a complete call report instantly.' },
                    { icon: '🧠', title: 'Next-Best-Action', desc: 'AI analyzes visit history, prescription patterns, and objections to suggest the optimal strategy for each doctor.' },
                    { icon: '📊', title: 'Manager Copilot', desc: 'Ask your manager dashboard anything: "Which MRs missed targets last week?" — get instant answers.' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                        <p className="text-gray-500 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 text-xs ml-2">AI Copilot</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">M</div>
                    <div className="bg-gray-800 rounded-xl rounded-tl-none px-4 py-3 text-gray-300 max-w-xs text-xs leading-relaxed">
                      Which doctors in Mumbai West need follow-up this week?
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
                    <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-xl rounded-tr-none px-4 py-3 text-emerald-100 max-w-xs text-xs leading-relaxed">
                      <p className="text-emerald-400 mb-2">📋 3 doctors need follow-up:</p>
                      <p>• Dr. Suresh Mehta — Cardiology (14 days since visit)</p>
                      <p className="mt-1">• Dr. Kavita Sharma — Endocrinology (objection unresolved)</p>
                      <p className="mt-1">• Dr. Rohit Nair — Neurology (high potential, 21 days gap)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">M</div>
                    <div className="bg-gray-800 rounded-xl rounded-tl-none px-4 py-3 text-gray-300 max-w-xs text-xs leading-relaxed">
                      What should Rahul pitch to Dr. Mehta?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    AI is thinking...
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-emerald-50">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900">Trusted by pharma leaders</h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Pharmax transformed how our 200+ MR team operates. Visit compliance went from 62% to 91% in just 3 months.', author: 'Rajesh Kumar', role: 'National Sales Manager', company: 'Sun Pharmaceuticals' },
              { quote: 'The AI copilot is incredible. Our managers now spend 80% less time on reporting and 80% more on actual coaching.', author: 'Priya Mehta', role: 'VP Sales', company: 'Cipla' },
              { quote: 'Best pharma CRM we\'ve used. The territory analytics and doctor coverage reports are exactly what we needed.', author: 'Arun Patel', role: 'Regional Manager', company: 'Dr. Reddy\'s Labs' },
            ].map(({ quote, author, role, company }, i) => (
              <FadeIn key={author} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />)}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 text-sm">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{author}</p>
                      <p className="text-gray-500 text-xs">{role}, {company}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / Contact ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="bg-emerald-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
              <div className="relative">
                <h2 className="text-4xl font-bold mb-4">Ready to transform your sales force?</h2>
                <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                  Join 500+ pharma companies using Pharmax to increase visit efficiency, doctor engagement, and territory coverage.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Link href="/login" className="bg-white text-emerald-700 font-bold px-8 py-4 rounded-xl hover:shadow-xl transition-all text-sm">
                    Start Free Trial →
                  </Link>
                  <a href="mailto:sales@pharmax.com" className="flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-sm border border-white/20">
                    <Mail className="w-4 h-4" /> Contact Sales
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Px</span>
                </div>
                <span className="font-bold text-gray-900">Pharmax</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The AI-powered commercial excellence platform for pharmaceutical sales teams.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Documentation', 'API Reference', 'Status', 'Contact'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-gray-900 text-sm mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-8 flex items-center justify-between text-sm text-gray-400">
            <p>© 2024 Pharmax. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
