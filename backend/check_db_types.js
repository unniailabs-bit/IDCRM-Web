const sequelize = require('./config/db');

async function checkType() {
    try {
        const [teachers] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'id'");
        const [divisions] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'divisions' AND column_name = 'teacher_id'");
        
        console.log('--- Current DB Types ---');
        console.log('teachers.id:', teachers[0]?.data_type);
        console.log('divisions.teacher_id:', divisions[0]?.data_type);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkType();
