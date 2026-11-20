import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export interface PredictResult {
  exercise:         string;
  confidence:       number;
  score:            number;
  feedback?:        string;
  /** list of 99-float arrays per frame — dùng để vẽ skeleton */
  keypoints_frames?: number[][];
}

const http = axios.create({ baseURL: BACKEND_URL, timeout: 120_000 });

export const api = {
  async healthCheck(): Promise<{ status: string }> {
    const { data } = await http.get('/api/status');
    return data;
  },

  async predictVideo(file: File, model: string): Promise<PredictResult> {
    const form = new FormData();
    form.append('video', file);
    form.append('model_name', model);   // ← Node đọc 'model_name'
    const { data } = await http.post<PredictResult>('/api/predict/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async predictFrame(frameFile: File, model: string): Promise<PredictResult> {
    const form = new FormData();
    form.append('frame', frameFile);
    form.append('model_name', model);   // ← Node đọc 'model_name'
    const { data } = await http.post<PredictResult>('/api/predict/frame', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
