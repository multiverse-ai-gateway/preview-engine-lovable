import { useState } from 'react';

function App() {
    const [prompt, setPrompt] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    const generatePreview = async () => {
        setStatus('Generating your preview...');
        const response = await fetch('https://your-orchestrator-api.onrender.com/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, userId: 'user_123' })
        });

        const { previewId } = await response.json();

        // Poll for status
        const poll = setInterval(async () => {
            const statusRes = await fetch(`https://your-orchestrator-api.onrender.com/api/preview/${previewId}`);
            const data = await statusRes.json();

            setStatus(data.status);
            if (data.status === 'live' && data.liveUrl) {
                setPreviewUrl(data.liveUrl);
                clearInterval(poll);
            }
            if (data.status === 'failed') {
                setStatus('Failed to generate preview');
                clearInterval(poll);
            }
        }, 2000);
    };

    return (
        <div>
            <h1>AI App Builder</h1>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your app..." />
            <button onClick={generatePreview}>Generate Live Preview</button>

            <p>Status: {status}</p>

            {previewUrl && (
                <div>
                    <h2>Live Preview:</h2>
                    <iframe
                        src={previewUrl}
                        style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
                        title="Live Preview"
                    />
                </div>
            )}
        </div>
    );
}
