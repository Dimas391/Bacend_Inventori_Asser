import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  verifyEmail, 
  verifyEmailGet, 
  resendVerification, 
  checkVerificationStatus 
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail); // POST method
router.get('/verify-email', verifyEmailGet); // GET method untuk compatibility
router.post('/resend-verification', resendVerification);
router.post('/check-verification', checkVerificationStatus);

// Protected routes
router.post('/logout', authenticateToken, logout);

export default router;