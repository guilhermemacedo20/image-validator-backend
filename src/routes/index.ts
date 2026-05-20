import { Router } from 'express'
import authRoutes from './authRoutes.js'
import aiRoutes from "./aiRoutes.js"
import userRoutes from './userRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/ai', aiRoutes)
router.use('/user',userRoutes)

export default router
