// src/hooks/useAuth.ts
import { useAuthStore } from "../store/authStore";
import { login as loginApi, register as registerApi } from "../api/auth";

export const useAuth = () => {
    const { user, access, refresh, setAuth, clearAuth } = useAuthStore();

    const login = async (username: string, password: string) => {
        const data = await loginApi(username, password);
        if (data.success) {
            setAuth(data.user, data.access, data.refresh);
        } else {
            throw new Error(data.error || "Login Failed !")
        }
    };

    const register = async (formData: any) => {
        const data = await registerApi(formData);
        if (data.success) {
            return data;
        } else {
            throw new Error(JSON.stringify(data.errors || "Registration failed"));
        }
    };

    const logout = () => {
        clearAuth();
    };

    return { user, access, refresh, login, register, logout };
};
