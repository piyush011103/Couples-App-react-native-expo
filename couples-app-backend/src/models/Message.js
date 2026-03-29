import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'voice', 'image', 'system'],
        default: 'text'
    },
    mediaUrl: {
        type: String // for voice or image
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    scheduledFor: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        default: false // Set to true by cron job if scheduled, or initially true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Message', messageSchema);
