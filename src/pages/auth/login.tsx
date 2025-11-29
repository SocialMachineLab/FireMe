import React, { useState } from "react";
import { Container, Box, Typography, Alert } from "@mui/material";
import InputField from "../../components/forms/InputField";
import SubmitButton from "../../components/forms/SubmitButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Login: React.FC = () => {

    const { login } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Success-Error Feedback State
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null)


    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null);
        setSuccess(null);
        try {
            // const data = 
            await login(username, password);
            setSuccess("Login Successful!")
            // console.log("Tokens : ", res)
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed");
        }
    }


    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Login
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <InputField
                        name="username"
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <InputField
                        name="password"
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <SubmitButton label="Login" />
                </form>

            </Box>
        </Container>
    )

}

export default Login;
