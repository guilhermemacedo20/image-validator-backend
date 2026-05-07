interface CreateLogParams {
  userId?: number | string | null
  email?: string | null
  action: string
  ip?: string | null
  userAgent?: string | null
  metadata?: unknown
}

interface WriteLogParams {
  userId?: number | string | null
  email?: string | null
  action: string
  metadata?: unknown
}