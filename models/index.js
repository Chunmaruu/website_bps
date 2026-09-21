import sequelize from '../config/db.js';
import AdminBps from './AdminBps.js';
import AdminDesa from './AdminDesa.js';
import Review from './Review.js';

// Relasi tabel
AdminDesa.hasMany(Review, { foreignKey: 'user_id', as: 'reviews', constraints: false });
Review.belongsTo(AdminDesa, { foreignKey: 'user_id', as: 'desa', constraints: false });

const db = {
  sequelize,
  AdminBps,
  AdminDesa,
  Review,
};

export { sequelize, AdminBps, AdminDesa, Review };
export default db;
