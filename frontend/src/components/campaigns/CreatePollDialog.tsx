import * as React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, MenuItem, Stack, Autocomplete, Chip, Typography
} from "@mui/material";
import { useCampaignStore } from "../../store/campaignStore";
import { useQuestionStore } from "../../store/questionStore";
import { usePollStore } from "../../store/pollStore";

type Props = {
    open: boolean;
    onClose: () => void;
    campaignId: number;
};

export default function CreatePollDialog({ open, onClose, campaignId }: Props) {
    const addPoll = usePollStore(s => s.addPoll);
    const queryIds = useCampaignStore(s => s.queryIdsByCampaign[campaignId] ?? []);
    const queries = useCampaignStore(s => s.queriesByCampaign[campaignId] ?? {});
    const loadQueriesForCampaign = useCampaignStore(s => s.loadQueriesForCampaign);

    const qids = useQuestionStore(s => s.qids);
    const questions = useQuestionStore(s => s.questions);
    const loadQuestions = useQuestionStore(s => s.loadQuestions);

    const [query, setQuery] = React.useState<number | "">("");
    const [questionId, setQuestionId] = React.useState<number | null>(null);
    const [title, setTitle] = React.useState("");
    const [startLocal, setStartLocal] = React.useState<string>(""); // yyyy-MM-ddTHH:mm
    const [endLocal, setEndLocal] = React.useState<string>("");
    const [submitting, setSubmitting] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

    // Load queries & questions once when dialog opens
    const loadedRef = React.useRef(false);
    React.useEffect(() => {
        if (!open) return;
        if (!loadedRef.current) {
            loadedRef.current = true;
            useCampaignStore.getState().loadQueriesForCampaign(campaignId).catch(() => { });
            useQuestionStore.getState().loadQuestions().catch(() => { });
        }
    }, [open, campaignId]);

    const toIso = (localValue: string) => {
        // local input like "2025-09-18T10:30" -> ISO
        if (!localValue) return "";
        const d = new Date(localValue);
        return d.toISOString();
    };

    const onSubmit = async () => {
        setSubmitting(true); setFieldErrors({});
        try {
            const errs: Record<string, string> = {};
            if (!query) errs["query"] = "Select a query";
            if (!questionId) errs["question"] = "Select a question";
            if (!startLocal) errs["starts_at"] = "Start time required";
            if (!endLocal) errs["ends_at"] = "End time required";
            if (Object.keys(errs).length) { setFieldErrors(errs); setSubmitting(false); return; }

            const starts_at = toIso(startLocal);
            const ends_at = toIso(endLocal);
            if (starts_at && ends_at && new Date(ends_at) < new Date(starts_at)) {
                setFieldErrors({ ends_at: "End time must be after start time" });
                setSubmitting(false); return;
            }

            await addPoll({
                title: title.trim() || null,
                query: Number(query),
                question: Number(questionId),
                starts_at, ends_at,
                campaignId,
            });

            setSubmitting(false);
            onClose();
            // reset fields
            setTitle(""); setQuery(""); setQuestionId(null); setStartLocal(""); setEndLocal("");
            loadedRef.current = false; // allow refetch next open if needed
        } catch (e: any) {
            setSubmitting(false);
            const fields = e?.response?.data?.error?.fields;
            if (fields) {
                const fe: Record<string, string> = {};
                Object.keys(fields).forEach(k => fe[k] = fields[k]?.[0] ?? "Invalid");
                setFieldErrors(fe);
            } else {
                setFieldErrors({ general: e?.response?.data?.error?.message ?? "Failed to create poll" });
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Create Poll</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        fullWidth label="Title (optional)"
                        value={title} onChange={e => setTitle(e.target.value)}
                    />

                    <TextField
                        select fullWidth label="Query"
                        value={query} onChange={(e) => setQuery(e.target.value as any)}
                        error={!!fieldErrors["query"]} helperText={fieldErrors["query"] ?? (queryIds.length ? "" : "No queries in this campaign yet")}
                    >
                        {queryIds.map(id => (
                            <MenuItem key={id} value={id}>
                                {queries[id]?.search_term ?? `#${id}`}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Autocomplete
                        options={qids.map((id) => questions[id])}
                        getOptionLabel={(q) => q?.question ?? ""}
                        value={questionId ? questions[questionId] : null}
                        onChange={(_, v) => setQuestionId(v?.question_id ?? null)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Question"
                                error={!!fieldErrors["question"]}
                                helperText={fieldErrors["question"]}
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip {...getTagProps({ index })} key={option.question_id} label={option.question} />
                            ))
                        }
                    />

                    <TextField
                        label="Starts at"
                        type="datetime-local"
                        value={startLocal}
                        onChange={(e) => setStartLocal(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        error={!!fieldErrors["starts_at"]}
                        helperText={fieldErrors["starts_at"]}
                    />
                    <TextField
                        label="Ends at"
                        type="datetime-local"
                        value={endLocal}
                        onChange={(e) => setEndLocal(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        error={!!fieldErrors["ends_at"]}
                        helperText={fieldErrors["ends_at"]}
                    />

                    {fieldErrors["general"] && (
                        <Typography color="error">{fieldErrors["general"]}</Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={onSubmit} variant="contained" disabled={submitting}>Create</Button>
            </DialogActions>
        </Dialog>
    );
}
