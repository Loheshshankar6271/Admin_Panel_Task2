const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Admin CRUD router for User Roles. Bespoke (not the generic
 * factory) because this table has a `type` field ('system' |
 * 'custom') that the generic master shape doesn't cover.
 * This is purely a reference/lookup list for display and
 * assignment purposes — it does NOT alter the `users.role` enum
 * or the auth.js middleware.
 *
 * Mounted at /api/masters/user-roles
 * Permissions mirror every other master router:
 *   - GET: any authenticated user
 *   - POST / PUT: manager, super_admin
 *   - DELETE: super_admin only
 */
const router = express.Router();
router.use(authenticate);

const VALID_SORTS = ['name', 'code', 'sort_order', 'created_at', 'updated_at'];

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', is_active = '', type = '', sort = 'sort_order', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    const sortCol = VALID_SORTS.includes(sort) ? sort : 'sort_order';
    const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `SELECT * FROM user_roles WHERE 1=1`;
    const params = [];

    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR description ILIKE $${params.length})`; }
    if (is_active === 'true' || is_active === 'false') { params.push(is_active === 'true'); query += ` AND is_active = $${params.length}::boolean`; }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) AS t`, params);
    params.push(limit, offset);
    query += ` ORDER BY ${sortCol} ${sortDir}, name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ items: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM user_roles WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User Role not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const { name, code, description, type = 'custom', is_active = true, sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: 'User Role name is required.' });

    const result = await pool.query(
      `INSERT INTO user_roles (name, code, description, type, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5::boolean, $6::integer) RETURNING *`,
      [name, code || null, description || null, type, is_active, sort_order]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `User Role "${req.body.name}" already exists.` });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const { name, code, description, type, is_active, sort_order } = req.body;
    const result = await pool.query(
      `UPDATE user_roles SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        type = COALESCE($4, type),
        is_active = COALESCE($5::boolean, is_active),
        sort_order = COALESCE($6::integer, sort_order),
        updated_at = NOW()
      WHERE id = $7 RETURNING *`,
      [name, code, description, type, is_active, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User Role not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `User Role "${req.body.name}" already exists.` });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM user_roles WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User Role not found.' });
    res.json({ message: 'User Role deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
