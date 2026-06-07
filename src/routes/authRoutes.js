import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { twoFactorMiddleware } from '../middlewares/twoFactorMiddleware.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)

router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)

router.post('/2fa/setup', authMiddleware, twoFactorMiddleware, authController.setup2FA)
router.post('/2fa/confirm', authMiddleware, twoFactorMiddleware, authController.confirm2FA)
router.post('/2fa/disable', authMiddleware, twoFactorMiddleware, authController.disable2FA)

router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

export default router