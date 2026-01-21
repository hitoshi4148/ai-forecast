/**
 * NASA POWER API から過去の気象データを取得するライブラリ
 * 
 * 機能：
 * - 日単位データの取得
 * - 時間単位データの取得
 * - データの正規化（MET Norwayと結合可能な形式）
 */

/**
 * NASA POWER APIのベースURL
 */
const NASA_POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal';

/**
 * 日付をNASA POWER API形式（YYYYMMDD）に変換
 * @param {Date|string} date - 日付（DateオブジェクトまたはYYYY-MM-DD形式の文字列）
 * @returns {string} YYYYMMDD形式の文字列
 */
function formatDateForNasa(date) {
  if (typeof date === 'string') {
    // YYYY-MM-DD形式をYYYYMMDDに変換
    return date.replace(/-/g, '');
  }
  // Dateオブジェクトの場合
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * NASA POWER APIから生データを取得（日単位）
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {string} startDate - 開始日（YYYY-MM-DD形式）
 * @param {string} endDate - 終了日（YYYY-MM-DD形式）
 * @returns {Promise<Object>} NASA POWER APIの生レスポンス
 * @throws {Error} API取得失敗時
 */
export async function fetchNasaPowerDailyRaw(latitude, longitude, startDate, endDate) {
  const params = new URLSearchParams({
    parameters: 'T2M,RH2M,T2M_MAX,T2M_MIN', // 気温、湿度、最高気温、最低気温
    community: 'AG', // 農業用コミュニティ
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    start: formatDateForNasa(startDate),
    end: formatDateForNasa(endDate),
    format: 'JSON'
  });

  const url = `${NASA_POWER_BASE_URL}/daily/point?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // NASA POWER APIのエラーチェック
    if (data.messages && data.messages.length > 0) {
      const errorMessages = data.messages.filter(msg => msg.severity === 'ERROR');
      if (errorMessages.length > 0) {
        throw new Error(`NASA POWER API error: ${errorMessages.map(m => m.message).join(', ')}`);
      }
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch NASA POWER daily data: ${error.message || error}`);
  }
}

/**
 * NASA POWER APIから生データを取得（時間単位）
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {string} startDate - 開始日（YYYY-MM-DD形式）
 * @param {string} endDate - 終了日（YYYY-MM-DD形式）
 * @returns {Promise<Object>} NASA POWER APIの生レスポンス
 * @throws {Error} API取得失敗時
 */
export async function fetchNasaPowerHourlyRaw(latitude, longitude, startDate, endDate) {
  const params = new URLSearchParams({
    parameters: 'T2M,RH2M', // 気温、湿度
    community: 'AG', // 農業用コミュニティ
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    start: formatDateForNasa(startDate),
    end: formatDateForNasa(endDate),
    format: 'JSON'
  });

  const url = `${NASA_POWER_BASE_URL}/hourly/point?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // NASA POWER APIのエラーチェック
    if (data.messages && data.messages.length > 0) {
      const errorMessages = data.messages.filter(msg => msg.severity === 'ERROR');
      if (errorMessages.length > 0) {
        throw new Error(`NASA POWER API error: ${errorMessages.map(m => m.message).join(', ')}`);
      }
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch NASA POWER hourly data: ${error.message || error}`);
  }
}

/**
 * NASA POWERの日単位データを正規化
 * @param {Object} rawData - NASA POWER APIの生レスポンス
 * @param {string} timezone - タイムゾーン（デフォルト: 'Asia/Tokyo'）
 * @returns {Array<Object>} 正規化された日単位データ配列
 */
export function normalizeNasaPowerDaily(rawData, timezone = 'Asia/Tokyo') {
  if (!rawData || !rawData.properties || !rawData.properties.parameter) {
    throw new Error('Invalid NASA POWER API response format');
  }

  const { parameter } = rawData.properties;
  const t2m = parameter.T2M || {}; // 日平均気温
  const rh2m = parameter.RH2M || {}; // 日平均湿度
  const t2mMax = parameter.T2M_MAX || {}; // 日最高気温
  const t2mMin = parameter.T2M_MIN || {}; // 日最低気温

  // 日付のキーを取得してソート
  const dates = Object.keys(t2m).sort();

  return dates.map(dateKey => {
    // YYYYMMDD形式をYYYY-MM-DDに変換
    const year = dateKey.substring(0, 4);
    const month = dateKey.substring(4, 6);
    const day = dateKey.substring(6, 8);
    const date = `${year}-${month}-${day}`;

    return {
      date: date,
      temperature_avg: t2m[dateKey] !== null && t2m[dateKey] !== undefined ? Number(t2m[dateKey]) : null,
      humidity_avg: rh2m[dateKey] !== null && rh2m[dateKey] !== undefined ? Number(rh2m[dateKey]) : null,
      temperature_max: t2mMax[dateKey] !== null && t2mMax[dateKey] !== undefined ? Number(t2mMax[dateKey]) : null,
      temperature_min: t2mMin[dateKey] !== null && t2mMin[dateKey] !== undefined ? Number(t2mMin[dateKey]) : null
    };
  });
}

/**
 * NASA POWERの時間単位データを正規化
 * @param {Object} rawData - NASA POWER APIの生レスポンス
 * @param {string} timezone - タイムゾーン（デフォルト: 'Asia/Tokyo'）
 * @returns {Array<Object>} 正規化された時間単位データ配列
 */
export function normalizeNasaPowerHourly(rawData, timezone = 'Asia/Tokyo') {
  if (!rawData || !rawData.properties || !rawData.properties.parameter) {
    throw new Error('Invalid NASA POWER API response format');
  }

  const { parameter } = rawData.properties;
  const t2m = parameter.T2M || {}; // 気温
  const rh2m = parameter.RH2M || {}; // 湿度

  // タイムスタンプのキーを取得してソート
  const timestamps = Object.keys(t2m).sort();

  return timestamps.map(timestamp => {
    // YYYYMMDDHH形式をISO8601形式に変換
    // NASA POWERはUTC時間で返すため、JSTに変換
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);

    // UTCとして解釈してからJSTに変換
    const utcDate = new Date(`${year}-${month}-${day}T${hour}:00:00Z`);
    
    // JSTに変換（UTC+9）
    const jstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    
    // ISO8601形式（JST）に変換
    const jstYear = jstDate.getUTCFullYear();
    const jstMonth = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
    const jstDay = String(jstDate.getUTCDate()).padStart(2, '0');
    const jstHour = String(jstDate.getUTCHours()).padStart(2, '0');
    
    const datetime = `${jstYear}-${jstMonth}-${jstDay}T${jstHour}:00:00+09:00`;

    return {
      datetime: datetime,
      temperature: t2m[timestamp] !== null && t2m[timestamp] !== undefined ? Number(t2m[timestamp]) : null,
      humidity: rh2m[timestamp] !== null && rh2m[timestamp] !== undefined ? Number(rh2m[timestamp]) : null
    };
  });
}

/**
 * NASA POWER APIから日単位データを取得して正規化
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {string} startDate - 開始日（YYYY-MM-DD形式）
 * @param {string} endDate - 終了日（YYYY-MM-DD形式）
 * @param {string} timezone - タイムゾーン（デフォルト: 'Asia/Tokyo'）
 * @returns {Promise<Array<Object>>} 正規化された日単位データ配列
 */
export async function fetchNasaPowerDaily(latitude, longitude, startDate, endDate, timezone = 'Asia/Tokyo') {
  const rawData = await fetchNasaPowerDailyRaw(latitude, longitude, startDate, endDate);
  return normalizeNasaPowerDaily(rawData, timezone);
}

/**
 * NASA POWER APIから時間単位データを取得して正規化
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {string} startDate - 開始日（YYYY-MM-DD形式）
 * @param {string} endDate - 終了日（YYYY-MM-DD形式）
 * @param {string} timezone - タイムゾーン（デフォルト: 'Asia/Tokyo'）
 * @returns {Promise<Array<Object>>} 正規化された時間単位データ配列
 */
export async function fetchNasaPowerHourly(latitude, longitude, startDate, endDate, timezone = 'Asia/Tokyo') {
  const rawData = await fetchNasaPowerHourlyRaw(latitude, longitude, startDate, endDate);
  return normalizeNasaPowerHourly(rawData, timezone);
}
