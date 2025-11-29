// src/pages/campaigns/campaignDetail.tsx
import * as React from "react";
import { useParams } from "react-router-dom";
import {
	Box,
	Tabs,
	Tab,
	Typography,
	Divider,
	Button,
	Card,
	CardContent,
	Grid, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useCampaignStore } from "../../store/campaignStore";
import AddQueryDialog from "../../components/campaigns/AddQueryDialog";
import { usePollStore } from "../../store/pollStore";
import CreatePollDialog from "../../components/campaigns/CreatePollDialog";
import { useQuestionStore } from "../../store/questionStore";

// --- add this helper near top of file ---
function computeStatus(p: { is_active: boolean; starts_at: string; ends_at: string }) {
	const now = new Date();
	const s = new Date(p.starts_at);
	const e = new Date(p.ends_at);
	if (!p.is_active) return "inactive";
	if (now < s) return "upcoming";
	if (now > e) return "finished";
	return "live";
}

/** Queries tab **/
function QueriesTab({ campaignId }: { campaignId: number }) {
	// IMPORTANT: selectors return raw values (possibly undefined) to keep referential stability.
	const ids = useCampaignStore((s) => s.queryIdsByCampaign[campaignId]);
	const map = useCampaignStore((s) => s.queriesByCampaign[campaignId]);
	const [openAdd, setOpenAdd] = React.useState(false);

	// Run load once per campaignId; call the action from getState() to avoid subscribing to its identity.
	const loadedForIdRef = React.useRef<number | null>(null);
	React.useEffect(() => {
		if (loadedForIdRef.current === campaignId) return;
		loadedForIdRef.current = campaignId;
		useCampaignStore
			.getState()
			.loadQueriesForCampaign(campaignId)
			.catch(() => { });
	}, [campaignId]);

	const idsSafe = ids ?? [];
	const mapSafe = map ?? {};

	return (
		<Box sx={{ mt: 2 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h6">Queries</Typography>
				<Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenAdd(true)}>
					Add Query
				</Button>
			</Box>

			<Grid container spacing={2}>
				{idsSafe.map((id: number) => {
					const q = mapSafe[id];
					if (!q) return null;
					return (
						<Grid key={id} size={{ xs: 12, md: 6 }}>
							<Card>
								<CardContent>
									<Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
										#{q.query_id}
									</Typography>
									<Typography variant="body1" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
										{q.search_term}
									</Typography>
									<Typography variant="caption" sx={{ opacity: 0.7 }}>
										Created: {new Date(q.created_at).toLocaleString()}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					);
				})}
				{idsSafe.length === 0 && (
					<Grid size={{ xs: 12 }}>
						<Typography color="text.secondary">No queries yet for this campaign.</Typography>
					</Grid>
				)}
			</Grid>

			<AddQueryDialog open={openAdd} onClose={() => setOpenAdd(false)} campaignId={campaignId} />
		</Box>
	);
}

/** Polls Tab **/
function PollsTab({ campaignId }: { campaignId: number }) {
	const ids = usePollStore(s => s.pollIdsByCampaign[campaignId]);
	const map = usePollStore(s => s.pollsByCampaign[campaignId]);
	const [open, setOpen] = React.useState(false);

	// Load polls once per campaign
	const fetchedRef = React.useRef<number | null>(null);
	React.useEffect(() => {
		if (fetchedRef.current === campaignId) return;
		fetchedRef.current = campaignId;
		usePollStore.getState().loadPollsForCampaign(campaignId).catch(() => { });
	}, [campaignId]);

	// Ensure queries for this campaign are available (for dialog & labels)
	React.useEffect(() => {
		useCampaignStore.getState().loadQueriesForCampaign(campaignId).catch(() => { });
		// questions list for dialog
		useQuestionStore.getState().loadQuestions().catch(() => { });
	}, [campaignId]);

	const idsSafe = ids ?? [];
	const mapSafe = map ?? {};

	return (
		<Box sx={{ mt: 2 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h6">Polls</Typography>
				<Button variant="contained" onClick={() => setOpen(true)}>Create Poll</Button>
			</Box>

			<Grid container spacing={2}>
				{idsSafe.map(id => {
					const p = mapSafe[id];
					if (!p) return null;
					const st = computeStatus(p);
					return (
						<Grid key={id} size = {{xs :12, md: 6}}>
							<Card>
								<CardContent>
									<Typography variant="subtitle2" sx={{ opacity: 0.7 }}>#{p.poll_id}</Typography>
									<Typography variant="h6" sx={{ mt: 0.5 }}>
										{p.title || "Untitled poll"}
										<Chip
											size="small"
											label={st}
											sx={{ ml: 1, textTransform: "capitalize" }}
											color={st === "live" ? "success" : st === "upcoming" ? "info" : st === "finished" ? "default" : "warning"}
										/>
									</Typography>
									<Typography variant="body2" sx={{ mt: 1 }}>
										{new Date(p.starts_at).toLocaleString()} → {new Date(p.ends_at).toLocaleString()}
									</Typography>
									<Typography variant="caption" sx={{ opacity: 0.7 }}>
										Query #{p.query} • Question #{p.question}
									</Typography>
								</CardContent>
							</Card>
						</Grid>
					);
				})}
				{idsSafe.length === 0 && (
					<Grid size = {{xs :12}}>
						<Typography color="text.secondary">No polls yet for this campaign.</Typography>
					</Grid>
				)}
			</Grid>

			<CreatePollDialog open={open} onClose={() => setOpen(false)} campaignId={campaignId} />
		</Box>
	);
}

/** Page **/
export default function CampaignDetailPage() {
	const params = useParams();
	const campaignId = Number(params.id);

	// Select campaign by id; keep selector stable (no inline defaulting).
	const campaign = useCampaignStore((s) => s.campaigns[campaignId]);

	const [tab, setTab] = React.useState(0);

	// Fetch the campaign exactly once per id, using getState() to avoid subscribing to the action.
	const fetchedForIdRef = React.useRef<number | null>(null);
	React.useEffect(() => {
		if (campaign) return; // already in store
		if (fetchedForIdRef.current === campaignId) return;
		fetchedForIdRef.current = campaignId;
		useCampaignStore
			.getState()
			.getCampaign(campaignId)
			.catch(() => { });
	}, [campaignId, campaign]);

	if (!campaign) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography>Loading…</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h5">{campaign.name}</Typography>
			<Typography variant="body2" sx={{ opacity: 0.8 }}>
				Campaign #{campaign.campaign_id} • Platform ID {campaign.plt}
			</Typography>

			<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }}>
				<Tab label="Queries" />
				<Tab label="Polls" />
			</Tabs>
			<Divider />

			{tab === 0 && <QueriesTab campaignId={campaignId} />}
			{tab === 1 && <PollsTab campaignId={campaignId} />}
		</Box>
	);
}
