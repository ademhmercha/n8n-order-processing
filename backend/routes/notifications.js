const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, order_id, message, is_read, created_at FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND customer_id = $2 RETURNING id, is_read',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error('Notification update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

module.exports = router;
