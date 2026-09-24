-- Migration: Add section column to schools table
-- This migration adds a section field to schools table and migrates existing data

-- Step 1: Add section column (nullable initially for migration)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS section VARCHAR(50);

-- Step 2: Migrate existing data from classes to schools
-- For schools that have classes, use the most common section
UPDATE schools s
SET section = (
  SELECT c.section 
  FROM classes c 
  WHERE c.school_id = s.id 
  GROUP BY c.section
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE section IS NULL 
AND EXISTS (SELECT 1 FROM classes WHERE school_id = s.id);

-- Step 3: Set default for schools without classes
UPDATE schools
SET section = 'Primary'
WHERE section IS NULL;

-- Step 4: Make section NOT NULL (after ensuring all schools have a section)
-- Note: Uncomment this after verifying all schools have sections
-- ALTER TABLE schools ALTER COLUMN section SET NOT NULL;

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_schools_section ON schools(section);
CREATE INDEX IF NOT EXISTS idx_schools_trust_section ON schools(trust_id, section);

