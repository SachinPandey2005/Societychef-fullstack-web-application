import { Router } from 'express';
import { getMe, getProfile, updateProfile, sendOtp, verifyOtp, refreshToken, adminLogin, logout, deleteAccount } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit per IP window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

const router = Router();

// Public auth routes with rate limiting
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/admin-login', adminLogin);
router.post('/refresh', refreshToken);

// All routes below are protected
router.use(requireAuth);

router.get('/me', getMe);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.post('/logout', logout);
router.delete('/account', deleteAccount);

export default router;
