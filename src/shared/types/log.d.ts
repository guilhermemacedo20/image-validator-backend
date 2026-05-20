interface CreateLogParams {
  userId?: string | null
  email?: string | null
  action: string
  ip?: string | null
  userAgent?: string | null
  metadata?: unknown
}

interface WriteLogParams {
  userId?: string | null
  email?: string | null
  action: string
  metadata?: unknown
}