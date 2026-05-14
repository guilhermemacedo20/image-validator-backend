import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.put('/profile', authMiddleware, authController.updateProfile)
router.get('/export', authMiddleware, authController.exportData)
router.post('/revoke-consent', authMiddleware, authController.revokeConsent)
router.delete('/', authMiddleware, authController.deleteAccount)

export default router