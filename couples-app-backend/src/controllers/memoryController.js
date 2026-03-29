import Memory from '../models/Memory.js';

// @desc    Get all memories for a couple
// @route   GET /api/memories
// @access  Private
const getMemories = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const partnerId = req.user.partnerId;

        if (!partnerId) {
            return res.status(400).json({ message: 'No partner connected' });
        }

        // The couple ID could be simply the sorted string of both ObjectIds
        const coupleId = [userId.toString(), partnerId.toString()].sort().join('_');

        const memories = await Memory.find({ coupleId }).sort({ date: -1 }).populate('author', 'name profilePic');
        
        res.json(memories);
    } catch(err) {
        next(err);
    }
};

// @desc    Add a memory
// @route   POST /api/memories
// @access  Private
const addMemory = async (req, res, next) => {
    try {
        const { imageUrl, caption, date } = req.body;
        const userId = req.user._id;
        const partnerId = req.user.partnerId;

        if (!partnerId) {
            return res.status(400).json({ message: 'You need to connect with a partner first' });
        }

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const coupleId = [userId.toString(), partnerId.toString()].sort().join('_');

        const memory = await Memory.create({
            author: userId,
            coupleId,
            imageUrl,
            caption,
            date: date || Date.now()
        });

        res.status(201).json(memory);
    } catch(err) {
        next(err);
    }
};

export {
    getMemories,
    addMemory
};
