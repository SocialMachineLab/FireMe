// src/components/platforms/ConnectAppDialog.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from "@mui/material";
import { useState, useEffect } from "react";
import type { Platform } from "../../api/platforms";
import { usePlatformStore } from "../../store/platformStore";

type Props = { open: boolean; onClose: () => void; platform?: Platform };

export default function ConnectAppDialog({ open, onClose, platform }: Props) {
    const saveApp = usePlatformStore((s) => s.saveApp);
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [appName, setAppName] = useState("");

    // Clear fields when dialog opens/closes or platform changes (avoid secrets lingering)
    useEffect(() => {
        if (!open) {
            setClientId("");
            setClientSecret("");
            setAppName("");
        }
    }, [open, platform?.plt_id]);

    if (!platform) return null;

    const handleSave = async () => {
        await saveApp(platform.plt_id, { client_id: clientId, client_secret: clientSecret, meta: { app_name: appName } });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Set App Keys — {platform.name}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Client ID" fullWidth value={clientId} onChange={(e) => setClientId(e.target.value)} />
                    <TextField label="Client Secret" fullWidth value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
                    <TextField label="App Name (optional)" fullWidth value={appName} onChange={(e) => setAppName(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!clientId || !clientSecret}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
