const sequelize = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration: Changing teacher_id columns to BIGINT...');

        // 1. Alter teachers table ID
        console.log('Altering teachers.id to BIGINT...');
        await sequelize.query('ALTER TABLE teachers ALTER COLUMN id TYPE BIGINT');

        // 2. Alter divisions table teacher_id
        console.log('Altering divisions.teacher_id to BIGINT...');
        await sequelize.query('ALTER TABLE divisions ALTER COLUMN teacher_id TYPE BIGINT');

        // 3. Alter form_links table teacher_id
        console.log('Altering form_links.teacher_id to BIGINT...');
        await sequelize.query('ALTER TABLE form_links ALTER COLUMN teacher_id TYPE BIGINT');

        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
