import React, { useState } from 'react';

/**
 * 病害リスク予報地図コンポーネント
 * 
 * @param {Object} props
 * @param {Array} props.facilities - 施設データ配列
 * @param {Function} props.onFacilityClick - マーカークリック時のコールバック
 */
export default function DiseaseRiskMap({ facilities = [], onFacilityClick }) {
  const [selectedFacility, setSelectedFacility] = useState(null);

  // 日本列島の簡略SVG座標（簡易版）
  // 実際の実装では、より詳細なSVGパスを使用するか、画像を使用
  const japanOutline = "M 100 50 L 150 60 L 200 80 L 250 100 L 300 120 L 350 110 L 400 100 L 450 90 L 500 85 L 550 80 L 600 75 L 650 70 L 700 65 L 750 60 L 800 55 L 850 50 L 800 100 L 750 120 L 700 130 L 650 140 L 600 145 L 550 150 L 500 155 L 450 160 L 400 165 L 350 170 L 300 175 L 250 180 L 200 185 L 150 190 L 100 200 Z";

  // 施設の座標（簡易版 - 実際の緯度経度からSVG座標に変換）
  // 蔵王カントリークラブ（宮城県）
  // 香取カントリークラブ（千葉県）
  // 東海カントリークラブ（愛知県）
  // 阿蘇大津ゴルフクラブ（熊本県）
  const facilityPositions = {
    '蔵王カントリークラブ': { x: 350, y: 120 },
    '香取カントリークラブ': { x: 400, y: 140 },
    '東海カントリークラブ': { x: 450, y: 150 },
    '阿蘇大津ゴルフクラブ': { x: 500, y: 200 }
  };

  /**
   * リスク値に応じた色を返す
   * @param {number} risk - リスク値（0-100）
   * @returns {string} カラーコード
   */
  const getRiskColor = (risk) => {
    if (risk === null || risk === undefined || isNaN(risk)) {
      return '#808080'; // グレー（データなし）
    }
    
    if (risk < 20) return '#3B82F6';      // 青
    if (risk < 40) return '#10B981';      // 緑
    if (risk < 60) return '#FBBF24';      // 黄
    if (risk < 80) return '#F97316';      // オレンジ
    return '#EF4444';                     // 赤
  };

  /**
   * リスク値の表示テキストを返す
   * @param {number|null} risk - リスク値
   * @returns {string}
   */
  const getRiskText = (risk) => {
    if (risk === null || risk === undefined || isNaN(risk)) {
      return '?';
    }
    return `${Math.round(risk)}%`;
  };

  /**
   * マーカークリック時の処理
   */
  const handleMarkerClick = (facility) => {
    setSelectedFacility(facility);
    if (onFacilityClick) {
      onFacilityClick(facility);
    }
  };

  /**
   * ポップアップを閉じる
   */
  const handleClosePopup = () => {
    setSelectedFacility(null);
  };

  return (
    <div className="disease-risk-map-container" style={{ position: 'relative', width: '100%', height: '600px', backgroundColor: '#E0F2FE' }}>
      {/* 日本列島の簡略SVG */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 900 250"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* 日本列島の輪郭 */}
        <path
          d={japanOutline}
          fill="#F0F9FF"
          stroke="#1E40AF"
          strokeWidth="2"
        />
      </svg>

      {/* 施設マーカーとリスク表示 */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {facilities.map((facility, index) => {
          const position = facilityPositions[facility.name] || { x: 300, y: 150 };
          
          return (
            <div
              key={facility.id || index}
              style={{
                position: 'absolute',
                left: `${(position.x / 900) * 100}%`,
                top: `${(position.y / 250) * 100}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              {/* マーカー */}
              <div
                onClick={() => handleMarkerClick(facility)}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#FFFFFF',
                  border: '3px solid #1E40AF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                📍
              </div>

              {/* 施設名 */}
              <div
                style={{
                  position: 'absolute',
                  top: '45px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#1E40AF',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {facility.name}
              </div>

              {/* リスク表示（5病害） */}
              <div
                style={{
                  position: 'absolute',
                  top: '70px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'center'
                }}
              >
                {[
                  { key: 'dollarSpot', label: 'DS' },
                  { key: 'brownPatch', label: 'BP' },
                  { key: 'pythium', label: 'Py' },
                  { key: 'anthracnose', label: 'An' },
                  { key: 'largePatch', label: 'LP' }
                ].map(({ key, label }) => {
                  const risk = facility.risks?.[key];
                  return (
                    <div
                      key={key}
                      style={{
                        width: '50px',
                        height: '20px',
                        backgroundColor: getRiskColor(risk),
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.5)'
                      }}
                      title={`${label}: ${getRiskText(risk)}`}
                    >
                      {getRiskText(risk)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ポップアップ（マーカークリック時） */}
      {selectedFacility && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#FFFFFF',
            border: '2px solid #1E40AF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '90vw'
          }}
        >
          {/* ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1E40AF', fontSize: '18px', fontWeight: 'bold' }}>
              {selectedFacility.name}
            </h3>
            <button
              onClick={handleClosePopup}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* リスク詳細一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'dollarSpot', label: 'Dollar Spot', fullName: 'Dollar Spot' },
              { key: 'brownPatch', label: 'Brown Patch', fullName: 'Brown Patch' },
              { key: 'pythium', label: 'Pythium', fullName: 'Pythium' },
              { key: 'anthracnose', label: 'Anthracnose', fullName: 'Anthracnose（炭疽病）' },
              { key: 'largePatch', label: 'Large Patch', fullName: 'Large Patch' }
            ].map(({ key, label, fullName }) => {
              const risk = selectedFacility.risks?.[key];
              const riskValue = risk !== null && risk !== undefined && !isNaN(risk) ? Math.round(risk) : null;
              
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: `2px solid ${getRiskColor(risk)}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1F2937' }}>
                      {fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {label}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '80px',
                      height: '40px',
                      backgroundColor: getRiskColor(risk),
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    {riskValue !== null ? `${riskValue}%` : '?'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* フッター */}
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
            予測時刻: 明日朝6:00時点
          </div>
        </div>
      )}

      {/* オーバーレイ（ポップアップ表示時） */}
      {selectedFacility && (
        <div
          onClick={handleClosePopup}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* 凡例 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontSize: '12px',
          zIndex: 20
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1E40AF' }}>
          リスク凡例
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { range: '0-20%', color: '#3B82F6', label: '低リスク' },
            { range: '20-40%', color: '#10B981', label: 'やや低' },
            { range: '40-60%', color: '#FBBF24', label: '中リスク' },
            { range: '60-80%', color: '#F97316', label: 'やや高' },
            { range: '80-100%', color: '#EF4444', label: '高リスク' }
          ].map(({ range, color, label }) => (
            <div key={range} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '16px',
                  backgroundColor: color,
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)'
                }}
              />
              <span style={{ color: '#374151' }}>{range} ({label})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
