import React from 'react';
import { Compass, Database, Globe, Layers } from 'lucide-react';
import { ActionButton, PersonaGlyph, SurfacePanel } from '../components/DesignSystem';
import { TrackHeader } from '../components/TrackHeader';
import { useObservatory, roleToRoutePage } from '../context/ObservatoryContext';
import { PERSONA_CARDS } from '../data/experiencesData';
import { EARTH_ANALOG_SITES } from '../data/planetaryData';

export const AboutPage: React.FC = () => {
  const { locale, navigate } = useObservatory();

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-10 space-y-10">
      <TrackHeader
        accentColor="#2A9D9F"
        title={locale === 'ar' ? 'عن منصة TerraTwin' : 'About TerraTwin'}
        subtitle={
          locale === 'ar'
            ? 'مرصد علمي تعليمي ثنائي اللغة يربط أشد بيئات الأرض قسوة بتضاريس القمر والمريخ مع الإفصاح عن مصدر كل قيمة أو وصفها بأنها توضيحية إن لم يتوفر مصدر مؤكد.'
            : 'A bilingual planetary exploration observatory connecting Earth’s extreme terrestrial analogs with the Moon and Mars labelling every value as measured, modeled, or illustrative so nothing unsourced passes as verified.'
        }
      />

      {/* Core Scientific Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SurfacePanel className="p-6 space-y-3">
          <Globe className="w-6 h-6 text-tt-teal-deep dark:text-tt-teal" />
          <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {locale === 'ar' ? '7 محطات نظائر أرضية حقيقية' : '7 Terrestrial Analog Field Stations'}
          </h2>
          <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
            {locale === 'ar'
              ? `تغطي المنصة ${EARTH_ANALOG_SITES.length} محطات عالمية من صحراء أتاكاما والوديان الجافة بأنتاركتيكا إلى أيسلندا وماونا كيا وفوهة هوتون ووادي الموت وأكسل هايبرغ.`
              : `Curated baselines across ${EARTH_ANALOG_SITES.length} field stations: Atacama, Antarctica Dry Valleys, Haughton Crater, Death Valley, Iceland, Mauna Kea, and Axel Heiberg Island.`}
          </p>
        </SurfacePanel>

        <SurfacePanel className="p-6 space-y-3">
          <Database className="w-6 h-6 text-tt-mars" />
          <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {locale === 'ar' ? 'النزاهة العلمية وعدم تلفيق البيانات' : 'Strict Data Integrity & Null Transparency'}
          </h2>
          <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
            {locale === 'ar'
              ? 'لا تعتمد TerraTwin على أرقام تقديرية مخفية؛ عندما يكون قياس الخشونة أو البياض غير موثق في قاعدة بيانات مرجعية يظهر صراحةً كقيمة غير متوفرة.'
              : 'TerraTwin refuses to fabricate missing metrics. Unverified parameters such as missing 1m LiDAR RMS roughness are explicitly flagged Null and withhold composite scores.'}
          </p>
        </SurfacePanel>

        <SurfacePanel className="p-6 space-y-3">
          <Layers className="w-6 h-6 text-[#3B82F6]" />
          <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {locale === 'ar' ? 'تكامل مباشر مع NASA و Open-Meteo' : 'Live NASA & Open-Meteo Feeds'}
          </h2>
          <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
            {locale === 'ar'
              ? 'يتصل الخادم بواجهات Open-Meteo للطقس الميداني الحي وبث NASA EONET ومركبة المريخ Perseverance عند توفر الاتصال.'
              : 'Server-side endpoints stream live station meteorology via Open-Meteo alongside NASA EONET and Perseverance mission status with honest availability states.'}
          </p>
        </SurfacePanel>
      </div>

      {/* 4 Experiences Overview */}
      <SurfacePanel className="p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold text-tt-ink dark:text-tt-paper">
            {locale === 'ar' ? 'أربع تجارب متكاملة لكل مستخدم' : 'Four Tailored Planetary Experiences'}
          </h2>
          <p className="text-sm text-tt-slate dark:text-tt-mist">
            {locale === 'ar'
              ? 'يمكنك التبديل بين أي مسار في أي وقت دون الحاجة لإعادة التسجيل.'
              : 'Switch effortlessly between all four tracks at any point.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONA_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => navigate(roleToRoutePage(card.id))}
              className="text-start p-4 rounded-xl border border-tt-ink/10 dark:border-white/10 bg-tt-paper dark:bg-[#04070D] hover:border-[#2A9D9F] transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center gap-2 text-base font-display font-semibold text-tt-ink dark:text-tt-paper">
                <PersonaGlyph role={card.id} />
                <span>{card.title[locale]}</span>
              </div>
              <p className="text-xs text-tt-slate dark:text-tt-mist">
                {card.description[locale]}
              </p>
            </button>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <ActionButton variant="primary" size="md" onClick={() => navigate('home')}>
            <Compass className="w-4 h-4" />
            <span>{locale === 'ar' ? 'فتح المرصد ثلاثي الأبعاد' : 'Launch 3D Observatory'}</span>
          </ActionButton>
          <ActionButton variant="secondary" size="md" onClick={() => navigate('explorer')}>
            <span>{locale === 'ar' ? 'خريطة النظائر التفاعلية' : 'Open Interactive Map'}</span>
          </ActionButton>
        </div>
      </SurfacePanel>
    </div>
  );
};
