import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from "../pages/home/home";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import Dashboard from "../pages/dashboard/dashboard";
import CampaignsPage from "../pages/campaigns/campaigns";
import CampaignDetailPage from "../pages/campaigns/campaignDetail";
import QuestionsPage from "../pages/questions/questions";
import PrivateRoute from "./PrivateRoute";

const AppRoutes : React.FC = () => {

    const isAuth = !!localStorage.getItem("access");

    return (

        <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={ isAuth ? <Navigate to="/dashboard" /> : <Login /> } />
            <Route path="/register" element={ isAuth ? <Navigate to="/dashboard" /> : <Register /> } />
            <Route path="/dashboard" element={ <PrivateRoute><Dashboard /></PrivateRoute> } />
            <Route path="/campaigns" element={<PrivateRoute><CampaignsPage /></PrivateRoute>} />
            <Route path="/campaigns/:id" element={<PrivateRoute><CampaignDetailPage /></PrivateRoute>} />
            <Route path="/questions" element={<PrivateRoute><QuestionsPage /></PrivateRoute>} />

        </Routes>
        
    );

}

export default AppRoutes