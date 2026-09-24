const { Client } = require('pg');

async function run() {
  const masterClient = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'Ashish',
    database: 'postgres',
    port: 5432
  });

  try {
    await masterClient.connect();
    const dbsRes = await masterClient.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    const dbs = dbsRes.rows.map(r => r.datname);
    console.log("All databases on server:", dbs);

    for (const dbName of dbs) {
      const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: 'Ashish',
        database: dbName,
        port: 5432
      });
      try {
        await client.connect();
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        console.log(`Database: ${dbName} has tables:`, res.rows.map(r => r.table_name));
      } catch (e) {
        console.log(`Database ${dbName} connection failed: ${e.message}`);
      } finally {
        await client.end();
      }
    }
  } catch (err) {
    console.error("Master connection failed:", err.message);
  } finally {
    await masterClient.end();
  }
}

run();
