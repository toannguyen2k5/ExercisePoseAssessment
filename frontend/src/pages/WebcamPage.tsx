import { useCallback, useEffect, useRef, useState } from 'react';
import ModelSelector, { type ModelType } from '../components/ui/ModelSelector';
import ScoreCard from '../components/ui/ScoreCard';
import ActivityLog, { makeLog, type LogEntry } from '../components/ui/ActivityLog';
import PoseCanvas from '../components/ui/PoseCanvas';
import { api, type PredictResult } from '../services/api';

const THROTTLE_MS = 1500;

export default function WebcamPage() {
  const [model, setModel]             = useState<ModelType>('transformer');
  const [prevModel, setPrevModel]     = useState<ModelType>('transformer');
  const [running, setRunning]         = useState(false);
  const [result, setResult]           = useState<PredictResult | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [currentKp, setCurrentKp]     = useState<number[] | null>(null);
  // videoSize: đọc từ videoRef sau khi stream gắn vào, không phải từ metadata file
  const [videoSize, setVideoSize]     = useState({ w: 640, h: 480 });
  const [logs, setLogs]               = useState<LogEntry[]>([
    makeLog('Nhấn "Bật Webcam" để bắt đầu…', 'info'),
  ]);

  const videoRef      = useRef<HTMLVideoElement>(null);
  const captureCanvas = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRef       = useRef<number>(0);

  const addLog = (msg: string, level: LogEntry['level'] = 'info') =>
    setLogs((prev) => [...prev.slice(-60), makeLog(msg, level)]);

  // Bug #3 fix: reset frame buffer khi đổi model
  useEffect(() => {
    if (model !== prevModel && running) {
      fetch(`http://localhost:3001/api/predict/frame/reset?model_name=${prevModel}`, { method: 'DELETE' })
        .catch(() => {}); // silent
      setResult(null);
      setCurrentKp(null);
      addLog(`Đổi model → ${model}, reset buffer`, 'warn');
    }
    setPrevModel(model);
  }, [model]);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      const vid = videoRef.current;
      if (vid) {
        vid.srcObject = stream;
        await vid.play();
        // Bug #2 fix: đọc kích thước từ stream track settings, không phải metadata event
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        setVideoSize({ w: settings.width ?? 640, h: settings.height ?? 480 });
      }
      setRunning(true);
      addLog('Camera bật thành công', 'ok');
    } catch {
      addLog('Không thể truy cập camera. Kiểm tra quyền.', 'error');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setResult(null);
    setCurrentKp(null);
    addLog('Camera đã tắt', 'warn');
  }, []);

  // Capture + predict loop
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(async () => {
      const now = Date.now();
      if (now - lastRef.current < THROTTLE_MS) return;
      lastRef.current = now;

      const video  = videoRef.current;
      const canvas = captureCanvas.current;
      if (!video || !canvas || video.readyState < 2) return;

      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const frameFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
        try {
          const res = await api.predictFrame(frameFile, model);
          setResult(res);
          if (res.keypoints_frames?.length) {
            setCurrentKp(res.keypoints_frames[res.keypoints_frames.length - 1]);
          }
          if (res.exercise !== '...') {
            addLog(`${res.exercise} — score ${res.score} (${(res.confidence * 100).toFixed(0)}%)`, 'ok');
          }
        } catch {
          addLog('Frame gửi thất bại. Kiểm tra API.', 'error');
        }
      }, 'image/jpeg', 0.80);
    }, 300);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, model]);

  const LABEL_MAP: Record<string, string> = {
    'push-up': 'Push-up', 'lateral raise': 'Lateral Raise',
    'squat': 'Squat', 'pull Up': 'Pull Up', 'leg raises': 'Leg Raises',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Live Webcam</h1>
        <p className="page-subtitle">Nhận diện real-time qua camera</p>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Left: camera + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Video container */}
          <div className="webcam-container" style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay muted playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: running ? 'block' : 'none' }}
            />
            {/* Hidden canvas for capture */}
            <canvas ref={captureCanvas} style={{ display: 'none' }} />

            {/* Bug #2 fix: skeleton overlay — dùng videoSize từ stream track */}
            {running && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <PoseCanvas
                  keypoints={currentKp}
                  width={videoSize.w}
                  height={videoSize.h}
                  show={showSkeleton}
                />
              </div>
            )}

            {!running && (
              <div className="webcam-overlay">
                <span style={{ fontSize: 36 }}>📷</span>
                <span>Camera chưa bật</span>
              </div>
            )}

            {running && result && result.exercise !== '...' && (
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(12px)',
                borderRadius: 10, padding: '6px 12px',
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                zIndex: 10,
              }}>
                {LABEL_MAP[result.exercise] ?? result.exercise} — {result.score}/100
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!running ? (
              <button className="btn btn-primary" onClick={startWebcam} style={{ flex: 1, padding: '11px 0' }}>
                📷  Bật Webcam
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={stopWebcam} style={{ flex: 1, padding: '11px 0' }}>
                ⏹  Dừng Camera
              </button>
            )}
            <button
              className={`btn ${showSkeleton ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setShowSkeleton((v) => !v)}
              style={{ padding: '11px 16px', fontSize: 13 }}
              title="Bật/tắt skeleton"
            >
              🦴 {showSkeleton ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>Chọn Model</p>
            <ModelSelector value={model} onChange={setModel} />
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            {/* Bug #10 fix: truyền exportPrefix để phân biệt nguồn log */}
            <ActivityLog entries={logs} exportPrefix="webcam" />
          </div>
        </div>

        {/* Right: result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result && result.exercise !== '...' ? (
            <div className="glass-card glass-card-strong">
              <p className="section-title">Nhận diện gần nhất</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ScoreCard score={result.score} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {LABEL_MAP[result.exercise] ?? result.exercise}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-indigo">{model.toUpperCase()}</span>
                    <span className="badge badge-green">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  {result.feedback && result.feedback !== '...' && (
                    <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 32 }}>🤖</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {running
                  ? result?.exercise === '...'
                    ? result.feedback
                    : 'Đang phân tích frame…'
                  : 'Bật camera để bắt đầu nhận diện'}
              </span>
            </div>
          )}

          <div className="glass-card" style={{ padding: 16 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>Hướng dẫn</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['1', 'Chọn model (Transformer khuyến nghị)'],
                ['2', 'Nhấn "Bật Webcam" và cấp quyền camera'],
                ['3', 'Thực hiện bài tập trước camera'],
                ['4', 'Kết quả cập nhật mỗi 1.5 giây'],
                ['5', 'Nhấn 🦴 để bật/tắt skeleton overlay'],
              ].map(([n, t]) => (
                <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="badge badge-indigo" style={{ fontSize: 11, flexShrink: 0 }}>{n}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
