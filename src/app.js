import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import routes from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.use('/api', routes)

export default app