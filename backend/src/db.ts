import Database from "better-sqlite3";
import path from "node:path";

const dbPath = path.join(__dirname, "..", "data", "shop.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS graded_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    card_name TEXT NOT NULL,
    set_name TEXT NOT NULL,
    grading_company TEXT NOT NULL,
    grade TEXT NOT NULL,
    cert_number TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'listed',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
  );

  CREATE TABLE IF NOT EXISTS graded_card_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    graded_card_id INTEGER NOT NULL,
    buyer_session_id TEXT NOT NULL,
    trade_in_value INTEGER NOT NULL DEFAULT 0,
    final_price INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (graded_card_id) REFERENCES graded_cards(id)
  );
`);
