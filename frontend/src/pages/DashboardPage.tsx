export default function DashboardPage() {
  const EXERCISES = [
    { label: 'Push-up',       icon: '💪', color: '#6366f1', total: 56,  pct: 56/169 },
    { label: 'Lateral Raise', icon: '🏋', color: '#8b5cf6', total: 37,  pct: 37/169 },
    { label: 'Squat',         icon: '🦵', color: '#06b6d4', total: 29,  pct: 29/169 },
    { label: 'Pull Up',       icon: '🤸', color: '#10b981', total: 26,  pct: 26/169 },
    { label: 'Leg Raises',    icon: '🧘', color: '#f59e0b', total: 21,  pct: 21/169 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Tổng quan dự án nhận diện tư thế tập luyện</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Bài tập',  value: '5',    sub: '5 exercise classes',           accent: '#6366f1' },
          { label: 'Videos',   value: '169',  sub: 'tổng dataset gốc',             accent: '#8b5cf6' },
          { label: 'Models',   value: '3',    sub: 'Vanilla LSTM · BiLSTM · Transformer', accent: '#06b6d4' },
          { label: 'FPS',      value: '30',   sub: 'chuẩn hóa pipeline',           accent: '#10b981' },
          { label: 'Features', value: '99',   sub: '33 keypoints × 3 (x,y,z)',     accent: '#f59e0b' },
          { label: 'Window',   value: '30f',  sub: '1 giây mỗi sequence',          accent: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      <div className="glass-card">
        <p className="section-title">
          <span className="section-title-icon">⬡</span>
          Phân bố Dataset (169 videos, video-level split 70/15/15)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {EXERCISES.map((ex) => (
            <div key={ex.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{ex.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ex.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.total} videos</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ex.pct * 100}%`, background: `linear-gradient(90deg, ${ex.color}, ${ex.color}99)` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-card">
        <p className="section-title">
          <span className="section-title-icon">◎</span>
          ML Pipeline
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['Video Input', 'MediaPipe Pose', '33 Keypoints', 'Sliding Window (30f)', 'Normalize', 'LSTM / Transformer', 'Prediction + Score'].map((step, i, arr) => (
            <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-indigo" style={{ whiteSpace: 'nowrap' }}>{step}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Sprint status — DONE */}
      <div className="two-col">
        <div className="glass-card">
          <p className="section-title">Sprint 1 &amp; 2 — Data + Training</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { task: 'EDA & thống kê dataset (169 videos)', done: true },
              { task: 'Extract keypoints MediaPipe Tasks API', done: true },
              { task: 'Augment 4× + Normalize + Video-level Split', done: true },
              { task: 'Train Vanilla LSTM (test 84.35%)', done: true },
              { task: 'Train BiLSTM (test 79.36%)', done: true },
              { task: 'Train Transformer (test 94.34%) — Winner', done: true },
              { task: '3-model comparison + retrain final_model.h5', done: true },
            ].map((t) => (
              <div key={t.task} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.task}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card">
          <p className="section-title">Sprint 3 — Backend + Demo</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { task: 'FastAPI ml_backend/ (4 files)', done: true },
              { task: 'Node.js Express backend (port 3001)', done: true },
              { task: 'React frontend — 5 pages', done: true },
              { task: 'PoseCanvas skeleton overlay (33 landmarks)', done: true },
              { task: 'Upload Video → predict + score', done: true },
              { task: 'Live Webcam → real-time predict', done: true },
              { task: 'Skeleton toggle ON/OFF', done: true },
            ].map((t) => (
              <div key={t.task} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
