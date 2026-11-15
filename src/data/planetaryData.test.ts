import { describe, expect, it } from 'vitest';
import {
  EARTH_ANALOG_SITES,
  PLANETARY_REGIONS,
  calculateComparison,
} from './planetaryData';
import type {
  DataQualityLevel,
  EarthAnalogSite,
  MetricQualityMap,
  PlanetaryRegion,
} from '../types/terratwin';

const REGIONS = Object.values(PLANETARY_REGIONS);
const ENTITIES: Array<EarthAnalogSite | PlanetaryRegion> = [...EARTH_ANALOG_SITES, ...REGIONS];
const SOURCED: DataQualityLevel[] = ['measured', 'modeled'];

const allQuality = (q: DataQualityLevel): MetricQualityMap => ({
  thermal: q,
  elevation: q,
  slope: q,
  roughness: q,
  waterIce: q,
  mineralogy: q,
});

describe('data integrity guards', () => {
  it('has the expected records', () => {
    expect(EARTH_ANALOG_SITES.map((s) => s.id).sort()).toEqual(
      ['antarctica', 'atacama', 'canadian-arctic', 'death-valley', 'haughton', 'hawaii', 'iceland'].sort()
    );
    expect(REGIONS).toHaveLength(4);
  });

  it('never labels data measured/modeled without a confirmed source on that record', () => {
    for (const e of ENTITIES) {
      const claimsSourced = Object.values(e.metricQuality).some((q) => SOURCED.includes(q));
      if (claimsSourced) {
        expect(
          e.sources.some((s) => s.verification === 'confirmed'),
          `${e.id} claims sourced data but has no confirmed source`
        ).toBe(true);
      }
    }
  });

  it('keeps null metrics out of the sourced tiers', () => {
    const map: Array<[keyof MetricQualityMap, string]> = [
      ['thermal', 'meanTempC'],
      ['elevation', 'elevationM'],
      ['slope', 'meanSlopeDeg'],
      ['roughness', 'roughnessIndexDeg'],
      ['waterIce', 'waterIcePct'],
    ];
    for (const e of ENTITIES) {
      for (const [axis, field] of map) {
        const value = (e.metrics as Record<string, number | null>)[field];
        if (value === null) {
          expect(SOURCED.includes(e.metricQuality[axis]), `${e.id}.${field} is null`).toBe(false);
        }
      }
    }
  });

  it('only shows numeric mineral percentages when mineralogy is measured', () => {
    for (const e of ENTITIES) {
      const hasNumeric = e.minerals.some((m) => m.percentage !== null);
      if (hasNumeric) expect(e.metricQuality.mineralogy, e.id).toBe('measured');
    }
  });

  it('uses well-formed identifiers and tags every source', () => {
    for (const e of ENTITIES) {
      for (const s of e.sources) {
        expect(['confirmed', 'unconfirmed']).toContain(s.verification);
        if (s.identifier.startsWith('DOI:')) {
          expect(s.identifier).toMatch(/^DOI:10\.\d{4,9}\/\S+$/);
        }
      }
    }
  });

  it('has unique source ids', () => {
    const ids = ENTITIES.flatMap((e) => e.sources.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('calculateComparison', () => {
  const site = EARTH_ANALOG_SITES.find((s) => s.id === 'atacama')!;
  const region = PLANETARY_REGIONS['mars-jezero'];

  it('withholds the reliable score while data is illustrative, but offers a labelled provisional one', () => {
    const c = calculateComparison(site, region);
    expect(c.overallScore).toBeNull();
    expect(c.isReliable).toBe(false);
    expect(c.provisionalScore).not.toBeNull();
    expect(c.provisionalScore!).toBeGreaterThanOrEqual(0);
    expect(c.provisionalScore!).toBeLessThanOrEqual(100);
    expect(c.insufficiencyReason?.en).toMatch(/provisional/i);
    expect(c.insufficiencyReason?.ar.length).toBeGreaterThan(10);
  });

  it('produces a reliable score when enough axes are sourced on both sides', () => {
    const c = calculateComparison(
      { ...site, metricQuality: allQuality('measured') },
      { ...region, metricQuality: allQuality('modeled') }
    );
    expect(c.isReliable).toBe(true);
    expect(c.overallScore).not.toBeNull();
    expect(c.provisionalScore).toBeNull();
    expect(c.verifiedAxisCount).toBe(c.totalAxisCount - c.missingAxes.length);
  });

  it('treats an axis as only as strong as its weakest side', () => {
    const c = calculateComparison(
      { ...site, metricQuality: allQuality('measured') },
      { ...region, metricQuality: allQuality('illustrative') }
    );
    expect(c.axes.every((a) => a.quality === 'illustrative')).toBe(true);
    expect(c.overallScore).toBeNull();
  });

  it('does not let illustrative axes leak into the reliable score', () => {
    const mixed: MetricQualityMap = {
      ...allQuality('measured'),
      thermal: 'illustrative',
      elevation: 'illustrative',
    };
    const c = calculateComparison(
      { ...site, metricQuality: mixed },
      { ...region, metricQuality: allQuality('measured') }
    );
    const sourced = c.axes.filter((a) => SOURCED.includes(a.quality));
    expect(sourced).toHaveLength(4);
    const w = { thermal: 1, elevation: 0.7, slope: 0.9, roughness: 1, waterIce: 1.2, mineralogy: 1.4 };
    const expected = Math.round(
      sourced.reduce((acc, a) => acc + a.similarityPct! * w[a.key], 0) /
        sourced.reduce((acc, a) => acc + w[a.key], 0)
    );
    expect(c.overallScore).toBe(expected);
  });

  it('preserves nulls instead of inventing values', () => {
    const arctic = EARTH_ANALOG_SITES.find((s) => s.id === 'canadian-arctic')!;
    expect(arctic.metrics.roughnessIndexDeg).toBeNull();
    const c = calculateComparison(arctic, region);
    expect(c.missingAxes).toContain('roughness');
    expect(c.axes.find((a) => a.key === 'roughness')!.similarityPct).toBeNull();
  });

  it('refuses even a provisional score with fewer than three usable axes', () => {
    const sparse: EarthAnalogSite = {
      ...site,
      metrics: {
        ...site.metrics,
        meanTempC: null,
        elevationM: null,
        meanSlopeDeg: null,
        roughnessIndexDeg: null,
        waterIcePct: null,
      },
    };
    const c = calculateComparison(sparse, region);
    expect(c.overallScore).toBeNull();
    expect(c.provisionalScore).toBeNull();
  });

  it('keeps every similarity within 0-100 for all site/region pairs', () => {
    for (const s of EARTH_ANALOG_SITES) {
      for (const r of REGIONS) {
        const c = calculateComparison(s, r);
        for (const a of c.axes) {
          if (a.similarityPct !== null) {
            expect(a.similarityPct).toBeGreaterThanOrEqual(0);
            expect(a.similarityPct).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});
