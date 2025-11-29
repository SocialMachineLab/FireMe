import { create } from "zustand";
import { useNotifyStore } from "./notifyStore";
import {
    Question, Answer,
    listQuestions, createQuestion, updateQuestion, deleteQuestion,
    listAnswers, addAnswer, updateAnswer, deleteAnswer
} from "../api/questions";

type State = {

    questions: Record<number, Question>
    qids: number[]
    answersByQ: Record<number, Record<number, Answer>>
    aidListByQ: Record<number, number[]>
    loading: boolean
    error?: string

}

type Actions = {
    loadQuestions: () => Promise<void>;
    addQuestion: (text: string) => Promise<Question>;
    editQuestion: (id: number, text: string) => Promise<Question>;
    removeQuestion: (id: number) => Promise<void>;

    loadAnswers: (questionId: number) => Promise<void>;
    addAnswer: (questionId: number, text: string) => Promise<Answer>;
    editAnswer: (answerId: number, text: string, questionId: number) => Promise<Answer>;
    removeAnswer: (answerId: number, questionId: number) => Promise<void>;
};


export const useQuestionStore = create<State & Actions>((set, get) => ({
    questions: {},
    qids: [],
    answersByQ: {},
    aidListByQ: {},
    loading: false,

    async loadQuestions() {
        set({ loading: true, error: undefined });
        try {
            const data = await listQuestions();
            console.log("Questions from backend : ")
            console.log(data);
            const map: Record<number, Question> = {};
            const ids: number[] = [];
            data.forEach(q => { map[q.question_id] = q; ids.push(q.question_id); });
            set({ questions: map, qids: ids, loading: false });
        } catch (e: any) {
            const msg = e?.response?.data?.error?.message || "Failed to load questions";
            useNotifyStore.getState().push(msg, "error");
            set({ loading: false, error: msg });
        }
    },

    async addQuestion(text) {
        const q = await createQuestion({ question: text.trim() });
        set(state => ({
            questions: { ...state.questions, [q.question_id]: q },
            qids: [q.question_id, ...state.qids],
        }));
        useNotifyStore.getState().push("Question created", "success");
        return q;
    },

    async editQuestion(id, text) {
        const q = await updateQuestion(id, { question: text.trim() });
        set(state => ({ questions: { ...state.questions, [id]: q } }));
        useNotifyStore.getState().push("Question updated", "success");
        return q;
    },

    async removeQuestion(id) {
        await deleteQuestion(id);
        set(state => {
            const { [id]: _, ...rest } = state.questions;
            return {
                questions: rest,
                qids: state.qids.filter(x => x !== id),
                // also drop cached answers if present
                answersByQ: Object.fromEntries(Object.entries(state.answersByQ).filter(([k]) => Number(k) !== id)),
                aidListByQ: Object.fromEntries(Object.entries(state.aidListByQ).filter(([k]) => Number(k) !== id)),
            };
        });
        useNotifyStore.getState().push("Question removed", "success");
    },

    async loadAnswers(questionId) {
        const data = await listAnswers(questionId);
        const map: Record<number, Answer> = {};
        const ids: number[] = [];
        data.forEach(a => { map[a.answer_id] = a; ids.push(a.answer_id); });
        set(state => ({
            answersByQ: { ...state.answersByQ, [questionId]: map },
            aidListByQ: { ...state.aidListByQ, [questionId]: ids },
        }));
    },

    async addAnswer(questionId, text) {
        const a = await addAnswer(questionId, text.trim());
        set(state => {
            const amap = state.answersByQ[questionId] ?? {};
            const aids = state.aidListByQ[questionId] ?? [];
            return {
                answersByQ: { ...state.answersByQ, [questionId]: { ...amap, [a.answer_id]: a } },
                aidListByQ: { ...state.aidListByQ, [questionId]: [a.answer_id, ...aids] },
            };
        });
        useNotifyStore.getState().push("Answer added", "success");
        return a;
    },

    async editAnswer(answerId, text, questionId) {
        const a = await updateAnswer(answerId, { answer: text.trim() });
        set(state => {
            const amap = state.answersByQ[questionId] ?? {};
            return { answersByQ: { ...state.answersByQ, [questionId]: { ...amap, [answerId]: a } } };
        });
        useNotifyStore.getState().push("Answer updated", "success");
        return a;
    },

    async removeAnswer(answerId, questionId) {
        await deleteAnswer(answerId);
        set(state => {
            const amap = { ...(state.answersByQ[questionId] ?? {}) };
            delete amap[answerId];
            const aids = (state.aidListByQ[questionId] ?? []).filter(x => x !== answerId);
            return { answersByQ: { ...state.answersByQ, [questionId]: amap }, aidListByQ: { ...state.aidListByQ, [questionId]: aids } };
        });
        useNotifyStore.getState().push("Answer removed", "success");
    },
}));