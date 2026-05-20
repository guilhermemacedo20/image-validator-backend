import { Router } from 'express'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { userController } from './user.controller.js'

const router = Router()

router.put('/profile', authMiddleware, userController.updateProfile)
router.get('/export', authMiddleware, userController.exportData)
router.post('/revoke-consent', authMiddleware, userController.revokeConsent)
router.delete('/', authMiddleware, userController.deleteAccount)

export default router