'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Magnetic hover wrapper — element gravitates toward the cursor. */
export function Magnetic({
  children,
  className = '',
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none)').matches) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * strength,
        y: (e.clientY - r.top - r.height / 2) * strength,
        duration: 0.4,
        ease: 'power3.out',
      });
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', leave);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/** Mono kicker tag used across sections (default = on light bg). */
export function SectionTag({ index, label, dark = false }: { index: string; label: string; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-3 font-jbmono text-[11px] uppercase tracking-[0.25em] ${dark ? 'text-[#f2f0e8]/60' : 'text-[#0c1f16]/60'}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dark ? 'bg-[#d9ff3d]' : 'bg-[#0b3b2e]'}`} />
      <span>{index}</span>
      <span className={`h-px w-12 ${dark ? 'bg-white/20' : 'bg-[#0c1f16]/20'}`} />
      <span>{label}</span>
    </div>
  );
}

/** Animated counter that fires once when scrolled into view. */
export function Counter({
  target,
  suffix = '',
  duration = 1.8,
  className = '',
}: {
  target: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: target,
      duration,
      ease: 'power3.out',
      paused: true,
      onUpdate: () => setVal(Math.round(obj.v)),
    });
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      st.kill();
      tween.kill();
    };
  }, [target, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {val.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/** Spotlight hover for cards (sets --mx/--my CSS vars). */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('mousemove', move, { passive: true });
    return () => el.removeEventListener('mousemove', move);
  }, []);
  return ref;
}

/** Generic fade-rise reveal on scroll. */
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 36,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          delay,
          ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, y]);
  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
