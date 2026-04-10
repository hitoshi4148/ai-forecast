import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { ensureGaDebugMode, gaPageView } from '../lib/gtag';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    ensureGaDebugMode();
    gaPageView(router.asPath);
  }, [router.isReady, router.asPath]);

  return <Component {...pageProps} />;
}
