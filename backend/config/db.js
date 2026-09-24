const { Sequelize } = require('sequelize');
require('dotenv').config();

// Cloud SQL connection configuration
const isCloudSQL = process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/');
const isProduction = process.env.NODE_ENV === 'production';

const sequelizeConfig = {
  dialect: 'postgres',
  logging: isProduction ? false : console.log,
  pool: {
    max: 50,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// For Cloud SQL Unix socket connection
let sequelize;

if (isCloudSQL) {
  // For Cloud SQL Unix sockets: pg library treats paths starting with / as Unix sockets
  // Set host to the socket path - pg library will automatically use it as a Unix socket
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      ...sequelizeConfig,
      host: process.env.DB_HOST, // Socket path (starts with /cloudsql/) - pg recognizes this as Unix socket
      // Do NOT set port when using Unix sockets
    }
  );
} else {
  // For TCP connections, use standard configuration
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      ...sequelizeConfig,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432
    }
  );
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    if (isCloudSQL) {
      console.log('📡 Connected via Cloud SQL Unix socket');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
})();

module.exports = sequelize;
