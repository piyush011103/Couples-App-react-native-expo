import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const useAuthStore = create((set) => ({
    user: null,
    isLoading: true,
    error: null,

    // App Initialization
    init: async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                set({ user: JSON.parse(userStr) });
            }
        } catch (e) {
            console.error('Failed to load user info', e);
        } finally {
            set({ isLoading: false });
        }
    },

    // Login Action
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            const userData = response.data;
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            set({ user: userData, isLoading: false });
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    // Register Action
    register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post('/auth/register', { name, email, password });
            const userData = response.data;
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            set({ user: userData, isLoading: false });
        } catch (error) {
            const msg = error.response?.data?.message || 'Registration failed';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    // Pair Connect Action
    connectPartner: async (connectionCode) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post('/auth/connect', { connectionCode });
            
            // Updating local user state to reflect new partnerId
            set((state) => {
                const updatedUser = { ...state.user, partnerId: response.data.partnerId };
                AsyncStorage.setItem('user', JSON.stringify(updatedUser)); // Keep it async in background
                return { user: updatedUser, isLoading: false };
            });

            return response.data;
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to connect';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    // Logout Action
    logout: async () => {
        await AsyncStorage.removeItem('user');
        set({ user: null });
    }
}));

export default useAuthStore;
