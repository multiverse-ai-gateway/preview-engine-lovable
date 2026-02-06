import Queue from 'bull';
import { processPreviewJob } from './generator';

const redisConfig = {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
};

export const previewQueue = new Queue('preview-generation', redisConfig);

previewQueue.process(2, async (job) => {
  console.log(`🚀 Processing preview job: ${job.id}`);
  try {
    await processPreviewJob(job.data);
    console.log(`✅ Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error);
    throw error;
  }
});

previewQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed in ${job.finishedOn - job.processedOn}ms`);
});

previewQueue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed with error:`, error);
});

setInterval(async () => {
  const completedCount = await previewQueue.getCompletedCount();
  const failedCount = await previewQueue.getFailedCount();
  if (completedCount > 100 || failedCount > 50) {
    await previewQueue.clean(1000 * 60 * 60 * 24);
    console.log('🧹 Cleaned old queue jobs');
  }
}, 1000 * 60 * 30);

export default previewQueue;
