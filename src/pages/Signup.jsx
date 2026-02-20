import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientLocation, setPatientLocation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (isAuthenticated && user) {
            const redirectPath = user.role === 'patient' ? '/patient' : '/hospital';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!email || !password || !confirmPassword || !role) {
            setError('Please fill in all required fields');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (role === 'hospital' && !hospitalName.trim()) {
            setError('Please enter the hospital name');
            return;
        }

        if (role === 'patient' && !patientName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            const result = await signup(email, password, role, hospitalName, patientName, patientLocation);

            if (result.success) {
                const redirectPath = result.user.role === 'patient' ? '/patient' : '/hospital';
                navigate(redirectPath, { replace: true });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container fade-in">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="logo-icon">🏥</div>
                            <span>HealthVault</span>
                        </div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join HealthVault to manage your health records</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Role Selection */}
                        <div className="form-group">
                            <label className="form-label">Select Your Role *</label>
                            <div className="role-selector">
                                <label className="role-option">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="patient"
                                        checked={role === 'patient'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <div className="role-card">
                                        <div className="role-icon">👤</div>
                                        <div className="role-title">Patient</div>
                                        <div className="role-description">Manage your health records</div>
                                    </div>
                                </label>

                                <label className="role-option">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="hospital"
                                        checked={role === 'hospital'}
                                        onChange={(e) => setRole(e.target.value)}
                                    />
                                    <div className="role-card">
                                        <div className="role-icon">🏥</div>
                                        <div className="role-title">Hospital</div>
                                        <div className="role-description">Access patient records</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Hospital Name (only for hospital role) */}
                        {role === 'hospital' && (
                            <div className="form-group slide-in">
                                <label className="form-label" htmlFor="hospitalName">Hospital Name *</label>
                                <input
                                    type="text"
                                    id="hospitalName"
                                    className="form-input"
                                    placeholder="Enter hospital name"
                                    value={hospitalName}
                                    onChange={(e) => setHospitalName(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Patient Name and Location (only for patient role) */}
                        {role === 'patient' && (
                            <>
                                <div className="form-group slide-in">
                                    <label className="form-label" htmlFor="patientName">Your Full Name *</label>
                                    <input
                                        type="text"
                                        id="patientName"
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                    />
                                </div>
                                <div className="form-group slide-in">
                                    <label className="form-label" htmlFor="patientLocation">Your Location</label>
                                    <input
                                        type="text"
                                        id="patientLocation"
                                        className="form-input"
                                        placeholder="City, State (e.g., Hyderabad, Telangana)"
                                        value={patientLocation}
                                        onChange={(e) => setPatientLocation(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address *</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password *</label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                placeholder="Create a password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="form-input"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading || !role}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
