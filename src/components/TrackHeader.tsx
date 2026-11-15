import React from 'react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useObservatory, roleToRoutePage } from '../context/ObservatoryContext';
import { PersonaGlyph } from './DesignSystem';
import { PERSONA_CARDS } from '../data/experiencesData';
import { RoutePage, UserRole } from '../types/terratwin';

interface TrackHeaderProps {
  activeRole?: UserRole;
  title: string;
  subtitle: string;
  accentColor?: string;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  activeRole,
  title,
  subtitle,
  accentColor = '#2A9D9F',
}) => {
  const { locale, isRTL, userName, navigate } = useObservatory();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const switchTrack = (targetPage: RoutePage) => {
    navigate(targetPage);
  };

  return (
    <div className="border-b border-tt-ink/10 dark:border-white/10 pb-6 space-y-5">
      {/* Top Return + Direct Cross-Track Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-tt-ink/12 dark:border-white/[0.12] bg-white dark:bg-[#070B12] px-3 py-1.5 font-medium text-tt-ink dark:text-tt-star hover:border-tt-teal-deep dark:hover:border-tt-teal transition-colors cursor-pointer min-h-[36px]"
          >
            <BackArrow className="w-3.5 h-3.5" />
            <Home className="w-3.5 h-3.5 text-tt-teal-deep dark:text-tt-teal" />
            <span>{locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </button>

          {userName && (
            <span className="text-tt-slate dark:text-tt-sand font-medium">
              {locale === 'ar' ? `مرحبًا، ${userName}` : `Welcome, ${userName}`}
            </span>
          )}
        </div>

        {/* Switch between the 4 tracks without returning to Welcome Page */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#EEF2F6] dark:bg-[#04060B] border border-tt-ink/10 dark:border-white/[0.09] dark:shadow-[0_14px_36px_-10px_rgba(0,0,0,0.95)]">
          {PERSONA_CARDS.map((p) => {
            const active = activeRole === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => switchTrack(roleToRoutePage(p.id))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-white dark:bg-[#0E1624] text-tt-ink dark:text-tt-star shadow-sm dark:border dark:border-tt-teal/60 console-active-cyan'
                    : 'text-tt-slate dark:text-tt-mist hover:text-tt-ink dark:hover:text-white'
                }`}
              >
                <PersonaGlyph role={p.id} />
                <span>{p.title[locale]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Track Title */}
      <div className="space-y-2 max-w-3xl">
        <div
          className="h-0.5 w-12 rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-tt-ink dark:text-tt-paper text-balance">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-tt-slate dark:text-tt-mist leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
