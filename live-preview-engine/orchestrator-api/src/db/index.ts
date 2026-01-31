import Dexie, { Table } from 'dexie';

export interface Preview {
    id: string;
    prompt: string;
    userId: string;
    status: 'building' | 'generating' | 'deploying' | 'live' | 'failed';
    liveUrl: string | null;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class PreviewDatabase extends Dexie {
    previews!: Table<Preview, string>;

    constructor() {
        super('PreviewDatabase');
        this.version(1).stores({
            previews: '&id, userId, status, createdAt'
        });
    }
}

export const db = new PreviewDatabase();
