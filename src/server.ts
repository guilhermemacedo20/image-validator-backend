import app from './app.js'

import { env } from './config/env.js'

import { connectDatabase } from './database/index.js'

import { blackListRepository } from './repositories/blackListRepository.js'

async function bootstrap() {
  try {
    await connectDatabase()
    await blackListRepository.cleanupExpired()

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error)

    process.exit(1)
  }
}

bootstrap()
