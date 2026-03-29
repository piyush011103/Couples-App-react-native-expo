import express from 'express';
const router = express.Router();
import { getMemories, addMemory } from '../controllers/memoryController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.route('/')
    .get(protect, getMemories)
    .post(protect, addMemory);

export default router;
