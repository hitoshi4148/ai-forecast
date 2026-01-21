/**
 * MET Norway APIから気象予報データを取得するAPIルート
 * 
 * GET /api/weather/met-norway
 * 
 * クエリパラメータ:
 * - latitude: 緯度（必須）
 * - longitude: 経度（必須）
 * - startDateTime: 取得開始時刻 ISO8601形式 JST（必須）
 * - endDateTime: 取得終了時刻 ISO8601形式 JST（必須）
 * 
 * または
 * - latitude: 緯度（必須）
 * - longitude: 経度（必須）
 * - hours: 現在時刻から何時間後まで取得するか（オプション、デフォルト: 48）
 */

import {
  fetchMetNorway,
  fetchMetNorwayFromNow,
  fetchMetNorwayFromToday
} from '../../../lib/met-norway-api';

export default async function handler(req, res) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, startDateTime, endDateTime, hours, fromToday } = req.query;

    // バリデーション
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['latitude', 'longitude']
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    let data;

    // fromTodayパラメータが指定されている場合は、今日の0時から取得
    if (fromToday === 'true' || fromToday === '1') {
      const hoursNum = hours ? parseInt(hours, 10) : 48;
      if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 240) {
        return res.status(400).json({ error: 'Hours must be between 1 and 240' });
      }
      data = await fetchMetNorwayFromToday(lat, lon, hoursNum);
    } else if (hours) {
      // hoursパラメータが指定されている場合は、現在時刻から指定時間後まで取得
      const hoursNum = parseInt(hours, 10);
      if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 240) {
        return res.status(400).json({ error: 'Hours must be between 1 and 240' });
      }
      data = await fetchMetNorwayFromNow(lat, lon, hoursNum);
    } else {
      // startDateTimeとendDateTimeが指定されている場合
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['startDateTime', 'endDateTime'] + (hours ? '' : ' or hours')
        });
      }

      // ISO8601形式のバリデーション（簡易版）
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\+\d{2}:\d{2}|Z)?$/;
      if (!iso8601Regex.test(startDateTime) || !iso8601Regex.test(endDateTime)) {
        return res.status(400).json({ 
          error: 'Invalid datetime format. Use ISO8601 format (e.g., 2024-01-01T00:00:00+09:00)' 
        });
      }

      // 開始時刻が終了時刻より後でないかチェック
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      if (startDate >= endDate) {
        return res.status(400).json({ error: 'startDateTime must be before endDateTime' });
      }

      data = await fetchMetNorway(lat, lon, startDateTime, endDateTime);
    }

    return res.status(200).json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('MET Norway API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch weather forecast data from MET Norway API'
    });
  }
}
