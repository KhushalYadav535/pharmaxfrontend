'use client';

import { useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

/**
 * RiveBlock — live Rive runtime animation with a light fallback orb
 * if the CDN file can't load (offline-safe).
 */
export default function RiveBlock({
  src = 'https://cdn.rive.app/animations/vehicles.riv',
  autoplay = true,
  className = '',
}: {
  src?: string;
  autoplay?: boolean;
  className?: string;
}) {
  const { RiveComponent, rive } = useRive({
    src,
    autoplay,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  });

  useEffect(() => {
    if (!rive) return;
    try {
      const names = rive.animationNames ?? [];
      if (names.length > 0 && !rive.isPlaying) rive.play(names[0]);
    } catch {
      /* noop — fallback orb stays behind */
    }
  }, [rive]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* fallback / ambient layer (always behind) */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="relative h-56 w-56">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d9ff3d,transparent_60%)] blur-2xl opacity-70 float-y" />
          <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_65%_70%,#0e9f6e,transparent_65%)] blur-xl opacity-50" />
          <div className="absolute inset-0 rounded-full border border-[#0b3b2e]/30 spin-slow" style={{ borderStyle: 'dashed' }} />
        </div>
      </div>
      <RiveComponent className="relative h-full w-full" />
      <p className="absolute bottom-2 right-3 font-jbmono text-[10px] uppercase tracking-[0.18em] text-[#0c1f16]/45">
        live ● rive runtime
      </p>
    </div>
  );
}
