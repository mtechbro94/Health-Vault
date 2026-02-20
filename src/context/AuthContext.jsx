import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUser,
    loginUser,
    getPatientByUserId,
    getHospitalByUserId
} from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('healthvault_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            loadProfile(parsedUser);
        }
        setLoading(false);
    }, []);

    const loadProfile = async (user) => {
        try {
            if (user.role === 'patient') {
                const patientProfile = await getPatientByUserId(user.id);
                setProfile(patientProfile);
            } else if (user.role === 'hospital') {
                const hospitalProfile = await getHospitalByUserId(user.id);
                setProfile(hospitalProfile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const login = async (email, password) => {
        try {
            const result = await loginUser(email, password);
            const authenticatedUser = result.user;
            setUser(authenticatedUser);
            localStorage.setItem('healthvault_user', JSON.stringify(authenticatedUser));
            await loadProfile(authenticatedUser);
            return { success: true, user: authenticatedUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (email, password, role, hospitalName = '', patientName = '', patientLocation = '') => {
        try {
            const result = await createUser(email, password, role, hospitalName, patientName, patientLocation);
            const newUser = result.user;
            setUser(newUser);
            localStorage.setItem('healthvault_user', JSON.stringify(newUser));
            await loadProfile(newUser);
            return { success: true, user: newUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('healthvault_user');
    };

    const refreshProfile = () => {
        if (user) {
            loadProfile(user);
        }
    };

    const value = {
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        isPatient: user?.role === 'patient',
        isHospital: user?.role === 'hospital',
        login,
        signup,
        logout,
        refreshProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
