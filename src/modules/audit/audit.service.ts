import type { Request } from 'express'

import { logRepository } from './audit.repository.js'

// serviço para escrita de logs de auditoria.
export const logService = {
  async write(
    req: Request,

    { userId = null, email = null, action, metadata = null }: WriteLogParams
  ): Promise<void> {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null

    const userAgent = req.headers['user-agent']?.toString() || null

    await logRepository.create({
      userId,
      email,
      action,
      ip,
      userAgent,
      metadata
    })
  }
}
