import { query } from '../config/database.js';

// GET /api/notifications
export async function getNotifications(req, res, next) {
  try {
    const result = await query(
      `SELECT n.*, c.complaint_number
       FROM notifications n
       LEFT JOIN complaints c ON n.complaint_id = c.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const unreadCount = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unread_count: parseInt(unreadCount.rows[0].count)
      }
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    } else {
      await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}
