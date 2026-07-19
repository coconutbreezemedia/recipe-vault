'use client';

import { useEffect } from 'react';

// Registers the service worker (offline support). basePath-aware so it works
// whether the app is hosted at a domain root or a GitHub Pages subpath.
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const swUrl = `${base}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      /* offline support is best-effort; ignore registration failures */
    });
  }, []);
  return null;
}
