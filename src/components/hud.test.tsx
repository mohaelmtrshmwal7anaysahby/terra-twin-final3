// @vitest-environment jsdom
import React from 'react';
import { MotionConfig } from 'motion/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObservatoryProvider } from '../context/ObservatoryContext';
import { EARTH_ANALOG_SITES } from '../data/planetaryData';
import { TelemetryTicker } from './Hud';
import { MissionJourney } from './MissionJourney';
import { WarpOverlay, playWarp } from './WarpOverlay';

const wrap = (ui: React.ReactElement) =>
  render(
    <MotionConfig reducedMotion="always">
      <ObservatoryProvider>{ui}</ObservatoryProvider>
    </MotionConfig>
  );

const setReducedMotion = (matches: boolean) => {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
};

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('terratwin_lang_50', 'en');
  window.location.hash = '';
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setReducedMotion(false);
});

describe('HUD building blocks', () => {
  it('TelemetryTicker lists every analog station twice (seamless loop)', () => {
    const { container } = wrap(<TelemetryTicker locale="en" />);
    const first = EARTH_ANALOG_SITES[0].name.en;
    expect(container.textContent?.split(first).length).toBe(3);
  });

  it('MissionJourney renders all three chapters', () => {
    wrap(<MissionJourney />);
    expect(screen.getAllByText(/Start where the analogs live/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Next stop: the Moon/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Then Mars/).length).toBeGreaterThan(0);
  });
});

describe('warp transition', () => {
  it('runs the callback immediately for reduced-motion users', () => {
    setReducedMotion(true);
    const onMidpoint = vi.fn();
    playWarp({ x: 10, y: 10, image: 'x.webp', label: 'Atacama', onMidpoint });
    expect(onMidpoint).toHaveBeenCalledTimes(1);
  });

  it('shows the overlay, navigates at the midpoint, then clears itself', () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    const onMidpoint = vi.fn();
    wrap(<WarpOverlay />);
    act(() => {
      playWarp({ x: 40, y: 60, image: 'x.webp', label: 'Atacama', onMidpoint });
    });
    expect(screen.getByText('Atacama')).toBeTruthy();
    expect(onMidpoint).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onMidpoint).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.queryByText('Atacama')).toBeNull();
  });
});
