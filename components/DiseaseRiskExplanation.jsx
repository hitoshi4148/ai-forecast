/**
 * 病害リスク判定ロジック説明コンポーネント
 * 
 * 各病害のリスク計算方法を説明するUI
 */

export default function DiseaseRiskExplanation() {
  const explanations = [
    {
      name: 'Dollar Spot',
      jpName: 'ドルスポット',
      description: '日次データを使用した5日移動平均による評価',
      formula: '移動平均(5日) = Σ(気温・湿度) / 5',
      conditions: [
        '気温: 15-30℃でリスク上昇',
        '湿度: 60%以上でリスク上昇',
        '気温30℃以上で減衰',
        'リスク = 気温リスク(50%) + 湿度リスク(50%)'
      ],
      calculation: (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>気温リスク:</div>
          <div>15-25℃: 線形上昇 (0→50%)</div>
          <div>25-30℃: 線形減少 (50%→0%)</div>
          <div style={{ marginTop: '4px' }}>湿度リスク:</div>
          <div>60-100%: 線形上昇 (0→50%)</div>
          <div style={{ marginTop: '4px' }}>減衰係数:</div>
          <div>30℃超: (40-気温)/10倍</div>
        </div>
      )
    },
    {
      name: 'Brown Patch',
      jpName: 'ブラウンパッチ',
      description: '時間単位データによる夜間条件評価',
      formula: 'リスク比 = 該当時間数 / 夜間総時間数',
      conditions: [
        '評価時間: 20:00-翌6:00',
        '条件: 気温≥20℃ かつ 湿度≥90%',
        'リスク = 該当時間の割合×2',
        '50%以上で最大リスク'
      ],
      calculation: (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>夜間時間を抽出</div>
          <div>条件該当時間をカウント</div>
          <div style={{ marginTop: '4px' }}>リスク計算:</div>
          <div>割合 = 該当/夜間総数</div>
          <div>リスク% = 割合×100 ×2</div>
          <div style={{ marginTop: '4px' }}>上限: 100%</div>
        </div>
      )
    },
    {
      name: 'Pythium',
      jpName: 'ピシウム病',
      description: '直近7日間の条件該当日数による指数評価',
      formula: 'リスク = 100 × (1 - e^(-0.3×日数))',
      conditions: [
        '評価期間: 直近7日',
        '条件: 気温≥25℃ かつ 湿度≥85%',
        '該当日数を指数関数で評価',
        '7日間で最大リスク'
      ],
      calculation: (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>条件該当日数をカウント</div>
          <div style={{ marginTop: '4px' }}>指数関数:</div>
          <div>risk = 100×(1-e^(-0.3×days))</div>
          <div style={{ marginTop: '4px' }}>例:</div>
          <div>1日: ~26%</div>
          <div>3日: ~59%</div>
          <div>7日: ~88%</div>
        </div>
      )
    },
    {
      name: 'Anthracnose',
      jpName: '炭疽病',
      description: '日次データによる気温・高温継続評価',
      formula: 'リスク = 気温リスク + 高温継続リスク + 湿度補助',
      conditions: [
        '評価期間: 直近10日',
        '気温: 15-30℃でリスク上昇',
        '高温: 25℃超が5日以上継続で高リスク',
        '湿度: 70%以上で補助'
      ],
      calculation: (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>1. 気温リスク:</div>
          <div>15-25℃: 線形 (0→10点/日)</div>
          <div>25-30℃: 線形 (10→0点/日)</div>
          <div style={{ marginTop: '4px' }}>2. 高温継続:</div>
          <div>5日以上: +(日数-5)×10点</div>
          <div style={{ marginTop: '4px' }}>3. 湿度補助:</div>
          <div>70%以上: +(湿度-70)/3%</div>
        </div>
      )
    },
    {
      name: 'Large Patch',
      jpName: 'ラージパッチ',
      description: '直近8-10日間の気温積算評価',
      formula: 'リスク = Σ(日リスク) / (評価日数×10) × 100',
      conditions: [
        '評価期間: 直近8-10日',
        '気温: 10-20℃でリスク上昇',
        'リセット: 25℃超 または 8℃未満',
        '積算値で評価'
      ],
      calculation: (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>日リスク計算:</div>
          <div>10-15℃: 線形 (0→10点)</div>
          <div>15-20℃: 線形 (10→0点)</div>
          <div style={{ marginTop: '4px' }}>リセット条件:</div>
          <div>25℃超 または 8℃未満</div>
          <div style={{ marginTop: '4px' }}>リスク =</div>
          <div>積算値 / (日数×10) ×100%</div>
        </div>
      )
    }
  ];

  return (
    <div style={{
      marginTop: '20px',
      padding: '12px',
      backgroundColor: '#F9FAFB',
      borderRadius: '8px',
      border: '1px solid #E5E7EB'
    }}>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1E40AF',
        textAlign: 'center'
      }}>
        病害リスク判定ロジック
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        fontSize: '11px'
      }}>
        {explanations.map((disease, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#FFFFFF',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h4 style={{
              margin: '0 0 6px 0',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#1E40AF',
              borderBottom: '1px solid #E5E7EB',
              paddingBottom: '4px'
            }}>
              {disease.name}
              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: 'normal' }}>
                {disease.jpName}
              </div>
            </h4>
            
            <div style={{
              fontSize: '9px',
              color: '#6B7280',
              marginBottom: '6px',
              lineHeight: '1.3'
            }}>
              {disease.description}
            </div>
            
            <div style={{
              fontSize: '9px',
              backgroundColor: '#F3F4F6',
              padding: '4px',
              borderRadius: '4px',
              marginBottom: '6px',
              fontFamily: 'monospace',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              {disease.formula}
            </div>
            
            <div style={{
              fontSize: '9px',
              marginBottom: '6px',
              flex: 1
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>条件:</div>
              {disease.conditions.map((condition, idx) => (
                <div key={idx} style={{ marginBottom: '2px', lineHeight: '1.3' }}>
                  • {condition}
                </div>
              ))}
            </div>
            
            <div style={{
              fontSize: '9px',
              backgroundColor: '#FEF3C7',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #FCD34D'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>計算式:</div>
              {disease.calculation}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        fontSize: '10px',
        color: '#6B7280',
        textAlign: 'center'
      }}>
        <div>※ すべてのリスク値は0-100%に正規化されます</div>
        <div>※ データ不足の場合は表示されません</div>
      </div>
    </div>
  );
}
