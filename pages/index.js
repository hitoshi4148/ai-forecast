import { useState } from 'react';
import Head from 'next/head';
import UserFacilitySettings from '../components/UserFacilitySettings';

export default function Home() {
  const [userFacility, setUserFacility] = useState(null);

  const handleFacilitySet = (facility) => {
    setUserFacility(facility);
  };

  return (
    <>
      <Head>
        <title>芝生病害リスク予報 - ユーザー指定施設設定</title>
        <meta name="description" content="ゴルフ場グリーンキーパー向けの病害リスク予報アプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* ヘッダー */}
          <header style={{
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#1E40AF',
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              芝生病害リスク予報
            </h1>
            <p style={{
              color: '#6B7280',
              fontSize: '14px'
            }}>
              ユーザー指定施設の設定
            </p>
          </header>

          {/* ユーザー指定施設設定コンポーネント */}
          <UserFacilitySettings onFacilitySet={handleFacilitySet} />

          {/* 仮の地図表示エリア */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #1E40AF',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h2 style={{
              color: '#1E40AF',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              🗺️ 地図表示エリア（仮）
            </h2>

            {userFacility ? (
              <div style={{
                textAlign: 'center',
                color: '#374151'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: '#1E40AF'
                }}>
                  {userFacility.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '8px'
                }}>
                  緯度: {userFacility.latitude}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px'
                }}>
                  経度: {userFacility.longitude}
                </div>
                <div style={{
                  width: '200px',
                  height: '200px',
                  backgroundColor: '#E0F2FE',
                  border: '2px dashed #1E40AF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  margin: '0 auto'
                }}>
                  📍
                </div>
                <p style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: '#9CA3AF'
                }}>
                  ここに地図が表示されます
                </p>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#9CA3AF'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  🗺️
                </div>
                <p style={{
                  fontSize: '14px'
                }}>
                  施設を設定すると、ここに地図が表示されます
                </p>
              </div>
            )}
          </div>

          {/* 設定情報表示 */}
          {userFacility && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #10B981',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                color: '#10B981',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <span>設定完了</span>
              </h2>
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  <strong>施設名:</strong> {userFacility.name}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  <strong>緯度:</strong> {userFacility.latitude}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <strong>経度:</strong> {userFacility.longitude}
                </div>
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #86EFAC',
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  💾 この情報はCookieに保存され、次回アクセス時に自動復元されます。
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
