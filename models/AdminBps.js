import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AdminBps = sequelize.define('AdminBps', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  status: {
    type: DataTypes.ENUM('aktif', 'nonaktif'),
    defaultValue: 'aktif',
    allowNull: false,
  },
}, {
  tableName: 'admins_bps',
  timestamps: true, // Menyediakan createdAt dan updatedAt secara otomatis
  underscored: true, // Menggunakan snake_case untuk kolom (created_at, updated_at)
});

export default AdminBps;
