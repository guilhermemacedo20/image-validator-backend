import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/userRepository.js'
import { authRepository } from '../repositories/authRepository.js'
import { tokenService } from './tokenService.js'
import { twoFactorService } from './twoFactorService.js'

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
