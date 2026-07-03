import { type SaveDataType, defaultSaveData } from './constants';
import { isValidOptionType, parseSaveData } from './utils/save-data';

const STATE = { saveData: { ...defaultSaveData } };

const getMessage = (key: string) => chrome.i18n.getMessage(key) || key;

const checkboxes = document.querySelectorAll<HTMLInputElement>('[type="checkbox"]');
const editCustomKeyField = document.getElementById('field');
if (!editCustomKeyField) {
  throw new Error('#field element not found in popup');
}

const save = (patch: Partial<SaveDataType>) => {
  const value: SaveDataType = { ...STATE.saveData, ...patch };
  STATE.saveData = value;

  for (const checkbox of checkboxes) {
    if (isValidOptionType(checkbox.dataset['optionType'])) {
      const currentValue = value[checkbox.dataset['optionType']];
      if (typeof currentValue === 'string') {
        checkbox.value = currentValue;
      } else {
        checkbox.checked = currentValue;
      }
    }
  }

  void chrome.storage.local.set({ saveData: value });
  return value;
};

const setLanguage = () => {
  const targets = document.querySelectorAll<HTMLElement>('[data-i18n]');

  for (const elm of targets) {
    const key = elm.dataset['i18n'];
    if (key === undefined || key === '') {
      continue;
    }

    const textContent = getMessage(key);

    if (elm.tagName.toLocaleLowerCase() === 'h1') {
      elm.textContent = textContent.split('※').slice(0, 1).join(''); // JPタイトルに注釈テキストを表示しない
    } else {
      elm.textContent = textContent;
    }
  }
};

const loadSaveData = async () => {
  const items = await chrome.storage.local.get('saveData');
  const saveData = parseSaveData(items['saveData']);
  STATE.saveData = saveData;

  for (const [key, value] of Object.entries(saveData)) {
    const checkbox = document.querySelector<HTMLInputElement>(`[data-option-type="${key}"]`);
    if (typeof value === 'boolean' && checkbox) {
      checkbox.checked = value;
    }
  }
};

const writeCustomKey = (data: SaveDataType) => {
  const key = data.customKeyPattern === ' ' ? '[Space]' : data.customKeyPattern;
  const keys = [key, data.ctrlKey ? '[Ctrl / Command]' : '', data.shiftKey ? '[Shift]' : ''].filter(
    Boolean,
  );

  editCustomKeyField.textContent = keys.join(' + ');
};

const addEvent = () => {
  for (const checkbox of checkboxes) {
    checkbox.addEventListener('change', () => {
      const optionType = checkbox.dataset['optionType'];
      if (isValidOptionType(optionType)) {
        const result = save({ [optionType]: checkbox.checked });
        writeCustomKey(result);
      }
    });
  }

  let isEditing = false;
  const editCustomKeyOnClick = () => {
    isEditing = true;
    editCustomKeyField.textContent = getMessage('editing');
  };

  editCustomKeyField.addEventListener('blur', () => {
    isEditing = false;
    writeCustomKey(STATE.saveData);
  });
  editCustomKeyField.addEventListener('keydown', (e) => {
    if (isEditing && e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      isEditing = false;
      writeCustomKey(STATE.saveData);
    }
  });
  editCustomKeyField.addEventListener('keypress', (e) => {
    if (isEditing) {
      e.stopPropagation();
      e.preventDefault();
      isEditing = false;

      const next = save({ customKeyPattern: e.key });
      writeCustomKey(next);
      return;
    }

    if ((e.key === 'Enter' || e.key === ' ') && e.currentTarget instanceof HTMLElement) {
      e.preventDefault();
      e.currentTarget.click();
    }
  });
  editCustomKeyField.addEventListener('click', editCustomKeyOnClick);
};

setLanguage();
void loadSaveData().then(() => {
  writeCustomKey(STATE.saveData);
  addEvent();
});

setTimeout(() => {
  document.body.dataset['state'] = 'loaded';
}, 300);
