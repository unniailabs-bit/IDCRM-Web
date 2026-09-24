-- Migration: Add trust_id to student_generated_ids table
-- This enables proper trust-level credit tracking

-- Add trust_id column to student_generated_ids table
ALTER TABLE student_generated_ids 
ADD COLUMN IF NOT EXISTS trust_id INTEGER REFERENCES trusts(id);

-- Update existing records with trust_id from schools
UPDATE student_generated_ids sgi
SET trust_id = (
  SELECT trust_id FROM schools WHERE id = sgi.school_id
)
WHERE trust_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_student_generated_ids_trust_id 
ON student_generated_ids(trust_id);

-- Add comment
COMMENT ON COLUMN student_generated_ids.trust_id IS 'Reference to trust that owns the school, for credit tracking at trust level';

