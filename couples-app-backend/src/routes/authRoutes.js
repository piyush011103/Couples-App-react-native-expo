import express from 'express';
const router = express.Router();
import {
    registerUser,
    loginUser,
    connectPartner,
    getPartner
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/connect', protect, connectPartner);
router.get('/partner', protect, getPartner);

export default router;
