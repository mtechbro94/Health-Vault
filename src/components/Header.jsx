import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const Header = () => {
    const { user, profile, logout, isPatient } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName = isPatient
        ? user?.email?.split('@')[0]
        : profile?.name || user?.email?.split('@')[0];

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <div className="logo-icon">🏥</div>
                    <span>HealthVault</span>
                </Link>

                <div className="header-right">
                    <div className="user-info">
                        <div className="user-avatar">
                            {getInitials(user?.email)}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{displayName}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
