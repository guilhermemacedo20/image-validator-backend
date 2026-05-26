import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { userController } from '../users/user.controller.js'

const router = Router()

// rota para registro, login, refresh de tokens, logout, obtenção de dados do usuário autenticado e gerenciamento de autenticação de dois fatores (2FA).
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