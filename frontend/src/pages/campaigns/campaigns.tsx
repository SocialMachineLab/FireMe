import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardActionArea, CardContent, Typography, Grid } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CreateCampaignDialog from "../../components/campaigns/CreateCampaignDialog";
import { useCampaignStore } from "../../store/campaignStore";

export default function CampaignsPage() {
    const nav = useNavigate();
    const [openCreate, setOpenCreate] = React.useState(false);

    const campaignIds = useCampaignStore(s => s.campaignIds);
    const campaigns   = useCampaignStore(s => s.campaigns);
    const loading     = useCampaignStore(s => s.loading);
    const loadCampaigns = useCampaignStore(s => s.loadCampaigns);

    React.useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);  // run once on mount

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5">Campaigns</Typography>
                <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenCreate(true)}>
                    Create Campaign
                </Button>
            </Box>

            <Grid container spacing={2}>
                {loading && <Typography sx={{ ml: 1 }}>Loading…</Typography>}
                {campaignIds.map(id => {
                    const c = campaigns[id];
                    return (
                        <Grid key={id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <Card className="hover:shadow-lg transition">
                                <CardActionArea onClick={() => nav(`/campaigns/${id}`)}>
                                    <CardContent>
                                        <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>#{c.campaign_id}</Typography>
                                        <Typography variant="h6" sx={{ mt: 0.5 }}>{c.name}</Typography>
                                        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                                            Platform ID: {c.plt}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            Created: {new Date(c.created_at).toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    );
                })}
                {!loading && campaignIds.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Typography color="text.secondary">No campaigns yet. Create your first one.</Typography>
                    </Grid>
                )}
            </Grid>

            <CreateCampaignDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={(id) => nav(`/campaigns/${id}`)}
            />
        </Box>
    );
}
