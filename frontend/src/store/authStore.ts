import { create } from 'zustand';

interface User {
    username: string;
    email : string;
}

interface AuthState {
    user: User | null;
    access: string | null;
    refresh: string | null;
    setAuth: (user: User, access:string, refresh:string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({


    user: JSON.parse(localStorage.getItem("user") || "null"),
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),

    setAuth: (user: User, access:string, refresh:string) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        set({ user, access, refresh });
    },

    clearAuth: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        set({ user: null, access: null, refresh: null });
    }


}) );