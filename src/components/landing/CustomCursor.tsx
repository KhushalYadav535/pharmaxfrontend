'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CustomCursor — basement-style difference-blend cursor.
 * Dot snaps instantly, ring trails with lerp. Grows + shows a label
 * over anything tagged with [data-cursor="..."].
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    document.documentElement.classList.add('cursor-none-fine');

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    const onMove = (e: MouseEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null;
      if (t) {
        const text = t.getAttribute('data-cursor') || '';
        label.textContent = text;
        gsap.to(ring, { scale: text ? 2.4 : 1.7, duration: 0.35, ease: 'power3.out' });
        gsap.to(label, { opacity: text ? 1 : 0, duration: 0.25 });
        gsap.to(dot, { scale: 0.4, duration: 0.3 });
      } else {
        gsap.to(ring, { scale: 1, duration: 0.35, ease: 'power3.out' });
        gsap.to(label, { opacity: 0, duration: 0.2 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    };

    const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.2 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      document.documentElement.classList.remove('cursor-none-fine');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <>
      <div id="awww-cursor-dot" ref={dotRef} aria-hidden="true" />
      <div id="awww-cursor-ring" ref={ringRef} aria-hidden="true">
        <span className="cursor-label" ref={labelRef} />
      </div>
    </>
  );
}
