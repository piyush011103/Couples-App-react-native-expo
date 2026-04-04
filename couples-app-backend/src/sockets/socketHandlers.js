import Message from '../models/Message.js';

// ── Collaborative Drawing ──────────────────────────────────────────
const canvasStates = new Map(); // Key: coupleKey (sorted userIds), Value: strokes[]

const getCoupleKey = (id1, id2) => [id1, id2].sort().join('_');

const initializeSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join personal room based on userId for private events
        socket.on('setup', (userData) => {
            if (userData && userData._id) {
                socket.join(userData._id);
                socket.emit('connected');
                console.log(`User mapped to room: ${userData._id}`);
            }
        });

        // Join a shared room for the couple
        socket.on('join chat', (coupleRoomId) => {
            socket.join(coupleRoomId);
            console.log(`User joined room: ${coupleRoomId}`);
        });

        // Handle typing indicators
        socket.on('typing', (room) => socket.in(room).emit('typing'));
        socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

        // Handle new messages
        socket.on('new message', (newMessageReceived) => {
            const receiverId = newMessageReceived.receiver;
            if (!receiverId) return console.log('Message has no receiver');

            // Emit to receiver's personal room
            socket.in(receiverId).emit('message received', newMessageReceived);
        });

        // Handle Love Tap ❤️
        socket.on('send love tap', (receiverId) => {
            socket.in(receiverId).emit('receive love tap', { timestamp: new Date() });
            console.log(`Sent Love tap to: ${receiverId}`);
        });

        // Handle sync for Watch Together
        socket.on('watch sync', (data) => {
            socket.in(data.receiverId).emit('watch sync received', data);
        });

        // ── Drawing Events ───────────────────────────────────────────────
        /**
         * data: { receiverId, senderId, strokeId, color, width, point }
         */
        socket.on('draw_start', (data) => {
            const { receiverId, senderId, ...strokeInfo } = data;
            socket.in(receiverId).emit('draw_start_received', strokeInfo);
        });

        /**
         * data: { receiverId, senderId, strokeId, point }
         */
        socket.on('draw_move', (data) => {
            const { receiverId, senderId, ...moveInfo } = data;
            socket.in(receiverId).emit('draw_move_received', moveInfo);
        });

        /**
         * data: { receiverId, senderId, stroke }
         */
        socket.on('draw_end', (data) => {
            const { receiverId, senderId, stroke } = data;
            const coupleKey = getCoupleKey(senderId, receiverId);
            
            if (!canvasStates.has(coupleKey)) {
                canvasStates.set(coupleKey, []);
            }
            
            const history = canvasStates.get(coupleKey);
            history.push(stroke);
            
            // Limit history to last 200 strokes
            if (history.length > 200) history.shift();
            
            socket.in(receiverId).emit('draw_end_received', { strokeId: stroke.id });
        });

        socket.on('draw_undo', (data) => {
            const { receiverId, senderId } = data;
            const coupleKey = getCoupleKey(senderId, receiverId);
            const history = canvasStates.get(coupleKey);
            if (history && history.length > 0) {
                // Find last stroke by this specific user
                for (let i = history.length - 1; i >= 0; i--) {
                    if (history[i].userId === senderId) {
                        history.splice(i, 1);
                        break;
                    }
                }
                socket.in(receiverId).emit('draw_undo_received');
            }
        });

        socket.on('draw_clear', (data) => {
            const { receiverId, senderId } = data;
            const coupleKey = getCoupleKey(senderId, receiverId);
            canvasStates.set(coupleKey, []);
            socket.in(receiverId).emit('draw_clear_received');
        });

        socket.on('get_canvas_state', (data) => {
            const { senderId, receiverId } = data;
            const coupleKey = getCoupleKey(senderId, receiverId);
            const history = canvasStates.get(coupleKey) || [];
            socket.emit('canvas_state_received', history);
        });

        // ── Tic Tac Toe Real-Time Sync ─────────────────────────────
        // data: { receiverId, board, currentTurn, winner }
        socket.on('game_move', (data) => {
            socket.in(data.receiverId).emit('game_move_received', data);
        });

        // data: { receiverId }
        socket.on('game_reset', (data) => {
            socket.in(data.receiverId).emit('game_reset_received');
        });

        // data: { receiverId, mark } — tell partner which mark you picked (X or O)
        socket.on('game_mark_selected', (data) => {
            socket.in(data.receiverId).emit('game_mark_received', { chosenMark: data.mark });
        });

        // data: { receiverId } — score reset sync
        socket.on('game_score_reset', (data) => {
            socket.in(data.receiverId).emit('game_score_reset_received');
        });

        // ── Music Sync (Listen Together) ──────────────────────────────────
        // data: { receiverId, url, isPlaying, positionMillis, metadata }
        socket.on('music_sync', (data) => {
            socket.in(data.receiverId).emit('music_sync_received', data);
        });

        // Initial sync request relay
        socket.on('request_sync', (data) => {
            if (data && data.receiverId) {
                socket.in(data.receiverId).emit('request_sync');
            }
        });

        // ── Countdown sync ─────────────────────────────────────────
        // data: { receiverId, countdown }
        socket.on('countdown_set', (data) => {
            socket.in(data.receiverId).emit('countdown_updated', data.countdown);
        });
        socket.on('countdown_deleted', (data) => {
            socket.in(data.receiverId).emit('countdown_removed');
        });

        // Cleanup on disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected from socket');
        });
    });
};

export default initializeSockets;
