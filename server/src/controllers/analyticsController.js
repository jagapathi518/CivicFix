import { query } from '../config/database.js';

// GET /api/analytics/overview
export async function getOverview(req, res, next) {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_complaints,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) as resolved,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed,
        COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED')) as pending,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('RESOLVED', 'CLOSED')) as overdue,
        COUNT(*) FILTER (WHERE status = 'REOPENED') as reopened,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL), 1) as avg_resolution_hours,
        COUNT(DISTINCT department_id) as active_departments
      FROM complaints
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/departments
export async function getDepartmentStats(req, res, next) {
  try {
    const result = await query(`
      SELECT d.name, d.id,
        COUNT(c.id) as total,
        COUNT(c.id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) as resolved,
        COUNT(c.id) FILTER (WHERE c.status NOT IN ('RESOLVED', 'CLOSED')) as pending,
        COUNT(c.id) FILTER (WHERE c.due_date < NOW() AND c.status NOT IN ('RESOLVED', 'CLOSED')) as overdue
      FROM departments d
      LEFT JOIN complaints c ON d.id = c.department_id
      WHERE d.is_active = true
      GROUP BY d.id, d.name
      ORDER BY total DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/categories
export async function getCategoryStats(req, res, next) {
  try {
    const result = await query(`
      SELECT cat.name, cat.id, d.name as department_name,
        COUNT(c.id) as total,
        COUNT(c.id) FILTER (WHERE c.status IN ('RESOLVED', 'CLOSED')) as resolved
      FROM categories cat
      LEFT JOIN complaints c ON cat.id = c.category_id
      LEFT JOIN departments d ON cat.department_id = d.id
      WHERE cat.is_active = true
      GROUP BY cat.id, cat.name, d.name
      ORDER BY total DESC
      LIMIT 20
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/public (for landing page stats)
export async function getPublicStats(req, res, next) {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_complaints,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) as resolved,
        COUNT(DISTINCT department_id) as departments,
        COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL), 0), 0) as avg_resolution_hours
      FROM complaints
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
