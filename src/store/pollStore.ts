import { create } from "zustand";
import { useNotifyStore } from "./notifyStore";
import { Poll, listPolls, createPoll } from '../api/polls'

type State = {
    pollsByCampaign: Record<number, Record<number, Poll>>
    pollIdsByCampaign: Record<number, number[]>
    loading: boolean;
    error?: string;
}

type Actions = {
    loadPollsForCampaign: (campaignId: number) => Promise<void>;
    addPoll: (payload: {
        title?: string | null;
        query: number;
        question: number;
        starts_at: string;
        ends_at: string;
        campaignId: number;        // to store under the right bucket
    }) => Promise<Poll>;
};

export const usePollStore = create<State & Actions>((set, get) => ({

    pollsByCampaign: {},
    pollIdsByCampaign: {},
    loading: false,

    async loadPollsForCampaign(campaignId) {
        set({ loading: true, error: undefined });
        try {

            const data = await listPolls({ campaign: campaignId })
            const map: Record<number, Poll> = {};
            const ids: number[] = []
            data.forEach(p => {
                map[p.poll_id] = p;
                ids.push(p.poll_id);
            });

            set(state => ({
                pollsByCampaign: { ...state.pollsByCampaign, [campaignId]: map },
                pollIdsByCampaign: { ...state.pollIdsByCampaign, [campaignId]: ids },
                loading: false,
            }));


        } catch (e: any) {
            const msg = e?.response?.data?.error?.message || "Failed to load polls";
            useNotifyStore.getState().push(msg, "error");
            set({ loading: false, error: msg });
        }
    },
    async addPoll(payload) {
        const { campaignId, ...body } = payload;
        const p = await createPoll(body);
        set(state => {
            const m = state.pollsByCampaign[campaignId] ?? {};
            const ids = state.pollIdsByCampaign[campaignId] ?? [];
            return {
                pollsByCampaign: { ...state.pollsByCampaign, [campaignId]: { ...m, [p.poll_id]: p } },
                pollIdsByCampaign: { ...state.pollIdsByCampaign, [campaignId]: [p.poll_id, ...ids] },
            };
        });
        useNotifyStore.getState().push("Poll created", "success");
        return p;
    },
}))