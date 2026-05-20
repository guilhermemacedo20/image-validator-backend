import type { User } from './user.js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      accessToken?: string
      token?: string
      file?: Multer.File
    }
  }
}

export {}