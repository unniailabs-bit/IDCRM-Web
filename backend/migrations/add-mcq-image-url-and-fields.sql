-- Migration: Add image_url, subject_id, title, material_id, and is_active to mcq_questions table

CREATE TABLE IF NOT EXISTS mcq_questions (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    division_id BIGINT NOT NULL,
    material_id BIGINT NULL,
    subject_id BIGINT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT NULL,
    title VARCHAR(255) NULL,
    image_url TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS material_id BIGINT NULL;
ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS subject_id BIGINT NULL;
ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL;
ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS image_url TEXT NULL;
ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE mcq_questions ALTER COLUMN id TYPE BIGINT;
ALTER TABLE mcq_questions ALTER COLUMN school_id TYPE BIGINT;
ALTER TABLE mcq_questions ALTER COLUMN teacher_id TYPE BIGINT;
ALTER TABLE mcq_questions ALTER COLUMN class_id TYPE BIGINT;
ALTER TABLE mcq_questions ALTER COLUMN division_id TYPE BIGINT;

ALTER TABLE mcq_questions ALTER COLUMN is_active SET DEFAULT TRUE;
UPDATE mcq_questions SET is_active = TRUE WHERE is_active IS NULL;

UPDATE mcq_questions q
SET subject_id = m.subject_id
FROM materials m
WHERE q.material_id = m.id
  AND q.subject_id IS NULL
  AND m.subject_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mcq_teacher ON mcq_questions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_mcq_class_div ON mcq_questions(class_id, division_id);
CREATE INDEX IF NOT EXISTS idx_mcq_subject ON mcq_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_mcq_material ON mcq_questions(material_id);
CREATE INDEX IF NOT EXISTS idx_mcq_active ON mcq_questions(is_active);
