import express from 'express';
import cors from 'cors';
import path from 'path';
import { predictVideoRoute } from './routes/predictRoute';
import { statusRoute } from './routes/statusRoute';
import videoRoute from './routes/videoRoute';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', statusRoute);
app.use('/api', predictVideoRoute);
app.use('/api/videos', videoRoute);

// Health check
app.get('/', (_req, res) => {
  res.json({ message: 'ExercisePoseAssessment Node Backend', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Node Backend running on http://localhost:${PORT}`);
  console.log('ML Backend expected at:', process.env.ML_BACKEND_URL || 'http://localhost:8000');
});

export default app;

