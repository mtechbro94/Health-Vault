import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import EmergencyAccess from './pages/EmergencyAccess';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-page">
                <div className="glass-card text-center">
                    <div className="logo-icon" style={{ margin: '0 auto 1rem', fontSize: '2rem' }}>🏥</div>
                    <p>Loading HealthVault...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/emergency/:patientId" element={<EmergencyAccess />} />

            {/* Protected Routes - Patient */}
            <Route
                path="/patient/*"
                element={
                    <ProtectedRoute allowedRole="patient">
                        <PatientDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Protected Routes - Hospital */}
            <Route
                path="/hospital/*"
                element={
                    <ProtectedRoute allowedRole="hospital">
                        <HospitalDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Default Redirect */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// Smart redirect based on auth state
function HomeRedirect() {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'patient') {
        return <Navigate to="/patient" replace />;
    }

    if (user.role === 'hospital') {
        return <Navigate to="/hospital" replace />;
    }

    return <Navigate to="/login" replace />;
}

export default App;
