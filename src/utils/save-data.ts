import { type SaveDataType, SAVE_DATA_KEYS, defaultSaveData } from '../constants';

export const isValidOptionType = (value: unknown): value is keyof SaveDataType => {
  if (typeof value !== 'string') {
    return false;
  }
  return (SAVE_DATA_KEYS as string[]).includes(value);
};

export const parseSaveData = (raw: unknown): SaveDataType => {
  if (typeof raw !== 'object' || raw === null) {
    return { ...defaultSaveData };
  }
  const partial = raw as Partial<SaveDataType>;
  return {
    isUseOnlySpace:
      typeof partial.isUseOnlySpace === 'boolean'
        ? partial.isUseOnlySpace
        : defaultSaveData.isUseOnlySpace,
    customKeyPattern:
      typeof partial.customKeyPattern === 'string'
        ? partial.customKeyPattern
        : defaultSaveData.customKeyPattern,
    shiftKey: typeof partial.shiftKey === 'boolean' ? partial.shiftKey : defaultSaveData.shiftKey,
    ctrlKey: typeof partial.ctrlKey === 'boolean' ? partial.ctrlKey : defaultSaveData.ctrlKey,
  };
};
