import { create } from 'zustand';
import { io } from 'socket.io-client';
import useAuthStore from './useAuthStore';

// ── Keep this in sync with src/api/apiClient.js BASE_URL ──────────
// Android Emulator  → http://10.0.2.2:5000
// Physical Device   → http://192.168.1.5:5000
const SOCKET_URL = 'http://192.168.1.4:5000';

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

        // When the partner connects via connection code, refresh user data
        // so partnerId is populated for features like heartbeat, games, etc.
        socket.on('partner_connected', () => {
            useAuthStore.getState().refreshUser();
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

    // ── Collaborative Drawing ──────────────────────────────────────
    emitDrawStart: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('draw_start', data);
    },

    emitDrawMove: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('draw_move', data);
    },

    emitDrawEnd: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('draw_end', data);
    },

    emitDrawUndo: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('draw_undo', data);
    },

    emitDrawClear: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('draw_clear', data);
    },

    getCanvasState: (data) => {
        const socket = get().socket;
        if (socket) socket.emit('get_canvas_state', data);
    },

    setDrawingCallbacks: (callbacks) => {
        const socket = get().socket;
        if (!socket) return;

        // Cleanup old listeners if any
        socket.off('draw_start_received');
        socket.off('draw_move_received');
        socket.off('draw_end_received');
        socket.off('draw_undo_received');
        socket.off('draw_clear_received');
        socket.off('canvas_state_received');

        socket.on('draw_start_received', callbacks.onDrawStart);
        socket.on('draw_move_received', callbacks.onDrawMove);
        socket.on('draw_end_received', callbacks.onDrawEnd);
        socket.on('draw_undo_received', callbacks.onDrawUndo);
        socket.on('draw_clear_received', callbacks.onDrawClear);
        socket.on('canvas_state_received', callbacks.onCanvasStateReceived);
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
