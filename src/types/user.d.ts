interface User {
  id: string
  email: string
  password: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address?: string | null
  two_factor_enabled?: boolean
  two_factor_secret?: string | null
  failed_login_attempts?: number
  locked_until?: string | Date | null
  last_login_at?: string | Date | null
  reset_token?: string | null
  reset_token_expires?: number | null
  consent?: boolean
  consent_date?: string | null
  consent_version?: string | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
}

interface CreateUserParams {
  email: string
  password: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  address?: string | null
  consent?: boolean
  consentDate?: string | null
  consentVersion?: string | null
}

interface UpdateProfileParams {
  firstName: string
  lastName: string
  phone: string
  address: string
}

interface UpdateConsentParams {
  consent: boolean

  consentDate?: string | null

  consentVersion?: string | null
}