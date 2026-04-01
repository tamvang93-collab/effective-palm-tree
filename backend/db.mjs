import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DB_PATH = path.resolve(process.cwd(), "backend", "data", "app.db");

export function getDbPath() {
  return process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : DEFAULT_DB_PATH;
}

export function createDbConnection() {
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  return db;
}

export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationDir = path.resolve(process.cwd(), "backend", "migrations");
  const files = fs
    .readdirSync(migrationDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const applied = db.prepare("SELECT id FROM schema_migrations WHERE filename = ?").get(file);
    if (applied) continue;

    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)")
      .run(file, new Date().toISOString());
  }
}

export function resetDatabaseForTests(db) {
  db.exec("DROP TABLE IF EXISTS admin_balance_logs;");
  db.exec("DROP TABLE IF EXISTS auth_logs;");
  db.exec("DROP TABLE IF EXISTS auth_sessions;");
  db.exec("DROP TABLE IF EXISTS users;");
  db.exec("DROP TABLE IF EXISTS schema_migrations;");
  runMigrations(db);
}
