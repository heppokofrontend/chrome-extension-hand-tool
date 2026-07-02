import { describe, it, expect } from 'vitest';
import { defaultSaveData } from '../constants';
import { isValidOptionType, parseSaveData } from './save-data';

describe('isValidOptionType', () => {
  it('accepts known keys', () => {
    expect(isValidOptionType('isUseOnlySpace')).toBe(true);
    expect(isValidOptionType('customKeyPattern')).toBe(true);
    expect(isValidOptionType('shiftKey')).toBe(true);
    expect(isValidOptionType('ctrlKey')).toBe(true);
  });

  it('rejects unknown or non-string values', () => {
    expect(isValidOptionType('foo')).toBe(false);
    expect(isValidOptionType('')).toBe(false);
    expect(isValidOptionType(undefined)).toBe(false);
    expect(isValidOptionType(null)).toBe(false);
    expect(isValidOptionType(42)).toBe(false);
  });
});

describe('parseSaveData', () => {
  it('falls back to defaults for non-object input', () => {
    expect(parseSaveData(undefined)).toEqual(defaultSaveData);
    expect(parseSaveData(null)).toEqual(defaultSaveData);
    expect(parseSaveData('nope')).toEqual(defaultSaveData);
  });

  it('preserves valid fields and falls back for invalid ones', () => {
    expect(
      parseSaveData({
        isUseOnlySpace: false,
        customKeyPattern: 'x',
        shiftKey: true,
        ctrlKey: false,
      }),
    ).toEqual({
      isUseOnlySpace: false,
      customKeyPattern: 'x',
      shiftKey: true,
      ctrlKey: false,
    });
  });

  it('drops fields with wrong types', () => {
    expect(
      parseSaveData({
        isUseOnlySpace: 'yes',
        customKeyPattern: 123,
        shiftKey: null,
      }),
    ).toEqual(defaultSaveData);
  });

  it('fills missing fields with defaults', () => {
    expect(parseSaveData({ isUseOnlySpace: false })).toEqual({
      ...defaultSaveData,
      isUseOnlySpace: false,
    });
  });
});
