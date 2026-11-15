import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

const copy = {
  en: {
    title: 'Something went wrong',
    body: 'This view failed to load. Your data is safe; reloading usually fixes it.',
    reload: 'Reload',
    home: 'Back to start',
  },
  ar: {
    title: 'حدث خطأ ما',
    body: 'تعذّر تحميل هذه الصفحة. بياناتك بأمان، وإعادة التحميل تحلّ المشكلة غالبًا.',
    reload: 'إعادة التحميل',
    home: 'العودة للبداية',
  },
} as const;

/** Catches render errors so one broken view never blanks the whole observatory. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('TerraTwin view error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const lang = typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const c = copy[lang];
    return (
      <div role="alert" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-24">
        <p className="font-mono-tabular text-xs uppercase tracking-widest text-tt-mars-deep dark:text-[#E58464]">
          Error
        </p>
        <h1 className="font-display text-3xl font-semibold">{c.title}</h1>
        <p className="text-sm leading-relaxed text-tt-slate dark:text-tt-mist">{c.body}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#2A9D9F] px-4 py-2 text-sm font-semibold text-[#04070D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A9D9F]"
          >
            {c.reload}
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/welcome';
              this.setState({ error: null });
            }}
            className="rounded-lg border border-current/30 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A9D9F]"
          >
            {c.home}
          </button>
        </div>
      </div>
    );
  }
}
