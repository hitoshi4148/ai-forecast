import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * ルートパス（/）からメインページ（/disease-risk-map）にリダイレクト
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // クエリを落とさない（例: ?debug_mode=true を /disease-risk-map に引き継ぐ）
    const q = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/disease-risk-map${q}`);
  }, [router]);

  return (
    <>
      <Head>
        <title>芝しごと・病害リスク予報</title>
        <meta name="description" content="ゴルフ場グリーンキーパー向けの病害リスク予報アプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6'
      }}>
        <p style={{
          color: '#6B7280',
          fontSize: '16px'
        }}>
          リダイレクト中...
        </p>
      </div>
    </>
  );
}
