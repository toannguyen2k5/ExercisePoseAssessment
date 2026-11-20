export type ModelType = 'lstm' | 'transformer' | 'lstm_vanilla';

interface Props {
  value:    ModelType;
  onChange: (v: ModelType) => void;
}

const MODELS: { key: ModelType; label: string; desc: string }[] = [
  { key: 'transformer',  label: 'Transformer',  desc: 'Tốt nhất — 94.34% accuracy' },
  { key: 'lstm',         label: 'BiLSTM',        desc: 'Cân bằng — 79.36% accuracy' },
  { key: 'lstm_vanilla', label: 'LSTM Vanilla',  desc: 'Baseline — 84.35% accuracy' },
];

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="model-selector">
      {MODELS.map((m) => (
        <button
          key={m.key}
          className={`model-opt ${value === m.key ? 'selected' : ''}`}
          onClick={() => onChange(m.key)}
        >
          <span className="model-dot" />
          <span>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{m.label}</span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{m.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
