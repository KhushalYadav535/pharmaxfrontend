'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import { WipeLink } from './BarbaTransition';
import { Magnetic } from './ui';
import { scrollToTarget } from './LenisProvider';

/**
 * Nav — light floating header + deep-forest fullscreen menu.
 */
const LINKS = [
  { label: 'Platform', target: '#platform' },
  { label: 'Manifesto', target: '#manifesto' },
  { label: 'AI Copilot', target: '#ai' },
  { label: 'Proof', target: '#proof' },
  { label: 'Contact', target: '#contact' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (open) {
      lenis?.stop();
      const ctx = gsap.context(() => {
        gsap.fromTo(overlayRef.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power4.inOut' });
        gsap.fromTo(
          '.menu-link-inner',
          { yPercent: 120 },
          { yPercent: 0, duration: 0.9, stagger: 0.07, delay: 0.35, ease: 'power4.out' }
        );
        gsap.fromTo('.menu-fade', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.6, ease: 'power3.out' });
      }, overlayRef);
      return () => ctx.revert();
    } else {
      lenis?.start();
    }
  }, [open ]);

  const go = (target: string) => {
    setOpen(false);
    setTimeout(() => scrollToTarget(target), 450);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[120] transition-all duration-500 ${
          scrolled && !open ? 'bg-[#f4f2ea]/80 backdrop-blur-xl border-b border-[#0c1f16]/10' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-5 md:px-10 py-4">
          <button
            onClick={() => go('#top')}
            data-cursor="Top"
            className="flex items-center gap-2.5"
            aria-label="Back to top"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b3b2e] font-display text-sm text-[#f4f2ea]">
              FP
            </span>
            <span className={`font-display text-lg tracking-wide transition-colors ${open ? 'text-[#f4f2ea]' : 'text-[#0c1f16]'}`}>
              Field&nbsp;Pulse<sup className={open ? 'text-[#d9ff3d]' : 'text-[#0e9f6e]'}>®</sup>
            </span>
          </button>

          <div className={`hidden lg:flex items-center gap-8 transition-colors ${open ? 'text-[#f4f2ea]' : ''}`}>
            {LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => go(l.target)}
                className={`u-sweep font-jbmono text-[11px] uppercase tracking-[0.22em] ${open ? 'text-[#f4f2ea]/70 hover:text-[#f4f2ea]' : 'text-[#0c1f16]/65 hover:text-[#0c1f16]'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <span className={`hidden md:block font-jbmono text-[11px] tracking-[0.18em] transition-colors ${open ? 'text-[#f4f2ea]/50' : 'text-[#0c1f16]/50'}`}>
              IST {time}
            </span>
            <Magnetic strength={0.4}>
              <WipeLink
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#0b3b2e] px-5 py-2.5 font-jbmono text-[11px] font-bold uppercase tracking-[0.15em] text-[#f4f2ea] transition-colors hover:bg-[#0c1f16]"
              >
                Enter App <ArrowUpRight className="h-3.5 w-3.5" />
              </WipeLink>
            </Magnetic>
            <button
              onClick={() => setOpen((v) => !v)}
              data-cursor={open ? 'Close' : 'Menu'}
              className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border transition-colors ${open ? 'border-[#f4f2ea]/30 hover:border-[#d9ff3d]' : 'border-[#0c1f16]/25 hover:border-[#0b3b2e]'}`}
              aria-label="Toggle menu"
            >
              <span className={`h-[2px] w-5 transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45 bg-[#f4f2ea]' : 'bg-[#0c1f16]'}`} />
              <span className={`h-[2px] w-5 transition-all duration-300 ${open ? 'opacity-0' : 'bg-[#0c1f16]'}`} />
              <span className={`h-[2px] w-5 transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45 bg-[#f4f2ea]' : 'bg-[#0c1f16]'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* fullscreen menu — deep forest moment */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-[110] bg-[#0b3b2e] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', visibility: open ? 'visible' : 'hidden' }}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgba(244,242,234,0.12) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative flex h-full flex-col justify-end px-5 md:px-10 pb-10 pt-28">
          <nav className="flex flex-col">
            {[...LINKS, { label: 'Enter App →', target: '__login' }].map((l, i) => (
              <div key={l.label} className="overflow-hidden border-t border-white/15 last:border-b">
                <button
                  onClick={() => (l.target === '__login' ? (window.location.href = '/login') : go(l.target))}
                  className="group flex w-full items-baseline gap-4 py-3 md:py-4 text-left"
                  data-cursor="Go"
                >
                  <span className="menu-fade font-jbmono text-xs text-[#d9ff3d]">0{i + 1}</span>
                  <span className="menu-link-inner font-display text-[11vw] md:text-[6vw] leading-[0.95] text-[#f4f2ea] transition-all duration-300 group-hover:translate-x-4 group-hover:text-[#d9ff3d]">
                    {l.label}
                  </span>
                </button>
              </div>
            ))}
          </nav>
          <div className="menu-fade mt-8 flex flex-wrap items-center justify-between gap-4 font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#f4f2ea]/55">
            <span>sales@fieldpulse.com</span>
            <span>Mumbai ● Delhi ● Bangalore</span>
            <span className="text-[#d9ff3d]">Available for demos</span>
          </div>
        </div>
      </div>
    </>
  );
}
