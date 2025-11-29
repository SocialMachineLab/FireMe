import { create } from 'zustand'
import {
    Platform,
    AppUpsertBody,
    ConnectCredentialsBody,

    listPlatforms,
    upsertApp,
    connectCredentials,
    disconnect
} from '../api/platforms'

type State = {
    platforms: Platform[];
    loading: boolean;
    error?: string;
}

type Actions = {
    fetchPlatforms: () => Promise<void>;
    saveApp: (pltId: number, body: AppUpsertBody) => Promise<void>;
    saveConnection: (pltId: number, body: ConnectCredentialsBody) => Promise<void>;
    disconnectAll: (pltId: number) => Promise<void>;
};

export const usePlatformStore = create<State & Actions>((set, get) => ({

    platforms: [],
    loading: false,
    error: undefined,

    fetchPlatforms: async () => {
        set({ loading: true, error: undefined });
        try {
            const data = await listPlatforms();
            set({ platforms: data, loading: false })
        } catch (e: any) {
            set({ error: e?.message || "Failed to load platforms", loading: false });
        }
    },
    saveApp: async (pltId, body) => {
        await upsertApp(pltId, body);
        await get().fetchPlatforms(); // pull fresh 'connected' flags
    },

    saveConnection: async (pltId, body) => {
        await connectCredentials(pltId, body);
        await get().fetchPlatforms();
    },

    disconnectAll: async (pltId) => {
        await disconnect(pltId);
        await get().fetchPlatforms();
    }
}))