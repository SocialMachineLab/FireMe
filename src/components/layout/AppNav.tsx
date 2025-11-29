import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

export default function AppNav() {
    const nav = useNavigate();
    const loc = useLocation();

    const go = (to: string) => () => nav(to);

    return (
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ flexGrow: 1, cursor: "pointer" }} onClick={go("/dashboard")}>
                    FireMe
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button variant={loc.pathname.startsWith("/dashboard") ? "contained" : "text"} onClick={go("/dashboard")}>
                        Dashboard
                    </Button>
                    <Button variant={loc.pathname.startsWith("/campaigns") ? "contained" : "text"} onClick={go("/campaigns")}>
                        Campaigns
                    </Button>
                    <Button variant={loc.pathname.startsWith("/questions") ? "contained" : "text"} onClick={go("/questions")}>
                        Questions
                    </Button>
                    {/* Enable later
          <Button variant={loc.pathname.startsWith("/polls") ? "contained" : "text"} onClick={go("/polls")}>
            Polls
          </Button> */}
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
