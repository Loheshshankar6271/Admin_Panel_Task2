const express = require('express');
const createMasterRouter = require('../utils/masterRouterFactory');
const createLinkedMasterRouter = require('../utils/linkedMasterRouterFactory');
const typesRouter = require('./medicalRecordTypesAdmin');

/**
 * Admin CRUD for Medical Record Category, plus its two child
 * masters (Sub-Categories, Types).
 *
 * Mounted at /api/masters/medical-record-categories, giving:
 *   GET/POST            /api/masters/medical-record-categories
 *   GET/PUT/DELETE      /api/masters/medical-record-categories/:id
 *   GET/POST            /api/masters/medical-record-categories/sub-categories        (?category_id= to scope)
 *   GET/PUT/DELETE      /api/masters/medical-record-categories/sub-categories/:id
 *   GET/POST            /api/masters/medical-record-categories/types                 (?category_id=&sub_category_id= to scope)
 *   GET/PUT/DELETE      /api/masters/medical-record-categories/types/:id
 *
 * The child routers are mounted BEFORE the base '/:id' route so
 * '/sub-categories' and '/types' are matched as their own paths
 * rather than being swallowed by the category's :id param.
 */
const router = express.Router();

router.use('/sub-categories', createLinkedMasterRouter('medical_record_sub_categories', 'Sub-Category', 'category_id', 'Category'));
router.use('/types', typesRouter);

// Base Medical Record Category CRUD (same shape as the other System Masters tables)
router.use('/', createMasterRouter('medical_record_categories', 'Medical Record Category'));

module.exports = router;
