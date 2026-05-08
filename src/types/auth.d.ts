interface RefreshTokenRow {
  id: number
  user_id: number
  token: string
  expires_at: string
  revoked: number
}

interface RegisterParams {
  email: string
  password: string
  consent?: boolean
}

interface LoginParams {
  email?: string
  password?: string
  twoFactorCode?: string
  twoFactorToken?: string
}

interface LoginResponse {
  requiresTwoFactor: boolean
  twoFactorToken?: string
  accessToken?: string
  refreshToken?: string
  user?: TokenPayload
}