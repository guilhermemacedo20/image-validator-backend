import type { Request } from 'express'
import mongoose from 'mongoose'

import type { WriteLogParams } from '../../domain/types/audit.types.js'
import { logRepository } from '../../infrastructure/persistence/audit/audit.repository.js'

export const logService = {
  async write(
    req: Request,
    { userId = null, email = null, action, metadata = null }: WriteLogParams
  ): Promise<void> {
    if (mongoose.connection.readyState !== 1) {
      return
    }

    try {
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
    } catch (error) {
      console.error('Falha ao gravar auditoria:', error)
    }
  }
}
