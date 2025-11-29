import { create } from "zustand";
import { useNotifyStore } from "./notifyStore";

import {
    Campaign, Query,
    fetchCampaigns, fetchCampaign, createCampaign,
    fetchQueries, createQuery
} from "../api/campaigns";

type State = {
    campaigns: Record<number, Campaign>;
    campaignIds: number[];
    queriesByCampaign: Record<number, Record<number, Query>>;
    queryIdsByCampaign: Record<number, number[]>
    loading: boolean;
    error?: string;
}

type Actions = {
    loadCampaigns: () => Promise<void>;
    getCampaign: (id: number) => Promise<Campaign>;
    addCampaign: (payload: Pick<Campaign, "plt" | "name">) => Promise<Campaign>;
    loadQueriesForCampaign: (campaignId: number) => Promise<void>;
    addQuery: (payload: Pick<Query, "campaign" | "search_term">) => Promise<Query>;
}

export const useCampaignStore = create<State & Actions>((set, get) => ({
    campaigns: {},
    campaignIds: [],
    queriesByCampaign: {},
    queryIdsByCampaign: {},
    loading: false,

    async loadCampaigns() {
        set({ loading: true, error: undefined });
        try {
            const data = await fetchCampaigns();
            const map: Record<number, Campaign> = {};
            const ids: number[] = [];
            data.forEach(c => { map[c.campaign_id] = c; ids.push(c.campaign_id); });
            set({ campaigns: map, campaignIds: ids, loading: false });
        } catch (e: any) {
            const msg = e?.response?.data?.error?.message || "Failed to load campaigns";
            useNotifyStore.getState().push(msg, "error");
            set({ loading: false, error: msg });
        }
    },

    async getCampaign(id: number) {
        const cached = get().campaigns[id];
        if (cached) return cached;
        const c = await fetchCampaign(id);
        set(state => ({
            campaigns: { ...state.campaigns, [c.campaign_id]: c },
            campaignIds: state.campaignIds.includes(c.campaign_id) ? state.campaignIds : [c.campaign_id, ...state.campaignIds],
        }));
        return c;
    },

    async addCampaign(payload) {
        const c = await createCampaign(payload);
        set(state => ({
            campaigns: { ...state.campaigns, [c.campaign_id]: c },
            campaignIds: [c.campaign_id, ...state.campaignIds],
        }));
        useNotifyStore.getState().push("Campaign created", "success");
        return c;
    },

    async loadQueriesForCampaign(campaignId: number) {
        const data = await fetchQueries(campaignId);
        const map: Record<number, Query> = {};
        const ids: number[] = [];
        data.forEach(q => { map[q.query_id] = q; ids.push(q.query_id); });
        set(state => ({
            queriesByCampaign: { ...state.queriesByCampaign, [campaignId]: map },
            queryIdsByCampaign: { ...state.queryIdsByCampaign, [campaignId]: ids },
        }));
    },

    async addQuery(payload) {
        const q = await createQuery(payload);
        set(state => {
            const cid = q.campaign;
            const cmap = state.queriesByCampaign[cid] ?? {};
            const cids = state.queryIdsByCampaign[cid] ?? [];
            return {
                queriesByCampaign: { ...state.queriesByCampaign, [cid]: { ...cmap, [q.query_id]: q } },
                queryIdsByCampaign: { ...state.queryIdsByCampaign, [cid]: [q.query_id, ...cids] },
            };
        });
        useNotifyStore.getState().push("Query added", "success");
        return q;
    },
}));