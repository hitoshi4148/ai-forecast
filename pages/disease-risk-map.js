import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import UserFacilitySettings from '../components/UserFacilitySettings';
import DiseaseRiskExplanation from '../components/DiseaseRiskExplanation';

// DiseaseRiskMapViewを動的インポート（SSRを無効化）
const DiseaseRiskMapView = dynamic(
  () => import('../components/DiseaseRiskMapView'),
  { ssr: false }
);

/**
 * 病害リスク予報地図ページ
 * 
 * 日本地図上に施設別の病害リスクを可視化するメインページ
 */
export default function DiseaseRiskMapPage() {
  const [userFacility, setUserFacility] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Cookieからユーザー指定施設を取得
    const cookies = document.cookie.split(';');
    const facilityCookie = cookies.find(c => c.trim().startsWith('userFacility='));
    
    if (facilityCookie) {
      try {
        const jsonStr = decodeURIComponent(facilityCookie.split('=')[1]);
        const facility = JSON.parse(jsonStr);
        setUserFacility(facility);
      } catch (e) {
        console.error('Cookie解析エラー:', e);
      }
    }
  }, []);

  const handleFacilitySet = (facility) => {
    // 現在の状態と同じ場合は何もしない（無限ループ防止）
    const currentFacilityStr = userFacility ? JSON.stringify(userFacility) : null;
    const newFacilityStr = facility ? JSON.stringify(facility) : null;
    if (currentFacilityStr === newFacilityStr) {
      return;
    }
    
    setUserFacility(facility);
    // 施設が設定されたら設定パネルを閉じる
    if (facility) {
      setShowSettings(false);
      // 少し待ってからリロード（保存処理が完了するのを待つ）
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else if (userFacility) {
      // クリアされた場合（かつ現在施設が存在する場合）も設定パネルを閉じてリロード
      setShowSettings(false);
      // 少し待ってからリロード
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // クリアされたが、元々施設がなかった場合はリロードしない
      setShowSettings(false);
    }
  };

  return (
    <>
      <Head>
        <title>芝しごと・病害予報ナビ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* ヘッダー */}
          <header style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#1E40AF',
              fontSize: '26px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              芝しごと・病害予報ナビ
            </h1>
            <div style={{
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                margin: '0 0 6px 0',
                lineHeight: '1.5'
              }}>
                明日の作業判断に使える、気象条件ベースの病害リスク指標です
              </p>
              <p style={{
                color: '#9CA3AF',
                fontSize: '12px',
                margin: '0',
                lineHeight: '1.4'
              }}>
                各地点の円アイコンをクリックすると、病害ごとの詳細リスクが表示されます
              </p>
            </div>
            
            {/* ユーザー施設設定ボタン */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                backgroundColor: '#1E40AF',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {userFacility ? '施設設定を変更' : 'ユーザー指定施設を設定'}
            </button>
          </header>

          {/* ユーザー施設設定パネル */}
          <div style={{ 
            marginBottom: '20px',
            display: showSettings ? 'block' : 'none'
          }}>
            <UserFacilitySettings onFacilitySet={handleFacilitySet} />
          </div>

          {/* 地図表示 */}
          <DiseaseRiskMapView />

          {/* 病害リスク判定ロジック説明 */}
          <DiseaseRiskExplanation />

          {/* フッター情報 */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6B7280',
            textAlign: 'center'
          }}>
            <p style={{ margin: '4px 0' }}>
              表示施設: 蔵〇CC、香〇CC、東〇CC、阿〇大津GC
              {userFacility && `、${userFacility.name}`}
            </p>
            <p style={{ margin: '4px 0' }}>
              データ取得: NASA POWER API（過去データ）、MET Norway API（予報データ）
            </p>
            <p style={{ margin: '8px 0 0 0', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
              <a 
                href="https://www.turf-tools.jp" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#1E40AF',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                グロウアンドプログレス
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
