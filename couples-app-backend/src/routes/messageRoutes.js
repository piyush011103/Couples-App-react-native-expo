import express from 'express';
import { getMessages, sendMessage, getScheduledMessages } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/scheduled', protect, getScheduledMessages);       // GET /api/messages/scheduled
router.get('/:partnerId', protect, getMessages);               // GET /api/messages/:partnerId
router.post('/', protect, sendMessage);                        // POST /api/messages

export default router;
