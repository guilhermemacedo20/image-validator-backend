import type { TokenPayload } from './token.types.js'

export interface RegisterParams {
  email: string
  password: string
  consent?: boolean
}

export interface LoginParams {
  email?: string
  password?: string
  twoFactorCode?: string
  twoFactorToken?: string
}

export interface LoginResponse {
  requiresTwoFactor: boolean
  twoFactorToken?: string
  accessToken?: string
  refreshToken?: string
  user?: TokenPayload
}

export interface RefreshTokenRow {
  id: string
  user_id: string
  token: string
  expires_at: string | Date
  revoked: boolean
}
