import { Router } from 'express'
import authRoutes from './authRoutes.js'
import { authController } from '../controllers/authController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.use('/auth', authRoutes)
router.put('/user/profile', authMiddleware, authController.updateProfile)
router.get('/user/export', authMiddleware, authController.exportData)
router.post('/user/revoke-consent', authMiddleware, authController.revokeConsent)
router.delete('/user', authMiddleware, authController.deleteAccount)

export default router
