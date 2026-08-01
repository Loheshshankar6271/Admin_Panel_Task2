-- ============================================
-- SYSTEM MASTERS MODULE - EXTENSION SCHEMA
-- Module Owner: System Masters
-- Feature: Master Data Management
--   - Relationship Master
--   - Medical Conditions Master
--   - Specialties Master
--   - Notification Categories Master
--   - Status Master
--
-- This file is ADDITIVE ONLY. It does not alter, drop, or
-- replace any table/column from the original schema.sql
-- (orders, users). Run this on the SAME database used by
-- the existing app (same DATABASE_URL / DB_* env vars).
--
--   psql -d admin_dashboard -f backend/migrations/002_system_masters.sql
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------
-- 1. Relationship Master  (healthcare_relationships)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS healthcare_relationships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_healthcare_relationships_active ON healthcare_relationships(is_active);
CREATE INDEX IF NOT EXISTS idx_healthcare_relationships_name   ON healthcare_relationships(name);

INSERT INTO healthcare_relationships (name, code, description, sort_order) VALUES
  ('Self',     'SELF',   'The patient themselves', 1),
  ('Spouse',   'SPOUSE', 'Husband or wife',        2),
  ('Father',   'FATHER', 'Father',                  3),
  ('Mother',   'MOTHER', 'Mother',                  4),
  ('Son',      'SON',    'Son',                      5),
  ('Daughter', 'DAUGHTER','Daughter',                6),
  ('Brother',  'BROTHER','Brother',                  7),
  ('Sister',   'SISTER', 'Sister',                   8),
  ('Guardian', 'GUARDIAN','Legal guardian',          9),
  ('Other',    'OTHER',  'Any other relationship',  10)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 2. Medical Conditions Master (healthcare_medical_conditions)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS healthcare_medical_conditions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_healthcare_medical_conditions_active ON healthcare_medical_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_healthcare_medical_conditions_name   ON healthcare_medical_conditions(name);

INSERT INTO healthcare_medical_conditions (name, code, description, sort_order) VALUES
  ('Diabetes Mellitus',        'DM',   'High blood sugar levels',            1),
  ('Hypertension',             'HTN',  'High blood pressure',                2),
  ('Asthma',                   'AST',  'Chronic respiratory condition',      3),
  ('Heart Disease',            'HD',   'Cardiovascular conditions',          4),
  ('Thyroid Disorder',         'THY',  'Thyroid gland dysfunction',          5),
  ('Arthritis',                'ART',  'Joint inflammation',                 6),
  ('Chronic Kidney Disease',   'CKD',  'Long-term kidney function loss',     7),
  ('Obesity',                  'OBS',  'Excess body weight',                 8),
  ('Allergy',                  'ALG',  'Allergic reactions/sensitivities',   9),
  ('Epilepsy',                 'EPI',  'Seizure disorder',                  10),
  ('Cancer',                   'CA',   'Malignant conditions',              11),
  ('None',                     'NONE', 'No known medical condition',        12)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 3. Specialties Master (healthcare_specialties)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS healthcare_specialties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_healthcare_specialties_active ON healthcare_specialties(is_active);
CREATE INDEX IF NOT EXISTS idx_healthcare_specialties_name   ON healthcare_specialties(name);

INSERT INTO healthcare_specialties (name, code, description, sort_order) VALUES
  ('General Medicine', 'GM',    'General physician / internal medicine', 1),
  ('Cardiology',       'CARD',  'Heart and cardiovascular system',       2),
  ('Dermatology',      'DERM',  'Skin, hair and nails',                  3),
  ('Orthopedics',      'ORTH',  'Bones, joints and muscles',             4),
  ('Pediatrics',       'PED',   'Care for infants, children, teens',     5),
  ('Gynecology',       'GYN',   'Women''s reproductive health',          6),
  ('Neurology',        'NEURO', 'Brain and nervous system',              7),
  ('ENT',              'ENT',   'Ear, nose and throat',                  8),
  ('Psychiatry',       'PSY',   'Mental health',                         9),
  ('Dentistry',        'DENT',  'Oral and dental care',                 10),
  ('Ophthalmology',    'OPH',   'Eye care',                              11),
  ('Urology',          'URO',   'Urinary tract and male reproductive',   12)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 4. Notification Categories Master (master_notification_categories)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS master_notification_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_master_notification_categories_active ON master_notification_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_master_notification_categories_name   ON master_notification_categories(name);

INSERT INTO master_notification_categories (name, code, description, sort_order) VALUES
  ('Appointment Reminder',  'APPT',  'Upcoming appointment reminders',          1),
  ('Lab Results',           'LAB',   'Lab/diagnostic report notifications',     2),
  ('Billing & Payments',    'BILL',  'Invoices, payments and dues',             3),
  ('Prescription Refill',   'RX',    'Medication refill reminders',             4),
  ('Promotional Offers',    'PROMO', 'Marketing and promotional messages',      5),
  ('System Alerts',         'SYS',   'System/maintenance alerts',               6),
  ('General Announcement',  'GEN',   'General announcements',                   7)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 5. Status Master (master_statuses)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS master_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_master_statuses_active ON master_statuses(is_active);
CREATE INDEX IF NOT EXISTS idx_master_statuses_name   ON master_statuses(name);

INSERT INTO master_statuses (name, code, description, sort_order) VALUES
  ('Active',    'ACTIVE',    'Currently active',          1),
  ('Inactive',  'INACTIVE',  'Currently inactive',        2),
  ('Pending',   'PENDING',   'Awaiting action',           3),
  ('Approved',  'APPROVED',  'Approved',                  4),
  ('Rejected',  'REJECTED',  'Rejected',                  5),
  ('Draft',     'DRAFT',     'Saved as draft',             6),
  ('Completed', 'COMPLETED', 'Completed',                  7),
  ('Cancelled', 'CANCELLED', 'Cancelled',                  8),
  ('Archived',  'ARCHIVED',  'Archived',                   9)
ON CONFLICT (name) DO NOTHING;
