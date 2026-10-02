import type { TokenPayload } from './token.types.js'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
      accessToken?: string
      token?: string
    }
  }
}

export {}
