import { query } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// GET /api/categories
export async function getCategories(req, res, next) {
  try {
    const { department_id } = req.query;
    let sql = `SELECT c.*, d.name as department_name
               FROM categories c
               LEFT JOIN departments d ON c.department_id = d.id
               WHERE c.is_active = true`;
    const params = [];

    if (department_id) {
      sql += ' AND c.department_id = $1';
      params.push(department_id);
    }

    sql += ' ORDER BY d.name, c.name';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories (super admin)
export async function createCategory(req, res, next) {
  try {
    const { name, description, department_id } = req.body;
    if (!name || !department_id) throw new ApiError(400, 'Name and department are required');

    const result = await query(
      'INSERT INTO categories (name, description, department_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || null, department_id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
