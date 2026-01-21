/**
 * MET Norway API動作確認用のテストページ
 * 
 * ブラウザで /test-met-norway にアクセスして動作確認できます
 */

import { useState } from 'react';
import Head from 'next/head';

export default function TestMetNorway() {
  const [latitude, setLatitude] = useState('35.6812');
  const [longitude, setLongitude] = useState('139.7671');
  const [hours, setHours] = useState('48');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [useDateTimeRange, setUseDateTimeRange] = useState(false);
  const [fromToday, setFromToday] = useState(true); // デフォルトで今日から取得
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 現在時刻から48時間後をデフォルト値として設定
  const getDefaultDateTimeRange = () => {
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const endDate = new Date(jstNow.getTime() + 48 * 60 * 60 * 1000);
    
    const formatJST = (date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hour = String(date.getUTCHours()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:00:00+09:00`;
    };

    return {
      start: formatJST(jstNow),
      end: formatJST(endDate)
    };
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude
      });

      if (useDateTimeRange) {
        const defaultRange = getDefaultDateTimeRange();
        params.append('startDateTime', startDateTime || defaultRange.start);
        params.append('endDateTime', endDateTime || defaultRange.end);
      } else {
        params.append('hours', hours);
        if (fromToday) {
          params.append('fromToday', 'true');
        }
      }

      const response = await fetch(`/api/weather/met-norway?${params.toString()}`);

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

  const defaultRange = getDefaultDateTimeRange();

  return (
    <>
      <Head>
        <title>MET Norway API テスト</title>
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
            MET Norway API 動作確認
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

          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '12px'
            }}>
              <input
                type="checkbox"
                checked={useDateTimeRange}
                onChange={(e) => setUseDateTimeRange(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              時刻範囲を指定する
            </label>

            {useDateTimeRange ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#6B7280',
                    marginBottom: '4px'
                  }}>
                    開始時刻（JST）
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime || defaultRange.start.replace('+09:00', '').slice(0, 16)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStartDateTime(value ? `${value}:00+09:00` : '');
                    }}
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
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#6B7280',
                    marginBottom: '4px'
                  }}>
                    終了時刻（JST）
                  </label>
                  <input
                    type="datetime-local"
                    value={endDateTime || defaultRange.end.replace('+09:00', '').slice(0, 16)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEndDateTime(value ? `${value}:00+09:00` : '');
                    }}
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
            ) : (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={fromToday}
                    onChange={(e) => setFromToday(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}>
                    今日の0時から取得（NASA POWERで取得できなかった今日の分も含む）
                  </label>
                </div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#6B7280',
                  marginBottom: '4px'
                }}>
                  取得時間数
                </label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="1"
                  max="240"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '14px',
                    border: '2px solid #D1D5DB',
                    borderRadius: '6px'
                  }}
                />
                <p style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#6B7280'
                }}>
                  {fromToday ? '今日の0時から' : '現在時刻から'}1〜240時間の範囲で指定してください
                </p>
              </div>
            )}
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
            {loading ? '取得中...' : '予報データ取得'}
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
                  <strong>取得件数:</strong> {result.count}件
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>成功:</strong> {result.success ? '✅' : '❌'}
                </p>
                {result.data && result.data.length > 0 && (
                  <>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>最初のデータ:</strong> {result.data[0].datetime}
                    </p>
                    <p style={{ margin: '8px 0', fontSize: '14px' }}>
                      <strong>最後のデータ:</strong> {result.data[result.data.length - 1].datetime}
                    </p>
                  </>
                )}
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
                  データ（最初の20件）
                </h3>
                <pre style={{
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(result.data.slice(0, 20), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
