import { TokenBlacklistModel } from '../models/TokenBlacklist.js'

export const blackListRepository = {
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

  async exists(token: string): Promise<boolean> {
    const item = await TokenBlacklistModel.exists({
      token
    })

    return Boolean(item)
  },

  async cleanupExpired(): Promise<boolean> {
    await TokenBlacklistModel.deleteMany({
      expires_at: {
        $lte: new Date()
      }
    })

    return true
  }
}
