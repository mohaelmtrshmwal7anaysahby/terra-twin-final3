import React from 'react';
import { useObservatory } from '../context/ObservatoryContext';
import { RoutePage } from '../types/terratwin';

export const Footer: React.FC = () => {
  const { locale, navigate, t } = useObservatory();

  const links: { page: RoutePage; label: string }[] = [
    { page: 'home', label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { page: 'welcome', label: locale === 'ar' ? 'اختر مهمتك' : 'Choose your mission' },
    { page: 'explorer', label: t.nav.explorer },
    { page: 'moon', label: t.nav.moon },
    { page: 'mars', label: t.nav.mars },
    { page: 'about', label: locale === 'ar' ? 'عن TerraTwin' : 'About TerraTwin' },
    { page: 'settings', label: locale === 'ar' ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <footer className="border-t border-tt-ink/10 dark:border-white/[0.08] bg-[#EEF2F6]/60 dark:bg-tt-void transition-colors duration-200">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8 border-b border-tt-ink/10 dark:border-white/10">
          <div className="max-w-md space-y-2">
            <span className="text-lg font-display font-semibold text-tt-ink dark:text-tt-paper">
              {t.brand}
            </span>
            <p className="text-sm font-medium text-tt-teal-deep dark:text-tt-teal">
              {t.footer.tagline}
            </p>
            <p className="text-xs text-tt-slate dark:text-tt-mist leading-relaxed">
              {t.footer.methodologyNote}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-3" aria-label="Footer Navigation">
            {links.map((item) => (
              <button
                type="button"
                key={item.page}
                onClick={() => navigate(item.page)}
                className="text-sm text-tt-slate dark:text-tt-mist hover:text-tt-ink dark:hover:text-tt-paper transition-colors whitespace-nowrap cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-tt-slate dark:text-tt-mist">
          <span>{t.footer.copyright}</span>
          <span>
            {locale === 'ar'
              ? 'اللغات المتاحة: العربية (RTL) / English (LTR)'
              : 'Supported Languages: English (LTR) / العربية (RTL)'}
          </span>
        </div>
      </div>
    </footer>
  );
};
