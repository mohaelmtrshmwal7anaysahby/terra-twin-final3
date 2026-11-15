// Minimal browser API stubs so pages can render under jsdom.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.assign(globalThis, {
  ResizeObserver: NoopObserver,
  IntersectionObserver: NoopObserver,
});
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList);
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  // Network is never used in unit tests: live feeds must degrade gracefully.
  globalThis.fetch = (() => Promise.reject(new Error('network disabled in tests'))) as typeof fetch;
}
