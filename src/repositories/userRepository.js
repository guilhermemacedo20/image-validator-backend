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
        `SELECT * FROM users WHERE lower(email) = lower(?)`,
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

  updateProfile(userId, { firstName, lastName, phone, address }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [firstName, lastName, phone, address, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
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
  },

  registerFailedLogin(userId, lockMinutes = 15) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET
            failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE
              WHEN failed_login_attempts + 1 >= 5 THEN datetime('now', ?)
              ELSE locked_until
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [`+${lockMinutes} minutes`, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  resetLoginFailures(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
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
}
