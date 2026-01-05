/**
 * Test environment polyfills
 * These must be loaded before any other test setup files
 */

// Polyfill localStorage for MSW in Node.js environment
(() => {
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
  (global as any).localStorage = localStoragePolyfill;
  (globalThis as any).localStorage = localStoragePolyfill;
})();
