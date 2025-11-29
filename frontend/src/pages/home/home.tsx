import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import { Link } from 'react-router-dom';

const Home: React.FC = () => (
    <Container maxWidth="sm">
        <Box textAlign="center" mt={8}>
            <Typography variant="h3" gutterBottom>
                Welcome to FireMe 🔥
            </Typography>
            <Typography variant="body1" gutterBottom>
                Who wants to get Fired ??
            </Typography>
            <Box mt={4}>
                <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    color="primary"
                    sx={{ mr: 2 }}
                >
                    Login
                </Button>
                <Button
                    component={Link}
                    to="/register"
                    variant="outlined"
                    color="secondary"
                >
                    Register
                </Button>
            </Box>
        </Box>
    </Container>
);;

export default Home;