const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Ashish',
    database: 'RanjeetIDCRMBup',
    port: 5432
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables in RanjeetIDCRMBup:', res.rows.map(r => r.table_name));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();
