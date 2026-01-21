/**
 * 施設データの定義と管理
 */

/**
 * 固定施設の座標と情報
 */
export const FIXED_FACILITIES = [
  {
    id: 'zao',
    name: '蔵王カントリークラブ',
    latitude: 38.1234,
    longitude: 140.5678,
    // SVG座標（簡略地図用、900x250のviewBoxを想定）
    svgX: 350,
    svgY: 120
  },
  {
    id: 'katori',
    name: '香取カントリークラブ',
    latitude: 35.8765,
    longitude: 140.4321,
    svgX: 400,
    svgY: 140
  },
  {
    id: 'tokai',
    name: '東海カントリークラブ',
    latitude: 35.1234,
    longitude: 136.9876,
    svgX: 450,
    svgY: 150
  },
  {
    id: 'aso',
    name: '阿蘇大津ゴルフクラブ',
    latitude: 32.9876,
    longitude: 131.1234,
    svgX: 500,
    svgY: 200
  }
];

/**
 * Cookieからユーザー指定施設を取得
 * @returns {Object|null} ユーザー指定施設の情報
 */
export function getUserFacilityFromCookie() {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const facilityCookie = cookies.find(c => c.trim().startsWith('userFacility='));
  
  if (facilityCookie) {
    try {
      const jsonStr = decodeURIComponent(facilityCookie.split('=')[1]);
      const facility = JSON.parse(jsonStr);
      
      // SVG座標を計算（簡易版：緯度経度から概算）
      // 日本の範囲: 緯度 24-46, 経度 123-146
      // SVG座標: X=100-800, Y=50-200
      const svgX = 100 + ((facility.longitude - 123) / (146 - 123)) * 700;
      const svgY = 50 + ((facility.latitude - 24) / (46 - 24)) * 150;
      
      return {
        id: 'user',
        name: facility.name,
        latitude: facility.latitude,
        longitude: facility.longitude,
        svgX: Math.max(100, Math.min(800, svgX)),
        svgY: Math.max(50, Math.min(200, svgY))
      };
    } catch (e) {
      console.error('Cookie解析エラー:', e);
      return null;
    }
  }
  return null;
}

/**
 * 全施設のリストを取得（固定施設 + ユーザー指定施設）
 * @returns {Array<Object>} 施設リスト
 */
export function getAllFacilities() {
  const facilities = [...FIXED_FACILITIES];
  const userFacility = getUserFacilityFromCookie();
  
  if (userFacility) {
    facilities.push(userFacility);
  }
  
  return facilities;
}
