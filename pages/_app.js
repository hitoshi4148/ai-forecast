import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { GA_MEASUREMENT_ID, gaPageView } from '../lib/gtag';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    const v = new URLSearchParams(window.location.search).get('debug_mode');
    if (v === 'true' || v === '1') {
      window.gtag('config', GA_MEASUREMENT_ID, { debug_mode: true });
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    gaPageView(router.asPath);
  }, [router.isReady, router.asPath]);

  return <Component {...pageProps} />;
}
