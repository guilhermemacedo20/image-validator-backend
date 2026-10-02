export interface TokenPayload {
  id: string
  email: string
}

export interface TwoFactorPayload extends TokenPayload {
  purpose: '2fa'
}

export interface TwoFactorSetupResult {
  base32: string
  otpauthUrl: string
  qrCode: string
}
