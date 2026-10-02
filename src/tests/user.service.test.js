import { userService } from '../../dist/application/users/user.service.js'

describe('userService.serializeUser', () => {
  it('maps persistence fields to public API shape', () => {
    const publicUser = userService.serializeUser({
      id: 'abc123',
      email: 'user@test.com',
      password: 'secret-hash',
      first_name: 'Ana',
      last_name: 'Silva',
      two_factor_enabled: true,
      consent: true,
      consent_date: '2026-01-01',
      created_at: '2026-01-02'
    })

    expect(publicUser).toEqual({
      id: 'abc123',
      email: 'user@test.com',
      firstName: 'Ana',
      lastName: 'Silva',
      twoFactorEnabled: true,
      consent: true,
      consentDate: '2026-01-01',
      createdAt: '2026-01-02'
    })

    expect(publicUser).not.toHaveProperty('password')
  })

  it('uses safe defaults for missing optional fields', () => {
    const publicUser = userService.serializeUser({
      id: 'xyz',
      email: 'x@y.com',
      password: 'hash'
    })

    expect(publicUser.firstName).toBe('')
    expect(publicUser.lastName).toBe('')
    expect(publicUser.twoFactorEnabled).toBe(false)
    expect(publicUser.consent).toBe(false)
  })
})
