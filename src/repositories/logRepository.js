import { db } from '../database/index.js'

export const logRepository = {
  create({ userId = null, email = null, action, ip = null, userAgent = null, metadata = null }) {
    return new Promise((resolve, reject) => {
      db.run(
        `
          INSERT INTO audit_logs (user_id, email, action, ip, user_agent, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          userId,
          email,
          action,
          ip,
          userAgent,
          metadata ? JSON.stringify(metadata) : null,
        ],
        function (err) {
          if (err) return reject(err)
          resolve(true)
        }
      )
    })
  }
}