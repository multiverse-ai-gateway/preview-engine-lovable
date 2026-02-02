import express from 'express';
import cors from 'cors';
import { generateAppCode } from './services/generator';
import { deployToNetlify } from './services/netlify';
import { db } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Endpoint to create a new preview
app.post('/api/preview', async (req, res) => {
    const { prompt, userId } = req.body;
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store initial state in DexieDB
    await db.previews.add({
        id: previewId,
        prompt,
        userId,
        status: 'initializing',
        liveUrl: null,
        createdAt: new Date()
    });

    // Process asynchronously
    processPreview(previewId, prompt).catch(console.error);

    res.json({ previewId, status: 'building' });
});

// 2. Endpoint to check preview status
app.get('/api/preview/:id', async (req, res) => {
    const preview = await db.previews.get(req.params.id);
    if (!preview) return res.status(404).json({ error: 'Preview not found' });
    res.json(preview);
});

// The core pipeline function
async function processPreview(previewId: string, prompt: string) {
    try {
        await db.previews.update(previewId, { status: 'generating_code' });

        // STEP 1: Generate the app code from the prompt
        const appCode = await generateAppCode(prompt); // Returns a folder path or zip

        await db.previews.update(previewId, { status: 'deploying' });

        // STEP 2: Deploy the generated code to Netlify
        const liveUrl = await deployToNetlify(appCode, previewId);

        // STEP 3: Update database with the LIVE URL
        await db.previews.update(previewId, {
            status: 'live',
            liveUrl: liveUrl,
            updatedAt: new Date()
        });

    } catch (error) {
        // ENHANCED ERROR LOGGING - ONLY THIS BLOCK WAS MODIFIED
        console.error(`[${previewId}] CRITICAL ERROR in processPreview:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await db.previews.update(previewId, {
            status: 'failed',
            error: errorMessage,
            updatedAt: new Date()
        });
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Orchestrator API running on port ${PORT}`));
