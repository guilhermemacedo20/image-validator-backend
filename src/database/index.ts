import mongoose from 'mongoose'

import { env } from '../config/env.js'

export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI não configurada')
  }

  await mongoose.connect(env.MONGODB_URI)
}