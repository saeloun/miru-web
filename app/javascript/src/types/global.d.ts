// Global type declarations for Hotwire and Rails patterns

declare global {
  interface Window {
    Turbo?: {
      visit: (
        url: string,
        options?: { action?: "advance" | "replace" }
      ) => void;
      navigator?: any;
    };
  }

  // Global navigator interface (available in browsers)
  const navigator: Navigator;

  // Node.js types
  namespace NodeJS {
    interface Timeout {}
  }
}

export {};
