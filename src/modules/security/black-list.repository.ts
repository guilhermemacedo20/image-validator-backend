import { TokenBlacklistModel } from './token-blacklist.model.js'

export const blackListRepository = {
  // função para adicionar um token de acesso à blacklist.
  async add(token: string, expiresAt: string): Promise<boolean> {
    await TokenBlacklistModel.updateOne(
      { token },
      {
        token,
        expires_at: new Date(expiresAt)
      },
      {
        upsert: true
      }
    )

    return true
  },

  // função para verificar se um token de acesso está na blacklist.
  async exists(token: string): Promise<boolean> {
    const item = await TokenBlacklistModel.exists({
      token
    })

    return Boolean(item)
  },

  // função para limpar tokens expirados da blacklist.
  async cleanupExpired(): Promise<boolean> {
    await TokenBlacklistModel.deleteMany({
      expires_at: {
        $lte: new Date()
      }
    })

    return true
  }
}
