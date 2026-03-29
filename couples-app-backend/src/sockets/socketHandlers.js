import Message from '../models/Message.js';

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
