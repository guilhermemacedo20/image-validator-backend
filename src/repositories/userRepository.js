import { db } from '../database/index.js'

export const userRepository = {
  create({ email, password, firstName = null, lastName = null, phone = null, address = null, consent = false, consentDate = null, consentVersion = null }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO users (
            email, password, first_name, last_name, phone, address, consent, consent_date, consent_version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [email, password, firstName, lastName, phone, address, consent ? 1 : 0, consentDate, consentVersion],
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

  saveResetToken(userId, token, expires) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET reset_token = ?, reset_token_expires = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [token, expires, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  findByToken(token) {
    return new Promise((resolve, reject) => {
      db.get(
        `
          SELECT * FROM users
          WHERE reset_token = ?
        `,
        [token],
        (err, row) => {
          if (err) return reject(err)
          resolve(row || null)
        }
      )
    })
  },

  clearResetToken(userId) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
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

  updatePassword(userId, password) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET password = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [password, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
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

  updateConsent(userId, { consent, consentDate = null, consentVersion = null }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          UPDATE users
          SET consent = ?, consent_date = ?, consent_version = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [consent ? 1 : 0, consentDate, consentVersion, userId],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  },

  deleteById(userId) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
        if (err) return reject(err)
        resolve(true)
      })
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
          SET failed_login_attempts = 0,
              locked_until = NULL,
              last_login_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
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
