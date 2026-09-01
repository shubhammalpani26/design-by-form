import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "nyzora:chunk-reloaded";

/**
 * Lazy import that survives stale deploys. When a chunk 404s (the browser has an
 * old index.html pointing at hashed files that no longer exist), we retry once,
 * then force a single hard reload to pick up the new build instead of showing a
 * blank screen with "Importing a module script failed".
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      // one silent retry — covers transient network blips
      try {
        const mod = await factory();
        sessionStorage.removeItem(RELOAD_KEY);
        return mod;
      } catch (err2) {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // keep the promise pending while the page reloads
          return new Promise<never>(() => {});
        }
        throw err2;
      }
    }
  });
}
