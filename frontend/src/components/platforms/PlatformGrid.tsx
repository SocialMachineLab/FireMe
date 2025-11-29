// src/components/platforms/PlatformGrid.tsx
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { CircularProgress, Stack, Typography, Snackbar, Alert } from "@mui/material";
import { usePlatformStore } from "../../store/platformStore";
import PlatformCard from "./PlatformCard";
import ConnectAppDialog from "./ConnectAppDialog";
import ConnectAccountDialog from "./ConnectAccountDialog";
import type { Platform } from "../../api/platforms";

export default function PlatformGrid() {
    const { platforms, loading, error, fetchPlatforms, disconnectAll } = usePlatformStore();
    const [appOpen, setAppOpen] = useState(false);
    const [acctOpen, setAcctOpen] = useState(false);
    const [selected, setSelected] = useState<Platform | undefined>(undefined);

    // Load platforms when the grid mounts
    useEffect(() => { fetchPlatforms(); }, [fetchPlatforms]);

    if (loading) return <Stack alignItems="center" mt={6}><CircularProgress /></Stack>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Typography variant="h5" sx={{ mb: 2 }}>Platforms</Typography>

            <Grid container spacing={2}>
                {platforms.map((p) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.plt_id}>
                        <PlatformCard
                            platform={p}
                            onConnectApp={(plat) => { setSelected(plat); setAppOpen(true); }}
                            onConnectAccount={(plat) => { setSelected(plat); setAcctOpen(true); }}
                            onDisconnect={(plat) => disconnectAll(plat.plt_id)}
                        />
                    </Grid>
                ))}
            </Grid>

            <ConnectAppDialog open={appOpen} onClose={() => setAppOpen(false)} platform={selected} />
            <ConnectAccountDialog open={acctOpen} onClose={() => setAcctOpen(false)} platform={selected} />

            <Snackbar open={!!error}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </>
    );
}
