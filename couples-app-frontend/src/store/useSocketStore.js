import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './useAuthStore';

// ── Keep this in sync with src/api/apiClient.js BASE_URL ──────────
// Android Emulator  → http://10.0.2.2:5000
// Physical Device   → http://192.168.1.5:5000
const SOCKET_URL = 'http://192.168.1.5:5000';

const useSocketStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    partnerOnline: false,
    loveTapReceived: false,
    typingFromPartner: false,
    messages: [],

    setLoveTapReceived: (val) => set({ loveTapReceived: val }),

    initSocket: (user) => {
        if (get().socket) return;

        const socket = io(SOCKET_URL, { transports: ['websocket'] });

        socket.on('connect', () => {
            set({ isConnected: true });
            socket.emit('setup', { _id: user._id });
        });

        socket.on('connected', () => {
            console.log('Socket fully setup');
        });

        socket.on('disconnect', () => set({ isConnected: false }));

        socket.on('message received', (msg) => {
            set(state => ({ messages: [...state.messages, msg] }));
        });

        socket.on('typing', () => set({ typingFromPartner: true }));
        socket.on('stop typing', () => set({ typingFromPartner: false }));

        socket.on('receive love tap', () => {
            set({ loveTapReceived: true });
            setTimeout(() => set({ loveTapReceived: false }), 4000);
        });

        socket.on('watch sync received', (data) => {
            get().watchSyncCallback?.(data);
        });

        set({ socket });
    },

    sendLoveTap: (partnerId) => {
        const socket = get().socket;
        if (socket && partnerId) {
            socket.emit('send love tap', partnerId);
        }
    },

    sendMessage: (msg) => {
        const socket = get().socket;
        if (socket) socket.emit('new message', msg);
        set(state => ({ messages: [...state.messages, msg] }));
    },

    emitTyping: (roomId) => {
        const socket = get().socket;
        if (socket) socket.emit('typing', roomId);
    },

    emitStopTyping: (roomId) => {
        const socket = get().socket;
        if (socket) socket.emit('stop typing', roomId);
    },

    syncWatch: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('watch sync', data);
    },

    setWatchSyncCallback: (cb) => set({ watchSyncCallback: cb }),

    setMessages: (msgs) => set({ messages: msgs }),

    disconnect: () => {
        const socket = get().socket;
        if (socket) socket.disconnect();
        set({ socket: null, isConnected: false });
    },
}));

export default useSocketStore;
