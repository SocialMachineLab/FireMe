import client from "./client"

export const login = async (username: string, password: string) => {

    const res = await client.post("/accounts/login/", { username, password });
    return res.data;

}

export const register = async (data: {
    username: string;
    email: string;
    fname: string;
    lname: string;
    institution: string;
    password: string;
}) => {
    const res = await client.post("/accounts/register/", data)
    return res.data;
}

export const refreshToken = async (refresh: string) => {
    const res = await client.post("/accounts/token/refresh/", {refresh});
    return res.data;
}

