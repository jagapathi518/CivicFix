import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getOverview, getDepartmentStats, getCategoryStats, getPublicStats } from '../controllers/analyticsController.js';

const router = Router();

router.get('/public', getPublicStats); // Public - for landing page
router.get('/overview', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), getOverview);
router.get('/departments', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), getDepartmentStats);
router.get('/categories', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), getCategoryStats);

export default router;
