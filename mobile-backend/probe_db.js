const { Client } = require('pg');

const passwords = [
  'Ashish',
  'postgres',
  'admin',
  'root',
  'admin123',
  'postgres123',
  'root123',
  'unni',
  'shikshalaya',
  'education',
  'school',
  'ranjeet',
  'Ranjeet',
  '123456',
  '12345678',
  '1234',
  'password',
  ''
];

async function probe() {
  for (const pwd of passwords) {
    const client = new Client({
      host: 'localhost',
      user: 'postgres',
      password: pwd,
      database: 'postgres',
      port: 5432
    });
    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Password is: "${pwd}"`);
      await client.end();
      return;
    } catch (err) {
      console.log(`Pwd "${pwd}": ${err.message || err}`);
    }
  }
}

probe();
