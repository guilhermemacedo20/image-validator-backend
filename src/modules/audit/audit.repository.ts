import { AuditLogModel } from './audit.model.js'

interface CreateLogParams {
  userId?: string | null
  email?: string | null
  action: string
  ip?: string | null
  userAgent?: string | null
  metadata?: unknown
}

// repositório para criação de logs de auditoria no banco de dados.
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
