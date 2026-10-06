/**
 * Migration 003: Ensure mcq_questions table exists and contains image_url, title, subject_id, material_id, and is_active columns.
 */
module.exports = {
    async up(sequelize) {
        // 1. Ensure table exists
        await sequelize.query(`
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        // 2. Add missing columns safely
        await sequelize.query(`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS material_id BIGINT NULL;`);
        await sequelize.query(`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS subject_id BIGINT NULL;`);
        await sequelize.query(`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL;`);
        await sequelize.query(`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS image_url TEXT NULL;`);
        await sequelize.query(`ALTER TABLE mcq_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);

        // 3. Ensure column types are BIGINT
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN id TYPE BIGINT;`);
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN school_id TYPE BIGINT;`);
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN teacher_id TYPE BIGINT;`);
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN class_id TYPE BIGINT;`);
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN division_id TYPE BIGINT;`);

        // 4. Set DEFAULT true for is_active and update any nulls
        await sequelize.query(`ALTER TABLE mcq_questions ALTER COLUMN is_active SET DEFAULT TRUE;`);
        await sequelize.query(`UPDATE mcq_questions SET is_active = TRUE WHERE is_active IS NULL;`);

        // 5. Backfill subject_id from materials table
        await sequelize.query(`
      UPDATE mcq_questions q
      SET subject_id = m.subject_id
      FROM materials m
      WHERE q.material_id = m.id
        AND q.subject_id IS NULL
        AND m.subject_id IS NOT NULL;
    `);

        // 6. Create indexes
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mcq_teacher ON mcq_questions(teacher_id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mcq_class_div ON mcq_questions(class_id, division_id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mcq_subject ON mcq_questions(subject_id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mcq_material ON mcq_questions(material_id);`);
        await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mcq_active ON mcq_questions(is_active);`);

        console.log("  MCQ questions table and image_url columns migration completed successfully.");
    }
};
