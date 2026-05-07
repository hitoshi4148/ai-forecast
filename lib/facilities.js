/**
 * 予報対象施設（Cookie）。CSV 最大3件 + 手動1件 = 合計最大4件
 */

export const MAX_CSV_FACILITIES = 3;
export const MAX_MANUAL_FACILITIES = 1;
export const MAX_TOTAL_FACILITIES = MAX_CSV_FACILITIES + MAX_MANUAL_FACILITIES;

const COOKIE_USER_FACILITIES = 'userFacilities';
const LEGACY_COOKIE_USER_FACILITY = 'userFacility';

/**
 * CSV由来施設の安定ID（地方＋地域＋コース名）
 */
export function makeCsvFacilityId(region1, region2, name) {
  const payload = JSON.stringify({ r1: region1, r2: region2, n: name });
  const b64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(payload)))
    : Buffer.from(payload, 'utf8').toString('base64');
  const urlSafe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `csv:${urlSafe}`;
}

/** @param {string} id */
export function isManualFacilityId(id) {
  return typeof id === 'string' && id.startsWith('manual:');
}

function facilityToMapEntry(item, index) {
  const lat = Number(item.latitude);
  const lon = Number(item.longitude);
  const svgX = 100 + ((lon - 123) / (146 - 123)) * 700;
  const svgY = 50 + ((lat - 24) / (46 - 24)) * 150;

  return {
    id: item.id || `slot-${index}`,
    name: item.name,
    latitude: lat,
    longitude: lon,
    source: item.source,
    svgX: Math.max(100, Math.min(800, svgX)),
    svgY: Math.max(50, Math.min(200, svgY)),
  };
}

/**
 * @returns {Array<{ source: 'csv'|'manual', id: string, name: string, latitude: number, longitude: number, region1?: string, region2?: string }>}
 */
export function loadFacilityItemsFromCookie() {
  if (typeof window === 'undefined') return [];

  const cookies = document.cookie.split(';');
  const modern = cookies.find((c) => c.trim().startsWith(`${COOKIE_USER_FACILITIES}=`));

  if (modern) {
    try {
      const jsonStr = decodeURIComponent(modern.split('=').slice(1).join('='));
      const parsed = JSON.parse(jsonStr);
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      return normalizeFacilityItems(items);
    } catch (e) {
      console.error('userFacilities Cookie解析エラー:', e);
      return [];
    }
  }

  const legacy = cookies.find((c) => c.trim().startsWith(`${LEGACY_COOKIE_USER_FACILITY}=`));
  if (legacy) {
    try {
      const jsonStr = decodeURIComponent(legacy.split('=').slice(1).join('='));
      const f = JSON.parse(jsonStr);
      if (f && typeof f.name === 'string' && f.latitude != null && f.longitude != null) {
        return [
          {
            source: 'manual',
            id: 'manual:1',
            name: f.name,
            latitude: Number(f.latitude),
            longitude: Number(f.longitude),
          },
        ];
      }
    } catch (e) {
      console.error('userFacility Cookie解析エラー:', e);
    }
  }

  return [];
}

/**
 * 件数制約を満たすよう切り詰め（不整合データ対策）
 * @param {unknown[]} items
 */
function normalizeFacilityItems(items) {
  const csv = [];
  const manual = [];

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    const o = /** @type {any} */ (raw);
    if (o.source === 'manual' && manual.length < MAX_MANUAL_FACILITIES) {
      manual.push({
        source: 'manual',
        id: typeof o.id === 'string' ? o.id : 'manual:1',
        name: String(o.name || ''),
        latitude: Number(o.latitude),
        longitude: Number(o.longitude),
      });
    } else if (o.source === 'csv' && csv.length < MAX_CSV_FACILITIES) {
      csv.push({
        source: 'csv',
        id: typeof o.id === 'string' ? o.id : makeCsvFacilityId(o.region1, o.region2, o.name),
        region1: String(o.region1 || ''),
        region2: String(o.region2 || ''),
        name: String(o.name || ''),
        latitude: Number(o.latitude),
        longitude: Number(o.longitude),
      });
    }
  }

  const merged = [...csv, ...manual];
  if (merged.length > MAX_TOTAL_FACILITIES) {
    return merged.slice(0, MAX_TOTAL_FACILITIES);
  }
  return merged;
}

/**
 * @param {ReturnType<typeof loadFacilityItemsFromCookie>} items
 */
export function saveFacilityItemsToCookie(items) {
  if (typeof window === 'undefined') return;

  const normalized = normalizeFacilityItems(items);
  const jsonStr = JSON.stringify({ version: 1, items: normalized });
  const expires = new Date();
  expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000);
  document.cookie = `${COOKIE_USER_FACILITIES}=${encodeURIComponent(jsonStr)}; expires=${expires.toUTCString()}; path=/`;

  document.cookie = `${LEGACY_COOKIE_USER_FACILITY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * 地図・API用の施設配列（0〜4件）
 */
export function getForecastFacilities() {
  if (typeof window === 'undefined') return [];
  const items = loadFacilityItemsFromCookie();
  return items.map((item, index) => facilityToMapEntry(item, index));
}

/**
 * @deprecated 互換のため残す。getForecastFacilities と同じ
 */
export function getAllFacilities() {
  return getForecastFacilities();
}

/**
 * Cookie 上の手動施設を取得（設定画面のフォーム初期値用）
 */
export function getManualFacilityFromCookie() {
  const items = loadFacilityItemsFromCookie();
  return items.find((i) => i.source === 'manual') || null;
}

export function clearAllFacilitiesCookie() {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_USER_FACILITIES}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${LEGACY_COOKIE_USER_FACILITY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
