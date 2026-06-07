import { logRepository } from '../repositories/logRepository.js'

export const logService = {
  async write(req, { userId = null, email = null, action, metadata = null }) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null

    const userAgent = req.headers['user-agent'] || null

    await logRepository.create({
      userId,
      email,
      action,
      ip,
      userAgent,
      metadata,
    })
  }
}