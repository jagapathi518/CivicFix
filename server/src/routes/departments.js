import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getDepartments, createDepartment, updateDepartment } from '../controllers/departmentController.js';

const router = Router();

router.get('/', getDepartments); // Public - needed for complaint form
router.post('/', authenticate, requireRole('SUPER_ADMIN'), createDepartment);
router.patch('/:id', authenticate, requireRole('SUPER_ADMIN'), updateDepartment);

export default router;
