import { RefreshTokenModel } from '../models/RefreshToken.js'

interface RefreshTokenRow {
  id: string
  user_id: string
  token: string
  expires_at: string | Date
  revoked: boolean
}

function normalizeRefreshToken(document: any): RefreshTokenRow | null {
  if (!document) return null

  return {
    id: String(document._id),
    user_id: String(document.user_id),
    token: document.token,
    expires_at: document.expires_at,
    revoked: Boolean(document.revoked)
  }
}

export const authRepository = {
  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: string
  ): Promise<boolean> {
    await RefreshTokenModel.create({
      user_id: userId,
      token,
      expires_at: new Date(expiresAt),
      revoked: false
    })

    return true
  },

  async findRefreshToken(
    token: string
  ): Promise<RefreshTokenRow | null> {
    const refreshToken =
      await RefreshTokenModel.findOne({ token }).lean()

    return normalizeRefreshToken(refreshToken)
  },

  async revokeRefreshToken(token: string): Promise<boolean> {
    await RefreshTokenModel.updateOne(
      { token },
      {
        revoked: true
      }
    )

    return true
  },

  async revokeAllUserRefreshTokens(
    userId: string
  ): Promise<boolean> {
    await RefreshTokenModel.updateMany(
      {
        user_id: userId
      },
      {
        revoked: true
      }
    )

    return true
  }
}