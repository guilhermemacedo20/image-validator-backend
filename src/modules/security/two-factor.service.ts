import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

import { userRepository } from '../users/user.repository.js'

export const twoFactorService = {
  async setup(user: UserWithTwoFactor): Promise<TwoFactorSetupResult> {
    const secret = speakeasy.generateSecret({
      name: `SecureImageValidator (${user.email})`
    })

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error('Erro ao gerar segredo 2FA')
    }

    await userRepository.setTwoFactorSecret(user.id, secret.base32)

    const qrCode = await QRCode.toDataURL(secret.otpauth_url)

    return {
      base32: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode
    }
  },

  verify(secret: string, token: string | number): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',

      token: String(token || '')
        .trim()
        .replace(/\s+/g, ''),

      window: 2
    })
  },

  async confirmActivation(
    userId: string,
    token: string | number
  ): Promise<boolean> {
    const user = (await userRepository.findById(
      userId
    )) as UserWithTwoFactor | null

    if (!user || !user.two_factor_secret) {
      throw new Error('Segredo 2FA não configurado')
    }

    const valid = this.verify(user.two_factor_secret, token)

    if (!valid) {
      throw new Error('Código 2FA inválido')
    }

    await userRepository.enableTwoFactor(userId)

    return true
  },

  async disable(userId: string): Promise<boolean> {
    await userRepository.disableTwoFactor(userId)

    return true
  }
}
