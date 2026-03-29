import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Avoid returning it in queries
    },
    profilePic: {
        type: String,
        default: 'no-photo.jpg'
    },
    connectionCode: {
        type: String,
        unique: true
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    currentMood: {
        type: String,
        enum: ['Happy', 'Sad', 'Stressed', 'Loved', 'Tired', 'Neutral'],
        default: 'Neutral'
    },
    currentEnergy: {
        type: Number, // 1 to 10
        min: 1,
        max: 10,
        default: 5
    },
    lastCheckInMessage: {
        type: String,
        default: ''
    },
    lastCheckInDate: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);
