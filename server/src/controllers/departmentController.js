import { query } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';

// GET /api/departments
export async function getDepartments(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM departments WHERE is_active = true ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/departments (super admin)
export async function createDepartment(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, 'Department name is required');

    const result = await query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim(), description || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/departments/:id
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) { paramCount++; updates.push(`name = $${paramCount}`); params.push(name.trim()); }
    if (description !== undefined) { paramCount++; updates.push(`description = $${paramCount}`); params.push(description); }
    if (is_active !== undefined) { paramCount++; updates.push(`is_active = $${paramCount}`); params.push(is_active); }

    if (updates.length === 0) return res.json({ success: true, message: 'No changes' });

    paramCount++;
    params.push(id);

    const result = await query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) throw new ApiError(404, 'Department not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}
