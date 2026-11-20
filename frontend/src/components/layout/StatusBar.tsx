import { useEffect, useState } from 'react';
import { api } from '../../services/api';

type Status = 'loading' | 'online' | 'offline';

export default function StatusBar() {
  const [status, setStatus] = useState<Status>('loading');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const check = async () => {
      const t0 = Date.now();
      try {
        await api.healthCheck();
        setLatency(Date.now() - t0);
        setStatus('online');
      } catch {
        setStatus('offline');
        setLatency(null);
      }
    };
    check();
    const id = setInterval(check, 6000);
    return () => clearInterval(id);
  }, []);

  const label = status === 'loading' ? 'Checking…' : status === 'online' ? 'API Online' : 'API Offline';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
      <span className={`status-dot ${status}`} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      {latency !== null && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{latency}ms</span>
      )}
    </div>
  );
}
