import type { CreateLogParams } from '../../../domain/types/audit.types.js'
import { AuditLogModel } from './audit.model.js'

export const logRepository = {
  async create({
    userId = null,
    email = null,
    action,
    ip = null,
    userAgent = null,
    metadata = null
  }: CreateLogParams): Promise<boolean> {
    await AuditLogModel.create({
      user_id: userId,
      email,
      action,
      ip,
      user_agent: userAgent,
      metadata
    })
    return true
  }
}
