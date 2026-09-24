-- Migration: Create schools table
-- This table stores school information and credentials for school admin login

CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    trust_id INTEGER,
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) UNIQUE,
    school_admin_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    section VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    total_students INTEGER DEFAULT 0,
    custom_id VARCHAR(50) UNIQUE,
    allot_no_of_id INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sequence for custom_id if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS school_custom_seq START 1;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);
CREATE INDEX IF NOT EXISTS idx_schools_trust_id ON schools(trust_id);
CREATE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);

-- Add comment
COMMENT ON TABLE schools IS 'Stores school information and admin credentials';

