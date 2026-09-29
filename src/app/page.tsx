'use client';

import LenisProvider from '@/components/landing/LenisProvider';
import Preloader from '@/components/landing/Preloader';
import CustomCursor from '@/components/landing/CustomCursor';
import { RouteWipe } from '@/components/landing/BarbaTransition';
import Nav from '@/components/landing/Nav';
import Hero from '@/components/landing/Hero';
import Footer from '@/components/landing/Footer';
import {
  AcidMarquee,
  Manifesto,
  Showreel,
  HorizontalZone,
  Bento,
  AISection,
  Quotes,
  CTA,
} from '@/components/landing/Sections';

/**
 * FIELD PULSE® — awwwards-grade landing.
 * Stack: Lenis (smooth scroll) + GSAP ScrollTrigger (scrub/pin) +
 * Three.js shaders (hero blob) + raw-WebGL gradient mesh
 * (shadergradient/unicorn vibe) + Rive runtime + Barba-style wipes.
 */
export default function LandingPage() {
  return (
    <LenisProvider>
      <div className="cursor-none-fine min-h-screen bg-[#f4f2ea] font-grot text-[#0c1f16] selection:bg-[#0b3b2e] selection:text-[#f4f2ea]">
        <Preloader />
        <CustomCursor />
        <RouteWipe />
        <div className="noise-overlay" aria-hidden="true" />
        <Nav />
        <main>
          <Hero />
          <AcidMarquee
            items={['AI Copilot', 'Doctor CRM', 'Visit Tracking', 'Retail Audits', 'Distributor OS', 'Voice Reports']}
          />
          <Manifesto />
          <Showreel />
          <HorizontalZone />
          <Bento />
          <AcidMarquee
            reverse
            items={['500+ teams', '98% retention', '10k visits/day', 'Pan-India', 'GDPR ready', '99.9% uptime']}
          />
          <AISection />
          <Quotes />
          <CTA />
        </main>
        <Footer />
      </div>
    </LenisProvider>
  );
}
