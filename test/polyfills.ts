/**
 * Test environment polyfills
 * These must be loaded before any other test setup files
 */

// Polyfill localStorage for MSW in Node.js environment.
// jsdom 30+ already provides a working localStorage (as a getter-only
// property on window), so only install the polyfill when it's missing.
(() => {
  const hasLocalStorage = (() => {
    try {
      return typeof globalThis.localStorage?.getItem === 'function';
    } catch {
      return false;
    }
  })();
  if (hasLocalStorage) return;

  let store: Record<string, string> = {};
  const localStoragePolyfill = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };

  // Set up localStorage before MSW loads
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStoragePolyfill,
    configurable: true,
    writable: true,
  });
})();
