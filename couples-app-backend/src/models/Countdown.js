import mongoose from 'mongoose';

const countdownSchema = new mongoose.Schema({
    coupleId: { type: String, required: true, unique: true }, // sorted userId_partnerId
    eventName: { type: String, default: 'Next Meet' },
    targetDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Countdown', countdownSchema);
