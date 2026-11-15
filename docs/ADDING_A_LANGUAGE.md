# Adding a language

TerraTwin ships a 50-language catalogue (`src/i18n/languages50.ts`). Two languages are fully translated (English, Arabic); about a dozen more have a *partial* override covering the navigation, hero text and level label (`CHROME_TRANSLATIONS_BY_LANG`). Everything else falls back to English.

Scientific values never change with language: numbers, units and formulas come from `src/data/planetaryData.ts`.

## Steps

1. Make sure the language exists in `LANGUAGES_50` (code, native name, `dir`).
2. For a **partial** translation, add an entry to `CHROME_TRANSLATIONS_BY_LANG` (`nav`, `hero`, `controls`).
3. For a **full** translation, translate every key of `UI_TEXT.en` in `src/i18n/translations.ts`. `src/i18n/translations.test.ts` already checks that English and Arabic expose identical keys and no empty strings; extend that test to your new locale.
4. Scientific prose in the data file (`BilingualText`: summaries, notes, feature names) currently has `en` and `ar` only. Add a key per language there if you want those translated too.
5. Right-to-left languages (`ar`, `fa`, `ur`, `he`) only need `dir: 'rtl'`; layouts use logical properties (`start`/`end`).
6. Run `npm run check`.

Have a native speaker review any machine-assisted translation before shipping it.
