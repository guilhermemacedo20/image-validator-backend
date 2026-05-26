import jwt, {
  type JwtPayload,
  type Secret,
  type SignOptions
} from 'jsonwebtoken'

import { env } from '../../config/env.js'

import { authRepository } from './auth.repository.js'
import { blackListRepository } from '../security/black-list.repository.js'

// função para calcular a data de expiração com base em uma string de duração (ex: "7d", "24h") ou um número de segundos.
function parseExpiryToDate(expiresIn: string | number): string {
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

  if (unit === 's') {
    now.setSeconds(now.getSeconds() + value)
  }

  if (unit === 'm') {
    now.setMinutes(now.getMinutes() + value)
  }

  if (unit === 'h') {
    now.setHours(now.getHours() + value)
  }

  if (unit === 'd') {
    now.setDate(now.getDate() + value)
  }

  return now.toISOString()
}

export const tokenService = {

  // função para gerar um token de acesso JWT com um payload específico e configuração de expiração.
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,

      env.JWT_SECRET as Secret,

      {
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN
      } as SignOptions
    )
  },

  // função para gerar um token de refresh JWT com um payload específico e configuração de expiração.
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,

      env.JWT_REFRESH_SECRET as Secret,

      {
        expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
      } as SignOptions
    )
  },

  // função para gerar um token de autenticação de dois fatores (2FA) JWT com um payload específico e configuração de expiração.
  generateTwoFactorToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        ...payload,

        purpose: '2fa'
      },

      env.JWT_SECRET as Secret,

      {
        expiresIn: '5m'
      } as SignOptions
    )
  },

  // função para verificar a validade de um token de acesso JWT e retornar seu payload decodificado.
  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload
  },

  // função para verificar a validade de um token de refresh JWT e retornar seu payload decodificado.
  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(
      token,

      env.JWT_REFRESH_SECRET as Secret
    ) as JwtPayload
  },

  // função para verificar a validade de um token de autenticação de dois fatores (2FA) JWT e retornar seu payload decodificado.
  verifyTwoFactorToken(token: string): TwoFactorPayload {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET as Secret
    ) as TwoFactorPayload

    if (decoded.purpose !== '2fa') {
      throw new Error('Token 2FA inválido')
    }

    return decoded
  },

  // função para persistir um refresh token no banco de dados.
  async persistRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = parseExpiryToDate(env.REFRESH_TOKEN_EXPIRES_IN)

    await authRepository.saveRefreshToken(userId, refreshToken, expiresAt)
  },

  // função para lidar com o processo de refresh de tokens, incluindo validação do refresh token.
  async rotateRefreshToken(oldToken: string, payload: TokenPayload) {
    const stored = (await authRepository.findRefreshToken(
      oldToken
    )) as RefreshTokenRow | null

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

      refreshToken: newRefreshToken
    }
  },

  // função para adicionar um token de acesso à blacklist, impedindo seu uso futuro.
  async blacklistAccessToken(token: string): Promise<void> {
    const decoded = this.verifyAccessToken(token)

    if (!decoded.exp) {
      throw new Error('Token inválido')
    }

    const expiresAt = new Date(decoded.exp * 1000).toISOString()

    await blackListRepository.add(token, expiresAt)
  },

  // função para verificar se um token de acesso está na blacklist.
  async isBlacklisted(token: string): Promise<boolean> {
    return blackListRepository.exists(token)
  }
}
