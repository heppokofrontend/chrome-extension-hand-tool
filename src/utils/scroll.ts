const visibleOrHidden = /visible|hidden/;
const SCROLLABLE_DIFF = 3;

export const isScrollableHorizon = ({
  target,
  overflowX,
}: {
  target: HTMLElement;
  overflowX: string;
}) =>
  SCROLLABLE_DIFF < Math.abs(target.clientWidth - target.scrollWidth) &&
  !visibleOrHidden.test(overflowX);

export const isScrollableVertical = ({
  target,
  overflowY,
}: {
  target: HTMLElement;
  overflowY: string;
}) =>
  SCROLLABLE_DIFF < Math.abs(target.clientHeight - target.scrollHeight) &&
  !visibleOrHidden.test(overflowY);

// Chromium の PageDown/PageUp と同じく、直前ビューの ~40px を残す。
const PAGE_SCROLL_RESERVE_PX = 40;

export const getPageScrollAmount = (viewportHeight: number): number =>
  Math.max(PAGE_SCROLL_RESERVE_PX, viewportHeight - PAGE_SCROLL_RESERVE_PX);

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Chromium のキーボード smooth scroll に寄せた曲線・時間計算・実行環境。
// - 曲線: EASE_OUT_CUBIC（1 - (1 - t)^3）で初速早く後半減速
// - 時間: √|delta| に比例して 150ms〜300ms でクランプ
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const MIN_SCROLL_DURATION_MS = 150;
const MAX_SCROLL_DURATION_MS = 300;
const DURATION_PER_SQRT_PX = 20;

export const getScrollDurationMs = (delta: number): number =>
  Math.min(
    MAX_SCROLL_DURATION_MS,
    Math.max(MIN_SCROLL_DURATION_MS, Math.sqrt(Math.abs(delta)) * DURATION_PER_SQRT_PX),
  );

export const canScrollBy = (deltaY: number): boolean => {
  const el = document.scrollingElement ?? document.documentElement;
  if (0 < deltaY) {
    // 下方向：残り可動域 > 1px あれば true。丸め誤差で 0.x px 残る場合を弾く。
    return 1 < el.scrollHeight - el.clientHeight - el.scrollTop;
  }
  if (deltaY < 0) {
    return 0 < el.scrollTop;
  }
  return false;
};

let activeScrollAnimationId: number | null = null;

export const smoothScrollBy = (deltaY: number): void => {
  if (activeScrollAnimationId !== null) {
    cancelAnimationFrame(activeScrollAnimationId);
    activeScrollAnimationId = null;
  }

  if (prefersReducedMotion()) {
    scrollBy({ left: 0, top: deltaY, behavior: 'instant' });
    return;
  }

  const startY = scrollY;
  const startX = scrollX;
  const startTime = performance.now();
  const duration = getScrollDurationMs(deltaY);

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(progress);
    // 自前でイージング済みのため、ページ側の scroll-behavior: smooth による
    // 二重アニメーションを避けて毎フレーム instant で反映する。
    scrollTo({ left: startX, top: startY + deltaY * eased, behavior: 'instant' });
    if (progress < 1) {
      activeScrollAnimationId = requestAnimationFrame(step);
    } else {
      activeScrollAnimationId = null;
    }
  };

  activeScrollAnimationId = requestAnimationFrame(step);
};
