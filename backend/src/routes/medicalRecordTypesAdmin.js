const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Admin CRUD router for Medical Record Types. Bespoke (not the
 * generic factory) because this table has two parent references
 * (category_id, sub_category_id) plus a `unit` field that the
 * generic master shape doesn't cover.
 *
 * Mounted at /api/masters/medical-record-categories/types
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
    const { page = 1, limit = 10, search = '', is_active = '', category_id = '', sub_category_id = '', sort = 'sort_order', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    const sortCol = VALID_SORTS.includes(sort) ? sort : 'sort_order';
    const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `SELECT * FROM medical_record_types WHERE 1=1`;
    const params = [];

    if (category_id) { params.push(category_id); query += ` AND category_id = $${params.length}::uuid`; }
    if (sub_category_id) { params.push(sub_category_id); query += ` AND sub_category_id = $${params.length}::uuid`; }
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
    const result = await pool.query(`SELECT * FROM medical_record_types WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record Type not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const { name, unit, code, description, is_active = true, sort_order = 0, category_id, sub_category_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Record Type name is required.' });
    if (!category_id) return res.status(400).json({ error: 'Category is required.' });

    const result = await pool.query(
      `INSERT INTO medical_record_types (category_id, sub_category_id, name, unit, code, description, is_active, sort_order)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::boolean, $8::integer) RETURNING *`,
      [category_id, sub_category_id || null, name, unit || null, code || null, description || null, is_active, sort_order]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Category or Sub-Category not found.' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const { name, unit, code, description, is_active, sort_order, category_id, sub_category_id } = req.body;
    const result = await pool.query(
      `UPDATE medical_record_types SET
        category_id = COALESCE($1::uuid, category_id),
        sub_category_id = $2::uuid,
        name = COALESCE($3, name),
        unit = COALESCE($4, unit),
        code = COALESCE($5, code),
        description = COALESCE($6, description),
        is_active = COALESCE($7::boolean, is_active),
        sort_order = COALESCE($8::integer, sort_order),
        updated_at = NOW()
      WHERE id = $9 RETURNING *`,
      [category_id || null, sub_category_id || null, name, unit, code, description, is_active, sort_order, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Record Type not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Category or Sub-Category not found.' });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM medical_record_types WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record Type not found.' });
    res.json({ message: 'Record Type deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
