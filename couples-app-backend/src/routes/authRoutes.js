import express from 'express';
const router = express.Router();
import {
    registerUser,
    loginUser,
    connectPartner,
    getPartner,
    getMe
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/connect', protect, connectPartner);
router.get('/partner', protect, getPartner);
router.get('/me', protect, getMe);

export default router;
