const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');

async function check() {
  try {
    const res = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'student_forms'", { type: QueryTypes.SELECT });
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
