import React, { useState } from 'react';
import { Check, Globe, Moon, Sun, Trash2, User } from 'lucide-react';
import { ActionButton, PersonaGlyph, SurfacePanel } from '../components/DesignSystem';
import { TrackHeader } from '../components/TrackHeader';
import { roleToRoutePage, useObservatory } from '../context/ObservatoryContext';
import { ACHIEVEMENT_CATALOG, PERSONA_CARDS } from '../data/experiencesData';
import { UserRole } from '../types/terratwin';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setThemeMode,
    locale,
    setLocale,
    userName,
    userRole,
    saveUserProfile,
    clearUserProfile,
    achievements,
    bestTriviaScore,
    bestQuizScore,
    navigate,
  } = useObservatory();

  const [draftName, setDraftName] = useState(userName);
  const [draftRole, setDraftRole] = useState<UserRole>(userRole ?? 'explorer');
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;
    saveUserProfile(draftName.trim(), draftRole);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 lg:px-10 py-10 space-y-8">
      <TrackHeader
        accentColor="#2A9D9F"
        title={locale === 'ar' ? 'الإعدادات والملف الشخصي' : 'Settings & Explorer Profile'}
        subtitle={
          locale === 'ar'
            ? 'عدّل اسمك وشخصيتك المحفوظة، بدّل بين العربية والإنجليزية، واضبط المظهر الليلي أو النهاري.'
            : 'Manage your locally saved name and persona, toggle English (LTR) or Arabic (RTL), and switch themes.'
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Editor */}
        <SurfacePanel className="lg:col-span-7 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-tt-teal-deep dark:text-tt-teal" />
            <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
              {locale === 'ar' ? 'البيانات الشخصية المحفوظة محليًا' : 'Saved Local Profile'}
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="settings-name-input"
                className="block text-xs font-medium text-tt-slate dark:text-tt-mist"
              >
                {locale === 'ar' ? 'الاسم المعروض' : 'Display Name'}
              </label>
              <input
                id="settings-name-input"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder={locale === 'ar' ? 'اكتب اسمك...' : 'Your Name...'}
                className="w-full rounded-lg border border-tt-ink/15 dark:border-white/15 bg-tt-paper dark:bg-[#04070D] px-3.5 py-2.5 text-sm text-tt-ink dark:text-tt-paper focus:outline-none focus:ring-2 focus:ring-[#2A9D9F]"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-tt-slate dark:text-tt-mist">
                {locale === 'ar' ? 'المسار الافتراضي' : 'Default Persona Track'}
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {PERSONA_CARDS.map((card) => {
                  const active = draftRole === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setDraftRole(card.id)}
                      style={{ borderColor: active ? card.accentHex : undefined }}
                      className={`p-3 rounded-xl border text-start transition-colors cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'bg-white dark:bg-[#04070D] shadow-sm'
                          : 'border-tt-ink/10 dark:border-white/10 bg-tt-paper dark:bg-[#04070D]/50'
                      }`}
                    >
                      <PersonaGlyph role={card.id} />
                      <span className="text-xs font-semibold text-tt-ink dark:text-tt-paper">
                        {card.title[locale]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <ActionButton type="submit" variant="primary" size="sm" disabled={!draftName.trim()}>
                <Check className="w-4 h-4" />
                <span>{locale === 'ar' ? 'حفظ التغييرات' : 'Save Profile'}</span>
              </ActionButton>
              <ActionButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate(roleToRoutePage(draftRole))}
              >
                <span>{locale === 'ar' ? 'الذهاب لمساري' : 'Go to My Track'}</span>
              </ActionButton>
              {savedToast && (
                <span className="text-xs font-medium text-tt-teal-deep dark:text-tt-teal">
                  {locale === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved locally ✓'}
                </span>
              )}
            </div>
          </form>
        </SurfacePanel>

        {/* Language, Theme & Local Stats */}
        <div className="lg:col-span-5 space-y-6">
          <SurfacePanel className="p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
              {locale === 'ar' ? 'اللغة والمظهر' : 'Language & Appearance'}
            </h2>

            <div className="space-y-2">
              <span className="text-xs font-medium text-tt-slate dark:text-tt-mist flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#2A9D9F]" />
                {locale === 'ar' ? 'لغة الواجهة واتجاه الصفحة' : 'Interface Language & Direction'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    locale === 'en'
                      ? 'border-tt-teal bg-tt-teal/14 text-tt-teal-deep dark:text-tt-teal console-active-cyan'
                      : 'border-tt-ink/12 dark:border-white/12 dark:bg-[#04070D]'
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('ar')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                    locale === 'ar'
                      ? 'border-tt-teal bg-tt-teal/14 text-tt-teal-deep dark:text-tt-teal console-active-cyan'
                      : 'border-tt-ink/12 dark:border-white/12 dark:bg-[#04070D]'
                  }`}
                >
                  العربية (RTL)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-medium text-tt-slate dark:text-tt-mist">
                {locale === 'ar' ? 'السمة البصرية' : 'Color Theme'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'border-tt-teal bg-tt-teal/14 text-[#38D6D8] console-active-cyan'
                      : 'border-tt-ink/12 dark:border-white/12'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'داكن' : 'Dark'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    theme === 'light'
                      ? 'border-tt-teal-deep bg-tt-teal-deep/15 text-tt-teal-deep'
                      : 'border-tt-ink/12 dark:border-white/12'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{locale === 'ar' ? 'فاتح' : 'Light'}</span>
                </button>
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel elevated className="p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
              {locale === 'ar' ? 'ملخص الإنجازات المحلية' : 'Local Progress Summary'}
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white dark:bg-[#020408] p-3 border border-tt-ink/10 dark:border-white/[0.09]">
                <p className="text-lg font-mono-tabular font-semibold text-[#38D6D8]">
                  {achievements.length}/{ACHIEVEMENT_CATALOG.length}
                </p>
                <p className="text-[11px] text-tt-slate dark:text-tt-mist">
                  {locale === 'ar' ? 'الأوسمة' : 'Badges'}
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#020408] p-3 border border-tt-ink/10 dark:border-white/[0.09]">
                <p className="text-lg font-mono-tabular font-semibold text-[#E8D5B5]">
                  {bestTriviaScore}
                </p>
                <p className="text-[11px] text-tt-slate dark:text-tt-mist">
                  {locale === 'ar' ? 'تحدي المستكشف' : 'Best Trivia'}
                </p>
              </div>
              <div className="rounded-lg bg-white dark:bg-[#020408] p-3 border border-tt-ink/10 dark:border-white/[0.09]">
                <p className="text-lg font-mono-tabular font-semibold text-[#FF7F54]">
                  {bestQuizScore}%
                </p>
                <p className="text-[11px] text-tt-slate dark:text-tt-mist">
                  {locale === 'ar' ? 'اختبار الطالب' : 'Best Quiz'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                clearUserProfile();
                setDraftName('');
                setDraftRole('explorer');
                navigate('welcome');
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-tt-mars-deep/35 px-3 py-2 text-xs font-medium text-tt-mars-deep dark:text-[#E58464] hover:bg-tt-mars-deep/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {locale === 'ar' ? 'مسح البيانات المحفوظة والعودة للبداية' : 'Clear Saved Data & Reset'}
              </span>
            </button>
          </SurfacePanel>
        </div>
      </div>
    </div>
  );
};
