import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { ensureGaDebugMode, gaPageView } from '../lib/gtag';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    const started = Date.now();

    const trySend = () => {
      if (cancelled) return;
      if (typeof window.gtag === 'function') {
        ensureGaDebugMode();
        gaPageView(router.asPath);
        return;
      }
      if (Date.now() - started < 10000) {
        requestAnimationFrame(trySend);
      }
    };

    trySend();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.asPath]);

  return <Component {...pageProps} />;
}
