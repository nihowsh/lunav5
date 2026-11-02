// Tiny photo gallery server. No dependencies. Run: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data'); // put this on a persistent disk when deploying
const MAX_BYTES = 25 * 1024 * 1024;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

fs.mkdirSync(path.join(DATA, 'photos'), { recursive: true });
const dbFile = path.join(DATA, 'db.json');
const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : { users: {}, sessions: {} };
const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(db));
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BYTES) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');

function newSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = username;
  saveDb();
  return token;
}

function authUser(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  const username = m && own(db.sessions, m[1]);
  return username ? own(db.users, username) : null;
}

const userDir = user => path.join(DATA, 'photos', user.id);

async function handle(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (req.method === 'GET' && p === '/') {
    return send(res, 200, fs.readFileSync(path.join(__dirname, 'index.html')), 'text/html');
  }

  // --- accounts ---
  if (req.method === 'POST' && (p === '/api/register' || p === '/api/login')) {
    let body; try { body = JSON.parse((await readBody(req)).toString()); } catch { return send(res, 400, { error: 'bad request' }); }
    const { username, password } = body || {};
    if (typeof username !== 'string' || typeof password !== 'string') return send(res, 400, { error: 'bad request' });
    if (p === '/api/register') {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return send(res, 400, { error: 'Username: 3-20 letters, numbers or _' });
      if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters' });
      if (own(db.users, username)) return send(res, 409, { error: 'Username taken' });
      const salt = crypto.randomBytes(16).toString('hex');
      db.users[username] = { id: crypto.randomBytes(8).toString('hex'), salt, hash: hash(password, salt) };
      return send(res, 200, { token: newSession(username) });
    }
    const u = own(db.users, username);
    const ok = u && crypto.timingSafeEqual(Buffer.from(hash(password, u.salt)), Buffer.from(u.hash));
    return ok ? send(res, 200, { token: newSession(username) }) : send(res, 401, { error: 'Wrong username or password' });
  }

  if (req.method === 'POST' && p === '/api/logout') {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    if (m && own(db.sessions, m[1])) { delete db.sessions[m[1]]; saveDb(); }
    return send(res, 200, { ok: true });
  }

  // --- photos (login required) ---
  if (p.startsWith('/api/photos')) {
    const user = authUser(req);
    if (!user) return send(res, 401, { error: 'Not logged in' });
    const dir = userDir(user);
    fs.mkdirSync(dir, { recursive: true });

    if (req.method === 'GET' && p === '/api/photos') {
      const list = fs.readdirSync(dir).map(f => ({ id: f, date: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.date - a.date);
      return send(res, 200, list);
    }

    if (req.method === 'POST' && p === '/api/photos') {
      const ext = EXT[(req.headers['content-type'] || '').split(';')[0]];
      if (!ext) return send(res, 400, { error: 'Only png, jpeg, webp or gif images' });
      let data; try { data = await readBody(req); } catch { return send(res, 413, { error: 'File too large (25MB max)' }); }
      const id = crypto.randomBytes(8).toString('hex') + '.' + ext;
      fs.writeFileSync(path.join(dir, id), data);
      return send(res, 200, { id });
    }

    const m = /^\/api\/photos\/([a-f0-9]{16}\.(png|jpg|webp|gif))$/.exec(p);
    if (m) {
      const file = path.join(dir, m[1]);
      if (!fs.existsSync(file)) return send(res, 404, { error: 'Not found' });
      if (req.method === 'GET') return send(res, 200, fs.readFileSync(file), MIME[m[2]]);
      if (req.method === 'DELETE') { fs.unlinkSync(file); return send(res, 200, { ok: true }); }
    }
  }
  send(res, 404, { error: 'Not found' });
}

http.createServer((req, res) => {
  handle(req, res).catch(() => send(res, 500, { error: 'Server error' }));
}).listen(PORT, () => console.log(`Photo site running on http://localhost:${PORT}`));
