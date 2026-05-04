import { db } from '../database/index.js'

export const blackListRepository = {
  add(token, expiresAt) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT OR IGNORE INTO token_blacklist (token, expires_at)
          VALUES (?, ?)
        `,
        [token, expiresAt],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  exists(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `
          SELECT id FROM token_blacklist
          WHERE token = ?
        `,
        [token],
        (err, row) => {
          if (err) return reject(err)
          resolve(!!row)
        }
      )
    })
  },

  cleanupExpired() {
    return new Promise((resolve, reject) => {
      db.run(
        `
          DELETE FROM token_blacklist
          WHERE expires_at <= datetime('now')
        `,
        [],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  }
}