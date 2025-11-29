// src/pages/Dashboard.tsx
import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PlatformGrid from "../../components/platforms/PlatformGrid";

const Dashboard: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};
	const nav = useNavigate();

	return (
		<Container sx={{ py: 4 }}>
			<Box mt={4} mb={8}>
				<Typography variant="h4" gutterBottom>
					Dashboard
				</Typography>
				<Typography variant="body1">
					Welcome, {user?.username || "Guest"}!
				</Typography>

				<Box display={"flex"} mt={3} gap={2}>
					<Button variant="contained" color="secondary" onClick={handleLogout}>
						Logout
					</Button>

					<Button
						variant="contained"
						onClick={() => nav("/campaigns")}
					>
						Manage Campaigns
					</Button>
				</Box>
			</Box>
			<PlatformGrid />
		</Container>
	);
};

export default Dashboard;
