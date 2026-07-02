export type SaveDataType = {
  isUseOnlySpace: boolean;
  customKeyPattern: string;
  shiftKey: boolean;
  ctrlKey: boolean;
};

export const defaultSaveData: SaveDataType = {
  isUseOnlySpace: true,
  customKeyPattern: '',
  shiftKey: true,
  ctrlKey: true,
};

export const SAVE_DATA_KEYS = Object.keys(defaultSaveData) as (keyof SaveDataType)[];

// Space をこの時間以内で離した場合のみ tap-release スクロールを発火する。
// 300ms を超える長押しは「ドラッグ準備で待った」扱いとみなしスクロールしない。
export const TAP_RELEASE_THRESHOLD_MS = 300;
