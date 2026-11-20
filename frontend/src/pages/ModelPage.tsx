import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Cell, LineChart, Line,
} from 'recharts';
import { useState } from 'react';
import historyData from '../data/training_history.json';

// ─── Số liệu THỰC từ comparison_report.json ──────────────────────────────────
const MODELS = [
  { key: 'Vanilla LSTM', label: 'LSTM Vanilla', acc: 84.35, f1: 83.09, color: '#10b981' },
  { key: 'BiLSTM',       label: 'BiLSTM',       acc: 79.36, f1: 79.20, color: '#6366f1' },
  { key: 'Transformer',  label: 'Transformer',  acc: 94.34, f1: 94.00, color: '#8b5cf6' },
];

const CLASSES = ['push-up', 'lat raise', 'squat', 'pull Up', 'leg raises'];

const CM: Record<string, number[][]> = {
  'Vanilla LSTM': [
    [281,1,2,0,5],[0,135,36,0,0],[7,12,202,0,17],[0,0,1,148,0],[0,24,21,40,129],
  ],
  BiLSTM: [
    [262,0,2,0,25],[0,131,37,0,3],[11,0,207,7,13],[0,0,3,146,0],[0,0,97,21,96],
  ],
  Transformer: [
    [287,0,2,0,0],[0,151,20,0,0],[1,8,223,0,6],[1,0,2,144,2],[0,0,7,11,196],
  ],
};

function getRecall(cm: number[][], i: number): number {
  const row = cm[i];
  const total = row.reduce((a, b) => a + b, 0);
  return total === 0 ? 0 : Math.round((row[i] / total) * 100);
}

const RADAR_DATA = CLASSES.map((cls, i) => ({
  cls,
  'LSTM Vanilla': getRecall(CM['Vanilla LSTM'], i),
  BiLSTM:         getRecall(CM['BiLSTM'], i),
  Transformer:    getRecall(CM['Transformer'], i),
}));

const BAR_DATA = MODELS.map((m) => ({
  name:          m.label,
  'Accuracy (%)': m.acc,
  'F1 Macro (%)': m.f1,
  color:         m.color,
}));

// ─── Training history (thực) ─────────────────────────────────────────────────
type HistKey = 'transformer' | 'lstm' | 'lstm_vanilla';

const HIST_MODELS: { key: HistKey; label: string; color: string }[] = [
  { key: 'transformer',  label: 'Transformer',  color: '#8b5cf6' },
  { key: 'lstm',         label: 'BiLSTM',       color: '#6366f1' },
  { key: 'lstm_vanilla', label: 'LSTM Vanilla',  color: '#10b981' },
];

function buildHistChart(key: HistKey) {
  const h = (historyData as Record<string, { accuracy: number[]; val_accuracy: number[]; loss: number[]; val_loss: number[] }>)[key];
  return h.accuracy.map((acc, i) => ({
    epoch:      i + 1,
    train_acc:  acc,
    val_acc:    h.val_accuracy[i],
    train_loss: h.loss[i],
    val_loss:   h.val_loss[i],
  }));
}

function HeatCell({ value, max }: { value: number; max: number }) {
  const opacity = max > 0 ? value / max : 0;
  return (
    <div style={{
      height: 36, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: value > 0 ? 600 : 400,
      background: `rgba(99,102,241,${opacity * 0.75 + 0.04})`,
      color: opacity > 0.5 ? '#3730a3' : '#6b7280',
    }}>{value}</div>
  );
}

export default function ModelPage() {
  const [cmModel, setCmModel]     = useState<string>('Transformer');
  const [histModel, setHistModel] = useState<HistKey>('transformer');

  const cm    = CM[cmModel];
  const maxVal = Math.max(...cm.flat());
  const histChart = buildHistChart(histModel);
  const selectedHist = HIST_MODELS.find(m => m.key === histModel)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Model</h1>
        <p className="page-subtitle">So sánh 3 model — test set 1 061 mẫu (video-level split, no leakage)</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {[
          { label: 'Vanilla LSTM',   value: '84.35%', sub: 'F1 0.8309', accent: '#10b981' },
          { label: 'BiLSTM',         value: '79.36%', sub: 'F1 0.7920', accent: '#6366f1' },
          { label: '🏆 Transformer', value: '94.34%', sub: 'F1 0.9400', accent: '#8b5cf6' },
          { label: 'Window Size',    value: '30f',    sub: '99 features/frame', accent: '#06b6d4' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
            <div className="stat-accent" style={{ background: s.accent }} />
          </div>
        ))}
      </div>

      {/* Training curves — dữ liệu thực */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>
            <span className="section-title-icon">⬢</span>
            Training History (thực tế)
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {HIST_MODELS.map((m) => (
              <button key={m.key}
                className={`btn ${histModel === m.key ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => setHistModel(m.key)}
              >{m.label}</button>
            ))}
          </div>
        </div>
        <div className="two-col" style={{ gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Accuracy</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={histChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v*100).toFixed(0)}%`} domain={[0.4, 1.05]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${(v*100).toFixed(1)}%`}
                  contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="train_acc" stroke={selectedHist.color} strokeWidth={2} dot={false} name="Train Acc" />
                <Line dataKey="val_acc"   stroke="#94a3b8"             strokeWidth={2} dot={false} name="Val Acc" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Loss</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={histChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
                <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="train_loss" stroke="#ef4444" strokeWidth={2} dot={false} name="Train Loss" />
                <Line dataKey="val_loss"   stroke="#f59e0b" strokeWidth={2} dot={false} name="Val Loss" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar + Radar */}
      <div className="two-col">
        <div className="glass-card">
          <p className="section-title">
            <span className="section-title-icon">⬢</span>
            Accuracy &amp; F1 — 3 Model
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BAR_DATA} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`}
                contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Accuracy (%)" radius={[4,4,0,0]}>
                {BAR_DATA.map((m) => <Cell key={m.name} fill={m.color} />)}
              </Bar>
              <Bar dataKey="F1 Macro (%)" fill="#94a3b8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <p className="section-title">
            <span className="section-title-icon">⬡</span>
            Recall per Class (%)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(99,102,241,0.12)" />
              <PolarAngleAxis dataKey="cls" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Radar name="LSTM Vanilla" dataKey="LSTM Vanilla" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
              <Radar name="BiLSTM"       dataKey="BiLSTM"       stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} />
              <Radar name="Transformer"  dataKey="Transformer"  stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="glass-card">
        <p className="section-title">
          <span className="section-title-icon">⬢</span>
          Bảng So Sánh Chi Tiết
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              <th style={{ textAlign: 'left', paddingBottom: 10, fontWeight: 600 }}>Model</th>
              <th style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>Test Acc</th>
              <th style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>F1 Macro</th>
              <th style={{ textAlign: 'right', paddingBottom: 10, fontWeight: 600 }}>Epochs</th>
            </tr>
          </thead>
          <tbody>
            {[
              { ...MODELS[0], epochs: 30 },
              { ...MODELS[1], epochs: 30 },
              { ...MODELS[2], epochs: 68 },
            ].map((m) => (
              <tr key={m.key} style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                <td style={{ padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, display: 'inline-block' }} />
                    {m.label}
                    {m.key === 'Transformer' && <span className="badge badge-indigo" style={{ fontSize: 10 }}>🏆 Winner</span>}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: m.key === 'Transformer' ? '#6366f1' : 'var(--text-primary)' }}>
                  {m.acc.toFixed(2)}%
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{m.f1.toFixed(2)}%</td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{m.epochs}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
          Test set: 1 061 mẫu · video-level split (70/15/15) · không data leakage
        </p>
      </div>

      {/* Confusion matrix */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>
            <span className="section-title-icon">⬢</span>
            Confusion Matrix
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.keys(CM).map((m) => (
              <button key={m}
                className={`btn ${cmModel === m ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => setCmModel(m)}
              >{m}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 3, marginBottom: 4 }}>
          <div />
          {CLASSES.map((c) => (
            <div key={c} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{c}</div>
          ))}
        </div>
        {cm.map((row, r) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              {CLASSES[r]}
            </div>
            {row.map((val, c) => <HeatCell key={c} value={val} max={maxVal} />)}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {CLASSES.map((ex, i) => (
            <span key={ex} className="badge badge-indigo" style={{ fontSize: 11 }}>{i}: {ex}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
