# 地図表示コンポーネントの使用例

## 概要
病害リスク予報Webアプリの地図表示コンポーネントの例です。

## ファイル構成
- `components/DiseaseRiskMap.jsx` - メインの地図コンポーネント
- `pages/example-usage.jsx` - 使用例ページ

## 主な機能

### 1. 地図表示
- 日本列島の簡略SVGを背景に表示
- 5施設の位置にマーカーを配置

### 2. リスク表示
- 各マーカー横に5病害のリスク値を色分け表示
  - Dollar Spot (DS)
  - Brown Patch (BP)
  - Pythium (Py)
  - Anthracnose (An)
  - Large Patch (LP)

### 3. 色分けルール
- 0-20%: 青 (#3B82F6) - 低リスク
- 20-40%: 緑 (#10B981) - やや低
- 40-60%: 黄 (#FBBF24) - 中リスク
- 60-80%: オレンジ (#F97316) - やや高
- 80-100%: 赤 (#EF4444) - 高リスク
- データなし: グレー (#808080) - "?"表示

### 4. インタラクション
- マーカーをクリックすると詳細ポップアップを表示
- ポップアップには各病害の正式名称とリスク値を表示
- オーバーレイクリックまたは×ボタンで閉じる

### 5. 凡例
- 右下にリスク凡例を表示

## データ構造

```javascript
const facility = {
  id: number,              // 施設ID
  name: string,            // 施設名
  latitude: number,        // 緯度
  longitude: number,       // 経度
  risks: {
    dollarSpot: number,    // 0-100のリスク値（null可）
    brownPatch: number,
    pythium: number,
    anthracnose: number,
    largePatch: number
  }
}
```

## 使用方法

```jsx
import DiseaseRiskMap from './components/DiseaseRiskMap';

const facilities = [
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
  // ... 他の施設
];

<DiseaseRiskMap
  facilities={facilities}
  onFacilityClick={(facility) => console.log(facility)}
/>
```

## 注意事項

1. **SVG座標**: 現在の実装では簡易的なSVG座標を使用しています。
   実際の実装では、緯度経度からSVG座標への正確な変換が必要です。

2. **レスポンシブ**: 地図は`viewBox`を使用してレスポンシブに対応していますが、
   より詳細な調整が必要な場合があります。

3. **パフォーマンス**: 多くの施設を表示する場合は、仮想化や最適化を検討してください。

4. **アクセシビリティ**: キーボード操作やスクリーンリーダー対応を追加することを推奨します。
