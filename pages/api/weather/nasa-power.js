/**
 * NASA POWER APIから気象データを取得するAPIルート
 * 
 * GET /api/weather/nasa-power
 * 
 * クエリパラメータ:
 * - latitude: 緯度（必須）
 * - longitude: 経度（必須）
 * - startDate: 開始日 YYYY-MM-DD（必須）
 * - endDate: 終了日 YYYY-MM-DD（必須）
 * - type: 'daily' | 'hourly'（デフォルト: 'daily'）
 */

import {
  fetchNasaPowerDaily,
  fetchNasaPowerHourly
} from '../../../lib/nasa-power-api';

export default async function handler(req, res) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, startDate, endDate, type = 'daily' } = req.query;

    // バリデーション
    if (!latitude || !longitude || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['latitude', 'longitude', 'startDate', 'endDate']
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

    // 日付形式のバリデーション
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // データ取得
    let data;
    if (type === 'hourly') {
      data = await fetchNasaPowerHourly(lat, lon, startDate, endDate);
    } else {
      data = await fetchNasaPowerDaily(lat, lon, startDate, endDate);
    }

    return res.status(200).json({
      success: true,
      data: data,
      type: type,
      count: data.length
    });
  } catch (error) {
    console.error('NASA POWER API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch weather data from NASA POWER API'
    });
  }
}
