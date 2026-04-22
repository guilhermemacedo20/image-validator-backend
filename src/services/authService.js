import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/userRepository.js'
import { authRepository } from '../repositories/authRepository.js'
import { tokenService } from './tokenService.js'
import { twoFactorService } from './twoFactorService.js'
import { randomBytes, createHash } from 'crypto'
import { sendResetEmail } from './mailService.js'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isStrongPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function isAccountLocked(user) {
  return user.locked_until && new Date(user.locked_until) > new Date()
}

async function applyFailedLoginDelay() {
  await new Promise((resolve) => setTimeout(resolve, 700))
}

export const authService = {
  async register({ email, password }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Email inválido')
    }

    if (!isStrongPassword(password)) {
      throw new Error('A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial')
    }

    const exists = await userRepository.findByEmail(normalizedEmail)
    if (exists) {
      throw new Error('Usuário já existe')
    }

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const user = await userRepository.create(normalizedEmail, hash)

    return user
  },

  async login({ email, password, twoFactorCode }) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const user = await userRepository.findByEmail(normalizedEmail)

    await applyFailedLoginDelay()

    if (!user) {
      throw new Error('Credenciais inválidas')
    }

    if (isAccountLocked(user)) {
      throw new Error('Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.')
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      await userRepository.registerFailedLogin(user.id)
      throw new Error('Credenciais inválidas')
    }

    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        return {
          requiresTwoFactor: true,
        }
      }

      const valid2FA = twoFactorService.verify(user.two_factor_secret, twoFactorCode)
      if (!valid2FA) {
        await userRepository.registerFailedLogin(user.id)
        throw new Error('Código 2FA inválido')
      }
    }

    await userRepository.resetLoginFailures(user.id)

    const payload = { id: user.id, email: user.email }

    const accessToken = tokenService.generateAccessToken(payload)
    const refreshToken = tokenService.generateRefreshToken(payload)

    await tokenService.persistRefreshToken(user.id, refreshToken)

    return {
      requiresTwoFactor: false,
      accessToken,
      refreshToken,
      user: payload,
    }
  },

  async forgotPassword(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase()

    const user = await userRepository.findByEmail(normalizedEmail)

    if (!user) return true

    const rawToken = randomBytes(32).toString('hex')

    const hashedToken = createHash('sha256')
      .update(rawToken)
      .digest('hex')

    const expires = Date.now() + 1000 * 60 * 15

    await userRepository.saveResetToken(user.id, hashedToken, expires)

    await sendResetEmail(user.email, rawToken)

    return true
  },

  async resetPassword(token, newPassword) {

    if (!isStrongPassword(newPassword)) {
      throw new Error('Senha não atende aos requisitos de segurança')
    }

    const hashedToken = createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await userRepository.findByToken(hashedToken)

    if (!user) {
      throw new Error('Token inválido')
    }

    if (user.reset_token_expires < Date.now()) {
      throw new Error('Token expirado')
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)

    await userRepository.updatePassword(user.id, hashedPassword)

    await userRepository.clearResetToken(user.id)

    return true
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token não informado')
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken)

    const tokens = await tokenService.rotateRefreshToken(refreshToken, {
      id: decoded.id,
      email: decoded.email,
    })

    return tokens
  },

  async logout(accessToken, refreshToken) {
    if (accessToken) {
      await tokenService.blacklistAccessToken(accessToken)
    }

    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken)
    }

    return true
  },
}
