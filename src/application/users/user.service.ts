import { toPublicUser } from '../../domain/policies/user.policies.js'
import type {
  PublicUser,
  UpdateProfileParams
} from '../../domain/types/user.types.js'
import { authRepository } from '../../infrastructure/persistence/auth/auth.repository.js'
import { userRepository } from '../../infrastructure/persistence/users/user.repository.js'

export const userService = {
  serializeUser: toPublicUser,

  async getById(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId)

    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    return toPublicUser(user)
  },

  async updateProfile(
    userId: string,
    { firstName, lastName }: UpdateProfileParams
  ): Promise<PublicUser> {
    if (!firstName || !lastName) {
      throw new Error('Preencha todos os campos do perfil')
    }

    await userRepository.updateProfile(userId, {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim()
    })

    return this.getById(userId)
  },

  async exportData(userId: string): Promise<PublicUser> {
    return this.getById(userId)
  },

  async revokeConsent(userId: string): Promise<void> {
    await userRepository.updateConsent(userId, {
      consent: false,
      consentDate: new Date().toISOString()
    })
  },

  async deleteAccount(userId: string): Promise<void> {
    await authRepository.revokeAllUserRefreshTokens(userId)
    await userRepository.deleteById(userId)
  }
}
