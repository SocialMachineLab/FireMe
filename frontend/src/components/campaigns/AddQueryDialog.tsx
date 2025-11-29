import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { useCampaignStore } from "../../store/campaignStore";

type Props = { open: boolean; onClose: () => void; campaignId: number; };

export default function AddQueryDialog({ open, onClose, campaignId }: Props) {
    const addQuery = useCampaignStore(s => s.addQuery);
    const [term, setTerm] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [fieldError, setFieldError] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!open) return;
        setTerm(""); setFieldError(null); setError(null);
    }, [open]);

    const onSubmit = async () => {
        setSubmitting(true); setFieldError(null); setError(null);
        try {
            if (!term.trim()) { setFieldError("Search term cannot be blank"); setSubmitting(false); return; }
            await addQuery({ campaign: campaignId, search_term: term.trim() });
            setSubmitting(false);
            onClose();
        } catch (e: any) {
            setSubmitting(false);
            const fields = e?.response?.data?.error?.fields;
            if (fields?.search_term?.length) setFieldError(fields.search_term[0]);
            else setError(e?.response?.data?.error?.message ?? "Failed to add query");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add Query</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    fullWidth multiline minRows={2}
                    label="Search term"
                    value={term} onChange={e => setTerm(e.target.value)}
                    error={!!fieldError} helperText={fieldError}
                />
                {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={onSubmit} variant="contained" disabled={submitting}>Add</Button>
            </DialogActions>
        </Dialog>
    );
}
