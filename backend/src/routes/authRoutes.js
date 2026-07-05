import express from 'express';
import { register, login, requestOtp, verifyOtp, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp-request', requestOtp);
router.post('/otp-verify', verifyOtp);
router.get('/me', protect, getMe);

export default router;
