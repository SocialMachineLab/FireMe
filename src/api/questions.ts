import client from "./client";

export type Answer = {

    answer_id: number;
    question: number;
    answer: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;

}

export type Question = {

    question_id: number;
    question: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;

}

export async function listQuestions(): Promise<Question[]> {
    const { data } = await client.get("/api/questions/");
    return data;
}

export async function createQuestion(body: Pick<Question, "question">): Promise<Question> {
    const { data } = await client.post("/api/questions/", body)
    return data;
}

export async function updateQuestion(id: number, body: Partial<Pick<Question, "question">>): Promise<Question> {
    const { data } = await client.patch(`/api/questions/${id}/`, body)
    return data
}

export async function deleteQuestion(id: number): Promise<void> {
    await client.delete(`/api/questions/${id}/`);
}

//Answers (nested & direct)
export async function listAnswers(questionId: number): Promise<Answer[]> {
    const { data } = await client.get(`/api/questions/${questionId}/answers/`);
    //returns either array or {success,data}; handle both:
    return Array.isArray(data) ? data : data?.data ?? [];
}
export async function addAnswer(questionId: number, answer: string): Promise<Answer> {
    const { data } = await client.post(`/api/questions/${questionId}/add_answer/`, { answer });
    return data?.data ?? data; // handle both
}
export async function updateAnswer(answerId: number, body: Partial<Pick<Answer, "answer">>): Promise<Answer> {
    const { data } = await client.patch(`/api/answers/${answerId}/`, body);
    return data;
}
export async function deleteAnswer(answerId: number): Promise<void> {
    await client.delete(`/api/answers/${answerId}/`);
}
