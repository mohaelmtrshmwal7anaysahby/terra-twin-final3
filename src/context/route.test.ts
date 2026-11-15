import { describe, expect, it } from 'vitest';
import { parseHashRoute } from './ObservatoryContext';

describe('parseHashRoute', () => {
  it('lands on the 3D observatory by default and keeps #/welcome as the mission picker', () => {
    expect(parseHashRoute('').page).toBe('home');
    expect(parseHashRoute('#/').page).toBe('home');
    expect(parseHashRoute('#/welcome').page).toBe('welcome');
  });

  it.each([
    'home',
    'explorer-hub',
    'student-hub',
    'scientist-hub',
    'astronaut-hub',
    'about',
    'settings',
    'moon',
    'mars',
    'explorer',
  ])('resolves #/%s', (page) => {
    expect(parseHashRoute(`#/${page}`).page).toBe(page);
  });

  it('resolves a known location and rejects unknown ones', () => {
    const ok = parseHashRoute('#/location/atacama');
    expect(ok.page).toBe('location');
    expect(ok.locationId).toBe('atacama');
    expect(parseHashRoute('#/location/atlantis').page).toBe('not-found');
    expect(parseHashRoute('#/location').page).toBe('not-found');
  });

  it('resolves compare routes and falls back to safe defaults for bad ids', () => {
    const ok = parseHashRoute('#/compare/iceland/mars-gale');
    expect(ok).toMatchObject({ page: 'compare', compareSiteId: 'iceland', compareRegionId: 'mars-gale' });
    const bad = parseHashRoute('#/compare/nowhere/pluto');
    expect(bad).toMatchObject({ page: 'compare', compareSiteId: 'atacama', compareRegionId: 'mars-jezero' });
  });

  it('sends unknown routes to not-found', () => {
    expect(parseHashRoute('#/does-not-exist').page).toBe('not-found');
    expect(parseHashRoute('#/main-content').page).toBe('not-found');
  });
});
