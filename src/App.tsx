import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/Hud';
import { Navbar } from './components/Navbar';
import { PageLoader } from './components/PageLoader';
import { WarpOverlay } from './components/WarpOverlay';
import { ObservatoryProvider, useObservatory } from './context/ObservatoryContext';
import { PERSONA_CARDS } from './data/experiencesData';
import { EARTH_ANALOG_SITES, HERO_ASSETS } from './data/planetaryData';
import type { RoutePage } from './types/terratwin';

// Route-level code splitting: each page (and its heavy deps like Three.js / Leaflet) loads on demand.
const page = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, name: T) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const WelcomePage = page(() => import('./pages/WelcomePage'), 'WelcomePage');
const HomePage = page(() => import('./pages/HomePage'), 'HomePage');
const ExplorerHubPage = page(() => import('./pages/ExplorerHubPage'), 'ExplorerHubPage');
const StudentHubPage = page(() => import('./pages/StudentHubPage'), 'StudentHubPage');
const ScientistHubPage = page(() => import('./pages/ScientistHubPage'), 'ScientistHubPage');
const AstronautHubPage = page(() => import('./pages/AstronautHubPage'), 'AstronautHubPage');
const AboutPage = page(() => import('./pages/AboutPage'), 'AboutPage');
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage');
const MoonPage = page(() => import('./pages/MoonPage'), 'MoonPage');
const MarsPage = page(() => import('./pages/MarsPage'), 'MarsPage');
const ExplorerPage = page(() => import('./pages/ExplorerPage'), 'ExplorerPage');
const LocationDetailPage = page(() => import('./pages/LocationDetailPage'), 'LocationDetailPage');
const ComparePage = page(() => import('./pages/ComparePage'), 'ComparePage');
const NotFoundPage = page(() => import('./pages/NotFoundPage'), 'NotFoundPage');

const PAGES: Record<RoutePage, React.LazyExoticComponent<React.ComponentType>> = {
  welcome: WelcomePage,
  home: HomePage,
  'explorer-hub': ExplorerHubPage,
  'student-hub': StudentHubPage,
  'scientist-hub': ScientistHubPage,
  'astronaut-hub': AstronautHubPage,
  about: AboutPage,
  settings: SettingsPage,
  moon: MoonPage,
  mars: MarsPage,
  explorer: ExplorerPage,
  location: LocationDetailPage,
  compare: ComparePage,
  'not-found': NotFoundPage,
};

const PAGE_TITLES: Record<RoutePage, { en: string; ar: string }> = {
  welcome: { en: 'Welcome', ar: 'مرحبًا' },
  home: { en: 'Overview', ar: 'نظرة عامة' },
  'explorer-hub': { en: 'Explorer', ar: 'المستكشف' },
  'student-hub': { en: 'Student', ar: 'الطالب' },
  'scientist-hub': { en: 'Scientist', ar: 'العالِم' },
  'astronaut-hub': { en: 'Pioneer', ar: 'الرائد' },
  about: { en: 'About', ar: 'حول' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  moon: { en: 'Moon', ar: 'القمر' },
  mars: { en: 'Mars', ar: 'المريخ' },
  explorer: { en: 'Earth Analog Explorer', ar: 'مستكشف المواقع الأرضية' },
  location: { en: 'Location', ar: 'الموقع' },
  compare: { en: 'Compare', ar: 'مقارنة' },
  'not-found': { en: 'Page not found', ar: 'الصفحة غير موجودة' },
};

const PRELOAD_URLS = Array.from(
  new Set([
    ...PERSONA_CARDS.map((c) => c.image),
    HERO_ASSETS.earthOrbit,
    HERO_ASSETS.moonSurface,
    HERO_ASSETS.marsSurface,
    ...EARTH_ANALOG_SITES.map((s) => s.image),
  ])
);

const EASE = [0.16, 1, 0.3, 1] as const;

const ObservatoryShell: React.FC = () => {
  const { route, locale } = useObservatory();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Warm the image cache only when the browser is idle, so it never competes with the first paint.
  useEffect(() => {
    const warm = () => {
      // Home owns the 3D globe chunk; fetch it early so navigating there never waits on the network.
      void import('./pages/HomePage');
      PRELOAD_URLS.forEach((url) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warm, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Per-route document title, scroll reset and focus hand-off (screen readers + keyboard users).
  // biome-ignore lint/correctness/useExhaustiveDependencies: route.locationId is an intentional trigger (new location, same page)
  useEffect(() => {
    const title = PAGE_TITLES[route.page]?.[locale === 'ar' ? 'ar' : 'en'];
    document.title = title ? `${title} — TerraTwin` : 'TerraTwin — Planetary Analog Observatory';
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    mainRef.current?.focus({ preventScroll: true });
  }, [route.page, route.locationId, locale]);

  const Page = PAGES[route.page] ?? NotFoundPage;

  return (
    <div className="relative min-h-screen flex flex-col bg-tt-paper dark:bg-tt-void space-void-backdrop text-tt-ink dark:text-tt-star transition-colors duration-200">
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#2A9D9F] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#04070D]"
      >
        {locale === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'}
      </button>
      <ScrollProgress />
      <WarpOverlay />
      {/* Subtle fixed starfield layer visible in dark mode */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-0 dark:opacity-100 space-void-stars"
        aria-hidden="true"
      />
      {/* Subtle fixed terminal scanline overlay visible in dark mode */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-0 dark:opacity-100 space-scanline-overlay"
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
          <ErrorBoundary key={`${route.page}-${route.locationId}`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${route.page}-${route.locationId}`}
                initial={{ opacity: 0, y: 12, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 1.004 }}
                transition={{ duration: 0.34, ease: EASE }}
              >
                <Suspense fallback={<PageLoader label={locale === 'ar' ? 'جارٍ التحميل' : 'Loading'} />}>
                  <Page />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ObservatoryProvider>
        <ObservatoryShell />
      </ObservatoryProvider>
    </MotionConfig>
  );
}
