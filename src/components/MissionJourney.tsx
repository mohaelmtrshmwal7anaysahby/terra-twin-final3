import React, { useRef, useState } from 'react';
import {
  type MotionValue,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useObservatory } from '../context/ObservatoryContext';
import { EARTH_ANALOG_SITES, HERO_ASSETS } from '../data/planetaryData';
import type { LocaleCode, RoutePage } from '../types/terratwin';
import { ActionButton } from './DesignSystem';
import { HudCorners } from './Hud';

type ChapterId = 'earth' | 'moon' | 'mars';

interface Chapter {
  id: ChapterId;
  image: string;
  route: RoutePage;
  variant: 'primary' | 'moon' | 'mars';
  /** [fadeInStart, fullyIn, fullyOut-start, fadeOutEnd] in scroll-progress units (0..1). */
  window: [number, number, number, number];
  title: Record<LocaleCode, string>;
  body: Record<LocaleCode, string>;
  stat: Record<LocaleCode, string>;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'earth',
    image: HERO_ASSETS.earthOrbit,
    route: 'explorer',
    variant: 'primary',
    window: [-1, -0.5, 0.28, 0.38],
    title: { en: 'Start where the analogs live', ar: 'ابدأ من حيث توجد المواقع التناظرية' },
    body: {
      en: `${EARTH_ANALOG_SITES.length} places on Earth reproduce the chemistry, cold and terrain we expect on other worlds, so we can test instruments and ideas here first.`,
      ar: `${EARTH_ANALOG_SITES.length} مواقع على الأرض تحاكي كيمياء وبرودة وتضاريس عوالم أخرى، فنختبر الأجهزة والأفكار هنا أولًا.`,
    },
    stat: { en: 'Home orbit', ar: 'مدار الأرض' },
  },
  {
    id: 'moon',
    image: HERO_ASSETS.moonSurface,
    route: 'moon',
    variant: 'moon',
    window: [0.28, 0.38, 0.62, 0.72],
    title: { en: 'Next stop: the Moon', ar: 'المحطة التالية: القمر' },
    body: {
      en: 'About 384,400 km away: no air, extreme temperature swings and fine abrasive dust. Analogs here probe regolith, polar ice and thermal design.',
      ar: 'على بعد نحو 384,400 كم: بلا هواء، وتقلبات حرارية شديدة، وغبار ناعم كاشط. تدرس المواقع التناظرية هنا التربة والجليد القطبي والتصميم الحراري.',
    },
    stat: { en: 'Mean distance', ar: 'متوسط المسافة' },
  },
  {
    id: 'mars',
    image: HERO_ASSETS.marsSurface,
    route: 'mars',
    variant: 'mars',
    window: [0.62, 0.72, 1.5, 2],
    title: { en: 'Then Mars', ar: 'ثم المريخ' },
    body: {
      en: 'Roughly 225 million km away on average: thin CO₂ air and ancient lake beds. Analogs rehearse the search for past habitability.',
      ar: 'على بعد نحو 225 مليون كم في المتوسط: هواء رقيق من ثاني أكسيد الكربون وقيعان بحيرات قديمة. تتدرب المواقع التناظرية على البحث عن صلاحية الحياة قديمًا.',
    },
    stat: { en: 'Mean distance', ar: 'متوسط المسافة' },
  },
];

const ODOMETER_INPUT = [0, 0.28, 0.4, 0.62, 0.76, 1];
const ODOMETER_OUTPUT = [0, 0, 384_400, 384_400, 225_000_000, 225_000_000];

const SECTION_TITLE: Record<LocaleCode, string> = {
  en: 'Mission journey: Earth, Moon, Mars',
  ar: 'رحلة المهمة: الأرض والقمر والمريخ',
};

const JourneyLayer: React.FC<{ chapter: Chapter; progress: MotionValue<number> }> = ({
  chapter,
  progress,
}) => {
  const opacity = useTransform(progress, chapter.window, [0, 1, 1, 0]);
  const scale = useTransform(progress, [0, 1], [1.04, 1.22]);
  const y = useTransform(progress, [0, 1], ['0%', '-4%']);
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.img
        src={chapter.image}
        alt=""
        decoding="async"
        style={{ scale, y }}
        className="h-full w-full object-cover will-change-transform"
      />
    </motion.div>
  );
};

const JourneyText: React.FC<{
  chapter: Chapter;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
  locale: LocaleCode;
}> = ({ chapter, index, active, progress, locale }) => {
  const { navigate, t, isRTL } = useObservatory();
  const Forward = isRTL ? ArrowLeft : ArrowRight;
  const [a, b, c, d] = chapter.window;
  const opacity = useTransform(progress, [a + 0.02, b, c - 0.02, d - 0.02], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c, d], [28, 0, 0, -28]);
  const destination = t.hero.destinations[chapter.id];
  return (
    <motion.div
      style={{ opacity, y }}
      aria-hidden={!active}
      className={`absolute inset-x-0 bottom-0 max-w-xl space-y-4 ${
        active ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <p className="font-mono-tabular text-xs tracking-[0.22em] text-tt-teal">
        {String(index + 1).padStart(2, '0')} / 03 · {destination.label.toUpperCase()}
      </p>
      <h3 className="font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-tt-star text-balance">
        {chapter.title[locale]}
      </h3>
      <p className="text-base leading-relaxed text-[#C3D0E0] sm:text-lg">{chapter.body[locale]}</p>
      <ActionButton
        variant={chapter.variant}
        tabIndex={active ? 0 : -1}
        onClick={() => navigate(chapter.route)}
      >
        <span>{destination.label}</span>
        <Forward className="h-4 w-4" />
      </ActionButton>
    </motion.div>
  );
};

const AnimatedJourney: React.FC = () => {
  const { locale } = useObservatory();
  const sectionRef = useRef<HTMLElement | null>(null);
  const odometerRef = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const km = useTransform(scrollYProgress, ODOMETER_INPUT, ODOMETER_OUTPUT);
  const railFill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const vignette = useTransform(scrollYProgress, [0, 0.5, 1], [0.55, 0.4, 0.55]);

  useMotionValueEvent(km, 'change', (value) => {
    if (odometerRef.current) {
      odometerRef.current.textContent = Math.round(value).toLocaleString('en-US');
    }
  });
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = value < 0.33 ? 0 : value < 0.67 ? 1 : 2;
    setActive((prev) => (prev === next ? prev : next));
  });

  return (
    <section
      ref={sectionRef}
      aria-label={SECTION_TITLE[locale]}
      className="relative h-[320svh] border-b border-white/[0.08] bg-tt-void text-tt-star"
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        {CHAPTERS.map((chapter) => (
          <JourneyLayer key={chapter.id} chapter={chapter} progress={scrollYProgress} />
        ))}
        <motion.div
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0 bg-tt-void"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-tt-void via-tt-void/40 to-transparent"
          aria-hidden="true"
        />
        <HudCorners inset="inset-4 sm:inset-6" />

        <div className="relative mx-auto h-full w-full max-w-[1440px] px-6 pb-12 sm:px-10 lg:px-14">
          <div className="pointer-events-none absolute inset-x-6 bottom-12 top-12 sm:inset-x-10 lg:inset-x-14">
            {CHAPTERS.map((chapter, index) => (
              <JourneyText
                key={chapter.id}
                chapter={chapter}
                index={index}
                active={active === index}
                progress={scrollYProgress}
                locale={locale}
              />
            ))}
          </div>

          {/* Odometer + progress rail */}
          <div className="pointer-events-none absolute end-6 top-10 flex flex-col items-end gap-3 sm:end-10 lg:end-14">
            <div className="rounded-md border border-white/[0.12] bg-[#020409]/80 px-3 py-2 text-end font-mono-tabular">
              <p className="text-xs text-tt-mist">
                {locale === 'ar' ? 'المسافة من الأرض' : 'DISTANCE FROM EARTH'}
              </p>
              <p dir="ltr" className="text-lg text-tt-star sm:text-2xl">
                <span ref={odometerRef}>0</span>
                <span className="ms-1 text-xs text-tt-teal">km</span>
              </p>
              <p className="text-xs text-tt-sand">{CHAPTERS[active].stat[locale]}</p>
            </div>
            <div className="relative hidden h-40 w-px bg-white/15 sm:block" aria-hidden="true">
              <motion.span
                style={{ scaleY: railFill, transformOrigin: 'top' }}
                className="absolute inset-0 bg-tt-teal"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/** Reduced-motion variant: three plain stacked chapters, no pinning or scroll-linked motion. */
const StaticJourney: React.FC = () => {
  const { locale, navigate, t } = useObservatory();
  return (
    <section
      aria-label={SECTION_TITLE[locale]}
      className="border-b border-white/[0.08] bg-tt-void text-tt-star"
    >
      {CHAPTERS.map((chapter, index) => {
        const destination = t.hero.destinations[chapter.id];
        return (
          <div key={chapter.id} className="relative min-h-[70svh] overflow-hidden">
            <img
              src={chapter.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tt-void via-tt-void/60 to-tt-void/30" />
            <div className="relative mx-auto flex min-h-[70svh] max-w-[1440px] flex-col justify-end gap-4 px-6 py-14 sm:px-10 lg:px-14">
              <p className="font-mono-tabular text-xs tracking-[0.22em] text-tt-teal">
                {String(index + 1).padStart(2, '0')} / 03 · {destination.label.toUpperCase()}
              </p>
              <h3 className="max-w-xl font-display text-3xl font-semibold text-tt-star text-balance">
                {chapter.title[locale]}
              </h3>
              <p className="max-w-xl text-base leading-relaxed text-[#C3D0E0]">
                {chapter.body[locale]}
              </p>
              <div>
                <ActionButton variant={chapter.variant} onClick={() => navigate(chapter.route)}>
                  <span>{destination.label}</span>
                </ActionButton>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export const MissionJourney: React.FC = () => {
  const reduce = useReducedMotion();
  return reduce ? <StaticJourney /> : <AnimatedJourney />;
};
