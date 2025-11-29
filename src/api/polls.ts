import client from "./client";


export type Poll = {
    poll_id: number;
    title: string | null;
    query: number;
    question: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;
}

export async function listPolls(
    params?: { campaign?: number, query?: number }): Promise<Poll[]> {

    const { data } = await client.get("/api/polls/", { params });
    return data as Poll[]
}

export async function createPoll(body: {
    title?: string | null;
    query: number;
    question: number;
    starts_at: string;
    ends_at: string;
}) {

    const { data }= await client.post("/api/polls/", body)
    return data as Poll;

}