const sequelize = require('./config/db');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

async function checkSchema() {
  try {
    const results = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments'",
      { type: QueryTypes.SELECT }
    );
    const output = {
      count: results.length,
      columns: results
    };
    fs.writeFileSync('schema_output.json', JSON.stringify(output, null, 2));
    process.exit(0);
  } catch (error) {
    fs.writeFileSync('schema_error.txt', error.message);
    process.exit(1);
  }
}

checkSchema();
