import type { Request, Response, NextFunction } from 'express'
import { tokenService } from '../../modules/auth/token.service.js'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token não informado'
      })
    }

    const token = authHeader.split(' ')[1]

    const blacklisted = await tokenService.isBlacklisted(token)

    if (blacklisted) {
      return res.status(401).json({
        error: 'Token inválido'
      })
    }

    const decoded = tokenService.verifyAccessToken(token) as TokenPayload

    req.user = decoded

    req.accessToken = token

    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Não autenticado'
      })
    }

    next()
  } catch {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    })
  }
}
