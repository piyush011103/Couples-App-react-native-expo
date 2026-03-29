import Message from '../models/Message.js';

// @desc    Get messages between logged-in user and their partner
// @route   GET /api/messages/:partnerId
// @access  Private
const getMessages = async (req, res, next) => {
    try {
        const { partnerId } = req.params;
        const userId = req.user._id;

        // Fetch messages in both directions between the two users
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: partnerId },
                { sender: partnerId, receiver: userId }
            ],
            isDelivered: true,    // only show delivered messages
            isScheduled: false,   // don't show scheduled-but-not-yet-sent
        })
        .sort({ createdAt: 1 })   // oldest first
        .populate('sender', 'name')
        .populate('receiver', 'name');

        // Mark unread messages as read
        await Message.updateMany(
            { sender: partnerId, receiver: userId, isRead: false },
            { isRead: true }
        );

        res.json(messages);
    } catch (err) {
        next(err);
    }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
    try {
        const { receiver, text, type, mediaUrl, isScheduled, scheduledFor } = req.body;
        const sender = req.user._id;

        if (!receiver) {
            res.status(400);
            throw new Error('Receiver is required');
        }
        if (!text && !mediaUrl) {
            res.status(400);
            throw new Error('Message text or media is required');
        }

        const message = await Message.create({
            sender,
            receiver,
            text: text || '',
            type: type || 'text',
            mediaUrl,
            isScheduled: isScheduled || false,
            scheduledFor: scheduledFor || null,
            isDelivered: !isScheduled,  // scheduled messages start as undelivered
            isRead: false,
        });

        const populated = await message.populate('sender', 'name');

        res.status(201).json(populated);
    } catch (err) {
        next(err);
    }
};

// @desc    Get all scheduled messages for the logged-in user
// @route   GET /api/messages/scheduled
// @access  Private
const getScheduledMessages = async (req, res, next) => {
    try {
        const messages = await Message.find({
            sender: req.user._id,
            isScheduled: true,
            isDelivered: false,
        }).sort({ scheduledFor: 1 });

        res.json(messages);
    } catch (err) {
        next(err);
    }
};

export { getMessages, sendMessage, getScheduledMessages };
