import { query } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// Valid status transitions
const STATUS_TRANSITIONS = {
  'NEW': ['UNDER_REVIEW'],
  'UNDER_REVIEW': ['ASSIGNED', 'NEW'],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['RESOLVED'],
  'RESOLVED': ['CITIZEN_VERIFICATION'],
  'CITIZEN_VERIFICATION': ['CLOSED', 'REOPENED'],
  'REOPENED': ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
  'CLOSED': []
};

// Generate complaint number: CF-YYYY-NNNNNN
async function generateComplaintNumber() {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('complaint_number_seq')");
  const seq = String(result.rows[0].nextval).padStart(6, '0');
  return `CF-${year}-${seq}`;
}

// Calculate due date based on priority
async function calculateDueDate(priority) {
  const slaResult = await query('SELECT resolution_hours FROM sla_config WHERE priority = $1', [priority]);
  if (slaResult.rows.length === 0) return null;
  const hours = slaResult.rows[0].resolution_hours;
  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + hours);
  return dueDate;
}

// POST /api/complaints
export async function createComplaint(req, res, next) {
  try {
    const { title, description, department_id, category_id, address, landmark, city, state, pincode, latitude, longitude } = req.body;

    if (!title || !description) {
      throw new ApiError(400, 'Title and description are required');
    }

    const complaint_number = await generateComplaintNumber();
    const priority = 'MEDIUM'; // Default priority, admin can change later
    const due_date = await calculateDueDate(priority);

    const result = await query(
      `INSERT INTO complaints (complaint_number, citizen_id, department_id, category_id, title, description,
        address, landmark, city, state, pincode, latitude, longitude, priority, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'NEW', $15)
       RETURNING *`,
      [complaint_number, req.user.id, department_id || null, category_id || null, title.trim(),
       description.trim(), address || null, landmark || null, city || null, state || null,
       pincode || null, latitude || null, longitude || null, priority, due_date]
    );

    const complaint = result.rows[0];

    // Create initial status history
    await query(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
       VALUES ($1, NULL, 'NEW', $2, 'Complaint submitted')`,
      [complaint.id, req.user.id]
    );

    // Create audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'COMPLAINT_CREATED', 'COMPLAINT', $2, $3)`,
      [req.user.id, complaint.id, JSON.stringify({ complaint_number })]
    );

    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints
export async function getComplaints(req, res, next) {
  try {
    const { status, priority, department_id, category_id, search, page = 1, limit = 20, sort = 'newest' } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === 'CITIZEN') {
      paramCount++;
      conditions.push(`c.citizen_id = $${paramCount}`);
      params.push(req.user.id);
    } else if (req.user.role === 'WORKER') {
      paramCount++;
      conditions.push(`ca_w.worker_id = $${paramCount}`);
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.user.department_id) {
      // Admin sees complaints for their department
      paramCount++;
      conditions.push(`c.department_id = $${paramCount}`);
      params.push(req.user.department_id);
    }
    // SUPER_ADMIN sees all

    if (status) {
      paramCount++;
      conditions.push(`c.status = $${paramCount}`);
      params.push(status);
    }
    if (priority) {
      paramCount++;
      conditions.push(`c.priority = $${paramCount}`);
      params.push(priority);
    }
    if (department_id) {
      paramCount++;
      conditions.push(`c.department_id = $${paramCount}`);
      params.push(department_id);
    }
    if (category_id) {
      paramCount++;
      conditions.push(`c.category_id = $${paramCount}`);
      params.push(category_id);
    }
    if (search) {
      paramCount++;
      conditions.push(`(c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount} OR c.complaint_number ILIKE $${paramCount} OR c.city ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sortMap = {
      'newest': 'c.created_at DESC',
      'oldest': 'c.created_at ASC',
      'priority': "CASE c.priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 END",
      'oldest_unresolved': "CASE WHEN c.status NOT IN ('RESOLVED','CLOSED') THEN 0 ELSE 1 END, c.created_at ASC"
    };
    const orderBy = sortMap[sort] || sortMap['newest'];

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM complaints c
       LEFT JOIN complaint_assignments ca_w ON c.id = ca_w.complaint_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get complaints
    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(parseInt(offset));

    const result = await query(
      `SELECT c.*, d.name as department_name, cat.name as category_name,
              u.name as citizen_name, u.email as citizen_email,
              w.name as worker_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN complaint_assignments ca_w ON c.id = ca_w.complaint_id
       LEFT JOIN users w ON ca_w.worker_id = w.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/:id
export async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*, d.name as department_name, cat.name as category_name,
              u.name as citizen_name, u.email as citizen_email, u.phone as citizen_phone,
              w.name as worker_name, w.id as worker_id
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN complaint_assignments ca ON c.id = ca.complaint_id
       LEFT JOIN users w ON ca.worker_id = w.id
       WHERE c.id = $1 OR c.complaint_number = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Complaint not found');
    }

    const complaint = result.rows[0];

    // Role-based access check
    if (req.user.role === 'CITIZEN' && complaint.citizen_id !== req.user.id) {
      throw new ApiError(403, 'You can only view your own complaints');
    }
    if (req.user.role === 'WORKER' && complaint.worker_id !== req.user.id) {
      throw new ApiError(403, 'You can only view complaints assigned to you');
    }

    // Get status history
    const historyResult = await query(
      `SELECT sh.*, u.name as changed_by_name
       FROM complaint_status_history sh
       LEFT JOIN users u ON sh.changed_by = u.id
       WHERE sh.complaint_id = $1
       ORDER BY sh.created_at ASC`,
      [complaint.id]
    );

    // Get evidence
    const evidenceResult = await query(
      `SELECT e.*, u.name as uploaded_by_name
       FROM complaint_evidence e
       LEFT JOIN users u ON e.uploaded_by = u.id
       WHERE e.complaint_id = $1
       ORDER BY e.created_at ASC`,
      [complaint.id]
    );

    // Get comments (hide internal comments from citizens)
    const commentCondition = req.user.role === 'CITIZEN' ? 'AND cc.is_internal = false' : '';
    const commentsResult = await query(
      `SELECT cc.*, u.name as user_name, u.role as user_role
       FROM complaint_comments cc
       LEFT JOIN users u ON cc.user_id = u.id
       WHERE cc.complaint_id = $1 ${commentCondition}
       ORDER BY cc.created_at ASC`,
      [complaint.id]
    );

    // Get assignment info
    const assignmentResult = await query(
      `SELECT ca.*, w.name as worker_name
       FROM complaint_assignments ca
       LEFT JOIN users w ON ca.worker_id = w.id
       WHERE ca.complaint_id = $1
       ORDER BY ca.assigned_at DESC LIMIT 1`,
      [complaint.id]
    );

    // Get rating
    const ratingResult = await query(
      'SELECT * FROM ratings WHERE complaint_id = $1',
      [complaint.id]
    );

    res.json({
      success: true,
      data: {
        ...complaint,
        history: historyResult.rows,
        evidence: evidenceResult.rows,
        comments: commentsResult.rows,
        assignment: assignmentResult.rows[0] || null,
        rating: ratingResult.rows[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:id (admin update)
export async function updateComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { priority, status, department_id, category_id } = req.body;

    const current = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (current.rows.length === 0) throw new ApiError(404, 'Complaint not found');
    const complaint = current.rows[0];

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (priority && priority !== complaint.priority) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
      // Recalculate due date
      const dueDate = await calculateDueDate(priority);
      if (dueDate) {
        paramCount++;
        updates.push(`due_date = $${paramCount}`);
        params.push(dueDate);
      }
    }
    if (department_id && department_id !== complaint.department_id) {
      paramCount++;
      updates.push(`department_id = $${paramCount}`);
      params.push(department_id);
    }
    if (category_id && category_id !== complaint.category_id) {
      paramCount++;
      updates.push(`category_id = $${paramCount}`);
      params.push(category_id);
    }
    if (status && status !== complaint.status) {
      // Validate transition
      const allowed = STATUS_TRANSITIONS[complaint.status] || [];
      if (!allowed.includes(status)) {
        throw new ApiError(400, `Cannot transition from ${complaint.status} to ${status}`);
      }
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);

      if (status === 'RESOLVED') {
        paramCount++;
        updates.push(`resolved_at = $${paramCount}`);
        params.push(new Date());
      }
      if (status === 'CLOSED') {
        paramCount++;
        updates.push(`closed_at = $${paramCount}`);
        params.push(new Date());
      }

      // Record status change
      await query(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [id, complaint.status, status, req.user.id]
      );
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: complaint, message: 'No changes made' });
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(id);

    const result = await query(
      `UPDATE complaints SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/comments
export async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { comment, is_internal } = req.body;

    if (!comment || !comment.trim()) {
      throw new ApiError(400, 'Comment is required');
    }

    // Citizens cannot add internal comments
    const internal = req.user.role === 'CITIZEN' ? false : (is_internal || false);

    const result = await query(
      `INSERT INTO complaint_comments (complaint_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.id, comment.trim(), internal]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/evidence
export async function addEvidence(req, res, next) {
  try {
    const { id } = req.params;
    const { evidence_type } = req.body;

    if (!req.file) {
      throw new ApiError(400, 'Image file is required');
    }

    const file_url = `/uploads/${req.file.filename}`;
    const type = evidence_type || (req.user.role === 'CITIZEN' ? 'CITIZEN_REPORT' : 'BEFORE_WORK');

    const result = await query(
      `INSERT INTO complaint_evidence (complaint_id, uploaded_by, file_url, file_type, evidence_type)
       VALUES ($1, $2, $3, 'IMAGE', $4)
       RETURNING *`,
      [id, req.user.id, file_url, type]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/assign
export async function assignComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { worker_id } = req.body;

    if (!worker_id) throw new ApiError(400, 'Worker ID is required');

    // Verify worker exists and is a WORKER
    const workerResult = await query('SELECT id, name, role FROM users WHERE id = $1 AND role = $2 AND is_active = true', [worker_id, 'WORKER']);
    if (workerResult.rows.length === 0) throw new ApiError(404, 'Worker not found or inactive');

    const complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length === 0) throw new ApiError(404, 'Complaint not found');

    // Create assignment
    await query(
      `INSERT INTO complaint_assignments (complaint_id, worker_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [id, worker_id, req.user.id]
    );

    // Update status
    const oldStatus = complaint.rows[0].status;
    await query(
      `UPDATE complaints SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Status history
    await query(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
       VALUES ($1, $2, 'ASSIGNED', $3, $4)`,
      [id, oldStatus, req.user.id, `Assigned to ${workerResult.rows[0].name}`]
    );

    // Notify worker
    await query(
      `INSERT INTO notifications (user_id, complaint_id, title, message)
       VALUES ($1, $2, 'New Assignment', $3)`,
      [worker_id, id, `Complaint ${complaint.rows[0].complaint_number} has been assigned to you.`]
    );

    // Notify citizen
    await query(
      `INSERT INTO notifications (user_id, complaint_id, title, message)
       VALUES ($1, $2, 'Complaint Assigned', $3)`,
      [complaint.rows[0].citizen_id, id, `Your complaint ${complaint.rows[0].complaint_number} has been assigned to a field worker.`]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'ADMIN_ASSIGNED_COMPLAINT', 'COMPLAINT', $2, $3)`,
      [req.user.id, id, JSON.stringify({ worker_id, worker_name: workerResult.rows[0].name })]
    );

    res.json({ success: true, message: 'Complaint assigned successfully' });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/accept (worker)
export async function acceptComplaint(req, res, next) {
  try {
    const { id } = req.params;

    await query(
      `UPDATE complaint_assignments SET accepted_at = NOW() WHERE complaint_id = $1 AND worker_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true, message: 'Assignment accepted' });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/start (worker)
export async function startWork(req, res, next) {
  try {
    const { id } = req.params;

    const complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length === 0) throw new ApiError(404, 'Complaint not found');

    if (complaint.rows[0].status !== 'ASSIGNED') {
      throw new ApiError(400, 'Complaint must be in ASSIGNED status to start work');
    }

    await query(`UPDATE complaints SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1`, [id]);

    await query(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
       VALUES ($1, 'ASSIGNED', 'IN_PROGRESS', $2, 'Field worker started work')`,
      [id, req.user.id]
    );

    // Notify citizen
    await query(
      `INSERT INTO notifications (user_id, complaint_id, title, message)
       VALUES ($1, $2, 'Work Started', $3)`,
      [complaint.rows[0].citizen_id, id, `Work has started on your complaint ${complaint.rows[0].complaint_number}.`]
    );

    res.json({ success: true, message: 'Work started' });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/resolve (worker)
export async function resolveComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length === 0) throw new ApiError(404, 'Complaint not found');

    if (complaint.rows[0].status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'Complaint must be IN_PROGRESS to resolve');
    }

    await query(
      `UPDATE complaints SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await query(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
       VALUES ($1, 'IN_PROGRESS', 'RESOLVED', $2, $3)`,
      [id, req.user.id, notes || 'Issue resolved by field worker']
    );

    await query(
      `UPDATE complaint_assignments SET completed_at = NOW() WHERE complaint_id = $1 AND worker_id = $2`,
      [id, req.user.id]
    );

    // Notify citizen for verification
    await query(
      `INSERT INTO notifications (user_id, complaint_id, title, message)
       VALUES ($1, $2, 'Issue Resolved - Verification Required', $3)`,
      [complaint.rows[0].citizen_id, id, `Your complaint ${complaint.rows[0].complaint_number} has been marked as resolved. Please verify.`]
    );

    res.json({ success: true, message: 'Complaint resolved' });
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/verify (citizen)
export async function verifyComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { is_resolved, rating, feedback } = req.body;

    const complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length === 0) throw new ApiError(404, 'Complaint not found');

    if (complaint.rows[0].citizen_id !== req.user.id) {
      throw new ApiError(403, 'Only the complainant can verify resolution');
    }

    if (complaint.rows[0].status !== 'RESOLVED') {
      throw new ApiError(400, 'Complaint must be in RESOLVED status to verify');
    }

    if (is_resolved) {
      // Close the complaint
      await query(
        `UPDATE complaints SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await query(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
         VALUES ($1, 'RESOLVED', 'CLOSED', $2, 'Citizen verified resolution')`,
        [id, req.user.id]
      );

      // Save rating if provided
      if (rating) {
        await query(
          `INSERT INTO ratings (complaint_id, citizen_id, rating, feedback)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (complaint_id, citizen_id) DO UPDATE SET rating = $3, feedback = $4`,
          [id, req.user.id, rating, feedback || null]
        );
      }

      res.json({ success: true, message: 'Complaint closed. Thank you for your feedback.' });
    } else {
      // Reopen
      await query(
        `UPDATE complaints SET status = 'REOPENED', resolved_at = NULL, updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await query(
        `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
         VALUES ($1, 'RESOLVED', 'REOPENED', $2, $3)`,
        [id, req.user.id, feedback || 'Issue not resolved as reported by citizen']
      );

      res.json({ success: true, message: 'Complaint reopened' });
    }
  } catch (err) {
    next(err);
  }
}

// POST /api/complaints/:id/reopen (citizen)
export async function reopenComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length === 0) throw new ApiError(404, 'Complaint not found');

    if (complaint.rows[0].citizen_id !== req.user.id) {
      throw new ApiError(403, 'Only the complainant can reopen');
    }

    if (!['RESOLVED', 'CITIZEN_VERIFICATION'].includes(complaint.rows[0].status)) {
      throw new ApiError(400, 'Complaint can only be reopened from RESOLVED status');
    }

    await query(
      `UPDATE complaints SET status = 'REOPENED', resolved_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await query(
      `INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, comment)
       VALUES ($1, $2, 'REOPENED', $3, $4)`,
      [id, complaint.rows[0].status, req.user.id, reason || 'Reopened by citizen']
    );

    res.json({ success: true, message: 'Complaint reopened' });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/track/:complaintNumber (public)
export async function trackComplaint(req, res, next) {
  try {
    const { complaintNumber } = req.params;

    const result = await query(
      `SELECT c.complaint_number, c.title, c.status, c.priority, c.city, c.state,
              c.created_at, c.updated_at, c.resolved_at, c.closed_at,
              d.name as department_name, cat.name as category_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.complaint_number = $1`,
      [complaintNumber.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Complaint not found');
    }

    // Get timeline (public-safe)
    const historyResult = await query(
      `SELECT new_status, created_at FROM complaint_status_history
       WHERE complaint_id = (SELECT id FROM complaints WHERE complaint_number = $1)
       ORDER BY created_at ASC`,
      [complaintNumber.toUpperCase()]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        timeline: historyResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/stats/overview
export async function getStats(req, res, next) {
  try {
    const conditions = [];
    const params = [];

    if (req.user.role === 'CITIZEN') {
      conditions.push('citizen_id = $1');
      params.push(req.user.id);
    } else if (req.user.role === 'WORKER') {
      // Worker stats from assignments
      const workerStats = await query(
        `SELECT
          COUNT(*) FILTER (WHERE c.status = 'ASSIGNED') as assigned,
          COUNT(*) FILTER (WHERE c.status = 'IN_PROGRESS') as in_progress,
          COUNT(*) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) as resolved,
          COUNT(*) as total
         FROM complaint_assignments ca
         JOIN complaints c ON ca.complaint_id = c.id
         WHERE ca.worker_id = $1`,
        [req.user.id]
      );
      return res.json({ success: true, data: workerStats.rows[0] });
    } else if (req.user.role === 'ADMIN' && req.user.department_id) {
      conditions.push('department_id = $1');
      params.push(req.user.department_id);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'NEW') as new,
        COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') as under_review,
        COUNT(*) FILTER (WHERE status = 'ASSIGNED') as assigned,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
        COUNT(*) FILTER (WHERE status = 'REOPENED') as reopened,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('RESOLVED', 'CLOSED')) as overdue,
        COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED', 'CITIZEN_VERIFICATION')) as pending
       FROM complaints ${whereClause}`,
      params
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
