import React from "react";
import { Button } from '@mui/material'

interface ButtonProps{ 
    label: string;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
}

const SubmitButton: React.FC<ButtonProps> = ({
    label, type = "submit", onClick, disabled
}) => {

    return (
        <Button 
            fullWidth
            variant="contained"
            color="primary"
            type={type}
            onClick={onClick}
            disabled={disabled}
            sx = {{mt : 2}}
        >
            {label}
        </Button>
    )

}

export default SubmitButton;