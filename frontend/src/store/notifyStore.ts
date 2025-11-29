import { create } from 'zustand'

type Notice = {
    id: number;
    message: string;
    severity?: "error" | "warning" | "info" | "success"
}

type State = {
    queue: Notice[]
}

type Actions = {
    push: (message: string, severity?: Notice['severity']) => void;
    shift: () => void;
}

let nextId = 1

export const useNotifyStore = create<State & Actions> ( (set) => ({

    queue: [],
    push: (message, severity = "error") =>
        set((s) => ({ queue: [...s.queue, { id: nextId++, message, severity }] })),
    shift: () => set((s) => ({ queue: s.queue.slice(1) })),

}));