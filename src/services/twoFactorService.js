import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { userRepository } from '../repositories/userRepository.js'

export const twoFactorService = {
  async setup(user) {
    const secret = speakeasy.generateSecret({
      name: `SecureImageValidator (${user.email})`,
    })

    await userRepository.setTwoFactorSecret(user.id, secret.base32)

    const qrCode = await QRCode.toDataURL(secret.otpauth_url)

    return {
      base32: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode,
    }
  },

  verify(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    })
  },

  async confirmActivation(userId, token) {
    const user = await userRepository.findById(userId)
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

  async disable(userId) {
    await userRepository.disableTwoFactor(userId)
    return true
  }
}