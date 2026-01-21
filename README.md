# 芝生病害リスク予報 Webアプリ

ゴルフ場グリーンキーパー向けの病害リスク予報Webアプリケーションです。

## 現在の実装状況

✅ **ユーザー指定施設の設定機能**
- 施設名の入力
- ブラウザ位置情報APIからの緯度・経度取得
- 位置情報API拒否時の手動入力フォールバック
- Cookieへの保存・復元

✅ **NASA POWER API 気象データ取得**
- 過去の気温・湿度データの取得（日単位・時間単位）
- データの正規化（MET Norwayと結合可能な形式）
- Next.js API Routes経由でのデータ取得

✅ **MET Norway API 気象予報データ取得**
- 将来の気温・湿度予報データの取得（時間単位）
- データの正規化（NASA POWERと結合可能な形式）
- JST（UTC+9）への時刻変換
- Next.js API Routes経由でのデータ取得

✅ **病害リスク計算ロジック**
- 5病害のリスク計算（0-100%）
  - Dollar Spot（日単位、5日移動平均）
  - Brown Patch（時間単位、夜間評価）
  - Pythium（日単位、7日積算）
  - Anthracnose（日単位、高温継続評価）
  - Large Patch（日単位、8-10日積算）
- 純粋関数として実装（UI非依存）
- 係数・閾値を定数化（調整容易）

✅ **地図表示UI**
- 日本列島の簡略地図上に施設マーカーを表示
- 5施設の病害リスクを可視化（4固定施設 + ユーザー指定施設）
- マーカーの色は最大リスク値に応じて変化
- クリックで詳細ポップアップ表示
- スマートフォン対応（レスポンシブ）

🚧 **今後実装予定**
- 気象データの統合API（NASA POWER + MET Norway）
- データ更新の自動化

## セットアップ

### 必要な環境

- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 主要ページ

- `/` - ユーザー指定施設設定ページ
- `/disease-risk-map` - 病害リスク予報地図（メインページ）
- `/test-nasa-power` - NASA POWER API動作確認
- `/test-met-norway` - MET Norway API動作確認
- `/test-disease-risk` - 病害リスク計算動作確認

## 機能説明

### ユーザー指定施設の設定

1. **施設名の入力**
   - テキストフィールドに施設名を入力します

2. **位置情報の取得**
   - 「現在地から位置情報を取得」ボタンをクリック
   - ブラウザの位置情報許可を確認
   - 許可すると自動的に緯度・経度が入力されます

3. **手動入力（フォールバック）**
   - 位置情報APIが拒否された場合、自動的に手動入力フォームが表示されます
   - または「手動で緯度・経度を入力する」リンクをクリック
   - 緯度・経度を数値で入力します

4. **保存**
   - 「保存」ボタンをクリックして施設情報をCookieに保存します
   - 保存された情報は次回アクセス時に自動復元されます

5. **クリア**
   - 「クリア」ボタンで入力内容とCookieを削除します

## 動作確認

### 正常動作の確認ポイント

1. **位置情報取得 → 表示 → Cookie保存 → 再読み込み復元**
   - 施設名を入力
   - 「現在地から位置情報を取得」をクリック
   - 位置情報を許可
   - 緯度・経度が自動入力されることを確認
   - 「保存」をクリック
   - ページをリロード（F5）
   - 施設情報が自動復元されることを確認

2. **手動入力の確認**
   - 位置情報を拒否する
   - 手動入力フォームが表示されることを確認
   - 緯度・経度を手動入力
   - 「保存」をクリック
   - ページをリロードして復元を確認

3. **Cookie削除の確認**
   - 「クリア」ボタンをクリック
   - 入力内容がクリアされることを確認
   - ページをリロードして、情報が復元されないことを確認

## プロジェクト構造

```
ai_forecast/
├── components/
│   └── UserFacilitySettings.jsx  # ユーザー指定施設設定コンポーネント
├── lib/
│   ├── nasa-power-api.js          # NASA POWER API呼び出し・正規化関数
│   ├── met-norway-api.js          # MET Norway API呼び出し・正規化関数
│   └── __tests__/
│       └── nasa-power-api.test.js # テスト用サンプルコード
├── pages/
│   ├── _app.js                    # Next.jsアプリケーションエントリーポイント
│   ├── index.js                   # メインページ
│   ├── test-nasa-power.js         # NASA POWER API動作確認ページ
│   ├── test-met-norway.js         # MET Norway API動作確認ページ
│   └── api/
│       └── weather/
│           ├── nasa-power.js      # NASA POWER APIルート
│           └── met-norway.js      # MET Norway APIルート
├── styles/
│   └── globals.css                # グローバルスタイル
├── package.json
├── next.config.js
└── README.md
```

## 技術スタック

- **フレームワーク**: Next.js 14
- **UIライブラリ**: React 18
- **スタイリング**: インラインスタイル（CSS-in-JS）

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リントチェック
npm run lint
```

## NASA POWER API 使用方法

### APIルート経由で取得

```javascript
// 日単位データの取得
const response = await fetch('/api/weather/nasa-power?latitude=35.6812&longitude=139.7671&startDate=2024-01-01&endDate=2024-01-07&type=daily');
const data = await response.json();

// 時間単位データの取得
const response = await fetch('/api/weather/nasa-power?latitude=35.6812&longitude=139.7671&startDate=2024-01-01&endDate=2024-01-07&type=hourly');
const data = await response.json();
```

### ライブラリ関数を直接使用

```javascript
import {
  fetchNasaPowerDaily,
  fetchNasaPowerHourly
} from '../lib/nasa-power-api';

// 日単位データ
const dailyData = await fetchNasaPowerDaily(
  35.6812,  // 緯度
  139.7671, // 経度
  '2024-01-01', // 開始日
  '2024-01-07'  // 終了日
);

// 時間単位データ
const hourlyData = await fetchNasaPowerHourly(
  35.6812,
  139.7671,
  '2024-01-01',
  '2024-01-07'
);
```

### データ形式

**日単位データ:**
```javascript
[
  {
    date: "2024-01-01",
    temperature_avg: 5.2,
    humidity_avg: 65.5,
    temperature_max: 10.3,
    temperature_min: 1.1
  },
  ...
]
```

**時間単位データ:**
```javascript
[
  {
    datetime: "2024-01-01T05:00:00+09:00",
    temperature: 3.5,
    humidity: 70.2
  },
  ...
]
```

### 動作確認

ブラウザで `/test-nasa-power` にアクセスして、NASA POWER APIの動作を確認できます。

- 緯度・経度を入力
- 取得日数を指定
- データタイプ（日単位/時間単位）を選択
- 「データ取得」ボタンをクリック

## MET Norway API 使用方法

### APIルート経由で取得

```javascript
// 現在時刻から48時間後の予報データを取得
const response = await fetch('/api/weather/met-norway?latitude=35.6812&longitude=139.7671&hours=48');
const data = await response.json();

// 時刻範囲を指定して取得
const response = await fetch('/api/weather/met-norway?latitude=35.6812&longitude=139.7671&startDateTime=2024-01-01T00:00:00+09:00&endDateTime=2024-01-02T00:00:00+09:00');
const data = await response.json();
```

### ライブラリ関数を直接使用

```javascript
import {
  fetchMetNorway,
  fetchMetNorwayFromNow
} from '../lib/met-norway-api';

// 時刻範囲を指定して取得
const forecastData = await fetchMetNorway(
  35.6812,  // 緯度
  139.7671, // 経度
  '2024-01-01T00:00:00+09:00', // 開始時刻（JST）
  '2024-01-02T00:00:00+09:00'  // 終了時刻（JST）
);

// 現在時刻から指定時間数後の予報を取得
const forecastData = await fetchMetNorwayFromNow(
  35.6812,
  139.7671,
  48 // 48時間後まで
);
```

### データ形式

**時間単位データ（NASA POWERと同じ形式）:**
```javascript
[
  {
    datetime: "2024-01-01T06:00:00+09:00",
    temperature: 5.2,
    humidity: 65.5
  },
  ...
]
```

### データ結合例

NASA POWER（過去）とMET Norway（未来）のデータを結合:

```javascript
import { fetchNasaPowerHourly } from '../lib/nasa-power-api';
import { fetchMetNorway } from '../lib/met-norway-api';

// 過去データ（NASA POWER）
const pastData = await fetchNasaPowerHourly(
  35.6812,
  139.7671,
  '2024-01-01',
  '2024-01-07'
);

// 未来データ（MET Norway）
const futureData = await fetchMetNorway(
  35.6812,
  139.7671,
  '2024-01-08T00:00:00+09:00',
  '2024-01-10T00:00:00+09:00'
);

// 結合（datetimeでソート）
const combinedData = [...pastData, ...futureData].sort((a, b) => {
  return new Date(a.datetime) - new Date(b.datetime);
});
```

### 動作確認

ブラウザで `/test-met-norway` にアクセスして、MET Norway APIの動作を確認できます。

- 緯度・経度を入力
- 取得時間数を指定、または時刻範囲を指定
- 「予報データ取得」ボタンをクリック

### 注意事項

- **User-Agent必須**: MET Norway APIは利用規約でUser-Agentヘッダーの設定が必須です
- **レート制限**: 過度なリクエストは避けてください（推奨: 1リクエスト/秒以下）
- **データの有効期限**: 予報データは通常数時間ごとに更新されます

## 病害リスク計算 使用方法

### ライブラリ関数を直接使用

```javascript
import { calculateAllDiseaseRisks } from '../lib/disease-risk-calculator';

// 気象データを準備
const weatherData = {
  daily: [
    {
      date: "2024-01-01",
      temperature_avg: 20.5,
      humidity_avg: 70.0
    },
    // ...
  ],
  hourly: [
    {
      datetime: "2024-01-01T15:00:00+09:00",
      temperature: 22.0,
      humidity: 75.0
    },
    // ...
  ]
};

// 全病害のリスクを計算
const risks = calculateAllDiseaseRisks(weatherData);

console.log(risks);
// {
//   dollarSpot: 45,
//   brownPatch: 30,
//   pythium: 15,
//   anthracnose: 60,
//   largePatch: 25
// }
```

### 個別の病害リスクを計算

```javascript
import {
  calculateDollarSpotRisk,
  calculateBrownPatchRisk,
  calculatePythiumRisk,
  calculateAnthracnoseRisk,
  calculateLargePatchRisk
} from '../lib/disease-risk-calculator';

const dailyData = [/* 日次データ */];
const hourlyData = [/* 時間単位データ */];

const dollarSpotRisk = calculateDollarSpotRisk(dailyData);
const brownPatchRisk = calculateBrownPatchRisk(hourlyData);
const pythiumRisk = calculatePythiumRisk(dailyData);
const anthracnoseRisk = calculateAnthracnoseRisk(dailyData);
const largePatchRisk = calculateLargePatchRisk(dailyData);
```

### データ形式

**入力（日次データ）:**
```javascript
[
  {
    date: "2024-01-01",
    temperature_avg: 20.5,
    humidity_avg: 70.0,
    temperature_max: 25.0,
    temperature_min: 15.0
  }
]
```

**入力（時間単位データ）:**
```javascript
[
  {
    datetime: "2024-01-01T15:00:00+09:00",
    temperature: 22.0,
    humidity: 75.0
  }
]
```

**出力:**
```javascript
{
  dollarSpot: 45,      // 0-100またはnull
  brownPatch: 30,
  pythium: 15,
  anthracnose: 60,
  largePatch: 25
}
```

### 動作確認

ブラウザで `/test-disease-risk` にアクセスして、病害リスク計算の動作を確認できます。

- 緯度・経度を入力
- 「リスク計算実行」ボタンをクリック
- 各病害のリスク値（%）が表示されます

### 各病害の計算ロジック

1. **Dollar Spot**: 日単位データ、5日移動平均、15-30℃・60%以上で上昇、30℃超で減衰
2. **Brown Patch**: 時間単位データ、20:00-翌6:00の夜間、20℃以上かつ90%以上の時間数で評価
3. **Pythium**: 日単位データ、25℃以上かつ85%以上の日を積算、直近7日を評価
4. **Anthracnose**: 日単位データ、15-30℃で上昇、25℃超が5日以上継続で高リスク
5. **Large Patch**: 日単位データ、10-20℃で上昇、25℃超または8℃未満でリセット、直近8-10日積算

## 地図表示UI 使用方法

### メインページ

ブラウザで `/disease-risk-map` にアクセスすると、日本地図上に施設別の病害リスクが表示されます。

### 表示される施設

1. **蔵王カントリークラブ**（固定）
2. **香取カントリークラブ**（固定）
3. **東海カントリークラブ**（固定）
4. **阿蘇大津ゴルフクラブ**（固定）
5. **ユーザー指定施設**（Cookieから自動取得）

### 操作方法

1. **施設設定**: 「ユーザー指定施設を設定」ボタンから施設を追加・変更
2. **マーカー表示**: 各施設の位置にマーカーが表示され、最大リスク値に応じて色分け
3. **詳細表示**: マーカーをクリックすると、各病害の詳細リスク値がポップアップ表示

### 色分けルール

- **0-20%**: 青 - 低リスク
- **20-40%**: 緑 - やや低
- **40-60%**: 黄 - 中リスク
- **60-80%**: オレンジ - やや高
- **80-100%**: 赤 - 高リスク

### スマートフォン対応

- レスポンシブデザインでスマートフォンでも見やすく表示
- タップ操作に対応
- 文字サイズを適切に調整
