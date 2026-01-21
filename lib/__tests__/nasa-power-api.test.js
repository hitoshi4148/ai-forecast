/**
 * NASA POWER API関数のテスト用サンプルコード
 * 
 * このファイルは動作確認用のサンプルです。
 * 実際のテストフレームワーク（Jest等）を使用する場合は適宜変更してください。
 */

import {
  fetchNasaPowerDaily,
  fetchNasaPowerHourly,
  fetchNasaPowerDailyRaw,
  normalizeNasaPowerDaily,
  normalizeNasaPowerHourly
} from '../nasa-power-api';

/**
 * テスト実行例
 * ブラウザのコンソールまたはNode.js環境で実行可能
 */
export async function testNasaPowerAPI() {
  console.log('=== NASA POWER API テスト開始 ===');

  // テスト用の座標（東京）
  const latitude = 35.6812;
  const longitude = 139.7671;
  
  // 過去7日間のデータを取得
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // 昨日まで
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // 7日前から

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log(`取得期間: ${startDateStr} ～ ${endDateStr}`);
  console.log(`座標: 緯度 ${latitude}, 経度 ${longitude}`);

  try {
    // 日単位データの取得テスト
    console.log('\n--- 日単位データ取得テスト ---');
    const dailyData = await fetchNasaPowerDaily(
      latitude,
      longitude,
      startDateStr,
      endDateStr
    );
    console.log(`取得件数: ${dailyData.length}件`);
    console.log('サンプルデータ（最初の3件）:');
    console.log(dailyData.slice(0, 3));

    // 時間単位データの取得テスト
    console.log('\n--- 時間単位データ取得テスト ---');
    const hourlyData = await fetchNasaPowerHourly(
      latitude,
      longitude,
      startDateStr,
      endDateStr
    );
    console.log(`取得件数: ${hourlyData.length}件`);
    console.log('サンプルデータ（最初の3件）:');
    console.log(hourlyData.slice(0, 3));

    console.log('\n=== テスト完了 ===');
    return { dailyData, hourlyData };
  } catch (error) {
    console.error('テストエラー:', error);
    throw error;
  }
}

// Node.js環境で直接実行する場合
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  // Node.js環境
  testNasaPowerAPI().catch(console.error);
}
