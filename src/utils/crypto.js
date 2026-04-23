import crypto from 'crypto'
import { env } from '../config/env.js'

const algorithm = 'aes-256-cbc'

function getKey() {
  return crypto.createHash('sha256').update(String(env.SECRET_KEY || '')).digest()
}

export function encrypt(text) {
  if (text === null || text === undefined || text === '') return null

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv)
  let encrypted = cipher.update(String(text), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(text) {
  if (!text) return ''
  if (!String(text).includes(':')) return String(text)

  const [ivHex, encrypted] = String(text).split(':')
  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivHex, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
