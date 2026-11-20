interface Props {
  score: number;    // 0-100
  label?: string;
  size?: number;
}

export default function ScoreCard({ score, label = 'Score', size = 110 }: Props) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring-container">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{ marginTop: -size / 2 - 8, textAlign: 'center', lineHeight: 1.2 }}>
        <div style={{ fontSize: size * 0.24, fontWeight: 700, color, letterSpacing: '-0.03em' }}>
          {pct}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}
