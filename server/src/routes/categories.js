import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getCategories, createCategory } from '../controllers/categoryController.js';

const router = Router();

router.get('/', getCategories); // Public - needed for complaint form
router.post('/', authenticate, requireRole('SUPER_ADMIN'), createCategory);

export default router;
