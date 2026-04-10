import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '../lib/gtag';

export default function Document() {
  return (
    <Html>
      <Head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="beforeInteractive"
          onLoad={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ga-forecast:gtag-js-loaded'));
            }
          }}
        />
        <Script
          id="ga-inline-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
