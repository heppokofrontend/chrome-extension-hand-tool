import { describe, it, expect } from 'vitest';
import {
  canScrollBy,
  getPageScrollAmount,
  getScrollDurationMs,
  isScrollableHorizon,
  isScrollableVertical,
} from './scroll';

const buildElement = ({
  clientWidth,
  scrollWidth,
  clientHeight,
  scrollHeight,
}: {
  clientWidth: number;
  scrollWidth: number;
  clientHeight: number;
  scrollHeight: number;
}): HTMLElement => {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  return el;
};

describe('isScrollableHorizon', () => {
  it('returns true when scrollWidth exceeds clientWidth by more than 3px and overflow allows it', () => {
    const target = buildElement({
      clientWidth: 100,
      scrollWidth: 200,
      clientHeight: 0,
      scrollHeight: 0,
    });
    expect(isScrollableHorizon({ target, overflowX: 'auto' })).toBe(true);
    expect(isScrollableHorizon({ target, overflowX: 'scroll' })).toBe(true);
  });

  it('returns false when overflow is visible or hidden', () => {
    const target = buildElement({
      clientWidth: 100,
      scrollWidth: 200,
      clientHeight: 0,
      scrollHeight: 0,
    });
    expect(isScrollableHorizon({ target, overflowX: 'visible' })).toBe(false);
    expect(isScrollableHorizon({ target, overflowX: 'hidden' })).toBe(false);
  });

  it('returns false when scroll delta is 3px or less', () => {
    const target = buildElement({
      clientWidth: 100,
      scrollWidth: 103,
      clientHeight: 0,
      scrollHeight: 0,
    });
    expect(isScrollableHorizon({ target, overflowX: 'auto' })).toBe(false);
  });
});

describe('isScrollableVertical', () => {
  it('returns true when scrollHeight exceeds clientHeight by more than 3px and overflow allows it', () => {
    const target = buildElement({
      clientWidth: 0,
      scrollWidth: 0,
      clientHeight: 100,
      scrollHeight: 200,
    });
    expect(isScrollableVertical({ target, overflowY: 'auto' })).toBe(true);
  });

  it('returns false when overflow is visible or hidden', () => {
    const target = buildElement({
      clientWidth: 0,
      scrollWidth: 0,
      clientHeight: 100,
      scrollHeight: 200,
    });
    expect(isScrollableVertical({ target, overflowY: 'visible' })).toBe(false);
    expect(isScrollableVertical({ target, overflowY: 'hidden' })).toBe(false);
  });

  it('returns false when scroll delta is 3px or less', () => {
    const target = buildElement({
      clientWidth: 0,
      scrollWidth: 0,
      clientHeight: 100,
      scrollHeight: 103,
    });
    expect(isScrollableVertical({ target, overflowY: 'auto' })).toBe(false);
  });
});

describe('getPageScrollAmount', () => {
  it('keeps ~40px of the previous view visible for typical viewports', () => {
    expect(getPageScrollAmount(800)).toBe(760);
    expect(getPageScrollAmount(1080)).toBe(1040);
  });

  it('never returns less than the reserve, even for tiny viewports', () => {
    expect(getPageScrollAmount(60)).toBe(40);
    expect(getPageScrollAmount(0)).toBe(40);
  });
});

describe('getScrollDurationMs', () => {
  it('scales with sqrt of distance and clamps to [150, 300]', () => {
    // sqrt(100)*20 = 200, in range
    expect(getScrollDurationMs(100)).toBeCloseTo(200);
    // tiny distance clamps to floor
    expect(getScrollDurationMs(1)).toBe(150);
    expect(getScrollDurationMs(0)).toBe(150);
    // huge distance clamps to ceiling
    expect(getScrollDurationMs(10000)).toBe(300);
    // negative distance uses absolute value
    expect(getScrollDurationMs(-400)).toBe(300);
  });
});

describe('canScrollBy', () => {
  const setScrollMetrics = ({
    scrollTop,
    clientHeight,
    scrollHeight,
  }: {
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  }) => {
    const el = document.scrollingElement ?? document.documentElement;
    Object.defineProperty(el, 'scrollTop', { value: scrollTop, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  };

  it('returns false at the bottom edge (down direction)', () => {
    setScrollMetrics({ scrollTop: 900, clientHeight: 100, scrollHeight: 1000 });
    expect(canScrollBy(500)).toBe(false);
  });

  it('returns true when there is room to scroll down', () => {
    setScrollMetrics({ scrollTop: 0, clientHeight: 100, scrollHeight: 1000 });
    expect(canScrollBy(500)).toBe(true);
  });

  it('returns false at the top edge (up direction)', () => {
    setScrollMetrics({ scrollTop: 0, clientHeight: 100, scrollHeight: 1000 });
    expect(canScrollBy(-500)).toBe(false);
  });

  it('returns true when there is room to scroll up', () => {
    setScrollMetrics({ scrollTop: 500, clientHeight: 100, scrollHeight: 1000 });
    expect(canScrollBy(-500)).toBe(true);
  });

  it('returns false for zero delta', () => {
    setScrollMetrics({ scrollTop: 500, clientHeight: 100, scrollHeight: 1000 });
    expect(canScrollBy(0)).toBe(false);
  });
});
