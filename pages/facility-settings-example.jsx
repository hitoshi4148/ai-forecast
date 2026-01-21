import React, { useState } from 'react';
import UserFacilitySettings from '../components/UserFacilitySettings';

/**
 * ユーザー指定施設設定の使用例ページ
 */
export default function FacilitySettingsExample() {
  const [userFacility, setUserFacility] = useState(null);

  const handleFacilitySet = (facility) => {
    setUserFacility(facility);
    console.log('施設が設定されました:', facility);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#1E40AF', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          ユーザー指定施設設定
        </h1>

        <UserFacilitySettings onFacilitySet={handleFacilitySet} />

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

          {userFacility ? (
            <div style={{ color: '#374151', fontSize: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>施設名:</strong> {userFacility.name}
              </div>
              <div>
                <strong>座標:</strong> {userFacility.latitude}, {userFacility.longitude}
              </div>
            </div>
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
