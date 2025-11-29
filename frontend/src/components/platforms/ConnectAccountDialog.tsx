// src/components/platforms/ConnectAccountDialog.tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, MenuItem } from "@mui/material";
import { useState, useEffect } from "react";
import type { Platform } from "../../api/platforms";
import { usePlatformStore } from "../../store/platformStore";

type Props = { open: boolean; onClose: () => void; platform?: Platform };

export default function ConnectAccountDialog({ open, onClose, platform }: Props) {
    const saveConnection = usePlatformStore((s) => s.saveConnection);
    const [oauth, setOauth] = useState<"oauth1a" | "oauth2" | "app">("oauth1a");
    const [externalId, setExternalId] = useState("");
    const [username, setUsername] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [tokenSecret, setTokenSecret] = useState("");
    const [bearer, setBearer] = useState("");
    const [refresh, setRefresh] = useState("");
    const [scope, setScope] = useState("");

    useEffect(() => {
        if (!open) {
            setOauth("oauth1a");
            setExternalId("");
            setUsername("");
            setAccessToken("");
            setTokenSecret("");
            setBearer("");
            setRefresh("");
            setScope("");
        }
    }, [open, platform?.plt_id]);

    if (!platform) return null;

    const handleSave = async () => {
        await saveConnection(platform.plt_id, {
            external_account_id: externalId,
            external_username: username || undefined,
            oauth_version: oauth,
            access_token: accessToken || undefined,
            token_secret: tokenSecret || undefined,
            bearer_token: bearer || undefined,
            refresh_token: refresh || undefined,
            scope: scope || undefined,
        });
        onClose();
    };

    const canSave =
        (oauth === "oauth1a" && externalId && accessToken && tokenSecret) ||
        (oauth === "oauth2" && externalId && (accessToken || bearer)) ||
        (oauth === "app" && bearer);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Connect Account — {platform.name}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField select label="Auth Type" value={oauth} onChange={(e) => setOauth(e.target.value as any)}>
                        <MenuItem value="oauth1a">OAuth 1.0a (access token + token secret)</MenuItem>
                        <MenuItem value="oauth2">OAuth 2.0 (access/bearer, optional refresh)</MenuItem>
                        <MenuItem value="app">App-only (bearer)</MenuItem>
                    </TextField>

                    {oauth !== "app" && (
                        <>
                            <TextField label="External Account ID" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
                            <TextField label="External Username (@handle)" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </>
                    )}

                    {oauth === "oauth1a" && (
                        <>
                            <TextField label="Access Token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
                            <TextField label="Token Secret" value={tokenSecret} onChange={(e) => setTokenSecret(e.target.value)} />
                        </>
                    )}

                    {oauth === "oauth2" && (
                        <>
                            <TextField label="Access Token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
                            <TextField label="Refresh Token (optional)" value={refresh} onChange={(e) => setRefresh(e.target.value)} />
                            <TextField label="Scope (optional)" value={scope} onChange={(e) => setScope(e.target.value)} />
                        </>
                    )}

                    {oauth === "app" && (
                        <TextField label="Bearer Token" value={bearer} onChange={(e) => setBearer(e.target.value)} />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!canSave}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
