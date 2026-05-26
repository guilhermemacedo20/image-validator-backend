// função para validar o formato de um endereço de email usando uma expressão regular simples.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// função para validar a força de uma senha, exigindo pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
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

// função para verificar se a conta de um usuário está bloqueada.
export function isAccountLocked(user: User): boolean {
  return Boolean(user.locked_until && new Date(user.locked_until) > new Date())
}