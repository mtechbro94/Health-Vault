import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, isAuthenticated, user } = useAuth();
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
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password);

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
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to access your health records</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
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
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account?{' '}
                        <Link to="/signup">Create Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
