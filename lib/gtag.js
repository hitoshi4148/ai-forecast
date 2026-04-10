/** GA4 測定 ID（データストリームと一致させる） */
export const GA_MEASUREMENT_ID = 'G-M4R0B2LW72';

/**
 * クライアント側の URL 変更時に page_view を送る（Next.js Router 用）。
 * @param {string} url router.asPath 相当（pathname + query）
 */
export function gaPageView(url) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}
