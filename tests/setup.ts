import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

const createMemoryStorage = (): Storage => {
  let items: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(items).length;
    },
    clear() {
      items = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(items, key) ? items[key] : null;
    },
    key(index: number) {
      return Object.keys(items)[index] ?? null;
    },
    removeItem(key: string) {
      delete items[key];
    },
    setItem(key: string, value: string) {
      items[key] = String(value);
    },
  };
};

const localStorageMock = createMemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
});

// Mock fetch for API tests
if (!globalThis.fetch) {
  globalThis.fetch = (() => Promise.reject(new Error('fetch not mocked'))) as typeof fetch;
}
