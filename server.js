import app from './src/app.js'
import { env } from './src/config/env.js'
import { blacklistRepository } from './src/repositories/blacklistRepository.js'

app.listen(env.PORT, async () => {
  await blacklistRepository.cleanupExpired()
  console.log(`Server running on port ${env.PORT}`)
})