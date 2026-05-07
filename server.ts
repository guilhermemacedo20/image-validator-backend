import app from './src/app'
import { env } from './src/config/env'
import { blackListRepository } from './src/repositories/blackListRepository'

app.listen(env.PORT, async () => {
  await blackListRepository.cleanupExpired()
  console.log(`Server running on port ${env.PORT}`)
})