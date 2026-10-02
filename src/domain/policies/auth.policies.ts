import type { User } from '../types/user.types.js'

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isStrongPassword(password: string): boolean {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export function isAccountLocked(user: User): boolean {
  return Boolean(user.locked_until && new Date(user.locked_until) > new Date())
}

export function assertValidRegistration(
  email: string,
  password: string,
  consent: boolean
): void {
  if (!isValidEmail(email)) {
    throw new Error('Email inválido')
  }

  if (!isStrongPassword(password)) {
    throw new Error(
      'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial'
    )
  }

  if (!consent) {
    throw new Error(
      'É necessário aceitar os termos e a política de privacidade'
    )
  }
}

export function assertStrongPassword(password: string): void {
  if (!isStrongPassword(password)) {
    throw new Error('Senha não atende aos requisitos de segurança')
  }
}
