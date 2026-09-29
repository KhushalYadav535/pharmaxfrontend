'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight, Stethoscope, Store, Truck, Brain, CheckCircle,
  Mic, Sparkles, MessageSquare, MapPin, BarChart3, Users, FileText,
} from 'lucide-react';
import GradientBand from './GradientBand';
import RiveBlock from './RiveBlock';
import { WipeLink } from './BarbaTransition';
import { Magnetic, SectionTag, Counter, Reveal, useSpotlight } from './ui';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════ Acid marquee strip ═══════════ */
export function AcidMarquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="relative z-20 -my-6 overflow-hidden">
      <div className={`-rotate-2 ${reverse ? 'bg-[#0b3b2e]' : 'bg-[#d9ff3d] border-y border-[#0c1f16]/15'}`}>
        <div className="flex w-max items-center gap-8 whitespace-nowrap px-4 py-3 md:py-4">
          <div className={`flex items-center gap-8 marquee-track ${reverse ? 'marquee-rev' : ''}`} style={{ ['--marquee-speed' as string]: '26s' }}>
            {row.map((it, i) => (
              <span key={i} className={`flex items-center gap-8 font-display text-xl md:text-3xl ${reverse ? 'text-[#d9ff3d]' : 'text-[#0c1f16]'}`}>
                {it} <span className={reverse ? 'text-[#f4f2ea]/40' : 'text-[#0c1f16]/35'}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Manifesto — word-by-word scroll scrub ═══════════ */
const MANIFESTO =
  'Field work is chaos. Doctors, chemists, stockists, targets — every day a new territory war. Field Pulse turns that chaos into rhythm: every visit tracked, every insight captured, every rep augmented by AI.';

export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const words = MANIFESTO.split(' ');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mani-word',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.06,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
        }
      );
      gsap.fromTo(
        '.mani-ghost',
        { xPercent: 4 },
        { xPercent: -4, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="manifesto" className="relative overflow-hidden bg-[#f4f2ea] px-5 md:px-10 py-28 md:py-40">
      <span aria-hidden="true" className="mani-ghost pointer-events-none absolute top-10 left-0 whitespace-nowrap font-display text-[22vw] leading-none text-[#0b3b2e]/[0.05]">
        RHYTHM RHYTHM RHYTHM
      </span>
      <div className="relative mx-auto max-w-6xl">
        <SectionTag index="01" label="Manifesto" />
        <p className="mt-8 font-grot text-3xl md:text-6xl font-medium leading-[1.15] tracking-tight text-[#0c1f16]">
          {words.map((w, i) => (
            <span key={i} className="mani-word">
              {w}{' '}
            </span>
          ))}
        </p>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 font-jbmono text-[11px] uppercase tracking-[0.22em] text-[#0c1f16]/50">
          <span>(Est. 2024 — Mumbai)</span>
          <span>(500+ pharma teams)</span>
          <span className="font-bold text-[#0b3b2e]">(Scroll-driven storytelling ↓)</span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Showreel band — shadergradient/unicorn vibe ═══════════ */
export function Showreel() {
  return (
    <section id="showreel" className="relative overflow-hidden border-y border-[#0c1f16]/10">
      <GradientBand className="absolute inset-0 h-full w-full" />
      <div className="relative z-10 mx-auto max-w-[1600px] px-5 md:px-10 py-24 md:py-36">
        <SectionTag index="02" label="Showreel — live gradient mesh" />
        <div className="mt-6 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-3xl font-display text-5xl md:text-8xl leading-[0.9] text-[#0c1f16]">
            Rendered live.<br />
            <span className="text-[#0b3b2e]">Never a video.</span>
          </h2>
          <p className="max-w-sm font-grot text-[#0c1f16]/65 leading-relaxed">
            This background is a real-time GLSL shader — the same ShaderGradient /
            UnicornStudio energy that powers our in-app auroras. It reacts to your cursor.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#0c1f16]/15 bg-[#0c1f16]/15 md:grid-cols-4">
          {[
            { v: 500, s: '+', l: 'Medical reps live' },
            { v: 10000, s: '+', l: 'Visits tracked daily' },
            { v: 25000, s: '+', l: 'Doctors in CRM' },
            { v: 98, s: '%', l: 'Retention rate' },
          ].map((st) => (
            <div key={st.l} className="bg-[#fbfaf5]/90 p-6 md:p-10 backdrop-blur">
              <div className="font-display text-4xl md:text-6xl text-[#0c1f16]">
                <Counter target={st.v} suffix={st.s} />
              </div>
              <p className="mt-2 font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#0c1f16]/50">{st.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Horizontal zone — pinned scroll gallery ═══════════ */
const PANELS = [
  {
    icon: Stethoscope, no: '01', title: 'Doctor CRM', tag: 'Classify / Engage',
    desc: 'A+/A/B/C classification, prescription potential scoring, KOL mapping and full visit history per doctor.',
    points: ['Visit history & follow-ups', 'Sample & input tracking', 'Objection logging'],
    bg: 'bg-[#0e2a1e]',
  },
  {
    icon: Store, no: '02', title: 'Retail Excellence', tag: 'Audit / Order',
    desc: 'Pharmacy audits, shelf-share tracking, GST & drug-license compliance and one-tap order capture.',
    points: ['Shelf-share audits', 'Scheme & order capture', 'License expiry alerts'],
    bg: 'bg-[#123a28]',
  },
  {
    icon: Truck, no: '03', title: 'Distributor OS', tag: 'Stock / Credit',
    desc: 'Credit limits, delivery routes and secondary-sales analytics across your entire distributor network.',
    points: ['Credit & payment tracking', 'Route optimization', 'Secondary sales analytics'],
    bg: 'bg-[#0b3b2e]',
  },
  {
    icon: Brain, no: '04', title: 'AI Copilot', tag: 'Voice / Insight',
    desc: 'Voice-to-report transcription, next-best-action engine and a manager copilot that answers anything.',
    points: ['Voice note → call report', 'Next-best-action engine', 'Ask-anything dashboard'],
    bg: 'bg-[#2a3a08]',
  },
];

export function HorizontalZone() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        const track = '.hz-track';
        const getX = () => -(document.querySelector(track)!.scrollWidth - window.innerWidth);
        gsap.to(track, {
          x: getX,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: () => `+=${document.querySelector(track)!.scrollWidth - window.innerWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
    }, ref);
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="platform" className="relative overflow-hidden bg-[#f4f2ea] text-[#0c1f16]">
      <div className="hz-track flex flex-col md:h-screen md:w-max md:flex-row md:items-stretch">
        {/* intro panel */}
        <div className="flex shrink-0 flex-col justify-center px-5 md:px-10 py-24 md:h-screen md:w-[42vw] md:py-0">
          <SectionTag index="03" label="The platform" />
          <h2 className="mt-6 font-display text-6xl md:text-[7vw] leading-[0.85]">
            One OS.<br />
            <span className="text-stroke-ink">Four</span> weapons.
          </h2>
          <p className="mt-6 max-w-md font-grot text-[#0c1f16]/60 leading-relaxed">
            Drag through the arsenal — <span className="hidden md:inline">keep scrolling, the page moves sideways.</span>
            <span className="md:hidden">swipe down to walk through each module.</span>
          </p>
          <div className="mt-8 flex items-center gap-3 font-jbmono text-[11px] uppercase tracking-[0.22em] text-[#0c1f16]/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0c1f16]/25">→</span>
            Scroll to travel
          </div>
        </div>
        {/* cards — deep forest panels pop on cream */}
        {PANELS.map((p) => (
          <article
            key={p.no}
            className={`group relative flex shrink-0 flex-col justify-between overflow-hidden ${p.bg} p-8 md:m-6 md:h-[calc(100vh-3rem)] md:w-[46vw] md:self-center md:rounded-3xl lg:w-[38vw] border-y md:border border-[#0c1f16]/10 paper-card`}
            data-cursor="View"
          >
            <div className="flex items-start justify-between">
              <p.icon className="h-10 w-10 text-[#d9ff3d]" strokeWidth={1.5} />
              <span className="font-display text-7xl md:text-8xl text-white/10 transition-colors group-hover:text-[#d9ff3d]/30">{p.no}</span>
            </div>
            <div>
              <p className="font-jbmono text-[11px] uppercase tracking-[0.25em] text-[#d9ff3d]">{p.tag}</p>
              <h3 className="mt-3 font-display text-5xl md:text-7xl leading-[0.9] text-[#f4f2ea]">{p.title}</h3>
              <p className="mt-4 max-w-md font-grot text-[#f4f2ea]/70 leading-relaxed">{p.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 font-grot text-sm text-[#f4f2ea]/85">
                    <CheckCircle className="h-4 w-4 text-[#d9ff3d]" /> {pt}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
        {/* end cap */}
        <div className="flex shrink-0 items-center justify-center px-5 py-24 md:h-screen md:w-[30vw]">
          <Magnetic>
            <WipeLink href="/login" className="flex h-44 w-44 md:h-56 md:w-56 flex-col items-center justify-center gap-2 rounded-full bg-[#0b3b2e] text-center font-display text-xl text-[#d9ff3d] transition-transform hover:scale-105">
              Try all
              <br /> four →
            </WipeLink>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ Bento — day-in-the-life dashboard (light) ═══════════ */
function BentoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useSpotlight<HTMLDivElement>();
  return (
    <div ref={ref} className={`spotlight-card paper-card overflow-hidden rounded-2xl border border-[#0c1f16]/10 bg-white transition-transform duration-500 hover:-translate-y-1.5 ${className}`}>
      {children}
    </div>
  );
}

export function Bento() {
  return (
    <section id="proof" className="relative bg-[#fbfaf5] px-5 md:px-10 py-28 md:py-40 border-y border-[#0c1f16]/10">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTag index="04" label="A day on Field Pulse" />
            <h2 className="mt-6 max-w-3xl font-display text-5xl md:text-8xl leading-[0.88] text-[#0c1f16]">
              6:00 AM to<br /> target <span className="text-[#0b3b2e]">crushed.</span>
            </h2>
          </div>
          <p className="max-w-sm font-grot text-[#0c1f16]/60 leading-relaxed">
            Real modules, real data. This is the exact cockpit your MRs open every morning —
            rebuilt here as an interactive diorama.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* main dashboard mock */}
          <Reveal className="md:col-span-7">
            <BentoCard className="p-0">
              <div className="flex items-center gap-2 border-b border-[#0c1f16]/10 bg-[#f4f2ea] px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#0e9f6e]" />
                <span className="mx-auto hidden sm:block rounded-md border border-[#0c1f16]/10 bg-white px-4 py-1 font-jbmono text-[10px] tracking-[0.15em] text-[#0c1f16]/40">
                  app.fieldpulse.com/dashboard
                </span>
              </div>
              <div className="flex">
                <div className="hidden w-14 flex-col items-center gap-4 border-r border-[#0c1f16]/10 bg-[#f4f2ea]/60 py-5 sm:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0b3b2e] font-display text-[10px] text-[#f4f2ea]">FP</span>
                  {[BarChart3, Users, MapPin, FileText, Brain].map((Icon, i) => (
                    <Icon key={i} className={`h-4 w-4 ${i === 0 ? 'text-[#0b3b2e]' : 'text-[#0c1f16]/25'}`} />
                  ))}
                </div>
                <div className="flex-1 p-5">
                  <p className="font-jbmono text-[10px] uppercase tracking-[0.22em] text-[#0c1f16]/45">Today’s overview — Mumbai West</p>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {[
                      { l: 'Doctors', v: '342', c: '+12 new' },
                      { l: 'Visits', v: '18', c: '5 due today' },
                      { l: 'Target', v: '84%', c: 'on track ▲' },
                    ].map((k) => (
                      <div key={k.l} className="rounded-xl border border-[#0c1f16]/10 bg-[#f4f2ea]/70 p-3 transition-colors hover:border-[#0e9f6e]/60">
                        <p className="font-jbmono text-[10px] uppercase tracking-widest text-[#0c1f16]/40">{k.l}</p>
                        <p className="font-display text-2xl md:text-3xl text-[#0c1f16]">{k.v}</p>
                        <p className="font-jbmono text-[10px] font-bold text-[#0e9f6e]">{k.c}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-[#0c1f16]/10 bg-[#f4f2ea]/50 p-4">
                    <p className="font-jbmono text-[10px] uppercase tracking-widest text-[#0c1f16]/40">Monthly visits</p>
                    <div className="mt-3 flex h-20 items-end gap-1.5">
                      {[55, 70, 62, 80, 74, 92, 86, 78, 95, 108, 99, 120].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{ height: `${(h / 120) * 100}%`, background: i >= 9 ? '#0b3b2e' : 'rgba(11,59,46,0.15)' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* voice-to-report */}
          <Reveal delay={100} className="md:col-span-5">
            <BentoCard className="flex h-full flex-col justify-between p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b3b2e]">
                <Mic className="h-5 w-5 text-[#d9ff3d]" />
              </div>
              <div className="mt-8">
                <p className="font-jbmono text-[11px] uppercase tracking-[0.22em] text-[#0e9f6e]">Voice → report in 8s</p>
                <h3 className="mt-3 font-display text-4xl leading-[0.95] text-[#0c1f16]">Speak. Done. Synced.</h3>
                <div className="mt-5 rounded-xl border border-[#0c1f16]/10 bg-[#f4f2ea] p-4 font-jbmono text-xs leading-relaxed text-[#0c1f16]/60">
                  <span className="text-[#0b3b2e] font-bold">“Met Dr. Mehta…</span> discussed cardio range,
                  left 12 samples, objection on pricing — <span className="text-[#0c1f16]">follow up Friday.”</span>
                  <span className="mt-2 block font-bold text-[#0e9f6e]">✓ Structured into call report</span>
                </div>
              </div>
            </BentoCard>
          </Reveal>

          {/* route */}
          <Reveal className="md:col-span-4">
            <BentoCard className="h-full p-7">
              <MapPin className="h-8 w-8 text-[#0b3b2e]" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-3xl text-[#0c1f16]">GPS tour plans</h3>
              <p className="mt-2 font-grot text-sm text-[#0c1f16]/55 leading-relaxed">Check-ins, route trails and missed-visit flags — live for every manager.</p>
              <div className="mt-5 flex items-center gap-2 font-jbmono text-[11px] text-[#0c1f16]/50">
                <span className="h-2 w-2 rounded-full bg-[#0e9f6e]" /> 14/18 visits verified today
              </div>
            </BentoCard>
          </Reveal>

          {/* approvals */}
          <Reveal delay={100} className="md:col-span-4">
            <BentoCard className="h-full p-7">
              <Sparkles className="h-8 w-8 text-[#0b3b2e]" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-3xl text-[#0c1f16]">One-tap approvals</h3>
              <p className="mt-2 font-grot text-sm text-[#0c1f16]/55 leading-relaxed">Leaves, expenses, orders — cleared from the manager’s pocket, not their inbox.</p>
              <div className="mt-5 flex gap-2">
                <span className="rounded-full bg-[#0b3b2e] px-4 py-1.5 font-jbmono text-[10px] font-bold uppercase text-[#f4f2ea]">Approve</span>
                <span className="rounded-full border border-[#0c1f16]/20 px-4 py-1.5 font-jbmono text-[10px] uppercase text-[#0c1f16]/60">Review</span>
              </div>
            </BentoCard>
          </Reveal>

          {/* compliance */}
          <Reveal delay={200} className="md:col-span-4">
            <BentoCard className="h-full bg-[#0b3b2e] p-7 !border-transparent">
              <MessageSquare className="h-8 w-8 text-[#d9ff3d]" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-3xl text-[#f4f2ea]">Audit-ready, always</h3>
              <p className="mt-2 font-grot text-sm text-[#f4f2ea]/65 leading-relaxed">GDPR-compliant logs, license tracking and 99.9% uptime SLA. Sleep well.</p>
              <p className="mt-5 font-display text-5xl text-[#d9ff3d]">99.9%</p>
            </BentoCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════ AI section — rive + copilot chat (light) ═══════════ */
export function AISection() {
  return (
    <section id="ai" className="relative overflow-hidden bg-[#f4f2ea] px-5 md:px-10 py-28 md:py-40">
      <div className="dot-grid-dark absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1600px] items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionTag index="05" label="AI Copilot — rive.live" />
          <h2 className="mt-6 font-display text-5xl md:text-8xl leading-[0.88] text-[#0c1f16]">
            Your rep’s<br />
            <span className="text-stroke">second</span> brain<span className="text-[#0b3b2e]">.</span>
          </h2>
          <div className="mt-8 space-y-5">
            {[
              { t: 'Voice-to-Report', d: 'Post-visit voice notes transcribed & structured into call reports instantly.' },
              { t: 'Next-Best-Action', d: 'History + prescription patterns → the optimal pitch for every single doctor.' },
              { t: 'Manager Copilot', d: '“Which MRs missed target last week?” — ask in plain English, get answers.' },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 80}>
                <div className="flex gap-4 border-t border-[#0c1f16]/15 pt-5" data-cursor="AI">
                  <span className="font-jbmono text-xs font-bold text-[#0e9f6e]">0{i + 1}</span>
                  <div>
                    <h4 className="font-grot font-bold text-[#0c1f16]">{f.t}</h4>
                    <p className="mt-1 font-grot text-sm text-[#0c1f16]/55">{f.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal y={48}>
          <div className="grid gap-4">
            <RiveBlock className="h-64 md:h-80 rounded-2xl border border-[#0c1f16]/10 bg-white paper-card" />
            {/* copilot chat mock */}
            <div className="rounded-2xl border border-[#0c1f16]/10 bg-white paper-card p-5 font-grot text-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-[#0c1f16]/10 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#0e9f6e]" />
                <span className="ml-2 font-jbmono text-[10px] uppercase tracking-[0.2em] text-[#0c1f16]/40">Manager copilot</span>
              </div>
              <div className="space-y-3 text-[13px] leading-relaxed">
                <div className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0c1f16]/10 font-jbmono text-[10px] text-[#0c1f16]">M</span>
                  <p className="max-w-xs rounded-xl rounded-tl-none bg-[#f4f2ea] border border-[#0c1f16]/10 px-4 py-2.5 text-[#0c1f16]/80">Which doctors in Mumbai West need follow-up?</p>
                </div>
                <div className="flex justify-end gap-2.5">
                  <p className="max-w-xs rounded-xl rounded-tr-none bg-[#0b3b2e] px-4 py-2.5 text-[#f4f2ea]">
                    <span className="text-[#d9ff3d]">3 doctors flagged:</span><br />
                    • Dr. Mehta — 14 days since visit<br />
                    • Dr. Sharma — objection open<br />
                    • Dr. Nair — high potential, 21-day gap
                  </p>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b3b2e] font-jbmono text-[10px] font-bold text-[#d9ff3d]">AI</span>
                </div>
                <p className="flex items-center gap-2 font-jbmono text-[11px] text-[#0c1f16]/40">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0e9f6e]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0e9f6e]" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0e9f6e]" style={{ animationDelay: '300ms' }} />
                  </span>
                  drafting rep briefs…
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════ Testimonials ═══════════ */
const QUOTES = [
  { q: 'Visit compliance went from 62% to 91% in three months. The sideways demo sold our board in minutes.', a: 'Rajesh Kumar', r: 'National Sales Manager — Sun Pharma' },
  { q: 'Managers spend 80% less time on reporting and 80% more on actual coaching. The copilot is unreal.', a: 'Priya Mehta', r: 'VP Sales — Cipla' },
  { q: 'Territory analytics finally match how pharma actually works. Best CRM we have ever deployed.', a: 'Arun Patel', r: 'Regional Manager — Dr. Reddy’s' },
];

export function Quotes() {
  return (
    <section className="border-t border-[#0c1f16]/10 bg-[#f4f2ea] px-5 md:px-10 py-28 md:py-36">
      <div className="mx-auto max-w-[1600px]">
        <SectionTag index="06" label="Field reports" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {QUOTES.map((t, i) => (
            <Reveal key={t.a} delay={i * 100}>
              <figure className="spotlight-card paper-card flex h-full flex-col justify-between rounded-2xl border border-[#0c1f16]/10 bg-white p-7 transition-transform duration-500 hover:-translate-y-1.5" data-cursor="★">
                <div>
                  <div className="font-display text-5xl text-[#0b3b2e]">“</div>
                  <blockquote className="mt-2 font-grot text-lg leading-relaxed text-[#0c1f16]/80">{t.q}</blockquote>
                </div>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-[#0c1f16]/10 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b3b2e] font-display text-sm text-[#f4f2ea]">{t.a[0]}</span>
                  <span>
                    <span className="block font-grot text-sm font-bold text-[#0c1f16]">{t.a}</span>
                    <span className="block font-jbmono text-[10px] uppercase tracking-[0.15em] text-[#0c1f16]/50">{t.r}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════ CTA — acid band (kept, it's already light & loud) ═══════════ */
export function CTA() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-giant',
        { yPercent: 30, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'power4.out',
          duration: 1.2,
          scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="contact" className="relative overflow-hidden bg-[#d9ff3d] px-5 md:px-10 py-24 md:py-36 text-[#0c1f16] border-y border-[#0c1f16]/15">
      <span aria-hidden="true" className="pointer-events-none absolute -top-6 left-0 whitespace-nowrap font-display text-[20vw] leading-none text-black/[0.05]">
        PULSE PULSE
      </span>
      <div className="cta-giant relative mx-auto max-w-[1600px]">
        <p className="font-jbmono text-[11px] uppercase tracking-[0.25em] text-black/60">07 — Final call</p>
        <h2 className="mt-4 font-display text-[13vw] md:text-[9vw] leading-[0.85]">
          Ready to<br /> make noise?
        </h2>
        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md font-grot text-lg text-black/70 leading-relaxed">
            Join 500+ pharma companies running their field force on Field Pulse.
            Free 14-day pilot — no setup fee, no IT department needed.
          </p>
          <div className="flex flex-wrap gap-4">
            <Magnetic strength={0.45}>
              <WipeLink href="/login" className="group inline-flex items-center gap-2 rounded-full bg-[#0c1f16] px-9 py-5 font-jbmono text-xs font-bold uppercase tracking-[0.15em] text-[#d9ff3d]">
                Start free trial <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </WipeLink>
            </Magnetic>
            <Magnetic strength={0.45}>
              <a href="mailto:sales@fieldpulse.com" data-cursor="Mail" className="inline-flex items-center gap-2 rounded-full border-2 border-black/80 px-9 py-5 font-jbmono text-xs font-bold uppercase tracking-[0.15em] transition-colors hover:bg-black hover:text-[#d9ff3d]">
                Contact sales
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
