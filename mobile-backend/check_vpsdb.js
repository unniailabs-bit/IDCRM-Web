`const { Client } = require('pg');

async function run() {
  const adminClient = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Ashish',
    database: 'postgres',
    port: 5432
  });
  
  try {
    await adminClient.connect();
    const dbsRes = await adminClient.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    const databases = dbsRes.rows.map(r => r.datname);
    await adminClient.end();

    console.log('Scanning databases:', databases);

    for (const db of databases) {
      if (db === 'postgres') continue;
      const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: 'Ashish',
        database: db,
        port: 5432
      });
      try {
        await client.connect();
        const tablesRes = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        const tables = tablesRes.rows.map(r => r.table_name);
        if (tables.length > 0) {
          console.log(`Database: ${db} (${tables.length} tables)`);
          if (tables.includes('student_forms') || tables.includes('notifications') || tables.includes('materials')) {
            console.log(`  --> Matches project tables! Contains: ${tables.filter(t => ['student_forms', 'notifications', 'materials', 'students', 'teachers', 'classes'].includes(t)).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`Database ${db} error: ${err.message}`);
      } finally {
        await client.end();
      }
    }
  } catch (e) {
    console.log('Admin connect error:', e.message);
  }
}

run();
