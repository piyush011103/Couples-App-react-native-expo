import express from 'express';
import { getGameScores, updateGameScore, resetGameScores } from '../controllers/gameController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/scores', protect, getGameScores);
router.post('/scores/update', protect, updateGameScore);
router.post('/scores/reset', protect, resetGameScores);

export default router;
