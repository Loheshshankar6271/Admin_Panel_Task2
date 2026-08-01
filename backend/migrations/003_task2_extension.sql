-- ============================================
-- TASK 2 EXTENSION — PUBLIC API SUPPORT SCHEMA
-- This file is ADDITIVE ONLY. It does not alter, drop, or
-- replace any table/column from schema.sql or
-- 002_system_masters.sql. Run this on the SAME database used
-- by the existing app (same DATABASE_URL / DB_* env vars).
--
--   psql -d admin_dashboard -f backend/migrations/003_task2_extension.sql
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------
-- 1. Medical Record Category Master (medical_record_categories)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_record_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mrc_active ON medical_record_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_mrc_name   ON medical_record_categories(name);

INSERT INTO medical_record_categories (name, code, description, sort_order) VALUES
  ('Lab Report',        'LAB',   'Laboratory / diagnostic test reports',  1),
  ('Prescription',      'RX',    'Doctor-issued prescriptions',           2),
  ('Discharge Summary', 'DISCH', 'Hospital discharge summaries',          3),
  ('Imaging',           'IMG',   'X-Ray, MRI, CT scan and other imaging', 4)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 2. Medical Record Sub-Category Master (medical_record_sub_categories)
--    Child of Medical Record Category
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_record_sub_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES medical_record_categories(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, name)
);
CREATE INDEX IF NOT EXISTS idx_mrsc_active   ON medical_record_sub_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_mrsc_category ON medical_record_sub_categories(category_id);

INSERT INTO medical_record_sub_categories (category_id, name, code, description, sort_order)
SELECT c.id, v.name, v.code, v.description, v.sort_order
FROM (VALUES
  ('Lab Report', 'Blood Test', 'BLOOD', 'Blood work / hematology panels', 1),
  ('Lab Report', 'Urine Test', 'URINE', 'Urinalysis reports',             2),
  ('Imaging',    'X-Ray',      'XRAY',  'Plain radiography',              1),
  ('Imaging',    'MRI Scan',   'MRI',   'Magnetic resonance imaging',     2)
) AS v(category_name, name, code, description, sort_order)
JOIN medical_record_categories c ON c.name = v.category_name
ON CONFLICT (category_id, name) DO NOTHING;

-- ------------------------------------------------
-- 3. Medical Record Type Master (medical_record_types)
--    Child of Medical Record Category, optionally scoped to a Sub-Category
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_record_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES medical_record_categories(id) ON DELETE CASCADE,
  sub_category_id UUID REFERENCES medical_record_sub_categories(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,
  unit            VARCHAR(50),
  code            VARCHAR(50),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mrt_active       ON medical_record_types(is_active);
CREATE INDEX IF NOT EXISTS idx_mrt_category     ON medical_record_types(category_id);
CREATE INDEX IF NOT EXISTS idx_mrt_sub_category ON medical_record_types(sub_category_id);

INSERT INTO medical_record_types (category_id, sub_category_id, name, unit, code, description, sort_order)
SELECT c.id, sc.id, v.name, v.unit, v.code, v.description, v.sort_order
FROM (VALUES
  ('Lab Report', 'Blood Test', 'Hemoglobin',  'g/dL', 'HB',   'Hemoglobin level test',  1),
  ('Lab Report', 'Blood Test', 'Blood Sugar', 'mg/dL','SUGAR','Blood glucose level',    2),
  ('Lab Report', NULL,         'General Panel', NULL, 'GEN',  'General lab test panel', 3),
  ('Imaging',    'X-Ray',      'Chest X-Ray', NULL,   'CXR',  'Chest radiograph',       1),
  ('Imaging',    'MRI Scan',   'Brain MRI',   NULL,   'BMRI', 'Brain magnetic resonance imaging', 2)
) AS v(category_name, sub_category_name, name, unit, code, description, sort_order)
JOIN medical_record_categories c ON c.name = v.category_name
LEFT JOIN medical_record_sub_categories sc ON sc.category_id = c.id AND sc.name = v.sub_category_name
ON CONFLICT DO NOTHING;

-- ------------------------------------------------
-- 4. Medical Record Tag Master (medical_record_tags)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_record_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mrtag_active ON medical_record_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_mrtag_name   ON medical_record_tags(name);

INSERT INTO medical_record_tags (name, code, description, sort_order) VALUES
  ('Urgent',       'URGENT',   'Requires immediate attention',    1),
  ('Follow-up',    'FOLLOWUP', 'Needs a follow-up visit',          2),
  ('Chronic',      'CHRONIC',  'Related to a chronic condition',  3),
  ('Confidential', 'CONFID',   'Sensitive / restricted record',   4),
  ('Reviewed',     'REVIEWED', 'Already reviewed by a physician', 5)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 5. User Role Master (user_roles)
--    A reference/lookup list of role definitions used for
--    display and assignment purposes. Distinct from the
--    `users.role` enum used by the auth middleware — this
--    table does not alter authentication/authorization.
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50),
  description TEXT,
  type        VARCHAR(30) NOT NULL DEFAULT 'system',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ur_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_ur_name   ON user_roles(name);

INSERT INTO user_roles (name, code, description, type, sort_order) VALUES
  ('Super Admin', 'super_admin', 'Full system access',                   'system', 1),
  ('Manager',     'manager',     'Manages orders, reports and masters', 'system', 2),
  ('Staff',       'staff',       'Front-line operational access',       'system', 3)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------
-- 6. Specialties — add image metadata columns (additive, nullable)
-- ------------------------------------------------
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_storage_path TEXT;
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_storage_bucket TEXT;
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_file_name TEXT;
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_file_size BIGINT;
ALTER TABLE healthcare_specialties ADD COLUMN IF NOT EXISTS image_mime_type TEXT;
