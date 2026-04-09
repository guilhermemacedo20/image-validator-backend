import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { authRepository } from '../repositories/authRepository.js'
import { blacklistRepository } from '../repositories/blackListRepository.js'

function parseExpiryToDate(expiresIn) {
  const now = new Date()

  if (typeof expiresIn === 'number') {
    now.setSeconds(now.getSeconds() + expiresIn)
    return now.toISOString()
  }

  const match = /^(\d+)([smhd])$/.exec(expiresIn)
  if (!match) {
    now.setDate(now.getDate() + 7)
    return now.toISOString()
  }

  const value = Number(match[1])
  const unit = match[2]

  if (unit === 's') now.setSeconds(now.getSeconds() + value)
  if (unit === 'm') now.setMinutes(now.getMinutes() + value)
  if (unit === 'h') now.setHours(now.getHours() + value)
  if (unit === 'd') now.setDate(now.getDate() + value)

  return now.toISOString()
}

export const tokenService = {
  generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    })
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    })
  },

  verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET)
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET)
  },

  async persistRefreshToken(userId, refreshToken) {
    const expiresAt = parseExpiryToDate(env.REFRESH_TOKEN_EXPIRES_IN)
    await authRepository.saveRefreshToken(userId, refreshToken, expiresAt)
  },

  async rotateRefreshToken(oldToken, payload) {
    const stored = await authRepository.findRefreshToken(oldToken)
    if (!stored || stored.revoked) {
      throw new Error('Refresh token inválido')
    }

    if (new Date(stored.expires_at) <= new Date()) {
      throw new Error('Refresh token expirado')
    }

    await authRepository.revokeRefreshToken(oldToken)

    const newRefreshToken = this.generateRefreshToken(payload)
    await this.persistRefreshToken(payload.id, newRefreshToken)

    const newAccessToken = this.generateAccessToken(payload)

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  },

  async blacklistAccessToken(token) {
    const decoded = this.verifyAccessToken(token)
    const expiresAt = new Date(decoded.exp * 1000).toISOString()
    await blacklistRepository.add(token, expiresAt)
  },

  async isBlacklisted(token) {
    return blacklistRepository.exists(token)
  },
}