import request from 'supertest'
import app from '../../dist/app.js'

describe('Auth HTTP', () => {
  it('should reject register with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'SenhaForte1!',
      consent: true
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('should reject register without consent', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'newuser@test.com',
      password: 'SenhaForte1!',
      consent: false
    })

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/consentimento|termos|política/i)
  })

  it('should reject register with weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'weak@test.com',
      password: '123',
      consent: true
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})
