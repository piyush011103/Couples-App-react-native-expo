import express from 'express';
const router = express.Router();
import { upload } from '../config/cloudinary.js';
import { protect } from '../middlewares/authMiddleware.js';

router.post('/', protect, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }
    
    res.json({
        message: 'Image uploaded successfully',
        imageUrl: req.file.path
    });
});

export default router;
