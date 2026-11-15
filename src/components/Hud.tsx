import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';
import { useObservatory } from '../context/ObservatoryContext';
import { EARTH_ANALOG_SITES } from '../data/planetaryData';
import type { LocaleCode } from '../types/terratwin';

/** Four instrument-style corner brackets drawn over the parent (which must be `relative`). */
export const HudCorners: React.FC<{ className?: string; inset?: string }> = ({
  className = '',
  inset = 'inset-3',
}) => {
  const corner = 'absolute h-4 w-4 border-tt-teal/70';
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute ${inset} ${className}`}>
      <span className={`${corner} left-0 top-0 border-l border-t`} />
      <span className={`${corner} right-0 top-0 border-r border-t`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} />
    </span>
  );
};

/** Ticking UTC "mission clock" chip. */
export const MissionClock: React.FC<{ locale: LocaleCode; className?: string }> = ({
  locale,
  className = '',
}) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toISOString().slice(11, 19);
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-[#020409]/80 px-2.5 py-1.5 font-mono-tabular text-xs text-tt-mist ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-tt-teal opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-tt-teal" />
      </span>
      <span>{locale === 'ar' ? 'ساعة المهمة' : 'MISSION CLOCK'}</span>
      <span dir="ltr" className="text-tt-star">
        UTC {time}
      </span>
    </div>
  );
};

/** Slow-scrolling strip of the real analog stations (name · coordinates · twin world). */
export const TelemetryTicker: React.FC<{ locale: LocaleCode }> = ({ locale }) => {
  const twinLabel = (twin: 'mars' | 'moon' | 'both') =>
    twin === 'mars' ? 'MARS' : twin === 'moon' ? 'MOON' : 'MOON + MARS';
  const row = (
    <div className="flex shrink-0 items-center gap-10 pe-10">
      {EARTH_ANALOG_SITES.map((site) => (
        <span key={site.id} className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="text-tt-teal" aria-hidden="true">
            ◆
          </span>
          <span className="text-tt-star">{site.name[locale]}</span>
          <span className="text-tt-mist">{site.coordinates.label}</span>
          <span className="text-tt-sand">→ {twinLabel(site.primaryTwin)}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      dir="ltr"
      aria-hidden="true"
      className="tt-ticker pointer-events-none overflow-hidden border-t border-white/[0.08] bg-tt-void/80 py-2 font-mono-tabular text-xs"
    >
      <div className="tt-ticker-track flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
};

/** Subtle pointer-driven 3D tilt (mouse only, off for reduced-motion users). */
export const TiltFrame: React.FC<{
  children: React.ReactNode;
  className?: string;
  max?: number;
}> = ({ children, className = '', max = 3.5 }) => {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 140, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 140, damping: 18 });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/** Thin gradient bar at the very top showing how far down the page you are. */
export const ScrollProgress: React.FC = () => {
  const { isRTL } = useObservatory();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: isRTL ? '100% 50%' : '0% 50%' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-gradient-to-r from-tt-teal via-tt-sand to-tt-mars"
    />
  );
};
