import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
    coupleId: { 
        type: String, 
        required: true, 
        unique: true 
    }, // sorted userId_partnerId
    scores: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

export default mongoose.model('GameScore', gameScoreSchema);
