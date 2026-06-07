import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'
import { env } from './config/env.js'

const app = express()

app.set('trust proxy', 1)

app.use((req, res, next) => {
  if (env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
})

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
})

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true })
})

app.use(globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/refresh', authLimiter)
app.use('/api', routes)

export default app
