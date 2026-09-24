const { DataTypes } = require("sequelize");
const sequelize = require('../../config/db');

const Student = sequelize.define("students", {
  school_id: { type: DataTypes.INTEGER },
  class_id: { type: DataTypes.INTEGER },
  division_id: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING },
  roll_number: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  parent_name: { type: DataTypes.STRING },
  parent_phone: { type: DataTypes.STRING },
  parent_email: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
}, {
  timestamps: true,
});

module.exports = Student;
