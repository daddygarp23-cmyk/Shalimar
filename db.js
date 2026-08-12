import Database from 'better-sqlite3';

const db = new Database('shalimar.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    price    REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'Mains',
    stock    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    author     TEXT NOT NULL,
    rating     INTEGER NOT NULL,
    comment    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_name TEXT NOT NULL,
    action     TEXT NOT NULL,
    note       TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const { c } = db.prepare('SELECT COUNT(*) AS c FROM menu_items').get();
if (c === 0) {
  const ins = db.prepare('INSERT INTO menu_items (name, price, category, stock) VALUES (?, ?, ?, ?)');
  const seed = db.transaction(rows => rows.forEach(r => ins.run(...r)));
  seed([
    ['Chicken Biryani',       320, 'Mains',     40],
    ['Mutton Biryani',        420, 'Mains',     30],
    ['Chicken Tikka',         280, 'Starters',  25],
    ['Seekh Kebab',           300, 'Starters',  20],
    ['Paneer Butter Masala',  240, 'Veg',       20],
    ['Butter Naan',            40, 'Breads',   100],
    ['Gulab Jamun',            90, 'Desserts',  50],
    ['Kulfi Falooda',         120, 'Desserts',  40]
  ]);
}

const { r } = db.prepare('SELECT COUNT(*) AS r FROM reviews').get();
if (r === 0) {
  const ir = db.prepare('INSERT INTO reviews (author, rating, comment) VALUES (?, ?, ?)');
  ir.run('Ayesha', 5, 'Best biryani in Bhendi Bazaar — a must try!');
  ir.run('Rahul', 4, 'Great kebabs and quick service even at midnight.');
}

const { l } = db.prepare('SELECT COUNT(*) AS l FROM staff_logs').get();
if (l === 0) {
  const il = db.prepare('INSERT INTO staff_logs (staff_name, action, note) VALUES (?, ?, ?)');
  il.run('Imran', 'Clock In', 'Shift 9pm – 3am');
  il.run('Farhan', 'Inventory Count', 'Restocked breads + naan');
}

export default db;
