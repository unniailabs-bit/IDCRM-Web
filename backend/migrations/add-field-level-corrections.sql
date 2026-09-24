-- Migration: Add field-level correction tracking to student_forms table
-- This allows tracking which specific fields need correction and individual form links

ALTER TABLE student_forms 
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_correction BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS correction_notes TEXT,
ADD COLUMN IF NOT EXISTS fields_requiring_correction JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS correction_field_notes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS edited_by_school_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_by_admin_id INTEGER,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS parent_submission_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS form_link_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS individual_form_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS correction_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS correction_sent_via VARCHAR(50);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_student_forms_token ON student_forms(form_link_token);
CREATE INDEX IF NOT EXISTS idx_student_forms_individual_token ON student_forms(individual_form_token);
CREATE INDEX IF NOT EXISTS idx_student_forms_active ON student_forms(is_active, requires_correction);

-- Example structure for fields_requiring_correction JSONB:
-- {
--   "first_name": true,
--   "dob": true,
--   "father_phone": false,
--   "mother_name": true
-- }
-- true = needs correction, false = correct

-- Example structure for correction_field_notes JSONB:
-- {
--   "first_name": "Name should match birth certificate",
--   "dob": "Date format incorrect, use DD/MM/YYYY",
--   "mother_name": "Please provide full name"
-- }

