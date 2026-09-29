'use client';

import { useEffect, useRef, createContext, useContext } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * LenisProvider — buttery smooth scrolling wired into GSAP's ticker
 * so ScrollTrigger scrubs stay perfectly in sync (basement-style feel).
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Sync Lenis with GSAP ticker (recommended integration)
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Preloader handshake: page boots locked, preloader releases it
    const locked = sessionStorage.getItem('fp-preloaded') !== '1';
    if (locked) lenis.stop();

    const release = () => lenis.start();
    window.addEventListener('fp:release-scroll', release);

    return () => {
      window.removeEventListener('fp:release-scroll', release);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <LenisContext.Provider value={null}>{children}</LenisContext.Provider>;
}

/** Scroll back to top via Lenis (used by footer / nav). */
export function scrollToTop() {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Scroll to a selector via Lenis. */
export function scrollToTarget(target: string) {
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: -20 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}
