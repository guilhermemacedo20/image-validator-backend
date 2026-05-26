import bcrypt from 'bcrypt'

import { randomBytes, createHash } from 'crypto'

import { env } from '../../config/env.js'

import { userRepository } from '../users/user.repository.js'
import { authRepository } from './auth.repository.js'

import { tokenService } from './token.service.js'
import { twoFactorService } from '../security/two-factor.service.js'
import { sendResetEmail } from '../security/mail.service.js'

import { encrypt } from '../../shared/utils/crypto.js'
import {
  isValidEmail,
  isStrongPassword,
  isAccountLocked
} from '../../shared/utils/validateInfo.js'

async function applyFailedLoginDelay(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 700)
  })
}

export const authService = {
  // função para registrar um novo usuário, incluindo validação de email e senha, hash da senha, e persistência no banco de dados.
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
      consentDate: new Date().toISOString()
    })

    return user
  },

  // função para autenticar um usuário, incluindo verificação de credenciais, gerenciamento de autenticação de dois fatores (2FA), geração de tokens de acesso e refresh, e persistência de refresh tokens no banco de dados.
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

  // função para lidar com o processo de esquecimento de senha, incluindo geração de token de reset, persistência do token no banco de dados, e envio de email para o usuário.
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

  // função para lidar com o processo de reset de senha, incluindo validação do token de reset, hash da nova senha, atualização da senha no banco de dados, e revogação de tokens de acesso e refresh existentes.
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

  // função para lidar com o refresh de tokens, incluindo validação do refresh token, geração de novos tokens de acesso e refresh, e persistência do novo refresh token no banco de dados.
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

  // função para lidar com o logout de usuários, revogando tokens de acesso e refresh.
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
