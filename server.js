import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import db from './db.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }
}));

const requireAuth = (req, res, next) =>
  req.session.admin ? next() : res.status(401).json({ error: 'Unauthorized' });

app.get('/api/menu', (req, res) => {
  res.json(db.prepare('SELECT * FROM menu_items ORDER BY category, name').all());
});

app.get('/api/reviews', (req, res) => {
  res.json(db.prepare('SELECT * FROM reviews ORDER BY id DESC LIMIT 100').all());
});

app.post('/api/reviews', (req, res) => {
  const author = String(req.body.author || 'Guest').trim().slice(0, 50);
  const rating = Math.min(5, Math.max(1, Math.round(Number(req.body.rating) || 5)));
  const comment = String(req.body.comment || '').trim().slice(0, 500);
  if (!comment) return res.status(400).json({ error: 'Comment is required' });
  const info = db.prepare('INSERT INTO reviews (author, rating, comment) VALUES (?, ?, ?)')
    .run(author || 'Guest', rating, comment);
  res.status(201).json({ id: info.lastInsertRowid, author, rating, comment });
});

app.post('/api/login', (req, res) => {
  if (bcrypt.compareSync(String(req.body.password || ''), ADMIN_HASH)) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => res.json({ admin: !!req.session.admin }));

app.get('/api/inventory', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM menu_items ORDER BY category, name').all());
});

app.post('/api/inventory', requireAuth, (req, res) => {
  const { name, price, category, stock } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'Name and price required' });
  const info = db.prepare(
    'INSERT INTO menu_items (name, price, category, stock) VALUES (?, ?, ?, ?)'
  ).run(String(name).trim(), Number(price), String(category || 'Mains'), Number(stock || 0));
  res.status(201).json({ id: info.lastInsertRowid });
});

app.put('/api/inventory/:id', requireAuth, (req, res) => {
  const { name, price, category, stock } = req.body;
  db.prepare('UPDATE menu_items SET name = ?, price = ?, category = ?, stock = ? WHERE id = ?')
    .run(String(name).trim(), Number(price), String(category || 'Mains'), Number(stock || 0), req.params.id);
  res.json({ ok: true });
});

app.delete('/api/inventory/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/staff-logs', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM staff_logs ORDER BY id DESC LIMIT 200').all());
});

app.post('/api/staff-logs', requireAuth, (req, res) => {
  const { staff_name, action, note } = req.body;
  if (!staff_name || !action) return res.status(400).json({ error: 'Name and action required' });
  const info = db.prepare('INSERT INTO staff_logs (staff_name, action, note) VALUES (?, ?, ?)')
    .run(String(staff_name).trim(), String(action).trim(), String(note || '').trim());
  res.status(201).json({ id: info.lastInsertRowid });
});

app.delete('/api/staff-logs/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM staff_logs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Shalimar running → http://localhost:${PORT}`));
