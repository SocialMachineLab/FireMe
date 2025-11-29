import React from "react";
import { Navigate } from "react-router-dom";
import AppNav from "../components/layout/AppNav";

interface PrivateRouteProps {
	children: React.ReactNode
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
	const access = localStorage.getItem("access");

	return access ? 
			<>
				<AppNav />
				{children}
			</> : <Navigate to="/login" />;
};

export default PrivateRoute;