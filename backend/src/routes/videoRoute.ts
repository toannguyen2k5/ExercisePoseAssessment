import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// __dirname khi chay tsx = src/routes/, nen can len 3 cap la project root
// Dung process.cwd() de lay project root on dinh hon
const ARCHIVE_DIR = path.resolve(process.cwd(), 'archive');
const VIDEO_EXTS  = ['.mp4', '.avi', '.mov', '.MP4', '.AVI', '.MOV'];

// GET /api/videos/:exercise  → list video filenames
router.get('/:exercise', (req: Request, res: Response) => {
  const exercise = req.params.exercise;
  const folder   = path.join(ARCHIVE_DIR, exercise);

  if (!fs.existsSync(folder)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(folder)
      .filter((f) => VIDEO_EXTS.includes(path.extname(f)));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// GET /api/videos/:exercise/:filename  → stream video
router.get('/:exercise/:filename', (req: Request, res: Response) => {
  const { exercise, filename } = req.params;
  const filePath = path.join(ARCHIVE_DIR, exercise, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.range;

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');

  if (rangeHeader) {
    const parts   = rangeHeader.replace(/bytes=/, '').split('-');
    const start   = parseInt(parts[0], 10);
    const end     = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSz = end - start + 1;

    res.status(206);
    res.setHeader('Content-Range',  `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSz);

    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
});

export default router;

