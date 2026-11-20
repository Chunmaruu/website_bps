import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

// Memastikan variabel lingkungan dimuat
dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();
const dialect = databaseUrl ? 'postgres' : (process.env.DB_DIALECT || (process.env.VERCEL ? 'sqlite' : 'mysql'));
const logging = !process.env.VERCEL && process.env.NODE_ENV === 'development' ? console.log : false;

let sequelize;

function readPostgresUrl(value) {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2 || url.port === '0') {
      throw new Error();
    }
    return {
      database: decodeURIComponent(url.pathname.slice(1)),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      host: url.hostname.replace(/^\[(.*)\]$/, '$1'),
      port: Number(url.port || 5432),
    };
  } catch {
    throw new Error('DATABASE_URL atau POSTGRES_URL harus berupa URL PostgreSQL yang valid.');
  }
}

if (dialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE || (process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    dialectModule: sqlite3,
    storage: storagePath,
    logging,
  });
} else if (dialect === 'mysql' || dialect === 'postgres') {
  const connection = databaseUrl ? readPostgresUrl(databaseUrl) : {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || (dialect === 'mysql' ? 3306 : 5432),
  };

  sequelize = new Sequelize({
    ...connection,
    dialect,
    dialectModule: dialect === 'mysql' ? mysql2 : pg,
    // URL query parameters cannot disable or weaken certificate verification.
    ...(databaseUrl ? { dialectOptions: { ssl: { rejectUnauthorized: true } } } : {}),
    logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  throw new Error('Dialek database tidak didukung.');
}

export default sequelize;
