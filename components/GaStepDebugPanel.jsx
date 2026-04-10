import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

const SS_KEY = 'ga_forecast_step_debug';

function timeNow() {
  return new Date().toLocaleTimeString('ja-JP', { hour12: false });
}

export default function GaStepDebugPanel() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [step3Wait, setStep3Wait] = useState(false);
  const [step3Timeout, setStep3Timeout] = useState(false);
  const [step4, setStep4] = useState(false);
  const [step5, setStep5] = useState(false);
  const [sendDetail, setSendDetail] = useState('');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  const [t4, setT4] = useState('');
  const [t5, setT5] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('ga_step') === '1') {
      try {
        sessionStorage.setItem(SS_KEY, '1');
      } catch (_) {
        /* ignore */
      }
    }
    let show = false;
    try {
      show = sessionStorage.getItem(SS_KEY) === '1';
    } catch (_) {
      show = qs.get('ga_step') === '1';
    }
    if (show) {
      setEnabled(true);
      setStep1(true);
      setT1(timeNow());
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onJs = () => {
      setStep4(true);
      setT4(timeNow());
    };
    window.addEventListener('ga-forecast:gtag-js-loaded', onJs);
    return () => window.removeEventListener('ga-forecast:gtag-js-loaded', onJs);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !router.isReady) return;
    setStep2(true);
    setT2(timeNow());
  }, [enabled, router.isReady]);

  useEffect(() => {
    if (!enabled || !router.isReady) return;
    if (typeof window.gtag === 'function') {
      setStep3(true);
      setStep3Wait(false);
      setT3(timeNow());
      return;
    }
    setStep3Wait(true);
    const started = Date.now();
    const id = setInterval(() => {
      if (typeof window.gtag === 'function') {
        clearInterval(id);
        setStep3(true);
        setStep3Wait(false);
        setStep3Timeout(false);
        setT3(timeNow());
      } else if (Date.now() - started > 10000) {
        clearInterval(id);
        setStep3Timeout(true);
        setStep3Wait(false);
      }
    }, 80);
    return () => clearInterval(id);
  }, [enabled, router.isReady]);

  useEffect(() => {
    if (!enabled) return;
    const onPv = (e) => {
      setStep5(true);
      setT5(timeNow());
      const d = e.detail || {};
      setSendDetail(d.pagePath ? String(d.pagePath) : '');
    };
    window.addEventListener('ga-forecast:pageview', onPv);
    return () => window.removeEventListener('ga-forecast:pageview', onPv);
  }, [enabled]);

  const closePanel = useCallback(() => {
    try {
      sessionStorage.removeItem(SS_KEY);
    } catch (_) {
      /* ignore */
    }
    setHidden(true);
  }, []);

  if (!enabled || hidden) return null;

  const row = (ok, label, sub, time) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 600 }}>
        <span style={{ color: ok ? '#34d399' : '#9ca3af' }}>{ok ? '[完了]' : '[待ち]'}</span>
        {' '}
        {label}
        {time ? <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>{time}</span> : null}
      </div>
      {sub ? <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub}</div> : null}
    </div>
  );

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        maxWidth: 360,
        zIndex: 99999,
        background: '#1f2937',
        color: '#f9fafb',
        padding: 16,
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.45,
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>アクセス記録の確認（ステップ）</div>
        <button
          type="button"
          onClick={closePanel}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 12,
            padding: '0 0 0 8px',
          }}
        >
          {'\u9589\u3058\u308b'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
        通常の利用では表示されません。OFFにするには「{'\u9589\u3058\u308b'}」か、URLから{' '}
        <code style={{ color: '#d1d5db' }}>?ga_step=1</code> を外してください。
      </div>
      {row(step1, 'ステップ1: 確認モードをオンにしました', 'URL に ?ga_step=1 があるか、前にオンにした記録があります。', t1)}
      {row(step2, 'ステップ2: ページの準備ができました', '表示中のパスを使える状態です。', t2)}
      {row(
        step3,
        '\u30b9\u30c6\u30c3\u30d73: \u8a08\u6e2c\u7528\u306e gtag \u304c\u4f7f\u3048\u307e\u3059',
        step3Timeout
          ? '10秒待っても gtag がありません。ネットワークやブロックを疑ってください。'
          : step3Wait
            ? 'gtag の出現を待っています…'
            : 'ブラウザに gtag の入口があります。',
        t3,
      )}
      {row(step4, 'ステップ4: gtag.js（ライブラリ）を読み込みました', 'googletagmanager のスクリプトの読み込みが終わったときにチェックします。', t4)}
      {row(
        step5,
        'ステップ5: アクセス記録の送信を呼び出しました',
        sendDetail ? `パス: ${sendDetail}` : 'このサイトから「記録して」と命令した直後です。',
        t5,
      )}
    </div>
  );
}
