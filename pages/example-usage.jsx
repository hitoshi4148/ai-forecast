import React from 'react';
import DiseaseRiskMap from '../components/DiseaseRiskMap';

/**
 * 地図コンポーネントの使用例
 */
export default function ExampleUsage() {
  // サンプルデータ（実際のAPIから取得したデータを想定）
  const sampleFacilities = [
    {
      id: 1,
      name: '蔵王カントリークラブ',
      latitude: 38.1234,
      longitude: 140.5678,
      risks: {
        dollarSpot: 45,
        brownPatch: 30,
        pythium: 15,
        anthracnose: 60,
        largePatch: 25
      }
    },
    {
      id: 2,
      name: '香取カントリークラブ',
      latitude: 35.8765,
      longitude: 140.4321,
      risks: {
        dollarSpot: 35,
        brownPatch: 55,
        pythium: 20,
        anthracnose: 40,
        largePatch: 15
      }
    },
    {
      id: 3,
      name: '東海カントリークラブ',
      latitude: 35.1234,
      longitude: 136.9876,
      risks: {
        dollarSpot: 70,
        brownPatch: 25,
        pythium: 85,
        anthracnose: 50,
        largePatch: 10
      }
    },
    {
      id: 4,
      name: '阿蘇大津ゴルフクラブ',
      latitude: 32.9876,
      longitude: 131.1234,
      risks: {
        dollarSpot: 20,
        brownPatch: 40,
        pythium: 30,
        anthracnose: 35,
        largePatch: 50
      }
    },
    {
      id: 5,
      name: 'ユーザー指定施設',
      latitude: 36.5678,
      longitude: 139.8765,
      risks: {
        dollarSpot: 90,
        brownPatch: 75,
        pythium: 65,
        anthracnose: 80,
        largePatch: 45
      }
    }
  ];

  const handleFacilityClick = (facility) => {
    console.log('施設がクリックされました:', facility);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#1E40AF', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
          芝生病害リスク予報
        </h1>
        <p style={{ color: '#6B7280', marginBottom: '20px', fontSize: '14px' }}>
          予測時刻: 明日朝6:00時点のリスク予測
        </p>
        
        <DiseaseRiskMap
          facilities={sampleFacilities}
          onFacilityClick={handleFacilityClick}
        />
      </div>
    </div>
  );
}
