import app from './src/app.js'
import { env } from './src/config/env.js'
import { blackListRepository } from './src/repositories/blackListRepository.js'

app.listen(env.PORT, async () => {
  await blackListRepository.cleanupExpired()
  console.log(`Server running on port ${env.PORT}`)
})