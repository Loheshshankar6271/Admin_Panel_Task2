const express = require('express');
const createMasterRouter = require('../utils/masterRouterFactory');
const specialtiesAdminRouter = require('./specialtiesAdmin');
const medicalRecordCategoriesAdminRouter = require('./medicalRecordCategoriesAdmin');
const userRolesAdminRouter = require('./userRolesAdmin');

const router = express.Router();

// Master Data Management — Module Owner: System Masters
router.use('/relationships', createMasterRouter('healthcare_relationships', 'Relationship'));
router.use('/medical-conditions', createMasterRouter('healthcare_medical_conditions', 'Medical Condition'));
// Specialties: extended router (adds image_* fields on top of the original name/code/
// description/is_active/sort_order fields — nothing from the original is removed).
router.use('/specialties', specialtiesAdminRouter);
router.use('/notification-categories', createMasterRouter('master_notification_categories', 'Notification Category'));
router.use('/statuses', createMasterRouter('master_statuses', 'Status'));

// Task 2 Extension: Medical Record Categories (+ Sub-Categories, Types), Tags, User Roles
router.use('/medical-record-categories', medicalRecordCategoriesAdminRouter);
router.use('/medical-record-tags', createMasterRouter('medical_record_tags', 'Medical Record Tag'));
router.use('/user-roles', userRolesAdminRouter);

module.exports = router;
