/**
 * Script to add test Super Admin users
 * Run with: node backend/scripts/add-test-admins.js
 */

// Load environment variables
// Try to load from different possible locations
try {
  require('dotenv').config();
} catch (e) {
  // If dotenv is not available, environment variables should be set externally
}

const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');

const testAdmins = [
  {
    name: 'Super Admin',
    email: 'admin@idtrust.com',
    password: 'admin123'
  },
  {
    name: 'Test Admin',
    email: 'testadmin@idtrust.com',
    password: 'test123'
  },
  {
    name: 'Demo Admin',
    email: 'demo@idtrust.com',
    password: 'demo123'
  }
];

async function addTestAdmins() {
  try {
    console.log('🔐 Starting to add test admin users...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    for (const admin of testAdmins) {
      try {
        // Check if admin already exists
        const existing = await sequelize.query(
          `SELECT id, email FROM super_admins WHERE email = :email`,
          {
            replacements: { email: admin.email },
            type: QueryTypes.SELECT
          }
        );

        if (existing.length > 0) {
          console.log(`⚠️  Admin with email ${admin.email} already exists. Skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        // Insert admin
        const result = await sequelize.query(
          `INSERT INTO super_admins (name, email, password, "createdAt", "updatedAt")
           VALUES (:name, :email, :password, NOW(), NOW())
           RETURNING id, name, email, "createdAt";`,
          {
            replacements: {
              name: admin.name,
              email: admin.email,
              password: hashedPassword
            },
            type: QueryTypes.INSERT
          }
        );

        const insertedAdmin = Array.isArray(result[0]) ? result[0][0] : result[0];
        
        console.log(`✅ Created admin: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${admin.password}`);
        console.log(`   ID: ${insertedAdmin.id}\n`);
      } catch (error) {
        console.error(`❌ Error creating admin ${admin.email}:`, error.message);
      }
    }

    console.log('✅ Test admin users creation completed!\n');
    console.log('📋 Summary of test admin accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${admin.password}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
addTestAdmins();

