const sequelize = require('./config/db');

async function revert() {
    try {
        console.log('Reverting BIGINT changes back to INTEGER...');

        // Check if there are any values that will overflow INTEGER
        const [check] = await sequelize.query('SELECT MAX(id) as max_id FROM teachers');
        const maxId = check[0].max_id;
        
        if (maxId > 2147483647) {
            console.error(`❌ CANNOT REVERT: Table "teachers" contains ID ${maxId} which is too large for INTEGER.`);
            console.error(`Please delete or fix large IDs before reverting.`);
            process.exit(1);
        }

        // Alter back to INTEGER
        console.log('Altering teachers.id back to INTEGER...');
        await sequelize.query('ALTER TABLE teachers ALTER COLUMN id TYPE INTEGER');

        console.log('Altering divisions.teacher_id back to INTEGER...');
        await sequelize.query('ALTER TABLE divisions ALTER COLUMN teacher_id TYPE INTEGER');

        console.log('Altering form_links.teacher_id back to INTEGER...');
        await sequelize.query('ALTER TABLE form_links ALTER COLUMN teacher_id TYPE INTEGER');

        console.log('✅ Revert completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Revert failed:', error.message);
        process.exit(1);
    }
}

revert();
