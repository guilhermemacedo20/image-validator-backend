import { tokenService } from '../services/tokenService.js'

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não informado' })
    }

    const token = authHeader.split(' ')[1]

    const blacklisted = await tokenService.isBlacklisted(token)
    if (blacklisted) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const decoded = tokenService.verifyAccessToken(token)
    req.user = decoded
    req.accessToken = token

    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}