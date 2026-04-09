import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { userRepository } from '../repositories/userRepository.js'
import { authRepository } from '../repositories/authRepository.js'
import { tokenService } from './tokenService.js'
import { twoFactorService } from './twoFactorService.js'

export const authService = {
  async register({ email, password }) {
    const exists = await userRepository.findByEmail(email)
    if (exists) {
      throw new Error('Usuário já existe')
    }

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
    const user = await userRepository.create(email, hash)

    return user
  },

  async login({ email, password, twoFactorCode }) {
    const user = await userRepository.findByEmail(email)
    if (!user) {
      throw new Error('Credenciais inválidas')
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
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
        throw new Error('Código 2FA inválido')
      }
    }

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
  }
}