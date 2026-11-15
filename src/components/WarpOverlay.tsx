import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useObservatory } from '../context/ObservatoryContext';
import { EARTH_ANALOG_SITES } from '../data/planetaryData';
import { HudCorners } from './Hud';

export interface WarpDetail {
  /** Viewport coordinates the iris opens from (usually the click point). */
  x: number;
  y: number;
  image: string;
  label: string;
  sublabel?: string;
  /** Called once the iris covers the screen: this is where the route should change. */
  onMidpoint: () => void;
}

const WARP_EVENT = 'terratwin:warp';

/** Plays the warp transition (or just runs the callback for reduced-motion users). */
export function playWarp(detail: WarpDetail) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    detail.onMidpoint();
    return;
  }
  window.dispatchEvent(new CustomEvent<WarpDetail>(WARP_EVENT, { detail }));
}

/** Returns a handler that warps into an analog site's page, opening from `origin`. */
export function useEnterAnalogSite() {
  const { locale, navigate } = useObservatory();
  return useCallback(
    (siteId: string, origin?: { x: number; y: number }) => {
      const site = EARTH_ANALOG_SITES.find((s) => s.id === siteId);
      if (!site) {
        navigate('location', { locationId: siteId });
        return;
      }
      playWarp({
        x: origin?.x ?? window.innerWidth / 2,
        y: origin?.y ?? window.innerHeight / 2,
        image: site.image,
        label: site.name[locale],
        sublabel: site.coordinates.label,
        onMidpoint: () => navigate('location', { locationId: siteId }),
      });
    },
    [locale, navigate]
  );
}

type WarpState = { detail: WarpDetail; phase: 'in' | 'out' } | null;

/** Mounted once in the app shell, above the page transition so it survives the route change. */
export const WarpOverlay: React.FC = () => {
  const { locale } = useObservatory();
  const [state, setState] = useState<WarpState>(null);
  const busy = useRef(false);

  useEffect(() => {
    const timers: number[] = [];
    const onWarp = (event: Event) => {
      if (busy.current) return;
      busy.current = true;
      const detail = (event as CustomEvent<WarpDetail>).detail;
      setState({ detail, phase: 'in' });
      timers.push(window.setTimeout(detail.onMidpoint, 780));
      timers.push(window.setTimeout(() => setState((s) => (s ? { ...s, phase: 'out' } : s)), 1150));
      timers.push(
        window.setTimeout(() => {
          setState(null);
          busy.current = false;
        }, 1900)
      );
    };
    window.addEventListener(WARP_EVENT, onWarp);
    return () => {
      window.removeEventListener(WARP_EVENT, onWarp);
      for (const id of timers) window.clearTimeout(id);
      busy.current = false;
    };
  }, []);

  if (!state) return null;
  const { detail, phase } = state;
  const radius = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) * 1.05);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[120] transition-opacity duration-700 ease-out ${
        phase === 'in' ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <motion.div
        className="absolute inset-0 overflow-hidden bg-tt-void"
        initial={{ clipPath: `circle(0px at ${detail.x}px ${detail.y}px)` }}
        animate={{ clipPath: `circle(${radius}px at ${detail.x}px ${detail.y}px)` }}
        transition={{ duration: 0.75, ease: [0.7, 0, 0.2, 1] }}
      >
        <motion.img
          src={detail.image}
          alt=""
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tt-void via-tt-void/55 to-tt-void/35" />
        <HudCorners inset="inset-5 sm:inset-8" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="font-mono-tabular text-xs tracking-[0.3em] text-tt-teal">
            {locale === 'ar' ? 'جارٍ الدخول إلى الموقع' : 'ENTERING SITE'}
          </span>
          <span className="font-display text-[clamp(1.8rem,5vw,3.6rem)] font-semibold leading-tight text-tt-star text-balance">
            {detail.label}
          </span>
          {detail.sublabel && (
            <span dir="ltr" className="font-mono-tabular text-sm text-tt-sand">
              {detail.sublabel}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
