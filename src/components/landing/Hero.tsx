'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, Play, FlaskConical } from 'lucide-react';
import ShaderHero from './ShaderHero';
import ReactionDiffusion from './ReactionDiffusion';
import { WipeLink } from './BarbaTransition';
import { Magnetic } from './ui';
import { scrollToTarget } from './LenisProvider';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero — light edition. Bone canvas, forest mega-type, Three.js
 * emerald blob floating behind. Intro on `fp:preloader-done`.
 */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.hero-line-inner', { yPercent: 115 });
      gsap.set(['.hero-fade'], { opacity: 0, y: 24 });
      gsap.set('.hero-blob', { opacity: 0, scale: 0.85 });

      const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
      intro
        .to('.hero-blob', { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
        .to('.hero-line-inner', { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.15)
        .to('.hero-fade', { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.7);

      const start = () => intro.play();
      if (sessionStorage.getItem('fp-preloaded') === '1') start();
      else window.addEventListener('fp:preloader-done', start, { once: true });

      gsap.to('.hero-content', {
        yPercent: -14,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-blob', {
        yPercent: 22,
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      });

      return () => window.removeEventListener('fp:preloader-done', start);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#f4f2ea]">
      <div className="dot-grid-dark absolute inset-0 opacity-70" aria-hidden="true" />

      {/* Live chemistry — Gray-Scott reaction-diffusion dish (multiply so cream stays clean) */}
      <div className="absolute inset-0 mix-blend-multiply" aria-hidden="true">
        <ReactionDiffusion className="block h-full w-full opacity-60" />
      </div>

      {/* Three.js shader blob */}
      <div className="hero-blob absolute inset-0">
        <ShaderHero />
      </div>
      {/* legibility washes */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_38%,rgba(244,242,234,0.25)_30%,rgba(244,242,234,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f4f2ea] to-transparent" />

      {/* floating molecule sketches */}
      <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
        <svg className="float-y absolute left-[6%] top-[16%] h-24 w-24 md:h-32 md:w-32 opacity-30" viewBox="0 0 100 100" fill="none" stroke="#0b3b2e" strokeWidth="2">
          <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" />
          <circle cx="50" cy="50" r="16" />
          <circle cx="50" cy="8" r="4" fill="#0b3b2e" />
          <circle cx="86" cy="71" r="4" fill="#0b3b2e" />
          <circle cx="14" cy="71" r="4" fill="#0b3b2e" />
        </svg>
        <svg className="float-y absolute right-[8%] top-[24%] hidden md:block h-20 w-40 opacity-25" style={{ animationDelay: '1.2s' }} viewBox="0 0 160 80" fill="none" stroke="#0b3b2e" strokeWidth="2">
          <circle cx="24" cy="40" r="12" />
          <line x1="36" y1="40" x2="62" y2="40" />
          <circle cx="80" cy="40" r="18" />
          <circle cx="80" cy="40" r="8" />
          <line x1="98" y1="40" x2="124" y2="40" />
          <circle cx="136" cy="40" r="12" fill="#0b3b2e" opacity="0.35" />
        </svg>
        <svg className="spin-slow absolute bottom-[30%] right-[16%] hidden lg:block h-14 w-14 opacity-25" viewBox="0 0 60 60" fill="none" stroke="#0b3b2e" strokeWidth="2">
          <circle cx="30" cy="30" r="22" strokeDasharray="6 5" />
          <circle cx="30" cy="30" r="5" fill="#0b3b2e" />
        </svg>
      </div>

      {/* side rails */}
      <div className="hero-fade absolute left-5 md:left-10 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden="true">
        <p className="vertical-rl font-jbmono text-[10px] uppercase tracking-[0.3em] text-[#0c1f16]/45">
          Commercial Excellence OS — v3.0
        </p>
      </div>
      <div className="hero-fade absolute right-5 md:right-10 top-1/2 hidden -translate-y-1/2 md:block" aria-hidden="true">
        <p className="vertical-rl font-jbmono text-[10px] uppercase tracking-[0.3em] text-[#0c1f16]/45">
          Scroll to explore ↓
        </p>
      </div>

      {/* content */}
      <div className="hero-content relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-5 md:px-10 pb-8 pt-32">
        <div className="hero-fade mb-5 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0b3b2e]/30 bg-white/70 px-4 py-1.5 font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#0b3b2e] backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0e9f6e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0e9f6e]" />
            </span>
            AI-powered pharma sales OS
          </span>
          <span className="hidden sm:inline font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#0c1f16]/50">
            Trusted by 500+ field teams
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#0b3b2e]/40 px-4 py-1.5 font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#0b3b2e]">
            <FlaskConical className="h-3.5 w-3.5" />
            Live reaction-diffusion — stir it
          </span>
        </div>

        <h1 className="font-display leading-[0.82] text-[#0c1f16]">
          <span className="block overflow-hidden">
            <span className="hero-line-inner block text-[19vw] md:text-[15vw]">Field</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-line-inner block text-[19vw] md:text-[15vw]">
              <span className="text-stroke">Pulse</span>
              <span className="text-[#0b3b2e]">®</span>
            </span>
          </span>
        </h1>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="hero-fade max-w-md font-grot text-base md:text-lg leading-relaxed text-[#0c1f16]/65">
            The commercial excellence platform for MRs, managers & distributors.
            Visit tracking, doctor CRM and an <span className="font-semibold text-[#0b3b2e]">AI copilot</span> that
            writes your reports before you reach the car.
          </p>
          <div className="hero-fade flex flex-wrap items-center gap-4">
            <Magnetic>
              <WipeLink
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-[#0b3b2e] px-8 py-4 font-jbmono text-xs font-bold uppercase tracking-[0.15em] text-[#f4f2ea] transition-transform hover:scale-[1.03]"
              >
                Start free trial
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </WipeLink>
            </Magnetic>
            <Magnetic>
              <button
                onClick={() => scrollToTarget('#showreel')}
                data-cursor="Play"
                className="inline-flex items-center gap-3 rounded-full border border-[#0c1f16]/25 bg-white/60 px-7 py-4 font-jbmono text-xs uppercase tracking-[0.15em] text-[#0c1f16] backdrop-blur transition-colors hover:border-[#0b3b2e] hover:text-[#0b3b2e]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b3b2e] text-[#f4f2ea]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                Showreel ’26
              </button>
            </Magnetic>
          </div>
        </div>

        {/* bottom ticker */}
        <div className="hero-fade mt-10 flex items-center justify-between border-t border-[#0c1f16]/15 pt-5 font-jbmono text-[11px] uppercase tracking-[0.2em] text-[#0c1f16]/55">
          <button onClick={() => scrollToTarget('#manifesto')} data-cursor="Scroll" className="flex items-center gap-2 hover:text-[#0b3b2e]">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> Scroll
          </button>
          <span className="hidden md:inline">Doctor CRM — Visit Tracking — AI Reports</span>
          <span>
            <span className="font-bold text-[#0b3b2e]">98%</span> retention
          </span>
        </div>
      </div>
    </section>
  );
}
