import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { gaPageView } from '../lib/gtag';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const onRouteComplete = (url) => {
      gaPageView(url);
    };
    router.events.on('routeChangeComplete', onRouteComplete);
    return () => {
      router.events.off('routeChangeComplete', onRouteComplete);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}
