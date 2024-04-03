import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
	const { user } = useAuth();

	// Assuming `user` could be null or undefined initially, until verified.
	if (user === undefined) {
		// Optionally, render a loading indicator while the user state is being verified.
		return <div>Loading...</div>;
	}

	if (
		!user ||
		!(user.role === 'sa' || user.role === 's' || user.role === 'a')
	) {
		return <Navigate to='/login' replace />;
	}

	return children;
};

export default ProtectedRoute;
