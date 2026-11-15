import React from 'react';
import { useObservatory } from '../context/ObservatoryContext';

export const NotFoundPage: React.FC = () => {
  const { locale, navigate } = useObservatory();
  const ar = locale === 'ar';
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center gap-5 px-6 py-24">
      <p className="font-mono-tabular text-xs tracking-widest text-[#2A9D9F]" dir="ltr">
        404 · 00°00′N 00°00′E
      </p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">
        {ar ? 'هذا المكان خارج الخريطة' : 'This location is off the map'}
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-tt-slate dark:text-tt-mist">
        {ar
          ? 'لم نعثر على الصفحة التي تبحث عنها. جرّب العودة إلى البداية أو استكشاف خريطة المواقع الأرضية.'
          : 'We could not find the page you were looking for. Head back to the start or explore the Earth analog map.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="rounded-lg bg-[#2A9D9F] px-4 py-2 text-sm font-semibold text-[#04070D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A9D9F]"
        >
          {ar ? 'العودة للبداية' : 'Back to start'}
        </button>
        <button
          type="button"
          onClick={() => navigate('explorer')}
          className="rounded-lg border border-current/30 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A9D9F]"
        >
          {ar ? 'خريطة الأرض' : 'Earth map'}
        </button>
      </div>
    </section>
  );
};
