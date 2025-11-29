import client from './client'

export type Campaign = {
    campaign_id: number;
    user: number;
    plt: number;
    name: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;
}

export type Query = {
    query_id: number;
    campaign: number;
    search_term: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
    const { data } = await client.get("/api/campaigns/");
    return data;
}

export async function fetchCampaign(id:number): Promise<Campaign> {
    const { data } = await client.get(`/api/campaigns/${id}/`);
    return data;
}

export async function createCampaign(body: Pick<Campaign, "plt" | "name">): Promise<Campaign> {
    const { data } = await client.post("/api/campaigns/", body)
    return data
}

export async function fetchQueries(campaignId?: number): Promise<Query[]> {
    const { data } = await client.get("/api/queries/", {
        params: campaignId ? { campaign: campaignId } : {}
    })

    return data
}

export async function createQuery(body: Pick<Query, "campaign" | "search_term">): Promise<Query> {
    const { data } = await client.post("/api/queries/", body)
    return data
}