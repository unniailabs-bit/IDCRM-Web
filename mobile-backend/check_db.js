const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Postgres connected!');
    
    // Check columns of notifications table
    const columns = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'notifications'`,
      { type: QueryTypes.SELECT }
    );
    console.log('Notifications columns:', columns);
    
    // Get last 5 notifications
    const lastNotifications = await sequelize.query(
      `SELECT * FROM notifications ORDER BY id DESC LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    console.log('Last 5 notifications:', lastNotifications);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

run();
