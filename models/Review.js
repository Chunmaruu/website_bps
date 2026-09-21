import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  template_id: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'desa',
  },
  reviewer_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  komentar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
});

export default Review;
