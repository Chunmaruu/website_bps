import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import test from 'node:test';

function inspectConfig(overrides) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', `
    import db from './config/db.js';
    console.log(JSON.stringify({
      dialect: db.getDialect(), host: db.config.host, port: db.config.port,
      database: db.config.database, username: db.config.username,
      decodedPassword: db.config.password === 'fixture@value', ssl: db.options.dialectOptions?.ssl,
    }));
  `], {
    env: { ...process.env, DATABASE_URL: '', POSTGRES_URL: '', NODE_ENV: 'test', ...overrides },
    encoding: 'utf8',
  });
}

test('hosted PostgreSQL URL takes precedence and cannot disable verified TLS', () => {
  const result = inspectConfig({
    VERCEL: '1', DB_DIALECT: 'mysql',
    DATABASE_URL: 'postgresql://village%5Fapp:fixture%40value@pool.example.test:6432/portal%2Dprod?sslmode=disable',
    POSTGRES_URL: 'postgres://unused@unused.example.test/unused',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    dialect: 'postgres', host: 'pool.example.test', port: 6432, database: 'portal-prod',
    username: 'village_app', decodedPassword: true, ssl: { rejectUnauthorized: true },
  });
  const alias = inspectConfig({ POSTGRES_URL: 'postgres://village@pool.example.test/portal' });
  assert.equal(alias.status, 0, alias.stderr);
  assert.equal(JSON.parse(alias.stdout).dialect, 'postgres');
});

test('invalid URL is redacted and discrete local MySQL remains supported', () => {
  const invalid = inspectConfig({ DATABASE_URL: 'mysql://fixture-credential@example.test/portal' });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /harus berupa URL PostgreSQL yang valid/);
  assert.doesNotMatch(invalid.stderr, /fixture-credential/);

  const local = inspectConfig({ DB_DIALECT: 'mysql', DB_HOST: '127.0.0.1', DB_PORT: '3307', DB_NAME: 'local_portal' });
  assert.equal(local.status, 0, local.stderr);
  const config = JSON.parse(local.stdout);
  assert.equal(config.dialect, 'mysql');
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 3307);
  assert.equal(config.database, 'local_portal');
});

test('Vercel API waits for one schema initialization and redacts health failures', async t => {
  Object.assign(process.env, {
    VERCEL: '1', DB_DIALECT: 'sqlite', DB_STORAGE: ':memory:', DATABASE_URL: '', POSTGRES_URL: '',
    JWT_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test',
  });
  const { sequelize } = await import('../models/index.js');
  const { default: app } = await import('../server.js');
  const sync = sequelize.sync.bind(sequelize);
  let entered;
  let release;
  let syncCount = 0;
  const syncStarted = new Promise(resolve => { entered = resolve; });
  const syncGate = new Promise(resolve => { release = resolve; });
  sequelize.sync = async () => {
    syncCount++;
    entered();
    await syncGate;
    return sync();
  };

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    release();
    await new Promise(resolve => server.close(resolve));
    await sequelize.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  let apiFinished = false;
  const api = fetch(`${base}/api/my-website`).then(response => {
    apiFinished = true;
    return response;
  });
  await syncStarted;
  const status = fetch(`${base}/api/status`);
  assert.equal((await fetch(base)).status, 200);
  assert.equal(apiFinished, false);
  release();
  assert.equal((await api).status, 401);
  assert.deepEqual((await (await status).json()).db, { dialect: 'sqlite', connected: true });
  assert.equal(syncCount, 1);

  sequelize.authenticate = async () => { throw new Error('fixture-credential'); };
  const failure = await fetch(`${base}/api/status`);
  assert.equal(failure.status, 503);
  assert.deepEqual(await failure.json(), { status: 'error', message: 'Database belum siap.' });
});
