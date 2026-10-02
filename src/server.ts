import app from './app.js'
import { env } from './infrastructure/config/env.js'
import { connectDatabase } from './infrastructure/database/index.js'
import { blackListRepository } from './infrastructure/persistence/security/black-list.repository.js'

async function server() {
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

server()
