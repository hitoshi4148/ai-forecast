/**
 * MET Norway API から将来の気象予報データを取得するライブラリ
 * 
 * 機能：
 * - Locationforecast 2.0 APIから時間単位の予報データを取得
 * - データの正規化（NASA POWERと結合可能な形式）
 * - JST（UTC+9）への時刻変換
 */

/**
 * MET Norway APIのベースURL
 */
const MET_NORWAY_BASE_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';

/**
 * User-Agent（MET Norway 必須。識別できるアプリ名 + メールまたは URL）
 * example.com 等のプレースホルダは 403 になりやすい。上書きは .env.local の MET_NORWAY_USER_AGENT
 */
const USER_AGENT =
  process.env.MET_NORWAY_USER_AGENT ||
  'ShibashigotoByohaiYoho/1.0 (hitoshi.yoshinobu@gmail.com)';

/**
 * ISO8601形式の文字列をDateオブジェクトに変換
 * @param {string} isoString - ISO8601形式の文字列
 * @returns {Date} Dateオブジェクト
 */
function parseISO8601(isoString) {
  return new Date(isoString);
}

/**
 * DateオブジェクトをJST（UTC+9）のISO8601形式に変換
 * @param {Date} date - Dateオブジェクト（UTCとして解釈）
 * @returns {string} JSTのISO8601形式（+09:00）
 */
function formatToJSTISO8601(date) {
  // UTC時刻をJSTに変換（UTC+9時間）
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  
  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  const hour = String(jstDate.getUTCHours()).padStart(2, '0');
  const minute = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const second = String(jstDate.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

/**
 * MET Norway APIから生データを取得
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @returns {Promise<Object>} MET Norway APIの生レスポンス
 * @throws {Error} API取得失敗時
 */
export async function fetchMetNorwayRaw(latitude, longitude) {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString()
  });

  const url = `${MET_NORWAY_BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      const hint =
        response.status === 403
          ? ' MET Norway は適切な User-Agent（連絡先付き）を要求します。.env.local に MET_NORWAY_USER_AGENT を設定してください。'
          : '';
      throw new Error(
        `MET Norway API error: ${response.status} ${response.statusText}.${hint}`,
      );
    }

    const data = await response.json();

    // MET Norway APIのエラーチェック
    if (data.error) {
      throw new Error(`MET Norway API error: ${data.error.message || data.error}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch MET Norway data: ${error.message || error}`);
  }
}

/**
 * MET Norwayの予報データを正規化
 * @param {Object} rawData - MET Norway APIの生レスポンス
 * @param {string} startDateTime - 取得開始時刻（ISO8601形式、JST）
 * @param {string} endDateTime - 取得終了時刻（ISO8601形式、JST）
 * @returns {Array<Object>} 正規化された時間単位データ配列
 */
export function normalizeMetNorway(rawData, startDateTime, endDateTime) {
  if (!rawData || !rawData.properties || !rawData.properties.timeseries) {
    throw new Error('Invalid MET Norway API response format');
  }

  const { timeseries } = rawData.properties;
  
  // 開始時刻と終了時刻をDateオブジェクトに変換（JSTとして解釈）
  const startDate = parseISO8601(startDateTime);
  const endDate = parseISO8601(endDateTime);

  // 現在時刻を取得（MET Norway APIは現在時刻以降のデータのみを返す）
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  // 現在時刻を0分0秒に丸める（時間単位データなので）
  jstNow.setUTCMinutes(0);
  jstNow.setUTCSeconds(0);
  jstNow.setUTCMilliseconds(0);

  const normalizedData = [];

  for (const entry of timeseries) {
    // MET NorwayはUTC時刻で返す
    const utcDateTime = parseISO8601(entry.time);
    
    // JSTに変換
    const jstDateTime = formatToJSTISO8601(utcDateTime);
    const jstDate = parseISO8601(jstDateTime);

    // 開始時刻以降、終了時刻以前のデータのみを抽出
    // MET Norway APIは現在時刻以降のデータのみを返すが、
    // 開始時刻を指定した場合は、その時刻以降のデータを全て取得する
    // （実際に取得できるのは max(startDate, jstNow) 以降のデータ）
    if (jstDate < startDate || jstDate > endDate) {
      continue;
    }

    // 気温と湿度を取得
    const instant = entry.data?.instant?.details;
    if (!instant) {
      continue; // データがない場合はスキップ
    }

    const temperature = instant.air_temperature;
    const humidity = instant.relative_humidity;

    // 値が存在する場合のみ追加
    if (temperature !== null && temperature !== undefined && 
        humidity !== null && humidity !== undefined) {
      normalizedData.push({
        datetime: jstDateTime,
        temperature: Number(temperature),
        humidity: Number(humidity)
      });
    }
  }

  // datetimeでソート（念のため）
  normalizedData.sort((a, b) => {
    return new Date(a.datetime) - new Date(b.datetime);
  });

  return normalizedData;
}

/**
 * MET Norway APIから予報データを取得して正規化
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {string} startDateTime - 取得開始時刻（ISO8601形式、JST）
 * @param {string} endDateTime - 取得終了時刻（ISO8601形式、JST）
 * @returns {Promise<Array<Object>>} 正規化された時間単位データ配列
 */
export async function fetchMetNorway(latitude, longitude, startDateTime, endDateTime) {
  const rawData = await fetchMetNorwayRaw(latitude, longitude);
  return normalizeMetNorway(rawData, startDateTime, endDateTime);
}

/**
 * 現在時刻から指定時間数後の予報データを取得
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {number} hours - 取得する時間数（デフォルト: 48時間）
 * @param {string} startFromDate - 開始日（YYYY-MM-DD形式、オプション）。指定した場合はその日の0時から取得
 * @returns {Promise<Array<Object>>} 正規化された時間単位データ配列
 */
export async function fetchMetNorwayFromNow(latitude, longitude, hours = 48, startFromDate = null) {
  // 現在時刻をJSTで取得
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  
  let startDateTime;
  
  if (startFromDate) {
    // 指定された日付の0時（JST）から開始
    const startDate = new Date(`${startFromDate}T00:00:00+09:00`);
    startDateTime = formatToJSTISO8601(startDate);
  } else {
    // 開始時刻（現在時刻）
    startDateTime = formatToJSTISO8601(jstNow);
  }
  
  // 終了時刻（開始時刻 + hours時間後）
  const startDateObj = parseISO8601(startDateTime);
  const endDate = new Date(startDateObj.getTime() + hours * 60 * 60 * 1000);
  const endDateTime = formatToJSTISO8601(endDate);

  return fetchMetNorway(latitude, longitude, startDateTime, endDateTime);
}

/**
 * 今日から指定時間数後の予報データを取得（今日のデータも含む）
 * @param {number} latitude - 緯度
 * @param {number} longitude - 経度
 * @param {number} hours - 取得する時間数（デフォルト: 48時間）
 * @returns {Promise<Array<Object>>} 正規化された時間単位データ配列
 */
export async function fetchMetNorwayFromToday(latitude, longitude, hours = 48) {
  // 今日の日付を取得（JST）
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(jstNow.getUTCDate()).padStart(2, '0')}`;
  
  // 今日の0時から取得
  return fetchMetNorwayFromNow(latitude, longitude, hours, todayStr);
}
