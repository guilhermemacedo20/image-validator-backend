import { Router } from 'express'
import authRoutes from './authRoutes.js'
import { authController } from '../controllers/authController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.use('/auth', authRoutes)
router.put('/user/profile', authMiddleware, authController.updateProfile)

export default router
