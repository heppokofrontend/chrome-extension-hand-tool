import {
  type SaveDataType,
  defaultSaveData,
  INJECTED_MARKER_KEY,
  TAP_RELEASE_THRESHOLD_MS,
} from './constants';
import { parseSaveData } from './utils/save-data';
import {
  canScrollBy,
  getPageScrollAmount,
  isScrollableHorizon,
  isScrollableVertical,
  smoothScrollBy,
} from './utils/scroll';

const state = {
  isUseOnlySpace: defaultSaveData.isUseOnlySpace,
  customKeyPattern: defaultSaveData.customKeyPattern,
  shiftKey: defaultSaveData.shiftKey,
  ctrlKey: defaultSaveData.ctrlKey,

  target: window as EventTarget | null,
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
  scrollableX: false,
  scrollableY: false,
  pressSpace: false,
  pressMouse: false,
  didDrag: false,
  spacePressedAt: 0,
};

const run = () => {
  const styleElement = (() => {
    const element = document.createElement('style');
    element.textContent = '* {cursor: move !important;}';
    element.dataset['from'] = 'chrome-extension';
    return element;
  })();

  // dragScreen は Popover API の top layer に載せることで dialog.showModal() の
  // 上に来れるようにしとる。popover 属性が付いた要素は :popover-open 状態のときのみ
  // 描画される。
  const dragScreen = (() => {
    const element = document.createElement('heppokofrontend-handtool');
    element.setAttribute('popover', 'manual');
    element.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      z-index: 2147483647 !important;
    `;
    element.dataset['from'] = 'chrome-extension';
    return element;
  })();
  document.body.append(dragScreen);

  const showDragScreen = () => {
    if (!dragScreen.matches(':popover-open')) {
      dragScreen.showPopover();
    }
  };
  const hideDragScreen = () => {
    if (dragScreen.matches(':popover-open')) {
      dragScreen.hidePopover();
    }
  };

  const mousemoveHandler = (e: MouseEvent) => {
    const { startX, scrollableX, x, startY, scrollableY, y } = state;
    const left = startX + (scrollableX ? x - e.screenX : 0);
    const top = startY + (scrollableY ? y - e.screenY : 0);

    if (state.target instanceof Window || state.target instanceof Element) {
      state.target.scroll({ top, left });
    }
  };

  const mouseupHandler = () => {
    state.pressMouse = false;
    hideDragScreen();
    window.removeEventListener('mousemove', mousemoveHandler);
  };

  const resolveTarget = (
    eventTarget: EventTarget | null,
  ): {
    target: EventTarget;
    scrollableX: boolean;
    scrollableY: boolean;
  } => {
    if (eventTarget instanceof HTMLElement) {
      const checkedNodes: HTMLElement[] = [];
      let target: HTMLElement | null = eventTarget;

      while (target) {
        checkedNodes.push(target);

        if (10000 < checkedNodes.length) {
          console.error('chrome-extension-hand-tool', checkedNodes);
          break;
        }

        const { overflowX, overflowY } = getComputedStyle(target);

        if (target.firstChild) {
          const scrollableX = isScrollableHorizon({ target, overflowX });
          const scrollableY = isScrollableVertical({ target, overflowY });

          if (scrollableX || scrollableY) {
            return { target, scrollableX, scrollableY };
          }
        }

        target = target.parentElement;
      }
    }

    return {
      target: window,
      scrollableX: true,
      scrollableY: true,
    };
  };

  const mousedownHandler = (e: MouseEvent) => {
    if (!state.pressSpace) {
      return;
    }

    const { target, scrollableX, scrollableY } = resolveTarget(e.target);

    e.preventDefault();
    state.target = target;
    state.x = e.screenX;
    state.y = e.screenY;
    state.scrollableX = scrollableX;
    state.scrollableY = scrollableY;
    state.pressMouse = true;
    state.didDrag = true;

    if (target === window) {
      state.startX = window.scrollX;
      state.startY = window.scrollY;
    } else if (target instanceof HTMLElement) {
      state.startX = target.scrollLeft;
      state.startY = target.scrollTop;
    }

    showDragScreen();
    window.addEventListener('mousemove', mousemoveHandler, { passive: true });
  };

  const targetIsEditableElement = (target: EventTarget | null) => {
    const { activeElement } = document;

    if (activeElement === null || target !== activeElement) {
      return false;
    }

    const isEditableElement =
      activeElement instanceof HTMLElement &&
      !['inherit', 'false'].includes(activeElement.contentEditable);
    const isFormControls = ['input', 'textarea', 'button'].includes(
      activeElement.tagName.toLowerCase(),
    );

    return isEditableElement || isFormControls;
  };

  const resolvePressedKey = (key: string) => {
    const pressedKey = key.toLowerCase();
    return (
      pressedKey === state.customKeyPattern.toLowerCase() || (state.isUseOnlySpace && key === ' ')
    );
  };

  const isPressedMetaKeyOrCtrlKey = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;

  const keydownHandler = (e: KeyboardEvent) => {
    const isPressedTheKey = resolvePressedKey(e.key);

    if (!isPressedTheKey) {
      return;
    }

    if (state.isUseOnlySpace) {
      if (isPressedMetaKeyOrCtrlKey(e)) {
        // Cmd+Space は Spotlight、Ctrl+Space は IME/入力ソース切り替えと衝突する
        // ため、修飾キー付きの動作は提供しない。ドラッグせず Space を離したときに
        // keyup 側でページスクロールを実行する。
        return;
      }
    } else {
      const isValidCtrl = isPressedMetaKeyOrCtrlKey(e) ? state.ctrlKey : !state.ctrlKey;
      const isValidShift = e.shiftKey ? state.shiftKey : !state.shiftKey;

      if (!isValidCtrl || !isValidShift) {
        return;
      }
    }

    if (state.pressSpace) {
      e.preventDefault();
      return;
    }

    if (targetIsEditableElement(e.target)) {
      return;
    }

    e.preventDefault();
    state.pressSpace = true;
    state.didDrag = false;
    state.spacePressedAt = performance.now();
    document.head.append(styleElement);
    showDragScreen();
    window.addEventListener('mousedown', mousedownHandler);
  };

  const resetState = () => {
    state.pressSpace = false;
    state.pressMouse = false;
    state.didDrag = false;
    state.spacePressedAt = 0;
    hideDragScreen();
    styleElement.remove();
    window.removeEventListener('mousedown', mousedownHandler);
    window.removeEventListener('mousemove', mousemoveHandler);
  };

  const keyupHandler = (e: KeyboardEvent) => {
    const isPressedTheKey = resolvePressedKey(e.key);

    if (isPressedTheKey) {
      // Space をドラッグせず、かつタップ相当（TAP_RELEASE_THRESHOLD_MS 以内で
      // 離した）ときのみ、ブラウザの Space=PageDown 相当を復元する。長押しは
      // ドラッグ待ちとみなしスクロールしない。
      const heldMs = performance.now() - state.spacePressedAt;
      const shouldTapScroll =
        state.isUseOnlySpace &&
        state.pressSpace &&
        !state.pressMouse &&
        !state.didDrag &&
        heldMs <= TAP_RELEASE_THRESHOLD_MS;
      state.pressSpace = false;

      if (!state.pressMouse) {
        resetState();
        if (shouldTapScroll) {
          const deltaY = getPageScrollAmount(window.innerHeight) * (e.shiftKey ? -1 : 1);
          // これ以上その方向にスクロールできない場合は overscroll bounce を
          // 誘発しないよう発火しない。
          if (canScrollBy(deltaY)) {
            smoothScrollBy(deltaY);
          }
        }
        return;
      }
    }

    hideDragScreen();
    styleElement.remove();
    window.removeEventListener('mousedown', mousedownHandler);
  };

  dragScreen.addEventListener('mouseup', (e) => {
    e.stopPropagation();
    mouseupHandler();
  });

  window.addEventListener('mouseup', mouseupHandler);
  window.addEventListener('keydown', keydownHandler);
  window.addEventListener('keyup', keyupHandler);
  window.addEventListener('blur', resetState);
  window.addEventListener('contextmenu', resetState);
};

const migrateLegacyIsUseOnlySpace = () => {
  type LegacyStorageItem = { isUseOnlySpace?: boolean };
  chrome.storage.local.get(['isUseOnlySpace'], ({ isUseOnlySpace }: LegacyStorageItem) => {
    const saveData: SaveDataType = {
      ...defaultSaveData,
      isUseOnlySpace: typeof isUseOnlySpace === 'boolean' ? isUseOnlySpace : true,
      customKeyPattern: ' ',
    };
    void chrome.storage.local.remove('isUseOnlySpace');
    void chrome.storage.local.set({ saveData });
  });
};

const applyState = (raw: unknown) => {
  const parsed = parseSaveData(raw);
  state.isUseOnlySpace = parsed.isUseOnlySpace;
  state.customKeyPattern = parsed.customKeyPattern;
  state.ctrlKey = parsed.ctrlKey;
  state.shiftKey = parsed.shiftKey;
};

const markedWindow = window as typeof window & { [INJECTED_MARKER_KEY]?: boolean };

if (markedWindow[INJECTED_MARKER_KEY] !== true) {
  markedWindow[INJECTED_MARKER_KEY] = true;

  chrome.storage.local.get(['saveData'], ({ saveData }) => {
    if (typeof saveData !== 'object' || saveData === null) {
      migrateLegacyIsUseOnlySpace();
    }

    window.addEventListener('focus', () => {
      chrome.storage.local.get(['saveData'], (items) => {
        applyState(items['saveData']);
      });
    });

    chrome.runtime.onMessage.addListener((message: unknown) => {
      applyState(message);
    });

    applyState(saveData);
    run();
  });
}
