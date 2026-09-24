const sequelize = require('./config/db');

async function scanTables() {
    try {
        const query = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE (column_name = 'teacher_id' OR (table_name = 'teachers' AND column_name = 'id'))
            AND table_schema = 'public'
        `;
        const [results] = await sequelize.query(query);
        console.log('--- Tables to Update ---');
        console.table(results);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

scanTables();
