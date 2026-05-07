import React, { useState, useEffect, useMemo, useRef } from 'react';
import { parseGolfCourseCsv, buildRegionTree } from '../lib/golf-course-csv';
import {
  loadFacilityItemsFromCookie,
  saveFacilityItemsToCookie,
  clearAllFacilitiesCookie,
  makeCsvFacilityId,
  MAX_CSV_FACILITIES,
  MAX_TOTAL_FACILITIES,
} from '../lib/facilities';

/**
 * 施設設定：CSV 3件まで + 手動1件、Cookie 保存
 */
export default function UserFacilitySettings({ onFacilitiesUpdated }) {
  const [rows, setRows] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [facilityItems, setFacilityItems] = useState([]);

  const [region1, setRegion1] = useState('');
  const [region2, setRegion2] = useState('');
  const [courseKey, setCourseKey] = useState('');

  const [facilityName, setFacilityName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [showManualInput, setShowManualInput] = useState(false);

  const [modal, setModal] = useState(null);
  const hasInitManual = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/golfCourse20260507.csv');
        if (!res.ok) throw new Error(`CSVの取得に失敗しました (${res.status})`);
        const text = await res.text();
        if (cancelled) return;
        setRows(parseGolfCourseCsv(text));
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'CSVの読み込みに失敗しました');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFacilityItems(loadFacilityItemsFromCookie());
  }, []);

  useEffect(() => {
    if (hasInitManual.current) return;
    const manual = facilityItems.find((i) => i.source === 'manual');
    if (manual) {
      setFacilityName(manual.name);
      setLatitude(String(manual.latitude));
      setLongitude(String(manual.longitude));
      hasInitManual.current = true;
    }
  }, [facilityItems]);

  const tree = useMemo(() => buildRegionTree(rows), [rows]);
  // CSVの並び順を保持（北海道→南などの意図した順序）
  const region1Options = useMemo(() => Object.keys(tree), [tree]);
  const region2Options = useMemo(() => {
    if (!region1 || !tree[region1]) return [];
    return Object.keys(tree[region1]);
  }, [tree, region1]);

  const courseOptions = useMemo(() => {
    if (!region1 || !region2 || !tree[region1]?.[region2]) return [];
    return tree[region1][region2];
  }, [tree, region1, region2]);

  useEffect(() => {
    if (!region2Options.includes(region2)) {
      setRegion2('');
      setCourseKey('');
    }
  }, [region1, region2Options, region2]);

  useEffect(() => {
    if (courseKey && !courseOptions.some((r) => r.rowKey === courseKey)) {
      setCourseKey('');
    }
  }, [courseOptions, courseKey]);

  const refreshFromCookie = () => {
    setFacilityItems(loadFacilityItemsFromCookie());
  };

  const notifyParent = () => {
    refreshFromCookie();
    if (onFacilitiesUpdated) onFacilitiesUpdated();
  };

  function tryAddCsvRow(row) {
    const current = loadFacilityItemsFromCookie();
    const csvCount = current.filter((i) => i.source === 'csv').length;
    const total = current.length;

    const newItem = {
      source: 'csv',
      id: makeCsvFacilityId(row.region1, row.region2, row.name),
      region1: row.region1,
      region2: row.region2,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
    };

    if (current.some((i) => i.id === newItem.id)) {
      setError('この施設はすでに追加されています。');
      return;
    }

    if (csvCount < MAX_CSV_FACILITIES && total < MAX_TOTAL_FACILITIES) {
      saveFacilityItemsToCookie([...current, newItem]);
      setError(null);
      notifyParent();
      return;
    }

    setModal({ newItem, current });
    setError(null);
  }

  function confirmReplace(removeId) {
    if (!modal) return;
    const { newItem, current } = modal;
    const filtered = current.filter((i) => i.id !== removeId);
    saveFacilityItemsToCookie([...filtered, newItem]);
    setModal(null);
    notifyParent();
  }

  function handleAddCsv() {
    setError(null);
    const row = courseOptions.find((r) => r.rowKey === courseKey);
    if (!row) {
      setError('地方・地域・ゴルフコースを選択してください。');
      return;
    }
    tryAddCsvRow(row);
  }

  function removeFacility(id) {
    const current = loadFacilityItemsFromCookie();
    saveFacilityItemsToCookie(current.filter((i) => i.id !== id));
    if (id.startsWith('manual:')) {
      setFacilityName('');
      setLatitude('');
      setLongitude('');
    }
    notifyParent();
  }

  function getCurrentLocation() {
    setIsLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報APIをサポートしていません。');
      setShowManualInput(true);
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationPermission('granted');
        setShowManualInput(false);
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        setLocationPermission('denied');
        setShowManualInput(true);
        setIsLoading(false);
        setError('位置情報が取得できませんでした。手動で入力してください。');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function handleSaveManual() {
    setError(null);
    if (!facilityName.trim()) {
      setError('施設名を入力してください。');
      return;
    }
    if (!latitude || !longitude) {
      setError('緯度・経度を入力するか、位置情報を取得してください。');
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('緯度・経度は数値で入力してください。');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('緯度・経度の範囲が不正です。');
      return;
    }

    const manualItem = {
      source: 'manual',
      id: 'manual:1',
      name: facilityName.trim(),
      latitude: lat,
      longitude: lng,
    };

    const current = loadFacilityItemsFromCookie();
    const withoutManual = current.filter((i) => i.source !== 'manual');
    const hasManual = current.some((i) => i.source === 'manual');

    if (hasManual) {
      saveFacilityItemsToCookie([...withoutManual, manualItem]);
      setError(null);
      notifyParent();
      alert('手動指定の施設を保存しました。');
      return;
    }

    if (withoutManual.length < MAX_TOTAL_FACILITIES) {
      saveFacilityItemsToCookie([...withoutManual, manualItem]);
      setError(null);
      notifyParent();
      alert('手動指定の施設を保存しました。');
      return;
    }

    setModal({ newItem: manualItem, current, replaceMode: 'manual' });
    setError(null);
  }

  function confirmReplaceManual(removeId) {
    if (!modal || !modal.replaceMode) return;
    const { newItem, current } = modal;
    const filtered = current.filter((i) => i.id !== removeId);
    saveFacilityItemsToCookie([...filtered, newItem]);
    setModal(null);
    notifyParent();
    alert('手動指定の施設を保存しました。');
  }

  function handleClearAll() {
    clearAllFacilitiesCookie();
    setFacilityName('');
    setLatitude('');
    setLongitude('');
    setRegion1('');
    setRegion2('');
    setCourseKey('');
    setError(null);
    notifyParent();
  }

  const selectStyle = {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '2px solid #D1D5DB',
    borderRadius: '8px',
    marginBottom: '12px',
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #1E40AF',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          color: '#1E40AF',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        施設の設定（リストから最大3件 + 手動1件）
      </h2>

      {loadError && (
        <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '12px' }}>{loadError}</p>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>現在の予報対象</h3>
        {facilityItems.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>施設が登録されていません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {facilityItems.map((item) => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: '14px',
                }}
              >
                <span>
                  <strong>{item.name}</strong>
                  <span style={{ color: '#9CA3AF', marginLeft: '8px' }}>
                    ({item.source === 'csv' ? 'リスト' : '手動'}) {item.latitude?.toFixed?.(4) ?? item.latitude},{' '}
                    {item.longitude?.toFixed?.(4) ?? item.longitude}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFacility(item.id)}
                  style={{
                    fontSize: '12px',
                    color: '#DC2626',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#F9FAFB',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #E5E7EB',
        }}
      >
        <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px' }}>リストから追加（最大3件）</h3>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280' }}>地方</label>
        <select value={region1} onChange={(e) => setRegion1(e.target.value)} style={selectStyle}>
          <option value="">選択してください</option>
          {region1Options.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280' }}>地域</label>
        <select
          value={region2}
          onChange={(e) => setRegion2(e.target.value)}
          style={selectStyle}
          disabled={!region1}
        >
          <option value="">選択してください</option>
          {region2Options.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280' }}>ゴルフコース</label>
        <select
          value={courseKey}
          onChange={(e) => setCourseKey(e.target.value)}
          style={selectStyle}
          disabled={!region2}
        >
          <option value="">選択してください</option>
          {courseOptions.map((r) => (
            <option key={r.rowKey} value={r.rowKey}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddCsv}
          style={{
            width: '100%',
            padding: '12px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: '#1E40AF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          リストの施設を追加
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', color: '#374151', marginBottom: '12px' }}>手動で緯度経度を指定（1件まで）</h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
            施設名 <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="例: 〇〇ゴルフクラブ"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '2px solid #D1D5DB',
              borderRadius: '8px',
            }}
          />
        </div>
        {!showManualInput && (
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              backgroundColor: isLoading ? '#9CA3AF' : '#1E40AF',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '位置情報を取得中...' : '現在地から位置情報を取得'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowManualInput(true)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '12px',
            fontSize: '13px',
            color: '#1E40AF',
            background: 'none',
            border: '1px dashed #93C5FD',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          緯度・経度を手入力する
        </button>
        {showManualInput && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>緯度</label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                step="any"
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '2px solid #D1D5DB' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>経度</label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                step="any"
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '2px solid #D1D5DB' }}
              />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handleSaveManual}
            style={{
              flex: 1,
              padding: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              backgroundColor: '#10B981',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            手動施設を保存
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#DC2626',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleClearAll}
        style={{
          width: '100%',
          padding: '12px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          backgroundColor: '#EF4444',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        すべての施設をクリア
      </button>

      {modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="facility-modal-title"
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h4 id="facility-modal-title" style={{ margin: '0 0 12px', fontSize: '16px', color: '#111' }}>
              {modal.replaceMode === 'manual'
                ? '登録上限のため、削除する施設を1つ選んでください'
                : 'リストから追加するには、削除する施設を1つ選んでください'}
            </h4>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              追加: <strong>{modal.newItem.name}</strong>
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {modal.current.map((item) => (
                <li key={item.id} style={{ marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      modal.replaceMode === 'manual'
                        ? confirmReplaceManual(item.id)
                        : confirmReplace(item.id)
                    }
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      background: '#F9FAFB',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    削除して入れ替え: {item.name}{' '}
                    <span style={{ color: '#9CA3AF' }}>({item.source === 'csv' ? 'リスト' : '手動'})</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                border: 'none',
                background: '#E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
