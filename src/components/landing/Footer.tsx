'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { WipeLink } from './BarbaTransition';
import { Magnetic } from './ui';
import { scrollToTop, scrollToTarget } from './LenisProvider';

gsap.registerPlugin(ScrollTrigger);

/**
 * Footer — light mega footer: giant forest wordmark, sitemap,
 * live IST clock, back-to-top.
 */
export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
      );
    tick();
    const id = setInterval(tick, 1000);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.foot-giant',
        { yPercent: 28 },
        { yPercent: 0, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: true } }
      );
    }, ref);
    return () => {
      clearInterval(id);
      ctx.revert();
    };
  }, []);

  const cols: { h: string; items: { l: string; t?: string; href?: string }[] }[] = [
    { h: 'Platform', items: [{ l: 'Doctor CRM', t: '#platform' }, { l: 'Retail Excellence', t: '#platform' }, { l: 'Distributor OS', t: '#platform' }, { l: 'AI Copilot', t: '#ai' }] },
    { h: 'Company', items: [{ l: 'Manifesto', t: '#manifesto' }, { l: 'Showreel', t: '#showreel' }, { l: 'Field reports', t: '#proof' }, { l: 'Contact', t: '#contact' }] },
    { h: 'Legal', items: [{ l: 'Privacy', href: '/privacy' }, { l: 'Delete account', href: '/delete-account' }, { l: 'Enter app', href: '/login' }] },
  ];

  return (
    <footer ref={ref} className="relative overflow-hidden bg-[#f4f2ea] px-5 md:px-10 pt-20 md:pt-28">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0b3b2e] font-display text-sm text-[#f4f2ea]">FP</span>
              <span className="font-display text-xl text-[#0c1f16]">Field Pulse<sup className="text-[#0e9f6e]">®</sup></span>
            </div>
            <p className="mt-5 max-w-sm font-grot text-[#0c1f16]/60 leading-relaxed">
              The commercial excellence OS for pharmaceutical field forces.
              Designed in Mumbai. Running across India.
            </p>
            <p className="mt-6 font-jbmono text-[11px] uppercase tracking-[0.22em] text-[#0c1f16]/50">
              Mumbai — <span className="font-bold text-[#0b3b2e]">{time} IST</span>
            </p>
            <div className="mt-8">
              <Magnetic>
                <WipeLink href="/login" className="group inline-flex items-center gap-2 rounded-full bg-[#0b3b2e] px-7 py-3.5 font-jbmono text-[11px] font-bold uppercase tracking-[0.15em] text-[#f4f2ea] transition-colors hover:bg-[#0c1f16]">
                  Enter app <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
                </WipeLink>
              </Magnetic>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <p className="font-jbmono text-[11px] uppercase tracking-[0.25em] text-[#0c1f16]/45">{c.h}</p>
              <ul className="mt-5 space-y-3">
                {c.items.map((it) => (
                  <li key={it.l}>
                    {it.href ? (
                      <WipeLink href={it.href} className="u-sweep font-grot text-sm text-[#0c1f16]/70 hover:text-[#0c1f16]">
                        {it.l}
                      </WipeLink>
                    ) : (
                      <button onClick={() => scrollToTarget(it.t!)} className="u-sweep font-grot text-sm text-[#0c1f16]/70 hover:text-[#0c1f16]">
                        {it.l}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1 flex md:justify-end items-start">
            <Magnetic strength={0.5}>
              <button
                onClick={scrollToTop}
                data-cursor="Top"
                aria-label="Back to top"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0b3b2e] text-[#d9ff3d] transition-transform hover:scale-110"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </Magnetic>
          </div>
        </div>

        {/* giant wordmark */}
        <div className="mt-16 overflow-hidden border-t border-[#0c1f16]/15 pt-8">
          <p
            className="foot-giant whitespace-nowrap text-center font-display leading-[0.8] text-[18.5vw] text-[#0b3b2e] transition-colors duration-500 hover:text-[#0e9f6e]"
            data-cursor="FP®"
          >
            Field Pulse®
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#0c1f16]/15 py-6 font-jbmono text-[10px] uppercase tracking-[0.2em] text-[#0c1f16]/45 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Field Pulse. All rights reserved.</span>
          <span className="hidden md:inline">Made with obsession in Mumbai ♥</span>
          <span>Smooth scroll by Lenis — Motion by GSAP</span>
        </div>
      </div>
    </footer>
  );
}
