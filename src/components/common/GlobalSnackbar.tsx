// src/components/common/GlobalSnackbar.tsx
import { Snackbar, Alert } from "@mui/material";
import { useNotifyStore } from "../../store/notifyStore";

export default function GlobalSnackbar() {
    const { queue, shift } = useNotifyStore();
    const current = queue[0];

    return (
        <Snackbar
            open={!!current}
            autoHideDuration={5000}
            onClose={shift}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            <Alert onClose={shift} severity={current?.severity || "error"} variant="filled" sx={{ width: "100%" }}>
                {current?.message}
            </Alert>
        </Snackbar>
    );
}
