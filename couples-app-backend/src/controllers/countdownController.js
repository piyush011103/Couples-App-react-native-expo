import Countdown from '../models/Countdown.js';
import User from '../models/User.js';

// Helper — stable coupleId for any two users
const getCoupleId = (id1, id2) => [id1.toString(), id2.toString()].sort().join('_');

// GET /api/countdown — get the couple's active countdown
export const getCountdown = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.partnerId) return res.status(400).json({ message: 'No partner connected' });
        const coupleId = getCoupleId(user._id, user.partnerId);
        const countdown = await Countdown.findOne({ coupleId });
        if (!countdown) return res.status(404).json({ message: 'No countdown set' });
        res.json(countdown);
    } catch (err) { next(err); }
};

// POST /api/countdown — set or update countdown
export const setCountdown = async (req, res, next) => {
    try {
        const { eventName, targetDate } = req.body;
        if (!targetDate) { res.status(400); throw new Error('targetDate is required'); }
        const user = await User.findById(req.user._id);
        if (!user.partnerId) return res.status(400).json({ message: 'No partner connected' });
        const coupleId = getCoupleId(user._id, user.partnerId);
        const countdown = await Countdown.findOneAndUpdate(
            { coupleId },
            { eventName: eventName || 'Next Meet', targetDate: new Date(targetDate), createdBy: req.user._id },
            { upsert: true, new: true }
        );
        res.json({ countdown, partnerId: user.partnerId.toString() });
    } catch (err) { next(err); }
};

// DELETE /api/countdown — remove the countdown
export const deleteCountdown = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.partnerId) return res.status(400).json({ message: 'No partner connected' });
        const coupleId = getCoupleId(user._id, user.partnerId);
        await Countdown.deleteOne({ coupleId });
        res.json({ message: 'Countdown removed', partnerId: user.partnerId.toString() });
    } catch (err) { next(err); }
};
