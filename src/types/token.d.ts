interface TokenPayload {
  id: number | string
  email: string
}

interface TwoFactorPayload
  extends TokenPayload {

  purpose: '2fa'
}

interface RefreshTokenRow {
  revoked: number
  expires_at: string
}

interface TwoFactorSetupResult {
  base32: string
  otpauthUrl: string
  qrCode: string
}

interface UserWithTwoFactor {
  id: number | string
  email: string
  two_factor_secret?: string | null
}