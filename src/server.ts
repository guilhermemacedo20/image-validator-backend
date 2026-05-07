import app from './app.js'
import { env } from './config/env.js'
import { blackListRepository } from './repositories/blackListRepository.js'

app.listen(env.PORT, async () => {
  await blackListRepository.cleanupExpired()
  console.log(`Server running on port ${env.PORT}`)
})