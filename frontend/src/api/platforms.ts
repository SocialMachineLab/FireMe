import client from './client'

export type Platform = {
    plt_id: number;
    name: string;
    logo_url: string;
    webpage: string;
    connected: boolean;
}

export type AppUpsertBody = {
    client_id: string;
    client_secret: string;
    meta?: Record<string, any>
}

export type ConnectCredentialsBody = {
    external_account_id: string;
    external_username?: string;
    oauth_version: "oauth1a" | "oauth2" | "app";
    bearer_token?: string;
    access_token?: string;
    refresh_token?: string;
    token_secret?: string;
    token_type?: string;
    scope?: string;
    expires_at?: string | null;
    meta?: Record<string, any>;
};

export async function listPlatforms(): Promise<Platform[]> {
    const { data } = await client.get("/api/platforms/")
    return data;
}

export async function upsertApp(pltId: number, body: AppUpsertBody) {
    const { data } = await client.post(`/api/platforms/${pltId}/app/`, body);
    return data;
}

export async function connectCredentials(pltId:number, body: ConnectCredentialsBody) {
    const { data } = await client.post(`/api/platforms/${pltId}/connect_credentials/`, body)
    return data
}

export async function disconnect(pltId: number, externalAccountId?: string) {
    const { data } = await client.post(`/api/platforms/${pltId}/disconnect`, 
       externalAccountId ? { external_account_id: externalAccountId } : {}
    )
    return data;
}


