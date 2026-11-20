import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import vm from 'node:vm';
import { createAuthRateLimit } from '../middleware/authRateLimit.js';

test('limiter blocks repeated requests, isolates IPs and expires windows', () => {
  let time = 0;
  const limit = createAuthRateLimit({ limit: 2, windowMs: 1000, now: () => time });
  const request = (ip) => {
    let status = 200;
    const res = { set() {}, status(code) { status = code; return this; }, json() {} };
    limit({ ip }, res, () => {});
    return status;
  };
  assert.equal(request('one'), 200);
  assert.equal(request('one'), 200);
  assert.equal(request('one'), 429);
  assert.equal(request('two'), 200);
  time = 1001;
  assert.equal(request('one'), 200);
});

test('server refuses absent, weak and legacy JWT secrets', () => {
  for (const secret of ['', 'short', 'super_secret_jwt_key_bps_village_gallery_2026']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import './config/auth.js'"], {
      env: { ...process.env, JWT_SECRET: secret }, encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET wajib/);
  }
});

for (const file of ['app.js', 'public/app.js']) {
  test(`${file}: untrusted registration data and URL schemes are escaped`, () => {
    const source = readFileSync(file, 'utf8');
    const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
    const elements = { tableVillagesBody: {} };
    const context = vm.createContext({ elements, URL, window: { location: { origin: 'http://localhost' } } });
    vm.runInContext(extract('function safeHttpUrl', 'function renderStarsHtml') +
      extract('function renderAdminVillagesTable', 'window.updateVillageStatus'), context);
    context.villages = [{ id: 1, nama_desa: '<img src=x onerror=alert(1)>', kecamatan: '" onmouseover="evil', kabupaten: 'A', provinsi: 'B', nama_pic: '<script>evil</script>', email: 'test@example.com', status: 'approved' }];
    vm.runInContext('renderAdminVillagesTable(villages)', context);
    assert.doesNotMatch(elements.tableVillagesBody.innerHTML, /<img|<script>/);
    assert.match(elements.tableVillagesBody.innerHTML, /&lt;img/);
    assert.equal(vm.runInContext("safeHttpUrl('javascript:alert(1)')", context), '#');
    assert.equal(vm.runInContext("safeHttpUrl('https://example.com')", context), 'https://example.com/');
  });
}

test('HTTP: private files denied, pages work, admin API protected, login limited', async (t) => {
  const port = 15000 + Math.floor(Math.random() * 10000);
  const child = spawn(process.execPath, ['server.js'], { env: {
    ...process.env, PORT: String(port), NODE_ENV: 'test', VERCEL: '',
    JWT_SECRET: randomBytes(48).toString('hex'), DB_DIALECT: 'sqlite', DB_STORAGE: ':memory:',
  }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  t.after(() => child.kill());
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 450; attempt++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs);
  for (const path of ['/server.js', '/middleware/auth.js', '/config/db.js', '/.env', '/package.json']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base + '/admin')).status, 200);
  assert.equal((await fetch(base + '/app.js')).status, 200);
  assert.equal((await fetch(base + '/api/admin/villages')).status, 401);
  const html = await (await fetch(base)).text();
  assert.ok(!html.includes('value="admin123"'));
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await fetch(base + '/api/auth/login/bps', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `192.0.2.${attempt}` }, body: '{}' });
    assert.equal(response.status, 400);
  }
  const blocked = await fetch(base + '/api/auth/login/desa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});
