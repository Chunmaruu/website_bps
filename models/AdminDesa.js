import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AdminDesa = sequelize.define('AdminDesa', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_desa: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  kecamatan: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  kabupaten: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  provinsi: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  nama_pic: {
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
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'nonaktif'),
    defaultValue: 'approved',
    allowNull: false,
  },
}, {
  tableName: 'admins_desa',
  timestamps: true, // Menyediakan createdAt dan updatedAt secara otomatis
  underscored: true, // Menggunakan snake_case untuk kolom (created_at, updated_at)
});

export default AdminDesa;
