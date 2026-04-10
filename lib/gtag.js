/** GA4 測定 ID（データストリームと一致させる） */
export const GA_MEASUREMENT_ID = 'G-M4R0B2LW72';

/**
 * GA4 に page_view を明示送信（SPA / Next.js Router 向け）。
 * gtag('config', { page_path }) だけでは計測されない環境があるため event を使う。
 * @param {string} asPath Next.js の router.asPath（先頭 /、クエリ可）
 */
export function gaPageView(asPath) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const path = asPath.startsWith('/') ? asPath : `/${asPath}`;
  let pagePath;
  let pageLocation;
  try {
    const u = new URL(path, window.location.origin);
    pagePath = `${u.pathname}${u.search}`;
    pageLocation = u.href;
  } catch {
    pagePath = path;
    pageLocation = `${window.location.origin}${path}`;
  }
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: typeof document !== 'undefined' ? document.title || '' : '',
    send_to: GA_MEASUREMENT_ID,
  });
}
