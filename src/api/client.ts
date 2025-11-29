import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { useNotifyStore } from "../store/notifyStore";
import { parseDrfError } from "../utils/drfError";
import { refreshToken } from "./auth";

declare module "axios" {
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

const API_BASE = process.env.APP_API_URL || "http://127.0.0.1:8000/";

const client = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" }
})

//Request interceptor to attach token every time
client.interceptors.request.use((config) => {
    const { access } = useAuthStore.getState();
    if (access) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${access}`;
    }
    return config;
});

// ---- Single-flight refresh machinery ----
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
    refreshQueue.push(cb);
}

function onRefreshed(newAccess: string | null) {
    refreshQueue.forEach((cb) => cb(newAccess));
    refreshQueue = [];
}


// Interceptor for expired tokens
client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig;
        const status = error.response?.status;

        // ---- 401 refresh branch ----
        if (status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;

            const { refresh, user, setAuth, clearAuth } = useAuthStore.getState();
            if (!refresh) {
                clearAuth();
                // fall through to toast below
            } else {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        subscribeTokenRefresh((newAccess) => {
                            if (!newAccess) return reject(error);
                            originalRequest.headers = originalRequest.headers || {};
                            (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
                            resolve(client(originalRequest));
                        });
                    });
                }
                isRefreshing = true;
                try {
                    const data = await refreshToken(refresh); // { access, refresh? }
                    const newAccess = data.access;
                    const newRefresh = (data as any).refresh ?? refresh;
                    setAuth(user!, newAccess, newRefresh);
                    onRefreshed(newAccess);
                    isRefreshing = false;

                    originalRequest.headers = originalRequest.headers || {};
                    (originalRequest.headers as any).Authorization = `Bearer ${newAccess}`;
                    return client(originalRequest);
                } catch (e) {
                    isRefreshing = false;
                    onRefreshed(null);
                    useAuthStore.getState().clearAuth();
                    // fall through to toast below with this error
                }
            }
        }

        // ---- catch-all: show backend error in a toast ----
        try {
            const data = error.response?.data as any;
            const message = parseDrfError(data, status);
            useNotifyStore.getState().push(message, "error");
        } catch {
            useNotifyStore.getState().push("Request failed.", "error");
        }

        return Promise.reject(error);
    }
);

export default client;