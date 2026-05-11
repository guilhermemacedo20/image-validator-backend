import type { Request, Response, NextFunction } from 'express'

export const twoFactorMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (!req.user?.id) {
    return res.status(401).json({
      error: 'Não autenticado'
    })
  }

  next()
}
