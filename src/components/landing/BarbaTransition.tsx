'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';

/**
 * BarbaTransition — a Barba.js-style page transition for the Next.js
 * App Router. `WipeLink` plays a full-screen wipe (two staggered panels)
 * before navigating; `RouteWipe` plays the enter reveal on arrival.
 */
export function RouteWipe() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      // Initial load is handled by the Preloader curtain instead.
      first.current = false;
      gsap.set(ref.current, { yPercent: 100 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { yPercent: 0 });
      gsap.to(ref.current, {
        yPercent: 100,
        duration: 1,
        ease: 'power4.inOut',
        onComplete: () => window.dispatchEvent(new Event('fp:release-scroll')),
      });
    }, ref);
    return () => ctx.revert();
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[140]">
      <div ref={ref} className="absolute inset-0 bg-[#d9ff3d] flex items-center justify-center" style={{ transform: 'translateY(100%)' }}>
        <span className="font-display text-[10vw] leading-none text-[#060f0a]">Pulse®</span>
      </div>
    </div>
  );
}

export function WipeLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const lenis = (window as unknown as { __lenis?: { stop: () => void } }).__lenis;
      lenis?.stop();
      const el = overlayRef.current;
      if (!el) {
        router.push(href);
        return;
      }
      gsap.set(el, { display: 'block', yPercent: 100 });
      gsap.to(el, {
        yPercent: 0,
        duration: 0.7,
        ease: 'power4.inOut',
        onComplete: () => router.push(href),
      });
    },
    [href, router]
  );

  return (
    <>
      <a href={href} onClick={go} className={className}>
        {children}
      </a>
      <div className="pointer-events-none fixed inset-0 z-[145] hidden">
        <div ref={overlayRef} className="absolute inset-0 bg-[#d9ff3d] flex items-center justify-center">
          <span className="font-display text-[10vw] leading-none text-[#060f0a]">Pulse®</span>
        </div>
      </div>
    </>
  );
}
