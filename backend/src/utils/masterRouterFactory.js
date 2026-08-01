const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Generic CRUD router factory for "master data" tables.
 *
 * Every System Masters table (healthcare_relationships,
 * healthcare_medical_conditions, healthcare_specialties,
 * master_notification_categories, master_statuses) shares the
 * exact same shape:
 *   id, name, code, description, is_active, sort_order, created_at, updated_at
 *
 * Rather than duplicating near-identical route files five times,
 * this factory builds one router per table. `table` is always a
 * hardcoded value supplied by routes/masters.js — never user input —
 * so there is no SQL injection risk in the interpolated identifiers.
 *
 * Permissions:
 *   - GET (list/detail): any authenticated user
 *   - POST / PUT: manager, super_admin
 *   - DELETE: super_admin only
 */
function createMasterRouter(table, label) {
  const router = express.Router();
  router.use(authenticate);

  const VALID_SORTS = ['name', 'code', 'sort_order', 'created_at', 'updated_at'];

  // List (search + filter + pagination)
  router.get('/', async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        is_active = '',
        sort = 'sort_order',
        order = 'ASC',
      } = req.query;

      const offset = (page - 1) * limit;
      const sortCol = VALID_SORTS.includes(sort) ? sort : 'sort_order';
      const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      let query = `SELECT * FROM ${table} WHERE 1=1`;
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR description ILIKE $${params.length})`;
      }
      if (is_active === 'true' || is_active === 'false') {
        params.push(is_active === 'true');
        query += ` AND is_active = $${params.length}::boolean`;
      }

      const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) AS t`, params);
      params.push(limit, offset);
      query += ` ORDER BY ${sortCol} ${sortDir}, name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await pool.query(query, params);
      res.json({
        items: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Detail
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: `${label} not found.` });
      res.json({ item: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  router.post('/', authorize('manager', 'super_admin'), async (req, res) => {
    try {
      const { name, code, description, is_active = true, sort_order = 0 } = req.body;
      if (!name) return res.status(400).json({ error: `${label} name is required.` });

      const result = await pool.query(
        `INSERT INTO ${table} (name, code, description, is_active, sort_order)
         VALUES ($1, $2, $3, $4::boolean, $5::integer) RETURNING *`,
        [name, code || null, description || null, is_active, sort_order]
      );
      res.status(201).json({ item: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: `${label} "${req.body.name}" already exists.` });
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update
  router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
    try {
      const { name, code, description, is_active, sort_order } = req.body;
      const result = await pool.query(
        `UPDATE ${table} SET
          name = COALESCE($1, name),
          code = COALESCE($2, code),
          description = COALESCE($3, description),
          is_active = COALESCE($4::boolean, is_active),
          sort_order = COALESCE($5::integer, sort_order),
          updated_at = NOW()
        WHERE id = $6 RETURNING *`,
        [name, code, description, is_active, sort_order, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: `${label} not found.` });
      res.json({ item: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: `${label} "${req.body.name}" already exists.` });
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete
  router.delete('/:id', authorize('super_admin'), async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: `${label} not found.` });
      res.json({ message: `${label} deleted.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createMasterRouter;
