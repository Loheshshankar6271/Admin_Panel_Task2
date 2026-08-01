const express = require('express');
const pool = require('../config/db');

/**
 * TASK 2 EXTENSION — Public API
 *
 * These endpoints are intentionally NOT behind `authenticate` —
 * they are read-only (GET) public endpoints, separate from the
 * authenticated /api/masters/* admin CRUD endpoints. They read
 * from the exact same tables the admin dashboard manages, but
 * return a curated, exact field shape as specified in the
 * Task 2 Extension email. Nothing under /api/masters/* is
 * touched by this file.
 *
 * Mounted directly at /api (see index.js), giving:
 *   GET /api/relationships[/:id]
 *   GET /api/medical-conditions[/:id]
 *   GET /api/medical-record-categories[/:id]
 *   GET /api/medical-record-categories/sub-categories[/:id]
 *   GET /api/medical-record-categories/types[/:id]
 *   GET /api/medical-record-tags[/:id]
 *   GET /api/specialties[/:id]
 *   GET /api/user-roles[/:id]
 */
const router = express.Router();

// ------------------------------------------------------------
// 1. Relationships
//    Fields: id, name, created_at
// ------------------------------------------------------------
router.get('/relationships', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at FROM healthcare_relationships ORDER BY sort_order ASC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/relationships/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at FROM healthcare_relationships WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Relationship not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 2. Medical Conditions
//    Fields: id, condition_name, description, is_active, created_at
// ------------------------------------------------------------
router.get('/medical-conditions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name AS condition_name, description, is_active, created_at
       FROM healthcare_medical_conditions ORDER BY sort_order ASC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-conditions/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name AS condition_name, description, is_active, created_at
       FROM healthcare_medical_conditions WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Medical condition not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 3. Medical Record Categories (+ nested subCategories[], each with nested types[])
//    Category fields: id, name, created_at, updated_at
//    subCategories[]: id, name, category_id, created_at, updated_at
//      types[] (nested inside each sub-category): id, name, unit,
//      category_id, sub_category_id, created_at, updated_at
// ------------------------------------------------------------
async function fetchCategoryChildren(categoryId) {
  const subParams = categoryId ? [categoryId] : [];
  const subQuery = `SELECT id, name, category_id, created_at, updated_at FROM medical_record_sub_categories
                     ${categoryId ? 'WHERE category_id = $1' : ''} ORDER BY sort_order ASC, name ASC`;
  const typeQuery = `SELECT id, name, unit, category_id, sub_category_id, created_at, updated_at FROM medical_record_types
                      ${categoryId ? 'WHERE category_id = $1' : ''} ORDER BY sort_order ASC, name ASC`;
  const [subsResult, typesResult] = await Promise.all([
    pool.query(subQuery, subParams),
    pool.query(typeQuery, subParams),
  ]);
  // Nest each type under its parent sub-category (types with no
  // sub_category_id don't belong to any sub-category and are omitted
  // here, matching the exact nesting shape in the spec).
  const subs = subsResult.rows.map((sc) => ({
    ...sc,
    types: typesResult.rows.filter((t) => t.sub_category_id === sc.id),
  }));
  return { subs };
}

router.get('/medical-record-categories', async (req, res) => {
  try {
    const categories = await pool.query(
      `SELECT id, name, created_at, updated_at FROM medical_record_categories ORDER BY sort_order ASC, name ASC`
    );
    const allSubs = await fetchCategoryChildren(null);

    const items = categories.rows.map((cat) => ({
      ...cat,
      subCategories: allSubs.subs.filter((s) => s.category_id === cat.id),
    }));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// NOTE: '/medical-record-categories/sub-categories' and
// '/medical-record-categories/types' (below) are registered
// BEFORE '/medical-record-categories/:id' (further below) on
// purpose — Express matches routes in registration order, so the
// literal paths must come first or they'd be swallowed by ':id'.

// ------------------------------------------------------------
// 4. Medical Record Sub-Categories (+ nested category object)
//    Fields: id, name, category_id, created_at, updated_at
//    category: id, name, created_at, updated_at
// ------------------------------------------------------------
router.get('/medical-record-categories/sub-categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sc.id, sc.name, sc.category_id, sc.created_at, sc.updated_at,
              c.id AS c_id, c.name AS c_name, c.created_at AS c_created_at, c.updated_at AS c_updated_at
       FROM medical_record_sub_categories sc
       JOIN medical_record_categories c ON c.id = sc.category_id
       ORDER BY sc.sort_order ASC, sc.name ASC`
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category_id: r.category_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category: { id: r.c_id, name: r.c_name, created_at: r.c_created_at, updated_at: r.c_updated_at },
    }));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-record-categories/sub-categories/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sc.id, sc.name, sc.category_id, sc.created_at, sc.updated_at,
              c.id AS c_id, c.name AS c_name, c.created_at AS c_created_at, c.updated_at AS c_updated_at
       FROM medical_record_sub_categories sc
       JOIN medical_record_categories c ON c.id = sc.category_id
       WHERE sc.id = $1`,
      [req.params.id]
    );
    const r = result.rows[0];
    if (!r) return res.status(404).json({ error: 'Sub-category not found.' });
    res.json({
      id: r.id,
      name: r.name,
      category_id: r.category_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category: { id: r.c_id, name: r.c_name, created_at: r.c_created_at, updated_at: r.c_updated_at },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 5. Medical Record Types (+ nested category, subCategory objects)
//    Fields: id, name, unit, category_id, sub_category_id, created_at, updated_at
//    category: id, name, created_at, updated_at
//    subCategory: id, name, category_id, created_at, updated_at (or null)
// ------------------------------------------------------------
const TYPE_SELECT = `
  SELECT t.id, t.name, t.unit, t.category_id, t.sub_category_id, t.created_at, t.updated_at,
         c.id AS c_id, c.name AS c_name, c.created_at AS c_created_at, c.updated_at AS c_updated_at,
         sc.id AS sc_id, sc.name AS sc_name, sc.category_id AS sc_category_id,
         sc.created_at AS sc_created_at, sc.updated_at AS sc_updated_at
  FROM medical_record_types t
  JOIN medical_record_categories c ON c.id = t.category_id
  LEFT JOIN medical_record_sub_categories sc ON sc.id = t.sub_category_id
`;

function shapeType(r) {
  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    category_id: r.category_id,
    sub_category_id: r.sub_category_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    category: { id: r.c_id, name: r.c_name, created_at: r.c_created_at, updated_at: r.c_updated_at },
    subCategory: r.sc_id
      ? { id: r.sc_id, name: r.sc_name, category_id: r.sc_category_id, created_at: r.sc_created_at, updated_at: r.sc_updated_at }
      : null,
  };
}

router.get('/medical-record-categories/types', async (req, res) => {
  try {
    const result = await pool.query(`${TYPE_SELECT} ORDER BY t.sort_order ASC, t.name ASC`);
    res.json(result.rows.map(shapeType));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-record-categories/types/:id', async (req, res) => {
  try {
    const result = await pool.query(`${TYPE_SELECT} WHERE t.id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record type not found.' });
    res.json(shapeType(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 3b. Medical Record Category detail (':id') — registered AFTER
//     the literal 'sub-categories' and 'types' paths above so
//     those aren't swallowed by this param route.
// ------------------------------------------------------------
router.get('/medical-record-categories/:id', async (req, res) => {
  try {
    const catResult = await pool.query(
      `SELECT id, name, created_at, updated_at FROM medical_record_categories WHERE id = $1`,
      [req.params.id]
    );
    if (!catResult.rows[0]) return res.status(404).json({ error: 'Medical record category not found.' });

    const { subs } = await fetchCategoryChildren(req.params.id);
    res.json({ ...catResult.rows[0], subCategories: subs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 6. Medical Record Tags
//    Fields: id, tag_name, is_active, created_at, updated_at
// ------------------------------------------------------------
router.get('/medical-record-tags', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name AS tag_name, is_active, created_at, updated_at
       FROM medical_record_tags ORDER BY sort_order ASC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-record-tags/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name AS tag_name, is_active, created_at, updated_at
       FROM medical_record_tags WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Tag not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 7. Specialties
//    Fields: id, name, image_url, image_storage_path, image_storage_bucket,
//            image_file_name, image_file_size, image_mime_type, is_active, created_at
// ------------------------------------------------------------
const SPECIALTY_FIELDS = `id, name, image_url, image_storage_path, image_storage_bucket,
       image_file_name, image_file_size, image_mime_type, is_active, created_at`;

router.get('/specialties', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${SPECIALTY_FIELDS} FROM healthcare_specialties ORDER BY sort_order ASC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/specialties/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${SPECIALTY_FIELDS} FROM healthcare_specialties WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Specialty not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 8. User Roles
//    Fields: id, name, description, type, createdAt, updatedAt
// ------------------------------------------------------------
router.get('/user-roles', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, type, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM user_roles ORDER BY sort_order ASC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user-roles/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, type, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM user_roles WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User role not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
