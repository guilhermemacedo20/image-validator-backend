import type { PublicUser, User } from '../types/user.types.js'

/** Mapeia entidade interna para o contrato público (sem dados sensíveis). */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    consent: Boolean(user.consent),
    consentDate: user.consent_date || null,
    createdAt: user.created_at || null
  }
}
