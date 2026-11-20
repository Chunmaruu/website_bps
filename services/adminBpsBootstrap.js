export async function bootstrapFirstAdmin({ sequelize, AdminBps }, env = process.env) {
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'production' || sequelize.getDialect() !== 'postgres') {
    return false;
  }

  const email = env.ADMIN_BPS_BOOTSTRAP_EMAIL?.trim();
  const hash = env.ADMIN_BPS_BOOTSTRAP_HASH?.trim();
  if (!email && !hash) return false;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !hash || !/^\$2[aby]\$(?:1[2-9]|2[0-9]|3[01])\$[./A-Za-z0-9]{53}$/.test(hash)) {
    throw new Error('Konfigurasi akun Admin BPS awal tidak valid.');
  }

  return sequelize.transaction(async transaction => {
    // Serialize the empty-table check with inserts from other instances or seed scripts.
    const options = { transaction, logging: false };
    await sequelize.query('LOCK TABLE "admins_bps" IN SHARE ROW EXCLUSIVE MODE', options);
    const existing = await AdminBps.findOne({ where: { email }, ...options });
    if (existing) return existing.status === 'aktif' && existing.password_hash === hash;
    if (await AdminBps.count(options) > 0) return false;

    await AdminBps.create({ nama: 'Admin BPS', email, password_hash: hash, status: 'aktif' }, options);
    return true;
  });
}
