import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { initiateSocketConnection as initiateSocket, disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const res = await api.get('/api/auth/me');
                    setUser(res.data);
                    initiateSocket(token);
                } catch (error) {
                    console.error('Auth check failed', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkLoggedIn();

        return () => {
            disconnectSocket();
        };
    }, []);

    const login = async (phoneNumber, otp) => {
        const res = await api.post('/api/auth/verify-otp', { phoneNumber, otp });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        setUser(user);
        initiateSocket(token);
    };

    const sendOtp = async (phoneNumber) => {
        const res = await api.post('/api/auth/send-otp', { phoneNumber });
        return res.data; 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider value={{ user, login, sendOtp, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
