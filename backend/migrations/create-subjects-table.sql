-- Migration: Create subjects table
-- This table stores all available subjects/departments that can be assigned to teachers

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

-- Insert some common subjects
INSERT INTO subjects (name, description) VALUES
    ('Mathematics', 'Mathematics and related subjects'),
    ('English', 'English language and literature'),
    ('Science', 'General Science'),
    ('Physics', 'Physics'),
    ('Chemistry', 'Chemistry'),
    ('Biology', 'Biology'),
    ('Social Studies', 'Social Studies and History'),
    ('Hindi', 'Hindi language'),
    ('Computer Science', 'Computer Science and IT'),
    ('Physical Education', 'Physical Education and Sports'),
    ('Arts', 'Fine Arts and Drawing'),
    ('Music', 'Music'),
    ('Economics', 'Economics'),
    ('Geography', 'Geography'),
    ('History', 'History'),
    ('Civics', 'Civics and Political Science')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE subjects IS 'Stores all available subjects/departments for teachers';

