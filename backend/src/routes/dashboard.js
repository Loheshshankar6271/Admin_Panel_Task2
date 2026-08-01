const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/summary', async (req, res) => {
  try {
    const [ordersTotal, pending, completed, processing, cancelled, recentOrders] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'::enum_orders_status"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'::enum_orders_status"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'processing'::enum_orders_status"),
      pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'::enum_orders_status"),
      pool.query("SELECT o.*, u.name as created_by_name FROM orders o LEFT JOIN users u ON o.created_by = u.id ORDER BY o.created_at DESC LIMIT 5"),
    ]);

    const summary = {
      totalOrders: parseInt(ordersTotal.rows[0].total),
      totalRevenue: parseFloat(ordersTotal.rows[0].revenue),
      pendingOrders: parseInt(pending.rows[0].count),
      completedOrders: parseInt(completed.rows[0].count),
      processingOrders: parseInt(processing.rows[0].count),
      cancelledOrders: parseInt(cancelled.rows[0].count),
      recentOrders: recentOrders.rows,
    };

    if (req.user.role === 'super_admin') {
      const [totalUsers, activeUsers] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      ]);
      summary.totalUsers = parseInt(totalUsers.rows[0].count);
      summary.activeUsers = parseInt(activeUsers.rows[0].count);
    }

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
