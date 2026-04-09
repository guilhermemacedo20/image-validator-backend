export const twoFactorMiddleware = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  next()
}