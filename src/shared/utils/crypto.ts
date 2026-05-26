import crypto from 'crypto'

import { env } from '../../config/env.js'

const algorithm = 'aes-256-cbc'

// função para gerar uma chave de criptografia a partir da variável de ambiente SECRET_KEY usando SHA-256.
function getKey(): Buffer {
  return crypto
    .createHash('sha256')

    .update(String(env.SECRET_KEY || ''))

    .digest()
}

// função para criptografar um texto usando AES-256-CBC, gerando um vetor de inicialização (IV) aleatório e retornando o resultado no formato "iv:encrypted".
export function encrypt(text: string | null | undefined): string | null {
  if (text === null || text === undefined || text === '') {
    return null
  }

  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, getKey(), iv)

  let encrypted = cipher.update(String(text), 'utf8', 'hex')

  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

// função para descriptografar um texto criptografado no formato "iv:encrypted" usando AES-256-CBC.
export function decrypt(text: string | null | undefined): string {
  if (!text) {
    return ''
  }

  if (!String(text).includes(':')) {
    return String(text)
  }

  const [ivHex, encrypted] = String(text).split(':')

  if (!ivHex || !encrypted) {
    return ''
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(ivHex, 'hex')
  )

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')

  decrypted += decipher.final('utf8')

  return decrypted
}
