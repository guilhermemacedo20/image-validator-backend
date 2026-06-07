import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.js'
import aiRoutes from '../modules/ai/ai.routes.js'
import userRoutes from '../modules/users/user.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/ai', aiRoutes)
router.use('/user', userRoutes)

export default router
