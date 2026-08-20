'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Users, Store, Truck, Brain, CheckCircle,
  TrendingUp, MapPin, FileText, Star, Mail,
  Stethoscope, BarChart3, Shield, Zap, PlayCircle, Activity,
} from 'lucide-react';

/* ============================================================================
   PHARMAX — Premium White & Forest-Green Landing Page
   Signature element: an animated "pulse line" (EKG → sales chart) that ties
   the pharma "vitals" idea to the sales-growth story. Used in the hero, the
   stats strip and the closing CTA so it reads as one deliberate motif.
   ============================================================================ */

// ── Scroll progress bar (thin line at the very top, fills as you scroll) ────
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? h.scrollTop / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-emerald-950/5">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
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

// ── Cinematic scroll reveal (fade + rise + soft blur-in) ─────────────────────
function Reveal({ children, delay = 0, className = '', y = 26 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out ${visible ? 'opacity-100 blur-0' : 'opacity-0 blur-[3px]'} ${className}`}
      style={{ transitionDelay: `${delay}ms`, transform: visible ? 'translateY(0)' : `translateY(${y}px)` }}
    >
      {children}
    </div>
  );
}

// ── Magnetic wrapper for premium hover-follow buttons ─────────────────────────
function Magnetic({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.35}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'translate(0,0)'; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`transition-transform duration-300 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  );
}

// ── Cursor-spotlight card (used on feature + testimonial cards) ──────────────
function Spotlight({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight-card relative ${className}`}>
      {children}
    </div>
  );
}

// ── Signature motif: animated pulse line (EKG → chart) ────────────────────────
function PulseLine({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 80" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 42 L110 42 L134 12 L160 72 L186 26 L208 42 L330 42 L354 16 L378 66 L400 42 L600 42"
        stroke="url(#pulseGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="pulse-draw"
      />
      <defs>
        <linearGradient id="pulseGrad" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B3B2E" stopOpacity="0" />
          <stop offset="18%" stopColor="#15803D" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="82%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#0B3B2E" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Infinite trust marquee ────────────────────────────────────────────────────
function Marquee({ items }: { items: string[] }) {
  return (
    <div className="marquee-mask overflow-hidden">
      <div className="flex items-center gap-16 marquee-track w-max">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="text-sm font-semibold tracking-[0.08em] uppercase text-emerald-900/35 whitespace-nowrap">
            {it}
          </span>
        ))}
      </div>
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
    <div className="min-h-screen bg-white font-sans text-[#0E1512] selection:bg-emerald-200/60">
      <GlobalStyles />
      <ScrollProgress />

      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-emerald-950/[0.06] shadow-[0_1px_0_0_rgba(11,59,46,0.04)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-[#0B3B2E] rounded-lg flex items-center justify-center shadow-sm shadow-emerald-900/20">
              <span className="text-white font-bold text-sm font-display">Px</span>
            </div>
            <span className="font-bold text-[#0B3B2E] text-lg font-display">Pharmax</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'AI Features', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="relative text-sm text-emerald-950/60 hover:text-emerald-950 font-medium transition-colors group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-emerald-950/60 hover:text-emerald-950 transition-colors">
              Login
            </Link>
            <Magnetic>
              <Link href="/login" className="flex items-center gap-1.5 bg-[#0B3B2E] hover:bg-[#0B3B2E]/90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                Request Demo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Magnetic>
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 mesh pointer-events-none" />
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]" />
        <PulseLine className="absolute top-[128px] left-0 w-full h-16 opacity-70 pointer-events-none hidden lg:block" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
                  <Zap className="w-3.5 h-3.5" />
                  AI-Powered Pharma Sales Platform
                </div>
              </Reveal>

              <h1 className="word-reveal font-display text-5xl lg:text-[3.85rem] leading-[1.05] tracking-tight text-[#0B1F16] mb-6">
                <span className="block overflow-hidden"><span style={{ animationDelay: '80ms' }}>Supercharge your</span></span>
                <span className="block overflow-hidden"><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-emerald-500" style={{ animationDelay: '220ms' }}>pharma sales team</span></span>
              </h1>

              <Reveal delay={250}>
                <p className="text-xl text-emerald-950/55 leading-relaxed mb-9 max-w-lg">
                  The complete commercial excellence platform for MRs, managers, and distributors.
                  AI-powered insights, real-time tracking, and seamless CRM — all in one place.
                </p>
              </Reveal>

              <Reveal delay={380}>
                <div className="flex items-center gap-4 flex-wrap">
                  <Magnetic>
                    <Link href="/login" className="flex items-center gap-2 bg-[#0B3B2E] hover:bg-[#0B3B2E]/90 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-emerald-900/20 text-sm">
                      Start Free Trial <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Magnetic>
                  <Magnetic>
                    <button className="flex items-center gap-2 text-emerald-950 font-semibold px-6 py-3.5 rounded-xl border border-emerald-950/10 hover:border-emerald-950/20 hover:bg-emerald-50/60 transition-all text-sm">
                      <PlayCircle className="w-4 h-4 text-emerald-600" /> Watch demo
                    </button>
                  </Magnetic>
                </div>
              </Reveal>

              <Reveal delay={480}>
                <div className="mt-10 flex items-center gap-6 flex-wrap">
                  {[
                    { label: 'No setup fee', icon: CheckCircle },
                    { label: 'GDPR compliant', icon: Shield },
                    { label: '99.9% uptime SLA', icon: Activity },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-emerald-950/50">
                      <Icon className="w-4 h-4 text-emerald-500" /> {label}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Hero visual */}
            <Reveal delay={200} y={36}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white rounded-[2rem] -rotate-2 scale-[1.03] blur-[1px]" />
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-emerald-950/10 overflow-hidden border border-emerald-950/[0.06]">
                  <div className="bg-emerald-50/60 border-b border-emerald-950/[0.06] px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="flex-1 mx-4 bg-white rounded-lg text-xs text-emerald-950/35 px-3 py-1 text-center border border-emerald-950/[0.04]">
                      app.pharmax.com/dashboard
                    </div>
                  </div>
                  <div className="flex" style={{ height: '380px' }}>
                    <div className="w-14 bg-white border-r border-emerald-950/[0.06] flex flex-col items-center py-4 gap-4">
                      <div className="w-7 h-7 bg-[#0B3B2E] rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold font-display">Px</span>
                      </div>
                      {[BarChart3, Users, MapPin, FileText, Brain].map((Icon, i) => (
                        <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-emerald-50' : 'hover:bg-emerald-50/60'}`}>
                          <Icon className={`w-4 h-4 ${i === 0 ? 'text-emerald-600' : 'text-emerald-950/30'}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-4 overflow-hidden">
                      <p className="text-xs font-semibold text-emerald-950 mb-3">Today&apos;s Overview</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: 'Doctors', value: '342', change: '+12' },
                          { label: 'Visits', value: '18', change: '5 due' },
                          { label: 'Target', value: '84%', change: 'On track' },
                        ].map((kpi) => (
                          <div key={kpi.label} className="bg-white rounded-xl border border-emerald-950/[0.06] p-2.5 shadow-sm">
                            <p className="text-xs text-emerald-950/35">{kpi.label}</p>
                            <p className="text-base font-bold text-emerald-950 font-display">{kpi.value}</p>
                            <p className="text-xs text-emerald-600 font-medium">{kpi.change}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-emerald-50/50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-emerald-950/45 mb-2">Monthly Visits</p>
                        <div className="flex items-end gap-1 h-16">
                          {[60, 72, 85, 68, 90, 95, 88, 76, 92, 105, 98, 115].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t-sm bar-grow" style={{ height: `${(h / 115) * 100}%`, background: i >= 9 ? '#059669' : '#D1FAE5', animationDelay: `${900 + i * 60}ms` }} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {['Dr. Suresh Mehta — Completed ✓', 'Dr. Kavita Sharma — Planned', 'Medplus Pharmacy — Visited ✓'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-emerald-950/60 bg-white rounded-lg px-2.5 py-1.5 border border-emerald-950/[0.04]">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-4 top-12 bg-white rounded-2xl shadow-xl shadow-emerald-950/10 border border-emerald-950/[0.06] px-4 py-3 text-xs float-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-950">AI Suggestion</p>
                      <p className="text-emerald-950/45">Visit Dr. Mehta today</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -left-4 bottom-16 bg-white rounded-2xl shadow-xl shadow-emerald-950/10 border border-emerald-950/[0.06] px-4 py-3 text-xs float-slow" style={{ animationDelay: '1.4s' }}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-950">+32% visits</p>
                      <p className="text-emerald-950/45">vs last quarter</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={550} className="mt-20">
            <p className="text-center text-xs font-semibold tracking-[0.15em] uppercase text-emerald-950/30 mb-6">Trusted by field teams at</p>
            <Marquee items={['Sun Pharmaceuticals', 'Cipla', "Dr. Reddy's Labs", 'Lupin', 'Zydus', 'Torrent Pharma', 'Alkem Labs']} />
          </Reveal>
        </div>
      </section>

      {/* ─── Stats Strip ────────────────────────────────────────────────── */}
      <section className="relative py-16 bg-[#0B3B2E] overflow-hidden">
        <div className="absolute inset-0 mesh opacity-40 mix-blend-screen pointer-events-none" />
        <PulseLine className="absolute -bottom-2 left-0 w-full h-20 opacity-25 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Medical Reps' },
              { value: 10000, suffix: '+', label: 'Visits Tracked Daily' },
              { value: 25000, suffix: '+', label: 'Doctors in CRM' },
              { value: 98, suffix: '%', label: 'Customer Satisfaction' },
            ].map((stat) => (
              <Reveal key={stat.label} className="text-center text-white">
                <div className="text-4xl font-bold mb-1 font-display">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-emerald-200/70 text-sm">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-emerald-600 font-semibold text-sm mb-3 tracking-[0.1em] uppercase">Platform Modules</p>
              <h2 className="text-4xl font-display font-bold text-[#0B1F16]">Everything your team needs</h2>
              <p className="mt-4 text-xl text-emerald-950/50 max-w-2xl mx-auto">One platform to manage every touchpoint — from doctors and retailers to distributors and analytics.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Stethoscope, iconBg: 'bg-emerald-50', iconText: 'text-emerald-700', title: 'Doctor CRM',
                desc: 'Classify, track, and engage doctors. Visit history, prescription potential, KOL mapping, and sample management.',
                features: ['Doctor classification (A+/A/B/C)', 'Prescription potential scoring', 'Visit history & follow-ups'],
              },
              {
                icon: Store, iconBg: 'bg-emerald-100', iconText: 'text-emerald-800', title: 'Retail Excellence',
                desc: 'Complete pharmacy and retailer management with audit tools, shelf tracking, and order capture.',
                features: ['GST & drug license tracking', 'Retail audit & shelf share', 'Order capture & schemes'],
              },
              {
                icon: Truck, iconBg: 'bg-teal-50', iconText: 'text-teal-700', title: 'Distributor Excellence',
                desc: 'Manage your distributor network with credit tracking, delivery routes, and secondary sales analysis.',
                features: ['Credit limit & payment tracking', 'Delivery route optimization', 'Secondary sales analytics'],
              },
              {
                icon: Brain, iconBg: 'bg-[#0B3B2E]', iconText: 'text-emerald-300', title: 'AI Copilot',
                desc: 'Voice-to-report, call summaries, next-best-action recommendations, and manager copilot chat.',
                features: ['Voice note transcription', 'AI visit summaries', 'Next-best-action engine'],
              },
            ].map(({ icon: Icon, iconBg, iconText, title, desc, features }, i) => (
              <Reveal key={title} delay={i * 90}>
                <Spotlight className="group bg-white rounded-2xl border border-emerald-950/[0.06] p-6 hover:shadow-2xl hover:shadow-emerald-950/[0.08] hover:-translate-y-1.5 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-6 h-6 ${iconText}`} />
                  </div>
                  <h3 className="font-bold text-emerald-950 text-lg mb-2 font-display">{title}</h3>
                  <p className="text-emerald-950/50 text-sm leading-relaxed mb-4">{desc}</p>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-emerald-950/65">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6 bg-emerald-50/40 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-emerald-600 font-semibold text-sm mb-3 tracking-[0.1em] uppercase">How it works</p>
              <h2 className="text-4xl font-display font-bold text-[#0B1F16]">Live in 3 simple steps</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Onboard your team', desc: 'Import your territory, assign MRs, configure roles and permissions in minutes. No IT required.' },
              { step: '02', title: 'Track every visit', desc: 'GPS check-in, product detailing, sample management, and AI-powered report generation — all from one screen.' },
              { step: '03', title: 'Get AI insights', desc: 'Manager dashboards surface missed visits, coaching insights, and team productivity in real time.' },
            ].map(({ step, title, desc }, i) => (
              <Reveal key={step} delay={i * 150}>
                <div className="relative text-center">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 h-px border-t-2 border-dashed border-emerald-300/60 z-0" style={{ width: 'calc(100% - 3rem)', left: '60%' }} />
                  )}
                  <div className="relative w-16 h-16 rounded-2xl bg-[#0B3B2E] text-white font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-900/20 font-display">
                    {step}
                  </div>
                  <h3 className="font-bold text-emerald-950 text-lg mb-3 font-display">{title}</h3>
                  <p className="text-emerald-950/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Spotlight ───────────────────────────────────────────────── */}
      <section id="ai-features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-emerald-600 font-semibold text-sm mb-3 tracking-[0.1em] uppercase">AI Features</p>
                <h2 className="text-4xl font-display font-bold text-[#0B1F16] mb-6">Your AI sales co-pilot</h2>
                <p className="text-emerald-950/50 text-lg leading-relaxed mb-8">
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
                        <h4 className="font-semibold text-emerald-950 mb-1">{title}</h4>
                        <p className="text-emerald-950/50 text-sm">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <Spotlight className="bg-[#0B1F16] rounded-2xl p-6 font-mono text-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-emerald-100/30 text-xs ml-2">AI Copilot</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">M</div>
                    <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-4 py-3 text-emerald-50/80 max-w-xs text-xs leading-relaxed">
                      Which doctors in Mumbai West need follow-up this week?
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-emerald-950 text-xs flex-shrink-0 font-bold">AI</div>
                    <div className="bg-emerald-900/30 border border-emerald-400/20 rounded-xl rounded-tr-none px-4 py-3 text-emerald-100 max-w-xs text-xs leading-relaxed">
                      <p className="text-emerald-400 mb-2">📋 3 doctors need follow-up:</p>
                      <p>• Dr. Suresh Mehta — Cardiology (14 days since visit)</p>
                      <p className="mt-1">• Dr. Kavita Sharma — Endocrinology (objection unresolved)</p>
                      <p className="mt-1">• Dr. Rohit Nair — Neurology (high potential, 21 days gap)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs flex-shrink-0">M</div>
                    <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-4 py-3 text-emerald-50/80 max-w-xs text-xs leading-relaxed">
                      What should Rahul pitch to Dr. Mehta?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-100/30 text-xs">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    AI is thinking...
                  </div>
                </div>
              </Spotlight>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-emerald-50/40 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-[#0B1F16]">Trusted by pharma leaders</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Pharmax transformed how our 200+ MR team operates. Visit compliance went from 62% to 91% in just 3 months.', author: 'Rajesh Kumar', role: 'National Sales Manager', company: 'Sun Pharmaceuticals' },
              { quote: 'The AI copilot is incredible. Our managers now spend 80% less time on reporting and 80% more on actual coaching.', author: 'Priya Mehta', role: 'VP Sales', company: 'Cipla' },
              { quote: "Best pharma CRM we've used. The territory analytics and doctor coverage reports are exactly what we needed.", author: 'Arun Patel', role: 'Regional Manager', company: "Dr. Reddy's Labs" },
            ].map(({ quote, author, role, company }, i) => (
              <Reveal key={author} delay={i * 100}>
                <Spotlight className="bg-white rounded-2xl p-6 border border-emerald-950/[0.06] shadow-sm hover:shadow-xl hover:shadow-emerald-950/[0.06] hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />)}
                  </div>
                  <p className="text-emerald-950/75 leading-relaxed mb-6 text-sm">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B3B2E] flex items-center justify-center text-white font-bold text-sm font-display">
                      {author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-950 text-sm">{author}</p>
                      <p className="text-emerald-950/45 text-xs">{role}, {company}</p>
                    </div>
                  </div>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / Contact ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="relative bg-[#0B3B2E] rounded-[2rem] p-12 text-white overflow-hidden">
              <div className="absolute inset-0 mesh opacity-50 mix-blend-screen pointer-events-none" />
              <PulseLine className="absolute -top-4 left-0 w-full h-16 opacity-25 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
              <div className="relative">
                <h2 className="text-4xl font-display font-bold mb-4">Ready to transform your sales force?</h2>
                <p className="text-emerald-100/70 text-lg mb-8 max-w-2xl mx-auto">
                  Join 500+ pharma companies using Pharmax to increase visit efficiency, doctor engagement, and territory coverage.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Magnetic>
                    <Link href="/login" className="block bg-white text-[#0B3B2E] font-bold px-8 py-4 rounded-xl hover:shadow-2xl hover:shadow-black/20 transition-all text-sm">
                      Start Free Trial →
                    </Link>
                  </Magnetic>
                  <Magnetic>
                    <a href="mailto:sales@pharmax.com" className="flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-sm border border-white/15">
                      <Mail className="w-4 h-4" /> Contact Sales
                    </a>
                  </Magnetic>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-emerald-950/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#0B3B2E] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs font-display">Px</span>
                </div>
                <span className="font-bold text-emerald-950 font-display">Pharmax</span>
              </div>
              <p className="text-emerald-950/45 text-sm leading-relaxed">
                The AI-powered commercial excellence platform for pharmaceutical sales teams.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Documentation', 'API Reference', 'Status', 'Contact'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-emerald-950 text-sm mb-4">{title}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-emerald-950/45 hover:text-emerald-950/80 text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-emerald-950/[0.06] pt-8 flex items-center justify-between text-sm text-emerald-950/30">
            <p>© 2024 Pharmax. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-emerald-950/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-emerald-950/60 transition-colors">Terms</a>
              <a href="#" className="hover:text-emerald-950/60 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Global cinematic styles: fonts, motifs, keyframes ────────────────────────
function GlobalStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600;700;800&display=swap');
      .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
      body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }

      /* signature pulse line */
      .pulse-draw {
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        animation: drawPulse 2.2s ease-out 0.3s forwards, glowPulse 2.6s ease-in-out 2.6s infinite;
      }
      @keyframes drawPulse { to { stroke-dashoffset: 0; } }
      @keyframes glowPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

      /* slow-drifting mesh gradient */
      .mesh {
        background:
          radial-gradient(40% 40% at 20% 20%, rgba(16,185,129,0.14), transparent 60%),
          radial-gradient(35% 35% at 80% 30%, rgba(5,105,73,0.12), transparent 60%),
          radial-gradient(45% 45% at 50% 90%, rgba(16,185,129,0.10), transparent 60%);
        background-size: 140% 140%;
        animation: meshShift 20s ease-in-out infinite alternate;
      }
      @keyframes meshShift { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }

      .dot-grid { background-image: radial-gradient(rgba(11,59,46,0.09) 1px, transparent 1px); background-size: 22px 22px; }

      /* trust marquee */
      .marquee-track { animation: marquee 30s linear infinite; }
      .marquee-mask {
        -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
        mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
      }
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

      /* cursor-follow spotlight on hover cards */
      .spotlight-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        opacity: 0;
        transition: opacity 0.4s;
        pointer-events: none;
        background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(16,185,129,0.14), transparent 70%);
      }
      .spotlight-card:hover::before { opacity: 1; }

      /* headline mask-reveal */
      .word-reveal span {
        display: inline-block;
        opacity: 0;
        transform: translateY(115%);
        animation: wordUp 0.9s cubic-bezier(0.2,0.7,0.2,1) forwards;
      }
      @keyframes wordUp { to { opacity: 1; transform: translateY(0); } }

      /* dashboard bar grow-in */
      .bar-grow { transform: scaleY(0); transform-origin: bottom; animation: growBar 0.6s cubic-bezier(0.2,0.7,0.2,1) forwards; }
      @keyframes growBar { to { transform: scaleY(1); } }

      /* floating badges */
      .float-slow { animation: floatY 5s ease-in-out infinite; }
      @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

      @media (prefers-reduced-motion: reduce) {
        .pulse-draw, .mesh, .marquee-track, .word-reveal span, .bar-grow, .float-slow {
          animation: none !important;
        }
      }
    `}</style>
  );
}