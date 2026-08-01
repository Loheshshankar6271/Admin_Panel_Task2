const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Admin CRUD router for Specialties. This REPLACES the generic
 * masterRouterFactory('healthcare_specialties', ...) mount that
 * was previously used, so that the admin can also manage the
 * new image metadata columns added in migration 003. All fields
 * and behavior from the original generic router are preserved
 * (name, code, description, is_active, sort_order, search,
 * pagination, same permission model) — only the new image_*
 * fields have been added on top. No existing functionality is
 * removed.
 *
 * Mounted at /api/masters/specialties
 */
const router = express.Router();
router.use(authenticate);

const VALID_SORTS = ['name', 'code', 'sort_order', 'created_at', 'updated_at'];

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', is_active = '', sort = 'sort_order', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    const sortCol = VALID_SORTS.includes(sort) ? sort : 'sort_order';
    const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let query = `SELECT * FROM healthcare_specialties WHERE 1=1`;
    const params = [];

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
    const result = await pool.query(`SELECT * FROM healthcare_specialties WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Specialty not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const {
      name, code, description, is_active = true, sort_order = 0,
      image_url, image_storage_path, image_storage_bucket, image_file_name, image_file_size, image_mime_type,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Specialty name is required.' });

    const result = await pool.query(
      `INSERT INTO healthcare_specialties
        (name, code, description, is_active, sort_order,
         image_url, image_storage_path, image_storage_bucket, image_file_name, image_file_size, image_mime_type)
       VALUES ($1, $2, $3, $4::boolean, $5::integer, $6, $7, $8, $9, $10::bigint, $11) RETURNING *`,
      [name, code || null, description || null, is_active, sort_order,
        image_url || null, image_storage_path || null, image_storage_bucket || null,
        image_file_name || null, image_file_size || null, image_mime_type || null]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Specialty "${req.body.name}" already exists.` });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
  try {
    const {
      name, code, description, is_active, sort_order,
      image_url, image_storage_path, image_storage_bucket, image_file_name, image_file_size, image_mime_type,
    } = req.body;

    const result = await pool.query(
      `UPDATE healthcare_specialties SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        is_active = COALESCE($4::boolean, is_active),
        sort_order = COALESCE($5::integer, sort_order),
        image_url = COALESCE($6, image_url),
        image_storage_path = COALESCE($7, image_storage_path),
        image_storage_bucket = COALESCE($8, image_storage_bucket),
        image_file_name = COALESCE($9, image_file_name),
        image_file_size = COALESCE($10::bigint, image_file_size),
        image_mime_type = COALESCE($11, image_mime_type),
        updated_at = NOW()
      WHERE id = $12 RETURNING *`,
      [name, code, description, is_active, sort_order,
        image_url, image_storage_path, image_storage_bucket, image_file_name, image_file_size, image_mime_type,
        req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Specialty not found.' });
    res.json({ item: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `Specialty "${req.body.name}" already exists.` });
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM healthcare_specialties WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Specialty not found.' });
    res.json({ message: 'Specialty deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
