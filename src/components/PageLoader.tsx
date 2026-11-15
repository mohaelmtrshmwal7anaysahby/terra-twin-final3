import React from 'react';

/**
 * Loading state shown while a route chunk downloads. It fades in after a short delay so fast
 * navigations never flash it, then shows an orbiting-probe ring and an indeterminate progress line.
 */
export const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div
    role="status"
    aria-live="polite"
    className="tt-loader-in flex min-h-[60vh] items-center justify-center"
  >
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-20 w-20" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border border-tt-teal/25" />
        <span className="absolute inset-[10px] rounded-full border border-tt-sand/20" />
        <span className="absolute inset-0 animate-spin rounded-full motion-reduce:animate-none [animation-duration:2.2s]">
          <span className="absolute start-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tt-teal shadow-[0_0_14px_3px_rgba(47,209,211,0.7)]" />
        </span>
        <span className="absolute inset-[27px] rounded-full bg-tt-sand/70" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-[0.3em] text-tt-ink dark:text-tt-star">
          TERRATWIN
        </span>
        <span className="relative h-px w-40 overflow-hidden bg-tt-ink/15 dark:bg-white/15" aria-hidden="true">
          <span className="tt-loader-bar absolute inset-y-0 w-1/3 bg-tt-teal" />
        </span>
        <span className="font-mono-tabular text-xs tracking-widest text-tt-slate dark:text-tt-mist">
          {label}
        </span>
      </div>
    </div>
  </div>
);
