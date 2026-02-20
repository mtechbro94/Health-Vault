import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="glass-card text-center">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        // Redirect to the correct dashboard based on role
        const redirectPath = user.role === 'patient' ? '/patient' : '/hospital';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
