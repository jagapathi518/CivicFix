import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);

export default router;
