import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'

import {
  assertStrongPassword,
  assertValidRegistration,
  isAccountLocked
} from '../../domain/policies/auth.policies.js'
import type {
  LoginParams,
  LoginResponse,
  RegisterParams
} from '../../domain/types/auth.types.js'
import type { TokenPayload } from '../../domain/types/token.types.js'
import type { User } from '../../domain/types/user.types.js'
import { env } from '../../infrastructure/config/env.js'
import { encrypt } from '../../infrastructure/crypto/crypto.js'
import { sendResetEmail } from '../../infrastructure/mail/mail.service.js'
import { authRepository } from '../../infrastructure/persistence/auth/auth.repository.js'
import { userRepository } from '../../infrastructure/persistence/users/user.repository.js'
import { twoFactorService } from '../security/two-factor.service.js'
import { tokenService } from './token.service.js'

async function applyFailedLoginDelay(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 700)
  })
}

export const authService = {
  async register({ email, password, consent = false }: RegisterParams) {
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    assertValidRegistration(normalizedEmail, password, Boolean(consent))

    const exists = await userRepository.findByEmail(normalizedEmail)

    if (exists) {
      throw new Error('Usuário já existe')
    }

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

    return userRepository.create({
      email: normalizedEmail,
      password: hash,
      consent: true,
      consentDate: new Date().toISOString()
    })
  },

  async login({
    email,
    password,
    twoFactorCode,
    twoFactorToken
  }: LoginParams): Promise<LoginResponse> {
    let user: User | null = null

    if (twoFactorToken) {
      const decoded = tokenService.verifyTwoFactorToken(
        twoFactorToken
      ) as TokenPayload

      user = await userRepository.findById(decoded.id)
      await applyFailedLoginDelay()

      if (!user || !user.two_factor_enabled) {
        throw new Error('Fluxo 2FA inválido')
      }

      const valid2FA = twoFactorService.verify(
        user.two_factor_secret || '',
        twoFactorCode || ''
      )

      if (!valid2FA) {
        await userRepository.registerFailedLogin(user.id)
        throw new Error('Código 2FA inválido')
      }
    } else {
      const normalizedEmail = String(email || '')
        .trim()
        .toLowerCase()

      user = await userRepository.findByEmail(normalizedEmail)
      await applyFailedLoginDelay()

      if (!user) {
        throw new Error('Credenciais inválidas')
      }

      if (isAccountLocked(user)) {
        throw new Error(
          'Conta temporariamente bloqueada por excesso de tentativas. Tente novamente mais tarde.'
        )
      }

      const validPassword = await bcrypt.compare(
        password || '',
        user.password || ''
      )

      if (!validPassword) {
        await userRepository.registerFailedLogin(user.id)
        throw new Error('Credenciais inválidas')
      }

      if (user.two_factor_enabled) {
        return {
          requiresTwoFactor: true,
          twoFactorToken: tokenService.generateTwoFactorToken({
            id: user.id,
            email: user.email
          })
        }
      }
    }

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    await userRepository.resetLoginFailures(user.id)

    const payload: TokenPayload = {
      id: user.id,
      email: user.email
    }

    const accessToken = tokenService.generateAccessToken(payload)
    const refreshToken = tokenService.generateRefreshToken(payload)

    await tokenService.persistRefreshToken(user.id, refreshToken)

    return {
      requiresTwoFactor: false,
      accessToken,
      refreshToken,
      user: payload
    }
  },

  async forgotPassword(email: string): Promise<boolean> {
    const normalizedEmail = String(email || '')
      .trim()
      .toLowerCase()

    const user = await userRepository.findByEmail(normalizedEmail)

    if (!user) {
      return true
    }

    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(rawToken).digest('hex')
    const expires = Date.now() + 1000 * 60 * 15

    await userRepository.saveResetToken(user.id, hashedToken, expires)
    await sendResetEmail(user.email, rawToken)

    return true
  },

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    assertStrongPassword(newPassword)

    const hashedToken = createHash('sha256').update(token).digest('hex')
    const user = await userRepository.findByToken(hashedToken)

    if (!user) {
      throw new Error('Token inválido')
    }

    if (Number(user.reset_token_expires) < Date.now()) {
      throw new Error('Token expirado')
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)

    await userRepository.updatePassword(user.id, hashedPassword)
    await userRepository.clearResetToken(user.id)
    await authRepository.revokeAllUserRefreshTokens(user.id)

    return true
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token não informado')
    }

    const decoded = tokenService.verifyRefreshToken(
      refreshToken
    ) as TokenPayload

    return tokenService.rotateRefreshToken(refreshToken, {
      id: decoded.id,
      email: decoded.email
    })
  },

  async logout(accessToken?: string, refreshToken?: string): Promise<boolean> {
    if (accessToken) {
      await tokenService.blacklistAccessToken(accessToken)
    }

    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken)
    }

    return true
  },

  encryptProfileValue(value: string): string {
    return encrypt(value) || ''
  }
}
