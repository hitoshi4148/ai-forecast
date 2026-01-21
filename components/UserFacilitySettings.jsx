import React, { useState, useEffect, useRef } from 'react';

/**
 * ユーザー指定施設設定コンポーネント
 * 
 * 機能：
 * - 施設名の入力
 * - 位置情報APIから緯度・経度を自動取得
 * - 位置情報API拒否時の手動入力フォールバック
 * - Cookieへの保存・復元
 */
export default function UserFacilitySettings({ onFacilitySet }) {
  const [facilityName, setFacilityName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [showManualInput, setShowManualInput] = useState(false);
  const hasInitializedRef = useRef(false);

  // Cookieから施設情報を復元（初回マウント時のみ、フォームが空の場合のみ）
  useEffect(() => {
    // クライアント側でのみ実行
    if (typeof window === 'undefined') return;
    
    // 既に初期化済みの場合はスキップ
    if (hasInitializedRef.current) return;
    
    const savedFacility = getFacilityFromCookie();
    if (savedFacility) {
      // フォームが空の場合のみ復元（手動入力中に上書きされないように）
      if (!facilityName && !latitude && !longitude) {
        setFacilityName(savedFacility.name);
        setLatitude(savedFacility.latitude.toString());
        setLongitude(savedFacility.longitude.toString());
      }
      // 注意: onFacilitySetは呼ばない（親コンポーネントのuseEffectで既に処理されているため）
      // 呼ぶと無限ループになる可能性がある
    }
    
    hasInitializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Cookieから施設情報を取得
   */
  function getFacilityFromCookie() {
    const cookies = document.cookie.split(';');
    const facilityCookie = cookies.find(c => c.trim().startsWith('userFacility='));
    
    if (facilityCookie) {
      try {
        const jsonStr = decodeURIComponent(facilityCookie.split('=')[1]);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('Cookie解析エラー:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * 施設情報をCookieに保存
   */
  function saveFacilityToCookie(facility) {
    const jsonStr = JSON.stringify(facility);
    const expires = new Date();
    expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000); // 1年間有効
    document.cookie = `userFacility=${encodeURIComponent(jsonStr)}; expires=${expires.toUTCString()}; path=/`;
  }

  /**
   * 位置情報APIから緯度・経度を取得
   */
  function getCurrentLocation() {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報APIをサポートしていません。手動で入力してください。');
      setShowManualInput(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocationPermission('granted');
        setShowManualInput(false);
        setIsLoading(false);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
        setLocationPermission('denied');
        setShowManualInput(true);
        setIsLoading(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('位置情報の取得が拒否されました。手動で緯度・経度を入力してください。');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('位置情報が取得できませんでした。手動で緯度・経度を入力してください。');
            break;
          case error.TIMEOUT:
            setError('位置情報の取得がタイムアウトしました。手動で緯度・経度を入力してください。');
            break;
          default:
            setError('位置情報の取得に失敗しました。手動で緯度・経度を入力してください。');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * 手動入力フォームを表示
   */
  function showManualInputForm() {
    setShowManualInput(true);
    setError(null);
  }

  /**
   * 施設情報を保存して通知
   */
  function saveAndNotify(facility) {
    saveFacilityToCookie(facility);
    if (onFacilitySet) {
      onFacilitySet(facility);
    }
  }

  /**
   * 保存ボタンの処理
   */
  function handleSave() {
    // バリデーション
    if (!facilityName.trim()) {
      setError('施設名を入力してください。');
      return;
    }

    if (!latitude || !longitude) {
      setError('緯度・経度を入力するか、位置情報を取得してください。');
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('緯度・経度は数値で入力してください。');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('緯度は-90から90の範囲で入力してください。');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('経度は-180から180の範囲で入力してください。');
      return;
    }

    const facility = {
      name: facilityName.trim(),
      latitude: lat,
      longitude: lng
    };

    saveAndNotify(facility);
    setError(null);
    alert('施設情報を保存しました。');
  }

  /**
   * クリアボタンの処理
   */
  function handleClear() {
    setFacilityName('');
    setLatitude('');
    setLongitude('');
    setError(null);
    setShowManualInput(false);
    setLocationPermission('prompt');
    
    // Cookieも削除
    document.cookie = 'userFacility=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    if (onFacilitySet) {
      onFacilitySet(null);
    }
  }

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '2px solid #1E40AF',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        color: '#1E40AF',
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📍</span>
        <span>ユーザー指定施設の設定</span>
      </h2>

      {/* 施設名入力 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#374151',
          marginBottom: '8px'
        }}>
          施設名 <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type="text"
          value={facilityName}
          onChange={(e) => setFacilityName(e.target.value)}
          placeholder="例: 〇〇ゴルフクラブ"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '2px solid #D1D5DB',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1E40AF'}
          onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
        />
      </div>

      {/* 位置情報取得ボタン */}
      {!showManualInput && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              backgroundColor: isLoading ? '#9CA3AF' : '#1E40AF',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#1E3A8A';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#1E40AF';
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner">⏳</span>
                <span>位置情報を取得中...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>現在地から位置情報を取得</span>
              </>
            )}
          </button>
          
          {locationPermission === 'denied' && (
            <p style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#6B7280',
              textAlign: 'center'
            }}>
              位置情報が取得できませんでした。
            </p>
          )}
        </div>
      )}

      {/* 手動入力フォーム */}
      {showManualInput && (
        <div style={{
          backgroundColor: '#F9FAFB',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              手動入力
            </label>
            {!showManualInput && (
              <button
                onClick={showManualInputForm}
                style={{
                  fontSize: '12px',
                  color: '#1E40AF',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                手動で入力する
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                緯度（Latitude） <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="例: 35.6812"
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1E40AF'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
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
                経度（Longitude） <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="例: 139.7671"
                step="any"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1E40AF'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>
          </div>

          <p style={{
            marginTop: '8px',
            fontSize: '11px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            💡 緯度・経度はGoogleマップなどで確認できます。
            <br />
            地図上で右クリック → 「座標をコピー」で取得できます。
          </p>
        </div>
      )}

      {/* 手動入力切り替えボタン（位置情報取得が成功した場合） */}
      {!showManualInput && (latitude || longitude) && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <button
            onClick={showManualInputForm}
            style={{
              fontSize: '12px',
              color: '#1E40AF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            手動で緯度・経度を入力する
          </button>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <p style={{
            color: '#DC2626',
            fontSize: '14px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* 現在の設定値表示 */}
      {(latitude || longitude) && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #93C5FD',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#1E40AF',
            margin: 0,
            fontWeight: 'bold',
            marginBottom: '4px'
          }}>
            現在の設定:
          </p>
          {facilityName && (
            <p style={{ fontSize: '12px', color: '#1E40AF', margin: '4px 0' }}>
              施設名: {facilityName}
            </p>
          )}
          {latitude && longitude && (
            <p style={{ fontSize: '12px', color: '#1E40AF', margin: '4px 0' }}>
              座標: {latitude}, {longitude}
            </p>
          )}
        </div>
      )}

      {/* アクションボタン */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={!facilityName || !latitude || !longitude}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: (!facilityName || !latitude || !longitude) ? '#9CA3AF' : '#10B981',
            border: 'none',
            borderRadius: '8px',
            cursor: (!facilityName || !latitude || !longitude) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (facilityName && latitude && longitude) {
              e.target.style.backgroundColor = '#059669';
            }
          }}
          onMouseLeave={(e) => {
            if (facilityName && latitude && longitude) {
              e.target.style.backgroundColor = '#10B981';
            }
          }}
        >
          💾 保存
        </button>

        <button
          onClick={handleClear}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: '#EF4444',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
        >
          🗑️ クリア
        </button>
      </div>
    </div>
  );
}
