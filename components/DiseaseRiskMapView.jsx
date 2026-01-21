'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getAllFacilities } from '../lib/facilities';
import { calculateAllDiseaseRisks } from '../lib/disease-risk-calculator';

// LeafletのCSSをクライアント側でのみ読み込む
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
  // 施設名Tooltipのスタイルをカスタマイズ
  const style = document.createElement('style');
  style.textContent = `
    .facility-name-tooltip {
      background: rgba(255, 255, 255, 0.95) !important;
      border: 1px solid rgba(30, 64, 175, 0.3) !important;
      border-radius: 4px !important;
      padding: 2px 6px !important;
      font-size: 12px !important;
      font-weight: bold !important;
      color: #1E40AF !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
    }
    .facility-name-tooltip::before {
      border-top-color: rgba(30, 64, 175, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
}

// react-leafletを動的インポート（SSRを無効化）
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

/**
 * 病害リスク予報地図コンポーネント（Leaflet版）
 * 
 * 日本地図上に施設マーカーを表示し、
 * 各施設の病害リスクを可視化する
 */
export default function DiseaseRiskMapView() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const hasFetchedRef = useRef(false); // データ取得済みフラグ

  // 施設名を伏字略称に変換（表示用）
  const getDisplayName = (facilityName) => {
    const nameMap = {
      '蔵王カントリークラブ': '蔵〇CC',
      '香取カントリークラブ': '香〇CC',
      '東海カントリークラブ': '東〇CC',
      '阿蘇大津ゴルフクラブ': '阿〇大津GC'
    };
    return nameMap[facilityName] || facilityName;
  };

  // リスク値に応じた色を返す
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

  // 最大リスク値を取得
  const getMaxRisk = (risks) => {
    if (!risks) return null;
    const values = Object.values(risks).filter(v => v !== null && v !== undefined && !isNaN(v));
    return values.length > 0 ? Math.max(...values) : null;
  };

  // 最大リスク病害名とリスク値を取得
  const getMaxRiskDisease = (risks) => {
    if (!risks) return { name: null, risk: null };
    
    const diseaseMap = {
      dollarSpot: 'Dollar Spot',
      brownPatch: 'Brown Patch',
      pythium: 'Pythium',
      anthracnose: 'Anthracnose',
      largePatch: 'Large Patch'
    };
    
    let maxRisk = null;
    let maxDisease = null;
    
    Object.entries(risks).forEach(([key, value]) => {
      if (value !== null && value !== undefined && !isNaN(value)) {
        if (maxRisk === null || value > maxRisk) {
          maxRisk = value;
          maxDisease = diseaseMap[key] || null;
        }
      }
    });
    
    return {
      name: maxDisease,
      risk: maxRisk !== null ? Math.round(maxRisk) : null
    };
  };

  // 最大リスク病害名表示用のDivIconを作成
  const createDiseaseLabelIcon = (diseaseName, riskValue, radius) => {
    if (typeof window === 'undefined') return null;
    
    const L = require('leaflet');
    
    if (!diseaseName || riskValue === null) {
      return L.divIcon({
        className: 'disease-label-marker',
        html: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    }
    
    return L.divIcon({
      className: 'disease-label-marker',
      html: `
        <div style="
          background-color: rgba(255, 255, 255, 0.95);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          color: #1E40AF;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 1px solid rgba(30, 64, 175, 0.3);
          margin-left: ${radius + 5}px;
        ">
          ${diseaseName} ${riskValue}%
        </div>
      `,
      iconSize: [null, null],
      iconAnchor: [0, 0]
    });
  };

  // リスク値の表示テキストを返す
  const getRiskText = (risk) => {
    if (risk === null || risk === undefined || isNaN(risk)) {
      return '?';
    }
    return `${Math.round(risk)}%`;
  };

  // 最大リスク値に基づいてCircleMarkerの半径を計算
  // リスク0% → radius = 12.5、リスク100% → radius = 25.0、0-100%の間は線形補間
  const getRadiusFromRisk = (maxRisk) => {
    if (maxRisk === null || maxRisk === undefined || isNaN(maxRisk)) {
      return 12.5; // デフォルト値（データなしの場合）
    }
    // 0-100%を12.5-25.0ピクセルに線形マッピング
    // radius = 12.5 + (risk_percent / 100.0) * (25.0 - 12.5)
    const minRadius = 12.5;
    const maxRadius = 25.0;
    const radius = minRadius + (maxRisk / 100.0) * (maxRadius - minRadius);
    return radius; // 小数点を保持
  };

  // 施設のリスクデータを取得（初回のみ）
  useEffect(() => {
    // クライアント側でのみ実行
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // 既にデータ取得済みの場合は再取得しない
    if (hasFetchedRef.current) {
      if (facilities.length > 0) {
        setLoading(false);
      }
      return;
    }
    
    const fetchFacilityRisks = async () => {
      // 既にデータ取得済みの場合はスキップ（二重取得防止）
      if (hasFetchedRef.current) {
        return;
      }
      
      hasFetchedRef.current = true; // 取得開始フラグを立てる
      setLoading(true);
      setError(null);

      try {
        const facilityList = getAllFacilities();
        const facilitiesWithRisks = await Promise.all(
          facilityList.map(async (facility) => {
            try {
              // 過去7日間の日次データを取得
              const endDate = new Date();
              endDate.setDate(endDate.getDate() - 1);
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 7);

              const startDateStr = startDate.toISOString().split('T')[0];
              const endDateStr = endDate.toISOString().split('T')[0];

              // 日次データ取得
              const dailyResponse = await fetch(
                `/api/weather/nasa-power?latitude=${facility.latitude}&longitude=${facility.longitude}&startDate=${startDateStr}&endDate=${endDateStr}&type=daily`
              );
              
              if (!dailyResponse.ok) {
                throw new Error(`日次データ取得失敗: ${facility.name}`);
              }
              
              const dailyData = await dailyResponse.json();

              // 時間単位データ取得
              const hourlyResponse = await fetch(
                `/api/weather/nasa-power?latitude=${facility.latitude}&longitude=${facility.longitude}&startDate=${startDateStr}&endDate=${endDateStr}&type=hourly`
              );
              
              if (!hourlyResponse.ok) {
                throw new Error(`時間単位データ取得失敗: ${facility.name}`);
              }
              
              const hourlyData = await hourlyResponse.json();

              // 未来データ取得（MET Norway）
              const forecastResponse = await fetch(
                `/api/weather/met-norway?latitude=${facility.latitude}&longitude=${facility.longitude}&hours=48&fromToday=true`
              );
              
              if (!forecastResponse.ok) {
                throw new Error(`予報データ取得失敗: ${facility.name}`);
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

              return {
                ...facility,
                risks
              };
            } catch (err) {
              console.error(`施設 ${facility.name} のリスク計算エラー:`, err);
              return {
                ...facility,
                risks: {
                  dollarSpot: null,
                  brownPatch: null,
                  pythium: null,
                  anthracnose: null,
                  largePatch: null
                }
              };
            }
          })
        );

        setFacilities(facilitiesWithRisks);
      } catch (err) {
        setError(err.message || 'データ取得に失敗しました');
        hasFetchedRef.current = false; // エラー時はフラグをリセット（再試行可能にする）
      } finally {
        setLoading(false);
      }
    };

    fetchFacilityRisks();
  }, []); // 依存配列は空のまま（初回マウント時のみ実行）

  // 日本全体が収まる中心座標とズームレベル
  const center = [36.5, 138.0]; // 日本の中心付近
  const zoom = 6;

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        地図を読み込み中...
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px',
        fontSize: '18px',
        color: '#6B7280'
      }}>
        データを取得中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        color: '#DC2626'
      }}>
        ⚠️ エラー: {error}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '600px',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid #1E40AF',
      position: 'relative'
    }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {facilities.map((facility) => {
          const maxRisk = getMaxRisk(facility.risks);
          const markerColor = getRiskColor(maxRisk);
          const radius = getRadiusFromRisk(maxRisk);
          const maxDisease = getMaxRiskDisease(facility.risks);
          const diseaseLabelIcon = createDiseaseLabelIcon(maxDisease.name, maxDisease.risk, radius);

          return (
            <React.Fragment key={facility.id}>
              <CircleMarker
                center={[facility.latitude, facility.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: markerColor,
                  fillOpacity: 0.7,
                  color: '#FFFFFF',
                  weight: 3,
                  opacity: 1
                }}
              >
              <Tooltip 
                permanent 
                direction="top" 
                offset={[0, -radius - 5]}
                className="facility-name-tooltip"
                opacity={1}
              >
                {getDisplayName(facility.name)}
              </Tooltip>
                <Popup>
                <div style={{
                  minWidth: '250px',
                  padding: '8px'
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    color: '#1E40AF',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderBottom: '2px solid #E5E7EB',
                    paddingBottom: '8px'
                  }}>
                    {getDisplayName(facility.name)}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {[
                      { key: 'dollarSpot', label: 'Dollar Spot', fullName: 'Dollar Spot' },
                      { key: 'brownPatch', label: 'Brown Patch', fullName: 'Brown Patch' },
                      { key: 'pythium', label: 'Pythium', fullName: 'Pythium' },
                      { key: 'anthracnose', label: 'Anthracnose', fullName: 'Anthracnose（炭疽病）' },
                      { key: 'largePatch', label: 'Large Patch', fullName: 'Large Patch' }
                    ].map(({ key, label, fullName }) => {
                      const risk = facility.risks?.[key];
                      const riskValue = risk !== null && risk !== undefined && !isNaN(risk) ? Math.round(risk) : null;
                      const color = getRiskColor(risk);
                      
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            backgroundColor: '#F9FAFB',
                            borderRadius: '6px',
                            border: `2px solid ${color}`
                          }}
                        >
                          <div>
                            <div style={{
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: '#1F2937',
                              marginBottom: '2px'
                            }}>
                              {fullName}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6B7280'
                            }}>
                              {label}
                            </div>
                          </div>
                          <div
                            style={{
                              width: '70px',
                              height: '40px',
                              backgroundColor: color,
                              color: '#FFFFFF',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            {riskValue !== null ? `${riskValue}%` : '?'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: '#6B7280',
                    textAlign: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    予測時刻: 明日朝6:00時点
                  </div>
                </div>
              </Popup>
            </CircleMarker>
            {diseaseLabelIcon && (
              <Marker
                position={[facility.latitude, facility.longitude]}
                icon={diseaseLabelIcon}
                interactive={false}
              />
            )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* 予測時刻ラベル */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#1E40AF',
          zIndex: 1000,
          border: '1px solid rgba(30, 64, 175, 0.2)'
        }}
      >
        明日 朝6:00（日本時間）時点の病害リスク予報
      </div>

      {/* 凡例 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '180px'
        }}
      >
        <div style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1E40AF',
          fontSize: '13px'
        }}>
          リスク凡例
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {[
            { range: '0-20%', color: '#3B82F6', label: '低リスク' },
            { range: '20-40%', color: '#10B981', label: 'やや低' },
            { range: '40-60%', color: '#FBBF24', label: '中リスク' },
            { range: '60-80%', color: '#F97316', label: 'やや高' },
            { range: '80-100%', color: '#EF4444', label: '高リスク' }
          ].map(({ range, color, label }) => (
            <div key={range} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div
                style={{
                  width: '24px',
                  height: '16px',
                  backgroundColor: color,
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)'
                }}
              />
              <span style={{
                color: '#374151',
                fontSize: '11px'
              }}>
                {range} ({label})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
