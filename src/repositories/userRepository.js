import { db } from '../database/index.js'

export const userRepository = {
  create(email, password) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO users (email, password)
          VALUES (?, ?)
        `,
        [email, password],
        function (err) {
          if (err) return reject(err)
          resolve({ id: this.lastID, email })
        }
      )
    })
  },

  findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) return reject(err)
          resolve(row || null)
        }
      )
    })
  },

  findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) return reject(err)
          resolve(row || null)
        }
      )
    })
  },

  setTwoFactorSecret(userId, secret) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET two_factor_secret = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [secret, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  enableTwoFactor(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET two_factor_enabled = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  disableTwoFactor(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET two_factor_enabled = 0, two_factor_secret = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
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