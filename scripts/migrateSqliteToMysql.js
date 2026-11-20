import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

dotenv.config();
const tables = ['admins_bps', 'admins_desa', 'reviews'];
const sourcePath = resolve(process.argv[2] || process.env.DB_STORAGE || './database.sqlite');
let source, target, sequelize;
function normalize(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key, (key === 'created_at' || key === 'updated_at') && value != null
      ? new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : value.replace(' ', 'T') + 'Z').toISOString().slice(0, 23).replace('T', ' ') : value,
  ]));
}
try {
  if (process.env.DB_DIALECT !== 'mysql') throw new Error('Set DB_DIALECT=mysql first.');
  const database = process.env.DB_NAME;
  if (!database || !/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Invalid DB_NAME.');
  source = await new Promise((ok, fail) => {
    const db = new sqlite3.Database(sourcePath, sqlite3.OPEN_READONLY, e => e ? fail(e) : ok(db));
  });
  const read = sql => new Promise((ok, fail) => source.all(sql, (e, rows) => e ? fail(e) : ok(rows)));
  await read('BEGIN');
  const sourceRows = {};
  for (const table of tables) sourceRows[table] = (await read('SELECT * FROM ' + table + ' ORDER BY id')).map(normalize);
  await read('COMMIT');
  target = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASS || '', dateStrings: true, timezone: 'Z',
  });
  await target.query('CREATE DATABASE IF NOT EXISTS `' + database + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await target.changeUser({ database });
  ({ sequelize } = await import('../models/index.js'));
  await sequelize.sync(); // Never use force/alter: preserve existing target data.
  const counts = {};
  for (const table of tables) {
    const [[{ total }]] = await target.query('SELECT COUNT(*) AS total FROM ' + table);
    counts[table] = total;
  }
  const hasData = Object.values(counts).some(n => n > 0);
  if (!hasData) {
    for (const table of tables) {
      await target.query('ALTER TABLE ' + table + ' MODIFY created_at DATETIME(3) NOT NULL, MODIFY updated_at DATETIME(3) NOT NULL');
    }
  }
  await target.beginTransaction();
  try {
    for (const table of tables) {
      const expected = sourceRows[table];
      if (!hasData) {
        for (const row of expected) {
          const columns = Object.keys(row);
          const names = columns.map(c => '`' + c + '`').join(', ');
          await target.execute('INSERT INTO ' + table + ' (' + names + ') VALUES (' + columns.map(() => '?').join(', ') + ')', Object.values(row));
        }
      }
      const [actual] = await target.query('SELECT * FROM ' + table + ' ORDER BY id');
      if (!isDeepStrictEqual(actual.map(normalize), expected)) {
        throw new Error('Verification failed for ' + table + '; target data will not be overwritten.');
      }
      console.log(table + ': ' + expected.length + ' rows verified (all fields, IDs, hashes, timestamps).');
    }
    await target.commit();
    console.log(hasData ? 'Data already matches; no rows changed.' : 'Migration completed. SQLite source retained.');
  } catch (error) { await target.rollback(); throw error; }
} catch (error) {
  console.error('Migration failed: ' + error.message);
  process.exitCode = 1;
} finally {
  if (source) await new Promise((ok, fail) => source.close(e => e ? fail(e) : ok()));
  if (target) await target.end();
  if (sequelize) await sequelize.close();
}
