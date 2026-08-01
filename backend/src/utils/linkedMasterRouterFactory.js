const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * CRUD router factory for "master data" tables that belong to a
 * parent record (e.g. Medical Record Sub-Categories, which belong
 * to a Medical Record Category). Same shape/behavior as
 * masterRouterFactory.js, plus a required `parentColumn`
 * (e.g. category_id) that is:
 *   - accepted as an optional ?category_id= filter on the list route
 *   - required on create
 *   - returned on every row
 *
 * `table`/`parentColumn` are always hardcoded values supplied by
 * routes/masters.js — never user input — so there is no SQL
 * injection risk in the interpolated identifiers.
 *
 * Permissions mirror masterRouterFactory.js:
 *   - GET (list/detail): any authenticated user
 *   - POST / PUT: manager, super_admin
 *   - DELETE: super_admin only
 */
function createLinkedMasterRouter(table, label, parentColumn, parentLabel = 'Category') {
  const router = express.Router();
  router.use(authenticate);

  const VALID_SORTS = ['name', 'code', 'sort_order', 'created_at', 'updated_at'];

  router.get('/', async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', is_active = '', sort = 'sort_order', order = 'ASC' } = req.query;
      const parentId = req.query[parentColumn];

      const offset = (page - 1) * limit;
      const sortCol = VALID_SORTS.includes(sort) ? sort : 'sort_order';
      const sortDir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      let query = `SELECT * FROM ${table} WHERE 1=1`;
      const params = [];

      if (parentId) {
        params.push(parentId);
        query += ` AND ${parentColumn} = $${params.length}::uuid`;
      }
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
      res.json({ items: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!result.rows[0]) return res.status(404).json({ error: `${label} not found.` });
      res.json({ item: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', authorize('manager', 'super_admin'), async (req, res) => {
    try {
      const { name, code, description, is_active = true, sort_order = 0 } = req.body;
      const parentId = req.body[parentColumn];
      if (!name) return res.status(400).json({ error: `${label} name is required.` });
      if (!parentId) return res.status(400).json({ error: `${parentLabel} is required.` });

      const result = await pool.query(
        `INSERT INTO ${table} (${parentColumn}, name, code, description, is_active, sort_order)
         VALUES ($1::uuid, $2, $3, $4, $5::boolean, $6::integer) RETURNING *`,
        [parentId, name, code || null, description || null, is_active, sort_order]
      );
      res.status(201).json({ item: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: `${label} "${req.body.name}" already exists for this ${parentLabel.toLowerCase()}.` });
      if (err.code === '23503') return res.status(400).json({ error: `${parentLabel} not found.` });
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', authorize('manager', 'super_admin'), async (req, res) => {
    try {
      const { name, code, description, is_active, sort_order } = req.body;
      const parentId = req.body[parentColumn];
      const result = await pool.query(
        `UPDATE ${table} SET
          ${parentColumn} = COALESCE($1::uuid, ${parentColumn}),
          name = COALESCE($2, name),
          code = COALESCE($3, code),
          description = COALESCE($4, description),
          is_active = COALESCE($5::boolean, is_active),
          sort_order = COALESCE($6::integer, sort_order),
          updated_at = NOW()
        WHERE id = $7 RETURNING *`,
        [parentId || null, name, code, description, is_active, sort_order, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: `${label} not found.` });
      res.json({ item: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: `${label} "${req.body.name}" already exists for this ${parentLabel.toLowerCase()}.` });
      if (err.code === '23503') return res.status(400).json({ error: `${parentLabel} not found.` });
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

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

module.exports = createLinkedMasterRouter;
