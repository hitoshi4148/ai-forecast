/**
 * NASA POWER API動作確認用のテストページ
 * 
 * ブラウザで /test-nasa-power にアクセスして動作確認できます
 */

import { useState } from 'react';
import Head from 'next/head';

export default function TestNasaPower() {
  const [latitude, setLatitude] = useState('35.6812');
  const [longitude, setLongitude] = useState('139.7671');
  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dataType, setDataType] = useState('daily');

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // 昨日まで
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        startDate: startDateStr,
        endDate: endDateStr,
        type: dataType
      });

      const response = await fetch(`/api/weather/nasa-power?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>NASA POWER API テスト</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            color: '#1E40AF',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}>
            NASA POWER API 動作確認
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '8px'
              }}>
                緯度
              </label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '8px'
              }}>
                経度
              </label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '8px'
              }}>
                取得日数
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                min="1"
                max="30"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '8px'
              }}>
                データタイプ
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              >
                <option value="daily">日単位</option>
                <option value="hourly">時間単位</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              backgroundColor: loading ? '#9CA3AF' : '#1E40AF',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '24px'
            }}
          >
            {loading ? '取得中...' : 'データ取得'}
          </button>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#DC2626',
                fontSize: '14px',
                margin: 0,
                fontWeight: 'bold'
              }}>
                ⚠️ エラー: {error}
              </p>
            </div>
          )}

          {result && (
            <div>
              <h2 style={{
                color: '#1E40AF',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}>
                取得結果
              </h2>

              <div style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>データタイプ:</strong> {result.type}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>取得件数:</strong> {result.count}件
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>成功:</strong> {result.success ? '✅' : '❌'}
                </p>
              </div>

              <div style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                maxHeight: '500px',
                overflow: 'auto'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}>
                  データ（最初の10件）
                </h3>
                <pre style={{
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(result.data.slice(0, 10), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
