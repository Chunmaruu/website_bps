import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

// Memastikan variabel lingkungan dimuat
dotenv.config();

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE || (process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlite3,
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
} else if (dialect === 'mysql' || dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || (dialect === 'mysql' ? 3306 : 5432),
      dialect: dialect,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  throw new Error(`Dialek database tidak didukung: ${dialect}`);
}

export default sequelize;
