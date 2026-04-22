import sqlite3 from 'sqlite3'

export const db = new sqlite3.Database('./db.sqlite')

function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
      if (err) return reject(err)
      resolve(rows.some((row) => row.name === columnName))
    })
  })
}

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, [], (err) => {
      if (err) return reject(err)
      resolve(true)
    })
  })
}

async function ensureUserColumn(columnName, definition) {
  const exists = await columnExists('users', columnName)
  if (!exists) {
    await run(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`)
  }
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT,
      action TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
})

Promise.all([
  ensureUserColumn('first_name', 'TEXT'),
  ensureUserColumn('last_name', 'TEXT'),
  ensureUserColumn('phone', 'TEXT'),
  ensureUserColumn('address', 'TEXT'),
  ensureUserColumn('failed_login_attempts', 'INTEGER NOT NULL DEFAULT 0'),
  ensureUserColumn('locked_until', 'DATETIME'),
  ensureUserColumn('last_login_at', 'DATETIME'),
  ensureUserColumn('reset_token', 'TEXT'),
  ensureUserColumn('reset_token_expires', 'INTEGER'),
]).catch((error) => {
  console.error('Erro ao aplicar migrações SQLite:', error)
})
