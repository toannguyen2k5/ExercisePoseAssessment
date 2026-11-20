import axios from 'axios';
import FormData from 'form-data';

const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000';

export const mlService = {
  /** Gửi video (buffer) sang FastAPI để predict. */
  async predictVideo(videoBuffer: Buffer, filename: string, modelName: string) {
    const form = new FormData();
    form.append('file', videoBuffer, { filename, contentType: 'video/mp4' });
    form.append('model_name', modelName);

    const response = await axios.post(`${ML_URL}/predict/video`, form, {
      headers: form.getHeaders(),
      timeout: 180_000,          // 3 phút (video dài có thể lâu)
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  },

  /** Gửi 1 frame JPEG (buffer) sang FastAPI /predict/frame để tích lũy + predict. */
  async predictFrame(frameBuffer: Buffer, modelName: string) {
    const form = new FormData();
    form.append('file', frameBuffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });
    form.append('model_name', modelName);

    const response = await axios.post(`${ML_URL}/predict/frame`, form, {
      headers: form.getHeaders(),
      timeout: 15_000,
    });
    return response.data;
  },

  /** Gửi list base64 frames sang FastAPI (legacy webcam endpoint). */
  async predictFrames(frames: string[], modelName: string) {
    const response = await axios.post(
      `${ML_URL}/predict/frames`,
      { frames, model_name: modelName },
      { timeout: 15_000 }
    );
    return response.data;
  },
};
