const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('super_admin'));

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}::enum_users_role`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) AS t`, params);
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required.' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5::enum_users_role,$6,$7)
       RETURNING id, name, email, role, is_active, created_at`,
      [id, name, email, hash, role, now, now]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, is_active } = req.body;
    const now = new Date();

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3::enum_users_role, role),
        is_active = COALESCE($4, is_active),
        updated_at = $5
      WHERE id = $6
      RETURNING id, name, email, role, is_active, created_at`,
      [name, email, role, is_active, now, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself.' });
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
