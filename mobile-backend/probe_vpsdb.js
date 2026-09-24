const { Client } = require('pg');

async function check(dbName) {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Ashish',
    database: dbName,
    port: 5432
  });
  try {
    await client.connect();
    console.log(`Successfully connected to database: "${dbName}"`);
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(`Tables in "${dbName}":`, res.rows.map(r => r.table_name));
  } catch (err) {
    console.log(`Failed to connect to "${dbName}":`, err.message);
  } finally {
    await client.end();
  }
}

async function run() {
  await check('VPSDBIDCRM');
  await check('VPSDBIDCRM ');
}

run();
