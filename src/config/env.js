import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  FRONT_URL: process.env.FRONT_URL || 'https://image-validator-frontend-cyan.vercel.app',
}