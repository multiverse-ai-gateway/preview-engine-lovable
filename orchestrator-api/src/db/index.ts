import Dexie from 'dexie';

export interface Preview {
    id: string;
    prompt: string;
    userId: string;
    status: 'initializing' | 'generating_code' | 'deploying' | 'live' | 'failed';
    liveUrl: string | null;
    error?: string;
    createdAt: Date;
    updatedAt?: Date;
}

class PreviewDatabase extends Dexie {
    previews!: Dexie.Table<Preview, string>;

    constructor() {
        super('PreviewEngineDB');
        this.version(1).stores({
            previews: '&id, userId, status, createdAt'
        });
    }
}

export const db = new PreviewDatabase();
