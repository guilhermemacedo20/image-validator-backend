import { RefreshTokenModel } from './refresh-token.model.js'

interface RefreshTokenRow {
  id: string
  user_id: string
  token: string
  expires_at: string | Date
  revoked: boolean
}

// função auxiliar para normalizar os dados do refresh token retornados do banco de dados.
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
  // função para salvar um novo refresh token no banco de dados.
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

  // função para encontrar um refresh token válido no banco de dados usando o token string.
  async findRefreshToken(
    token: string
  ): Promise<RefreshTokenRow | null> {
    const refreshToken =
      await RefreshTokenModel.findOne({ token }).lean()

    return normalizeRefreshToken(refreshToken)
  },

  // função para revogar um refresh token específico no banco de dados.
  async revokeRefreshToken(token: string): Promise<boolean> {
    await RefreshTokenModel.updateOne(
      { token },
      {
        revoked: true
      }
    )

    return true
  },

  // função para revogar todos os refresh tokens de um usuário específico no banco de dados.
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