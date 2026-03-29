import express from 'express';
import { getCountdown, setCountdown, deleteCountdown } from '../controllers/countdownController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCountdown);
router.post('/', protect, setCountdown);
router.delete('/', protect, deleteCountdown);

export default router;
