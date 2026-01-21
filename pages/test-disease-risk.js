/**
 * 病害リスク計算の動作確認用テストページ
 * 
 * ブラウザで /test-disease-risk にアクセスして動作確認できます
 */

import { useState } from 'react';
import Head from 'next/head';
import { calculateAllDiseaseRisks } from '../lib/disease-risk-calculator';

export default function TestDiseaseRisk() {
  const [latitude, setLatitude] = useState('35.6812');
  const [longitude, setLongitude] = useState('139.7671');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 過去7日間の日次データを取得
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // 昨日まで
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7日前から

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 日次データ取得
      const dailyResponse = await fetch(
        `/api/weather/nasa-power?latitude=${latitude}&longitude=${longitude}&startDate=${startDateStr}&endDate=${endDateStr}&type=daily`
      );
      
      if (!dailyResponse.ok) {
        throw new Error('日次データの取得に失敗しました');
      }
      
      const dailyData = await dailyResponse.json();

      // 時間単位データ取得（過去7日間）
      const hourlyResponse = await fetch(
        `/api/weather/nasa-power?latitude=${latitude}&longitude=${longitude}&startDate=${startDateStr}&endDate=${endDateStr}&type=hourly`
      );
      
      if (!hourlyResponse.ok) {
        throw new Error('時間単位データの取得に失敗しました');
      }
      
      const hourlyData = await hourlyResponse.json();

      // 未来データ取得（MET Norway）
      const forecastResponse = await fetch(
        `/api/weather/met-norway?latitude=${latitude}&longitude=${longitude}&hours=48&fromToday=true`
      );
      
      if (!forecastResponse.ok) {
        throw new Error('予報データの取得に失敗しました');
      }
      
      const forecastData = await forecastResponse.json();

      // データを結合
      const combinedHourly = [
        ...(hourlyData.data || []),
        ...(forecastData.data || [])
      ].sort((a, b) => {
        return new Date(a.datetime) - new Date(b.datetime);
      });

      // 病害リスク計算
      const risks = calculateAllDiseaseRisks({
        daily: dailyData.data || [],
        hourly: combinedHourly
      });

      setResult({
        risks,
        dailyCount: (dailyData.data || []).length,
        hourlyCount: combinedHourly.length,
        dailySample: (dailyData.data || []).slice(0, 3),
        hourlySample: combinedHourly.slice(0, 5)
      });
    } catch (err) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>病害リスク計算 テスト</title>
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
            病害リスク計算 動作確認
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
            {loading ? '計算中...' : 'リスク計算実行'}
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
                計算結果
              </h2>

              <div style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>日次データ件数:</strong> {result.dailyCount}件
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>時間単位データ件数:</strong> {result.hourlyCount}件
                </p>
              </div>

              {/* リスク値表示 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {[
                  { key: 'dollarSpot', label: 'Dollar Spot', color: '#3B82F6' },
                  { key: 'brownPatch', label: 'Brown Patch', color: '#10B981' },
                  { key: 'pythium', label: 'Pythium', color: '#FBBF24' },
                  { key: 'anthracnose', label: 'Anthracnose', color: '#F97316' },
                  { key: 'largePatch', label: 'Large Patch', color: '#EF4444' }
                ].map(({ key, label, color }) => {
                  const risk = result.risks[key];
                  const riskValue = risk !== null && risk !== undefined ? Math.round(risk) : null;
                  const riskColor = riskValue === null ? '#808080' : 
                    riskValue < 20 ? '#3B82F6' :
                    riskValue < 40 ? '#10B981' :
                    riskValue < 60 ? '#FBBF24' :
                    riskValue < 80 ? '#F97316' : '#EF4444';

                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: `2px solid ${riskColor}`,
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: riskColor
                      }}>
                        {riskValue !== null ? `${riskValue}%` : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* サンプルデータ表示 */}
              <details style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <summary style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}>
                  サンプルデータ（最初の数件）
                </summary>
                <div style={{ marginTop: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>日次データ:</h3>
                  <pre style={{
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.dailySample, null, 2)}
                  </pre>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '12px', marginBottom: '8px' }}>時間単位データ:</h3>
                  <pre style={{
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    backgroundColor: '#FFFFFF',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.hourlySample, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
