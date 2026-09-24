const sequelize = require('./config/db');

async function runFinalMigration() {
    try {
        console.log('🚀 Starting Final BIGINT Migration for all Teacher-related tables...');

        const tablesToUpdate = [
            { table: 'teachers', column: 'id' },
            { table: 'divisions', column: 'teacher_id' },
            { table: 'form_links', column: 'teacher_id' },
            { table: 'materials', column: 'teacher_id' },
            { table: 'homework', column: 'teacher_id' },
            { table: 'notifications', column: 'teacher_id' },
            { table: 'mcq_questions', column: 'teacher_id' },
            { table: 'teacher_class_divisions', column: 'teacher_id' },
            { table: 'student_forms', column: 'teacher_id' },
            { table: 'teacher_awards', column: 'teacher_id' },
            { table: 'teacher_student_messages', column: 'teacher_id' },
            { table: 'teacher_stories', column: 'teacher_id' },
            { table: 'timetables', column: 'teacher_id' }
        ];

        for (const item of tablesToUpdate) {
            console.log(`Updating ${item.table}.${item.column} to BIGINT...`);
            await sequelize.query(`ALTER TABLE ${item.table} ALTER COLUMN ${item.column} TYPE BIGINT`);
        }

        console.log('✅ Success! All teacher-related columns are now BIGINT.');
        console.log('No more "integer out of range" errors will occur.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error.message);
        process.exit(1);
    }
}

runFinalMigration();
