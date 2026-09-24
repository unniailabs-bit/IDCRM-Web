const { QueryTypes } = require('sequelize');
const sequelize = require('./config/db');

(async () => {
  try {
    console.log('🔍 Checking student_forms table structure...\n');
    
    const columns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_name = 'student_forms'
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );

    console.log('📋 student_forms table columns:');
    console.table(columns);

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

