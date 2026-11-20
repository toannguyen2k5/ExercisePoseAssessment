/**
 * PoseCanvas.tsx
 * Vẽ skeleton MediaPipe 33 landmarks lên canvas overlay.
 * Props:
 *   keypoints  — array of [x, y, z] × 33 = 99 floats (normalized 0–1)
 *   width/height — kích thước video/webcam
 *   show       — toggle hiển thị
 */

import { useEffect, useRef } from 'react';

// MediaPipe Pose connections (index pairs)
const POSE_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],
  [9,10],
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [15,17],[16,18],[15,19],[16,20],[15,21],[16,22],
  [11,23],[12,24],[23,24],
  [23,25],[24,26],[25,27],[26,28],
  [27,29],[28,30],[29,31],[30,32],[27,31],[28,32],
];

interface Props {
  /** Flat array of 99 floats: [x0,y0,z0, x1,y1,z1, …, x32,y32,z32] (0–1 normalized) */
  keypoints: number[] | null;
  width:  number;
  height: number;
  show:   boolean;
}

export default function PoseCanvas({ keypoints, width, height, show }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!show || !keypoints || keypoints.length < 99) return;

    // Lấy toạ độ pixel từ normalized [0,1]
    const pts: [number, number][] = [];
    for (let i = 0; i < 33; i++) {
      pts.push([keypoints[i * 3] * width, keypoints[i * 3 + 1] * height]);
    }

    // Vẽ đường nối (bones)
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = 'rgba(99,102,241,0.75)';
    for (const [a, b] of POSE_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }

    // Vẽ điểm khớp (joints)
    for (const [px, py] of pts) {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle   = '#6366f1';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();
    }
  }, [keypoints, width, height, show]);

  if (!show) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        pointerEvents: 'none',
        borderRadius:  'var(--radius)',
      }}
    />
  );
}

