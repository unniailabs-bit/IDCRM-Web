// backend-school/models/FormLink.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // your Sequelize instance

const FormLink = sequelize.define('FormLink', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    token: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    class_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    division: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'form_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = FormLink;
