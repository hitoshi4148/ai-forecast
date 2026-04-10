/** GA4 測定 ID（データストリームと一致させる） */
export const GA_MEASUREMENT_ID = 'G-M4R0B2LW72';

const GA_DEBUG_STORAGE_KEY = 'ga4_debug_mode';

/**
 * URL の debug_mode または sessionStorage により GA4 DebugView 用の計測を有効にする。
 * （トップからのリダイレクトでクエリが落ちないよう pages/index 側でも search を引き継ぐこと）
 */
export function ensureGaDebugMode() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  let debug = false;
  try {
    if (window.sessionStorage.getItem(GA_DEBUG_STORAGE_KEY) === '1') {
      debug = true;
    } else {
      const v = new URLSearchParams(window.location.search).get('debug_mode');
      if (v === 'true' || v === '1') {
        window.sessionStorage.setItem(GA_DEBUG_STORAGE_KEY, '1');
        debug = true;
      }
    }
  } catch {
    // sessionStorage 不可（プライベートモード等）は URL のみ
    const v = new URLSearchParams(window.location.search).get('debug_mode');
    if (v === 'true' || v === '1') debug = true;
  }
  if (debug) {
    window.gtag('config', GA_MEASUREMENT_ID, { debug_mode: true });
  }
}

/**
 * SPA のルート変更時に page_view 相当を送る（gtag config の page_path 更新）。
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
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: typeof document !== 'undefined' ? document.title || '' : '',
  });
}
