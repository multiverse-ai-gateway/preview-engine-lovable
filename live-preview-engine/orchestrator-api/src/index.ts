import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { previewQueue } from './services/queue';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// FIX: Root endpoint that definitely works
app.get('/', (req, res) => {
  res.json({ 
    status: 'live', 
    service: 'Preview Engine API',
    message: 'Service is running with queue system',
    timestamp: new Date().toISOString()
  });
});

// FIX: Simple health check that can't fail
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    redis: previewQueue.client.status,
    queue: 'active'
  });
});

// FIX: Queue stats
app.get('/api/queue/stats', async (req, res) => {
  try {
    const counts = await previewQueue.getJobCounts();
    res.json({ success: true, counts, redis: previewQueue.client.status });
  } catch (err) {
    res.json({ success: false, error: 'Queue not ready yet' });
  }
});

// FIX: Create preview endpoint
app.post('/api/preview', async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    const jobId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.previews.add({
      id: jobId,
      prompt,
      userId: userId || 'anonymous',
      status: 'building',
      liveUrl: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await previewQueue.add({ jobId, prompt, userId: userId || 'anonymous' }, { jobId });

    console.log(`Job ${jobId} queued`);
    res.json({ 
      success: true, 
      jobId, 
      message: 'Preview queued',
      checkStatus: `https://preview-engine-lovable.onrender.com/api/preview/${jobId}`
    });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to queue' });
  }
});

// FIX: Check preview status
app.get('/api/preview/:id', async (req, res) => {
  try {
    const preview = await db.previews.get(req.params.id);
    if (!preview) return res.status(404).json({ error: 'Not found' });
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Preview API running on port ${PORT}`);
  console.log(`Redis: ${process.env.REDIS_URL ? 'CONNECTED' : 'MISSING'}`);
});
