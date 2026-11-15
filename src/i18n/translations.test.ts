import { describe, expect, it } from 'vitest';
import { UI_TEXT } from './translations';
import { LANGUAGES_50 } from './languages50';

const keyPaths = (obj: unknown, prefix = ''): string[] => {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k)
  );
};

describe('i18n', () => {
  it('English and Arabic expose exactly the same keys', () => {
    expect(keyPaths(UI_TEXT.ar).sort()).toEqual(keyPaths(UI_TEXT.en).sort());
  });

  it('has no empty strings in either locale', () => {
    const empties = (o: unknown, p = ''): string[] =>
      typeof o === 'string'
        ? o.trim() === ''
          ? [p]
          : []
        : o && typeof o === 'object'
        ? Object.entries(o).flatMap(([k, v]) => empties(v, p ? `${p}.${k}` : k))
        : [];
    expect(empties(UI_TEXT.en)).toEqual([]);
    expect(empties(UI_TEXT.ar)).toEqual([]);
  });

  it('declares RTL correctly for right-to-left languages', () => {
    for (const code of ['ar', 'fa', 'ur', 'he']) {
      expect(LANGUAGES_50.find((l) => l.code === code)?.dir).toBe('rtl');
    }
    expect(LANGUAGES_50.find((l) => l.code === 'en')?.dir).toBe('ltr');
  });

  it('has unique language codes', () => {
    const codes = LANGUAGES_50.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
