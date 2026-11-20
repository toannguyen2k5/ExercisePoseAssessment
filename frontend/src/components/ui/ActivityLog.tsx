import { useEffect, useRef } from 'react';

export type LogLevel = 'info' | 'ok' | 'error' | 'warn';

export interface LogEntry {
  id:      number;
  time:    string;
  icon:    string;
  message: string;
  level:   LogLevel;
}

interface Props {
  entries:      LogEntry[];
  /** Prefix cho tên file export, mặc định 'activity' */
  exportPrefix?: string;
}

function now() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function makeLog(message: string, level: LogLevel = 'info'): LogEntry {
  const icons: Record<LogLevel, string> = { info: '›', ok: '✓', error: '✗', warn: '!' };
  return { id: Date.now() + Math.random(), time: now(), icon: icons[level], message, level };
}

function exportLogs(entries: LogEntry[], prefix = 'activity') {
  const lines = entries.map((e) => `[${e.time}] ${e.icon} ${e.message}`);
  const blob  = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href     = url;
  a.download = `${prefix}_log_${dateStr}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityLog({ entries, exportPrefix = 'activity' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p className="section-title" style={{ marginBottom: 0 }}>
          <span className="section-title-icon">⬡</span>
          Activity Log
        </p>
        {entries.length > 0 && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={() => exportLogs(entries, exportPrefix)}
            title="Xuất log ra file .txt"
          >
            💾 Export
          </button>
        )}
      </div>
      <div className="activity-log" ref={ref}>
        {entries.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12, padding: '4px 0' }}>
            Chưa có hoạt động nào…
          </span>
        )}
        {entries.map((e) => (
          <div key={e.id} className="log-entry">
            <span className="log-time">{e.time}</span>
            <span className="log-icon">{e.icon}</span>
            <span className={`log-msg ${e.level}`}>{e.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
