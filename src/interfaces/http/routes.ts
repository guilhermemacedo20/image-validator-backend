import { Router } from 'express'

import aiRoutes from './ai/ai.routes.js'
import authRoutes from './auth/auth.routes.js'
import userRoutes from './users/user.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/ai', aiRoutes)
router.use('/user', userRoutes)

export default router
