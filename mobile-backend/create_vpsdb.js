const { Client } = require('pg');

async function create() {
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Ashish',
    database: 'postgres',
    port: 5432
  });
  try {
    await client.connect();
    await client.query('CREATE DATABASE "VPSDBIDCRM"');
    console.log('✅ Database "VPSDBIDCRM" created successfully!');
  } catch (err) {
    console.log('⚠️ Error:', err.message);
  } finally {
    await client.end();
  }
}

create();
