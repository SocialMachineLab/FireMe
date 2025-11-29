import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Stack } from "@mui/material";
import { useCampaignStore } from "../../store/campaignStore";
import { usePlatformStore } from "../../store/platformStore";

type Props = { open: boolean; onClose: () => void; onCreated?: (id: number) => void; };

export default function CreateCampaignDialog({ open, onClose, onCreated }: Props) {
    const addCampaign = useCampaignStore(s => s.addCampaign);
    const { platforms, fetchPlatforms } = usePlatformStore();

    const [plt, setPlt] = React.useState<number | "">("");
    const [name, setName] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open && platforms.length === 0) fetchPlatforms();
    }, [open, platforms.length, fetchPlatforms]);

    const reset = () => { setPlt(""); setName(""); setFieldErrors({}); setError(null); };

    const onSubmit = async () => {
        setSubmitting(true); setFieldErrors({}); setError(null);
        try {
            if (!plt) { setFieldErrors({ plt: "Platform is required" }); setSubmitting(false); return; }
            if (!name.trim()) { setFieldErrors({ name: "Name cannot be blank" }); setSubmitting(false); return; }
            const c = await addCampaign({ plt: Number(plt), name: name.trim() });
            setSubmitting(false);
            onCreated?.(c.campaign_id);
            reset();
            onClose();
        } catch (e: any) {
            setSubmitting(false);
            const fields = e?.response?.data?.error?.fields;
            if (fields) {
                const fe: Record<string, string> = {};
                Object.keys(fields).forEach(k => fe[k] = fields[k]?.[0] ?? "Invalid");
                setFieldErrors(fe);
            } else {
                setError(e?.response?.data?.error?.message ?? "Failed to create campaign");
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        select fullWidth label="Platform"
                        value={plt} onChange={e => setPlt(e.target.value as any)}
                        error={!!fieldErrors["plt"]} helperText={fieldErrors["plt"]}
                    >
                        {platforms.map(p => (
                            <MenuItem key={p.plt_id} value={p.plt_id}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth label="Campaign name"
                        value={name} onChange={e => setName(e.target.value)}
                        error={!!fieldErrors["name"]} helperText={fieldErrors["name"]}
                    />
                    {error && <span style={{ color: "crimson" }}>{error}</span>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={onSubmit} disabled={submitting} variant="contained">Create</Button>
            </DialogActions>
        </Dialog>
    );
}
