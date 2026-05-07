import bcrypt from 'bcrypt'

import { randomBytes, createHash } from 'crypto'

import { env } from '../config/env.js'

import { userRepository } from '../repositories/userRepository.js'
import { authRepository } from '../repositories/authRepository.js'

import { tokenService } from './tokenService.js'
import { twoFactorService } from './twoFactorService.js'
import { sendResetEmail } from './mailService.js'

import { encrypt } from '../utils/crypto.js'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isStrongPassword(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function isAccountLocked(user: User): boolean {
  return Boolean(user.locked_until && new Date(user.locked_until) > new Date())
}

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

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Email inválido')
    }

    if (!isStrongPassword(password)) {
      throw new Error(
        'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial'
      )
    }

    if (!consent) {
      throw new Error(
        'É necessário aceitar os termos e a política de privacidade'
      )
    }

    const exists = await userRepository.findByEmail(normalizedEmail)

    if (exists) {
      throw new Error('Usuário já existe')
    }

    const hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

    const user = await userRepository.create({
      email: normalizedEmail,

      password: hash,

      consent: true,

      consentDate: new Date().toISOString(),

      consentVersion: '1.0'
    })

    return user
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
    if (!isStrongPassword(newPassword)) {
      throw new Error('Senha não atende aos requisitos de segurança')
    }

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
