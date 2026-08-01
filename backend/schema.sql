-- ============================================
-- ADMIN PANEL - COMPLETE SCHEMA
-- Run this entire file on your Admin_Panel DB
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create orders status enum (if not exists)
DO $$ BEGIN
  CREATE TYPE enum_orders_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(150),
  status enum_orders_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Seed orders
INSERT INTO orders (id, order_number, customer_name, customer_email, status, total_amount, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ORD-001', 'Ravi Kumar', 'ravi@example.com', 'completed', 12500.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-002', 'Priya Sharma', 'priya@example.com', 'pending', 8750.50, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-003', 'Arjun Singh', 'arjun@example.com', 'processing', 34200.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-004', 'Meera Nair', 'meera@example.com', 'cancelled', 5000.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-005', 'Karan Mehta', 'karan@example.com', 'completed', 19800.75, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-006', 'Ananya Rao', 'ananya@example.com', 'pending', 7300.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-007', 'Vikram Das', 'vikram@example.com', 'processing', 22100.25, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-008', 'Sanya Gupta', 'sanya@example.com', 'completed', 15600.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-009', 'Rohit Verma', 'rohit@example.com', 'pending', 9450.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-010', 'Divya Pillai', 'divya@example.com', 'processing', 41000.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-011', 'Aditya Joshi', 'aditya@example.com', 'completed', 6800.50, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-012', 'Nisha Kapoor', 'nisha@example.com', 'cancelled', 3200.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-013', 'Suresh Patel', 'suresh@example.com', 'pending', 18900.00, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-014', 'Pooja Reddy', 'pooja@example.com', 'completed', 25500.75, NOW(), NOW()),
  (gen_random_uuid(), 'ORD-015', 'Manish Yadav', 'manish@example.com', 'processing', 13400.00, NOW(), NOW())
ON CONFLICT (order_number) DO NOTHING;
