// src/components/platforms/PlatformCard.tsx
import { Card, CardContent, CardActions, Button, Typography, Chip, Stack, Avatar } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import AddLinkIcon from "@mui/icons-material/AddLink";
import type { Platform } from "../../api/platforms";

type Props = {
    platform: Platform;
    onConnectApp: (p: Platform) => void;
    onConnectAccount: (p: Platform) => void;
    onDisconnect: (p: Platform) => void;
};

export default function PlatformCard({ platform, onConnectApp, onConnectAccount, onDisconnect }: Props) {
    return (
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={platform.logo_url} alt={platform.name} />
                    <Stack>
                        <Typography variant="h6">{platform.name}</Typography>
                        <Chip
                            size="small"
                            label={platform.connected ? "Connected" : "Not connected"}
                            color={platform.connected ? "success" : "default"}
                            sx={{ mt: 1, width: "fit-content" }}
                        />
                    </Stack>
                </Stack>
            </CardContent>
            <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                <Button startIcon={<LinkIcon />} onClick={() => onConnectApp(platform)}>
                    Set App Keys
                </Button>
                <Button startIcon={<AddLinkIcon />} onClick={() => onConnectAccount(platform)}>
                    Add Account
                </Button>
                {platform.connected && (
                    <Button color="error" startIcon={<PowerOffIcon />} onClick={() => onDisconnect(platform)}>
                        Disconnect
                    </Button>
                )}
            </CardActions>
        </Card>
    );
}
