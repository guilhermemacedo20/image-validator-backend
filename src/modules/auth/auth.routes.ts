import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { userController } from '../users/user.controller.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)

router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, userController.me)

router.post('/2fa/setup', authMiddleware, authController.setup2FA)
router.post('/2fa/confirm', authMiddleware, authController.confirm2FA)
router.post('/2fa/disable', authMiddleware, authController.disable2FA)

router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

export default router