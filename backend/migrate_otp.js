const sequelize = require('./config/db');

async function migrate() {
  try {
    console.log('--- Database Migration (Adding OTP columns) ---');
    
    // Trusts table
    await sequelize.query(`
      ALTER TABLE trusts 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(255),
      ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
    `);
    console.log('✅ Updated trusts table');

    // Schools table
    await sequelize.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(255),
      ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
    `);
    console.log('✅ Updated schools table');

    // Teachers table
    await sequelize.query(`
      ALTER TABLE teachers 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(255),
      ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
    `);
    console.log('✅ Updated teachers table');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
