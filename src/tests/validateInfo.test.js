import {
  isAccountLocked,
  isStrongPassword,
  isValidEmail
} from '../../dist/domain/policies/auth.policies.js'

describe('auth.policies', () => {
  describe('isValidEmail', () => {
    it('accepts a valid email', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(isValidEmail('user')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
    })
  })

  describe('isStrongPassword', () => {
    it('accepts a strong password', () => {
      expect(isStrongPassword('SenhaForte1!')).toBe(true)
    })

    it('rejects weak passwords', () => {
      expect(isStrongPassword('senha')).toBe(false)
      expect(isStrongPassword('SENHA123!')).toBe(false)
      expect(isStrongPassword('Senha123')).toBe(false)
      expect(isStrongPassword('Senha!')).toBe(false)
    })
  })

  describe('isAccountLocked', () => {
    it('returns false when locked_until is null', () => {
      expect(
        isAccountLocked({
          id: '1',
          email: 'a@b.com',
          password: 'x',
          locked_until: null
        })
      ).toBe(false)
    })

    it('returns true when locked_until is in the future', () => {
      expect(
        isAccountLocked({
          id: '1',
          email: 'a@b.com',
          password: 'x',
          locked_until: new Date(Date.now() + 60_000)
        })
      ).toBe(true)
    })

    it('returns false when lock already expired', () => {
      expect(
        isAccountLocked({
          id: '1',
          email: 'a@b.com',
          password: 'x',
          locked_until: new Date(Date.now() - 60_000)
        })
      ).toBe(false)
    })
  })
})
