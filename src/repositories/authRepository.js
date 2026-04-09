import { db } from '../database/index.js'

export const authRepository = {
  saveRefreshToken(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
          VALUES (?, ?, ?, 0)
        `,
        [userId, token, expiresAt],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  findRefreshToken(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `
          SELECT * FROM refresh_tokens
          WHERE token = ?
        `,
        [token],
        (err, row) => {
          if (err) return reject(err)
          resolve(row || null)
        }
      )
    })
  },

  revokeRefreshToken(token) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE refresh_tokens
          SET revoked = 1
          WHERE token = ?
        `,
        [token],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  revokeAllUserRefreshTokens(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE refresh_tokens
          SET revoked = 1
          WHERE user_id = ?
        `,
        [userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  }
}