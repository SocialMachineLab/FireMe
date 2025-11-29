import * as React from "react";
import {
    Box, Typography, Button, Grid, Card, CardContent, CardActions,
    TextField, IconButton, Collapse, Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useQuestionStore } from "../../store/questionStore";

export default function QuestionsPage() {
    const qids = useQuestionStore(s => s.qids);
    const questions = useQuestionStore(s => s.questions);
    const loadQuestions = useQuestionStore(s => s.loadQuestions);
    const addQuestion = useQuestionStore(s => s.addQuestion);
    const editQuestion = useQuestionStore(s => s.editQuestion);
    const removeQuestion = useQuestionStore(s => s.removeQuestion);

    React.useEffect(() => { loadQuestions(); }, [loadQuestions]);

    // create question controls
    const [newQ, setNewQ] = React.useState("");
    const onCreate = async () => {
        const t = newQ.trim();
        if (!t) return;
        await addQuestion(t);
        setNewQ("");
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Questions</Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <TextField
                    fullWidth label="New question"
                    value={newQ} onChange={e => setNewQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && onCreate()}
                />
                <Button startIcon={<AddIcon />} variant="contained" onClick={onCreate}>Add</Button>
            </Stack>

            <Grid container spacing={2}>
                {qids.map((id) => (
                    <QuestionCard
                        key={id}
                        qid={id}
                        text={questions[id].question}
                        createdAt={questions[id].created_at}
                        onSave={(txt) => editQuestion(id, txt)}
                        onDelete={() => removeQuestion(id)}
                    />
                ))}
                {qids.length === 0 && (
                    <Grid size={{ xs: 12 }}><Typography color="text.secondary">No questions yet.</Typography></Grid>
                )}
            </Grid>
        </Box>
    );
}

function QuestionCard({
    qid, text, createdAt, onSave, onDelete
}: { qid: number; text: string; createdAt: string; onSave: (t: string) => Promise<any>; onDelete: () => Promise<any> }) {
    const [expanded, setExpanded] = React.useState(false);
    const [editing, setEditing] = React.useState(false);
    const [value, setValue] = React.useState(text);

    React.useEffect(() => { setValue(text); }, [text]);

    return (
        <Grid size={{ xs: 12, md: 6 }}>
            <Card>
                <CardContent>
                    {!editing ? (
                        <>
                            <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>#{qid}</Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{text}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Created: {new Date(createdAt).toLocaleString()}</Typography>
                        </>
                    ) : (
                        <Stack spacing={1}>
                            <TextField
                                fullWidth multiline minRows={2}
                                value={value} onChange={e => setValue(e.target.value)}
                            />
                            <Stack direction="row" spacing={1}>
                                <Button startIcon={<SaveIcon />} variant="contained" onClick={async () => { await onSave(value); setEditing(false); }}>
                                    Save
                                </Button>
                                <Button startIcon={<CloseIcon />} onClick={() => { setEditing(false); setValue(text); }}>Cancel</Button>
                            </Stack>
                        </Stack>
                    )}
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => setEditing(e => !e)}><EditIcon /></IconButton>
                        <IconButton onClick={() => onDelete()}><DeleteIcon /></IconButton>
                    </Stack>
                    <IconButton onClick={() => setExpanded(e => !e)}
                          sx={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}
                    ><ExpandMoreIcon /></IconButton>
                </CardActions>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <CardContent>
                        <AnswersSection questionId={qid} />
                    </CardContent>
                </Collapse>
            </Card>
        </Grid>
    );
}

function AnswersSection({ questionId }: { questionId: number }) {
    // Select raw slices without inline defaults to keep referential stability.
    const ids = useQuestionStore((s) => s.aidListByQ[questionId]);
    const map = useQuestionStore((s) => s.answersByQ[questionId]);

    const [newAns, setNewAns] = React.useState("");

    // Load exactly once per questionId. Call the action via getState() to avoid
    // subscribing to its identity (which would retrigger the effect).
    const loadedRef = React.useRef<number | null>(null);
    React.useEffect(() => {
        if (loadedRef.current === questionId) return;
        loadedRef.current = questionId;
        useQuestionStore.getState().loadAnswers(questionId).catch(() => { });
    }, [questionId]);

    const onAdd = async () => {
        const t = newAns.trim();
        if (!t) return;
        await useQuestionStore.getState().addAnswer(questionId, t);
        setNewAns("");
    };

    // Default AFTER selection to avoid new refs during selection
    const idsSafe = ids ?? [];
    const mapSafe = map ?? {};

    return (
        <Stack spacing={2}>
            <Typography variant="subtitle1">Answers</Typography>
            <Stack direction="row" spacing={1}>
                <TextField
                    fullWidth
                    label="New answer"
                    value={newAns}
                    onChange={(e) => setNewAns(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onAdd()}
                />
                <Button variant="contained" onClick={onAdd}>Add</Button>
            </Stack>

            <Stack spacing={1}>
                {idsSafe.map((id) => (
                    <AnswerRow
                        key={id}
                        ans={mapSafe[id]}
                        onSave={(t) => useQuestionStore.getState().editAnswer(id, t, questionId)}
                        onDelete={() => useQuestionStore.getState().removeAnswer(id, questionId)}
                    />
                ))}
                {idsSafe.length === 0 && (
                    <Typography color="text.secondary">No answers yet.</Typography>
                )}
            </Stack>
        </Stack>
    );
}


function AnswerRow({ ans, onSave, onDelete }: { ans: AnswerLike; onSave: (t: string) => Promise<any>; onDelete: () => Promise<any> }) {
    const [editing, setEditing] = React.useState(false);
    const [val, setVal] = React.useState(ans.answer);
    React.useEffect(() => { setVal(ans.answer); }, [ans.answer]);

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            {!editing ? (
                <>
                    <Typography sx={{ flex: 1 }}>{ans.answer}</Typography>
                    <IconButton onClick={() => setEditing(true)}><EditIcon /></IconButton>
                    <IconButton onClick={() => onDelete()}><DeleteIcon /></IconButton>
                </>
            ) : (
                <>
                    <TextField fullWidth value={val} onChange={e => setVal(e.target.value)} />
                    <Button startIcon={<SaveIcon />} variant="contained" onClick={async () => { await onSave(val); setEditing(false); }}>
                        Save
                    </Button>
                    <Button startIcon={<CloseIcon />} onClick={() => { setEditing(false); setVal(ans.answer); }}>
                        Cancel
                    </Button>
                </>
            )}
        </Stack>
    );
}

type AnswerLike = { answer_id: number; answer: string; question: number; }
