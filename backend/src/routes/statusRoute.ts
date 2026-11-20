import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();
const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000';

// GET /api/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const r = await axios.get(`${ML_URL}/health`, { timeout: 3000 });
    res.json({
      node_backend: 'ok',
      ml_backend: 'ok',
      ml_detail: r.data
    });
  } catch {
    res.json({
      node_backend: 'ok',
      ml_backend: 'down',
      ml_detail: null
    });
  }
});

export { router as statusRoute };

