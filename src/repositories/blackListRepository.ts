import { db } from '../database/index.js'

export const blackListRepository = {
  add(token: string, expiresAt: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `
            INSERT OR IGNORE
            INTO token_blacklist (
              token,
              expires_at
            )
            VALUES (?, ?)
          `,

        [token, expiresAt],

        function (err: Error | null) {
          if (err) {
            return reject(err)
          }

          resolve(true)
        }
      )
    })
  },

  exists(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        `
            SELECT id
            FROM token_blacklist
            WHERE token = ?
          `,

        [token],

        (err: Error | null, row: BlacklistRow | undefined) => {
          if (err) {
            return reject(err)
          }

          resolve(!!row)
        }
      )
    })
  },

  cleanupExpired(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        `
            DELETE
            FROM token_blacklist
            WHERE expires_at <= datetime('now')
          `,

        [],

        function (err: Error | null) {
          if (err) {
            return reject(err)
          }

          resolve(true)
        }
      )
    })
  }
}
