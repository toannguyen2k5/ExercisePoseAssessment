import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CLASS_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
const EXERCISES = ['push-up', 'lateral raise', 'squat', 'pull Up', 'leg raises'];

const CLASS_DATA = EXERCISES.map((name, i) => ({
  name: name.replace(' ', '\n'),
  videos: [56, 37, 29, 26, 21][i],   // số thực từ split_info.json (tổng 169)
  color: CLASS_COLORS[i],
}));

// Video browser
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

interface VideoItem { name: string; url: string }

export default function EDAPage() {
  const [selClass, setSelClass] = useState<string>(EXERCISES[0]);
  const [videos, setVideos]     = useState<VideoItem[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setVideos([]);
    fetch(`${BACKEND_URL}/api/videos/${encodeURIComponent(selClass)}`)
      .then((r) => r.json())
      .then((data: string[]) => {
        setVideos(
          data.map((name) => ({
            name,
            url: `${BACKEND_URL}/api/videos/${encodeURIComponent(selClass)}/${encodeURIComponent(name)}`,
          }))
        );
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, [selClass]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Dataset EDA</h1>
        <p className="page-subtitle">Phân tích dữ liệu và xem video mẫu</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {[
          { label: 'Tổng videos', value: '169',  accent: '#6366f1' },
          { label: 'Classes',     value: '5',    accent: '#8b5cf6' },
          { label: 'FPS target',  value: '30',   accent: '#06b6d4' },
          { label: 'Window size', value: '30f',  accent: '#10b981' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="glass-card">
        <p className="section-title">
          <span className="section-title-icon">⬡</span>
          Số video theo bài tập
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={CLASS_DATA} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              contentStyle={{ background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, fontSize: 13 }}
            />
            <Bar dataKey="videos" radius={[6, 6, 0, 0]}>
              {CLASS_DATA.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Video browser */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>
            <span className="section-title-icon">◉</span>
            Xem video dataset
          </p>
          <select
            className="select-glass"
            value={selClass}
            onChange={(e) => setSelClass(e.target.value)}
          >
            {EXERCISES.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Backend chưa chạy hoặc không có video cho class này.
            <br />
            <span style={{ fontSize: 12 }}>Khởi động Node backend trên port 3001.</span>
          </div>
        )}

        {!loading && videos.length > 0 && (
          <div className="video-grid">
            {videos.slice(0, 12).map((v) => (
              <div key={v.name} className="video-card">
                <video
                  src={v.url}
                  controls
                  muted
                  preload="metadata"
                  style={{ maxHeight: 150 }}
                />
                <div className="video-card-label" title={v.name}>{v.name}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && videos.length > 12 && (
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
            Hiển thị 12 / {videos.length} videos
          </p>
        )}
      </div>
    </div>
  );
}
