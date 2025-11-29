import React from "react";
import { TextField } from "@mui/material";

interface InputFieldProps {
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label, type="text", name, value, onChange, error}
    ) => {
        return (
            <TextField
            
                fullWidth
                label={label}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                margin="normal"
                variant="outlined"
                error={!!error}
                helperText={error}
            />
        );

};

export default InputField;