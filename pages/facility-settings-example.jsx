import React, { useState, useEffect } from 'react';
import UserFacilitySettings from '../components/UserFacilitySettings';
import { loadFacilityItemsFromCookie } from '../lib/facilities';

/**
 * ユーザー指定施設設定の使用例ページ
 */
export default function FacilitySettingsExample() {
  const [items, setItems] = useState([]);

  const refresh = () => {
    setItems(loadFacilityItemsFromCookie());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFacilitiesUpdated = () => {
    refresh();
    console.log('施設が更新されました:', loadFacilityItemsFromCookie());
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#1E40AF', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          ユーザー指定施設設定
        </h1>

        <UserFacilitySettings onFacilitiesUpdated={handleFacilitiesUpdated} />

        {/* 設定された施設情報の表示例 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #1E40AF',
          borderRadius: '12px',
          padding: '24px',
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
            <span>📋</span>
            <span>設定された施設情報</span>
          </h2>

          {items.length > 0 ? (
            <ul style={{ color: '#374151', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
              {items.map((it) => (
                <li key={it.id} style={{ marginBottom: '8px' }}>
                  <strong>{it.name}</strong>
                  {' '}
                  ({it.latitude}, {it.longitude})
                  {it.source === 'csv' && it.region1 ? ` — ${it.region1} / ${it.region2}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#6B7280', fontSize: '14px' }}>
              まだ施設が設定されていません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
