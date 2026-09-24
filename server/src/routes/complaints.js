import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createComplaint, getComplaints, getComplaintById, updateComplaint,
  addComment, addEvidence, assignComplaint, acceptComplaint,
  startWork, resolveComplaint, verifyComplaint, reopenComplaint,
  trackComplaint, getStats
} from '../controllers/complaintController.js';

const router = Router();

// Public
router.get('/track/:complaintNumber', trackComplaint);

// Authenticated
router.post('/', authenticate, requireRole('CITIZEN'), createComplaint);
router.get('/', authenticate, getComplaints);
router.get('/stats/overview', authenticate, getStats);
router.get('/:id', authenticate, getComplaintById);
router.patch('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), updateComplaint);

// Comments & Evidence
router.post('/:id/comments', authenticate, addComment);
router.post('/:id/evidence', authenticate, upload.single('image'), addEvidence);

// Assignment (Admin/Super Admin)
router.post('/:id/assign', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), assignComplaint);

// Worker actions
router.post('/:id/accept', authenticate, requireRole('WORKER'), acceptComplaint);
router.post('/:id/start', authenticate, requireRole('WORKER'), startWork);
router.post('/:id/resolve', authenticate, requireRole('WORKER'), resolveComplaint);

// Citizen actions
router.post('/:id/verify', authenticate, requireRole('CITIZEN'), verifyComplaint);
router.post('/:id/reopen', authenticate, requireRole('CITIZEN'), reopenComplaint);

export default router;
