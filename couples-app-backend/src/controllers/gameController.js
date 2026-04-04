import GameScore from '../models/GameScore.js';
import User from '../models/User.js';

const getCoupleId = (id1, id2) => [id1.toString(), id2.toString()].sort().join('_');

// @desc    Get the scores for the couple
// @route   GET /api/game/scores
// @access  Protected
export const getGameScores = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.partnerId) {
            return res.status(400).json({ message: 'No partner connected' });
        }
        const coupleId = getCoupleId(user._id, user.partnerId);
        
        let gameScore = await GameScore.findOne({ coupleId });
        
        if (!gameScore) {
            // Initialize scores if not found
            gameScore = await GameScore.create({
                coupleId,
                scores: {
                    [user._id]: 0,
                    [user.partnerId]: 0
                }
            });
        }
        
        res.json(gameScore);
    } catch (err) {
        next(err);
    }
};

// @desc    Update games score (increment)
// @route   POST /api/game/scores/update
// @access  Protected
export const updateGameScore = async (req, res, next) => {
    try {
        const { winnerId } = req.body;
        if (!winnerId) {
            return res.status(400).json({ message: 'Winner ID is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user.partnerId) {
            return res.status(400).json({ message: 'No partner connected' });
        }
        const coupleId = getCoupleId(user._id, user.partnerId);

        let gameScore = await GameScore.findOne({ coupleId });
        
        if (!gameScore) {
            gameScore = new GameScore({ 
                coupleId, 
                scores: { 
                    [user._id]: 0, 
                    [user.partnerId]: 0 
                } 
            });
        }

        // Increment the winner's score
        const currentScore = gameScore.scores.get(winnerId) || 0;
        gameScore.scores.set(winnerId, currentScore + 1);
        
        await gameScore.save();
        
        res.json(gameScore);
    } catch (err) {
        next(err);
    }
};

// @desc    Reset games scores
// @route   POST /api/game/scores/reset
// @access  Protected
export const resetGameScores = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.partnerId) {
            return res.status(400).json({ message: 'No partner connected' });
        }
        const coupleId = getCoupleId(user._id, user.partnerId);

        const gameScore = await GameScore.findOne({ coupleId });
        
        if (gameScore) {
            gameScore.scores.set(user._id.toString(), 0);
            gameScore.scores.set(user.partnerId.toString(), 0);
            await gameScore.save();
        }
        
        res.json({ message: 'Scores reset successfully', scores: { [user._id]: 0, [user.partnerId]: 0 } });
    } catch (err) {
        next(err);
    }
};
