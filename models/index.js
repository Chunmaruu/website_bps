import sequelize from '../config/db.js';
import AdminBps from './AdminBps.js';
import AdminDesa from './AdminDesa.js';

// Tempat mendefinisikan asosiasi/relasi antar tabel di masa depan
// Misalnya jika kita ingin mencatat admin BPS mana yang menyetujui akun desa:
// AdminDesa.belongsTo(AdminBps, { foreignKey: 'approved_by', as: 'approver' });

const db = {
  sequelize,
  AdminBps,
  AdminDesa,
};

export { sequelize, AdminBps, AdminDesa };
export default db;
