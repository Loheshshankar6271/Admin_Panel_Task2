const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const validSorts = ['created_at', 'total_amount', 'status', 'customer_name', 'order_number'];
    const sortCol = validSorts.includes(sort) ? sort : 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = 'SELECT o.*, u.name as created_by_name FROM orders o LEFT JOIN users u ON o.created_by = u.id WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.customer_name ILIKE $${params.length} OR o.order_number ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}::enum_orders_status`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) AS t`, params);
    params.push(limit, offset);
    query += ` ORDER BY o.${sortCol} ${sortDir} LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ orders: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, u.name as created_by_name FROM orders o LEFT JOIN users u ON o.created_by = u.id WHERE o.id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All roles can create orders
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_email, total_amount, notes } = req.body;
    if (!customer_name || !total_amount) return res.status(400).json({ error: 'Customer name and amount required.' });

    const count = await pool.query('SELECT COUNT(*) FROM orders');
    const num = String(parseInt(count.rows[0].count) + 1).padStart(3, '0');
    const order_number = `ORD-${num}`;
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO orders (id, order_number, customer_name, customer_email, total_amount, notes, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, order_number, customer_name, customer_email || null, total_amount, notes || null, req.user.id, now, now]
    );
    res.status(201).json({ order: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// Manager + Super Admin can edit
router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const { customer_name, customer_email, status, total_amount, notes } = req.body;
    const now = new Date();
    const result = await pool.query(
      `UPDATE orders SET
        customer_name = COALESCE($1, customer_name),
        customer_email = COALESCE($2, customer_email),
        status = COALESCE($3::enum_orders_status, status),
        total_amount = COALESCE($4, total_amount),
        notes = COALESCE($5, notes),
        updated_at = $6
      WHERE id = $7 RETURNING *`,
      [customer_name, customer_email, status || null, total_amount, notes, now, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order: result.rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// Only Super Admin can delete
router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found.' });
    res.json({ message: 'Order deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
