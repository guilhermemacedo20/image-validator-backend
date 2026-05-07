import { db } from '../database/index.js'

export const authRepository = {
  saveRefreshToken(
    userId: number | string,
    token: string,
    expiresAt: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
          VALUES (?, ?, ?, 0)
        `,
        [userId, token, expiresAt],
        function (err: Error | null) {
          if (err) return reject(err)

          resolve(true)
        }
      )
    })
  },

  findRefreshToken(token: string): Promise<RefreshTokenRow | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `
          SELECT * FROM refresh_tokens
          WHERE token = ?
        `,
        [token],
        (err: Error | null, row: RefreshTokenRow) => {
          if (err) return reject(err)

          resolve(row || null)
        }
      )
    })
  },

  revokeRefreshToken(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE refresh_tokens
          SET revoked = 1
          WHERE token = ?
        `,
        [token],
        function (err: Error | null) {
          if (err) return reject(err)

          resolve(true)
        }
      )
    })
  },

  revokeAllUserRefreshTokens(userId: number | string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE refresh_tokens
          SET revoked = 1
          WHERE user_id = ?
        `,
        [userId],
        function (err: Error | null) {
          if (err) return reject(err)

          resolve(true)
        }
      )
    })
  }
}
