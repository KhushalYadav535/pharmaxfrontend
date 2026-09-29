'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Preloader — light edition. Bone curtain, forest type, acid progress
 * bar. Fires `fp:preloader-done` + `fp:release-scroll` on lift.
 */
export default function Preloader() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem('fp-preloaded') === '1') {
      setDone(true);
      window.dispatchEvent(new Event('fp:preloader-done'));
      window.dispatchEvent(new Event('fp:release-scroll'));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wordRefs.current,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power4.out', delay: 0.15 }
      );

      const counter = { v: 0 };
      gsap.to(counter, {
        v: 100,
        duration: 2,
        ease: 'power2.inOut',
        delay: 0.2,
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
          if (barRef.current) barRef.current.style.transform = `scaleX(${counter.v / 100})`;
        },
        onComplete: () => {
          const tl = gsap.timeline({
            onComplete: () => {
              sessionStorage.setItem('fp-preloaded', '1');
              setDone(true);
              window.dispatchEvent(new Event('fp:preloader-done'));
              window.dispatchEvent(new Event('fp:release-scroll'));
            },
          });
          tl.to('.pre-inner', { yPercent: -18, opacity: 0, duration: 0.55, ease: 'power3.in' }).to(
            rootRef.current,
            { yPercent: -100, duration: 1, ease: 'power4.inOut' },
            '-=0.1'
          );
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[150] bg-[#f4f2ea] flex flex-col justify-between p-6 md:p-10">
      <div className="pre-inner flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between font-jbmono text-[11px] tracking-[0.2em] text-[#0c1f16]/50 uppercase">
          <span>Field Pulse®</span>
          <span className="hidden sm:block">Commercial Excellence OS</span>
          <span>©2026</span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <h1 className="font-display text-[13vw] md:text-[8vw] leading-[0.85] text-[#0c1f16]">
            <span className="block overflow-hidden">
              <span ref={(el) => { wordRefs.current[0] = el; }} className="block">
                Field
              </span>
            </span>
            <span className="block overflow-hidden">
              <span ref={(el) => { wordRefs.current[1] = el; }} className="block text-[#0b3b2e]">
                Pulse®
              </span>
            </span>
          </h1>
          <div className="pb-2 text-right">
            <span ref={numRef} className="font-display text-6xl md:text-8xl text-[#0c1f16] tabular-nums">
              000
            </span>
            <p className="font-jbmono text-[11px] tracking-[0.2em] text-[#0c1f16]/50 uppercase mt-2">Loading experience</p>
          </div>
        </div>

        <div className="h-[3px] w-full bg-[#0c1f16]/10 overflow-hidden rounded-full">
          <div ref={barRef} className="h-full w-full origin-left bg-[#0b3b2e]" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}
