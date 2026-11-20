import { Router, Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import { mlService } from '../services/mlService';

const router = Router();
const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
                     'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp4|avi|mov|jpg|jpeg|png)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Chi chap nhan file video (.mp4, .avi, .mov) hoac anh (.jpg, .png)'));
    }
  }
});

// POST /api/predict/video
router.post('/predict/video', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Chua co file video' });
      return;
    }
    // Frontend gui 'model_name' (hoac 'model' de tuong thich)
    const modelName = (req.body.model_name as string) || (req.body.model as string) || 'transformer';
    const result = await mlService.predictVideo(req.file.buffer, req.file.originalname, modelName);
    res.json(result);
  } catch (err: any) {
    console.error('predict/video error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/predict/frame  (single frame from webcam)
router.post('/predict/frame', upload.single('frame'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Chua co frame anh' });
      return;
    }
    const modelName = (req.body.model_name as string) || (req.body.model as string) || 'transformer';
    const result = await mlService.predictFrame(req.file.buffer, modelName);
    res.json(result);
  } catch (err: any) {
    console.error('predict/frame error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/predict/frames  (legacy: list base64 frames)
router.post('/predict/frames', async (req: Request, res: Response) => {
  try {
    const { frames, model_name } = req.body as { frames: string[]; model_name?: string };
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      res.status(400).json({ error: 'Chua co frames' });
      return;
    }
    const modelName = model_name || 'transformer';
    const result = await mlService.predictFrames(frames, modelName);
    res.json(result);
  } catch (err: any) {
    console.error('predict/frames error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/predict/frame/reset  — reset frame buffer (khi doi model webcam)
router.delete('/predict/frame/reset', async (req: Request, res: Response) => {
  try {
    const modelName = (req.query.model_name as string) || 'transformer';
    const response  = await axios.delete(
      `${ML_URL}/predict/frame/reset?model_name=${encodeURIComponent(modelName)}`,
      { timeout: 5_000 }
    );
    res.json(response.data);
  } catch {
    res.json({ status: 'reset', note: 'ml backend may be down' });
  }
});

export { router as predictVideoRoute };
