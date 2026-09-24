const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const bcrypt = require('bcryptjs');

const SuperAdmin = sequelize.define(
  'SuperAdmin',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'super_admins',
    timestamps: true,
  }
);

// ---------------- Hooks ----------------

// Hash password before creating a new Super Admin
SuperAdmin.beforeCreate(async (admin) => {
  if (admin.password) {
    admin.password = await bcrypt.hash(admin.password.trim(), 10);
  }
});

// Hash password before updating (if password changes)
SuperAdmin.beforeUpdate(async (admin) => {
  if (admin.changed('password')) {
    admin.password = await bcrypt.hash(admin.password.trim(), 10);
  }
});

// ---------------- Instance Methods ----------------

// Compare entered password with hashed password
SuperAdmin.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = SuperAdmin;
