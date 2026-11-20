import { useCallback, useRef, useState } from 'react';
import ModelSelector, { type ModelType } from '../components/ui/ModelSelector';
import ScoreCard from '../components/ui/ScoreCard';
import ActivityLog, { makeLog, type LogEntry } from '../components/ui/ActivityLog';
import PoseCanvas from '../components/ui/PoseCanvas';
import { api, type PredictResult } from '../services/api';

export default function UploadPage() {
  const [model, setModel]             = useState<ModelType>('transformer');
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<PredictResult | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [logs, setLogs]               = useState<LogEntry[]>([
    makeLog('Chọn video để bắt đầu dự đoán…', 'info'),
  ]);
  const inputRef   = useRef<HTMLInputElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  // Bug #9 fix: dùng ref để đọc rendered size thực của video element
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [videoSize, setVideoSize] = useState({ w: 640, h: 360 });

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    setLogs((prev) => [...prev, makeLog(message, level)]);
  };

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setPreview(URL.createObjectURL(f));
    addLog(`Đã chọn: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`, 'info');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) handleFile(f);
    else addLog('File không hợp lệ. Chỉ nhận video.', 'error');
  }, []);

  const predict = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    addLog(`Đang gửi video lên server (model: ${model})…`, 'info');
    try {
      const res = await api.predictVideo(file, model);
      setResult(res);
      addLog(`Nhận diện: ${res.exercise} (${(res.confidence * 100).toFixed(1)}% confidence)`, 'ok');
      addLog(`Điểm chất lượng: ${res.score}/100`, 'ok');
      if (res.keypoints_frames?.length) {
        addLog(`Skeleton: ${res.keypoints_frames.length} frames keypoints nhận được`, 'info');
      }
    } catch (err) {
      addLog('Lỗi kết nối server. Kiểm tra FastAPI port 8000.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const LABEL_MAP: Record<string, string> = {
    'push-up': 'Push-up', 'lateral raise': 'Lateral Raise',
    'squat': 'Squat', 'pull Up': 'Pull Up', 'leg raises': 'Leg Raises',
  };

  // Lấy frame giữa của keypoints để hiển thị skeleton
  const skeletonKp = result?.keypoints_frames?.length
    ? result.keypoints_frames[Math.floor(result.keypoints_frames.length / 2)]
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <h1 className="page-title">Upload Video</h1>
        <p className="page-subtitle">Tải lên video để nhận diện bài tập và chấm điểm</p>
      </div>

      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Left: upload + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
          >
            <input
              ref={inputRef} type="file" accept="video/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <span className="drop-zone-icon">🎬</span>
            {file ? (
              <span className="drop-zone-title" style={{ color: 'var(--indigo-dark)' }}>{file.name}</span>
            ) : (
              <>
                <span className="drop-zone-title">Kéo thả hoặc click để chọn video</span>
                <span className="drop-zone-sub">MP4, AVI, MOV — tối đa 200MB</span>
              </>
            )}
          </div>

          {/* Model selector */}
          <div className="glass-card" style={{ padding: 16 }}>
            <p className="section-title" style={{ marginBottom: 10 }}>Chọn Model</p>
            <ModelSelector value={model} onChange={setModel} />
          </div>

          {/* Predict button */}
          <button className="btn btn-primary" onClick={predict} disabled={!file || loading}
            style={{ width: '100%', padding: '12px 0', fontSize: 14 }}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Đang xử lý…</>
            ) : '🔍  Nhận diện bài tập'}
          </button>

          <div className="glass-card" style={{ padding: 16 }}>
            {/* Bug #10 fix: truyền exportPrefix để phân biệt log nguồn upload */}
            <ActivityLog entries={logs} exportPrefix="upload" />
          </div>
        </div>

        {/* Right: preview + result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {preview && (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <video
                ref={videoRef}
                src={preview}
                controls
                style={{ width: '100%', display: 'block', borderRadius: 'var(--radius)' }}
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  // Bug #9 fix: dùng rendered width × aspect ratio để khớp canvas
                  const renderW = v.clientWidth || 640;
                  const aspectH = v.videoHeight > 0
                    ? Math.round(renderW * v.videoHeight / v.videoWidth)
                    : 360;
                  setVideoSize({ w: renderW, h: aspectH });
                }}
              />
              {/* Skeleton overlay */}
              {skeletonKp && (
                <PoseCanvas
                  keypoints={skeletonKp}
                  width={videoSize.w}
                  height={videoSize.h}
                  show={showSkeleton}
                />
              )}
            </div>
          )}

          {/* Skeleton toggle */}
          {result?.keypoints_frames?.length && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className={`btn ${showSkeleton ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setShowSkeleton((v) => !v)}
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                🦴 Skeleton {showSkeleton ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {result && (
            <div className="glass-card glass-card-strong">
              <p className="section-title">Kết quả</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ScoreCard score={result.score} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {LABEL_MAP[result.exercise] ?? result.exercise}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-indigo">{model.toUpperCase()}</span>
                    <span className="badge badge-green">
                      {(result.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  {result.feedback && (
                    <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {result.feedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!preview && !result && (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Video preview sẽ hiển thị ở đây</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
