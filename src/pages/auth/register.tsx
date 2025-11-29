import React, { useState } from "react";
import { Container, Typography, Box, Alert } from '@mui/material'
import InputField from "../../components/forms/InputField";
import SubmitButton from "../../components/forms/SubmitButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface RegisterForm {
    username: string,
    email: string,
    first_name: string,
    last_name: string,
    institution: string,
    password: string
}

const Register: React.FC = () => {

    const { register } = useAuth()
    const navigate = useNavigate();

    const [form, setForm] = useState<RegisterForm>({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        institution: "",
        password: ""
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {

            await register(form)
            setSuccess("Registration Successful! Please Login !")
            setTimeout(() => navigate("/login"), 1500);

        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration Failed !.");
        }
    }

    return (
        <Container maxWidth="xs">
            <Box mt={8}>
                <Typography variant="h4" gutterBottom>
                    Register
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <InputField label="Username" name="username" value={form.username} onChange={handleChange} />
                    <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                    <InputField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} />
                    <InputField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
                    <InputField label="Institution" name="institution" value={form.institution} onChange={handleChange} />
                    <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
                    
                    <SubmitButton label="Register" />
                </form>
            </Box>
        </Container>
    );

}

export default Register;