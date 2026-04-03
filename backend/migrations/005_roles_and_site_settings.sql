ALTER TABLE users ADD COLUMN admin_role TEXT;
ALTER TABLE users ADD COLUMN created_by_admin_id INTEGER REFERENCES users(id);

UPDATE users SET admin_role = 'super' WHERE is_admin = 1 AND (admin_role IS NULL OR trim(admin_role) = '');

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES
(
  'config_json',
  '{"deductXuModelAll5":10,"deductXuModelOther":2,"siteTitle":"SLOSTWIN - AI","siteSubtitle":"HỆ THỐNG GAME"}',
  datetime('now')
);
