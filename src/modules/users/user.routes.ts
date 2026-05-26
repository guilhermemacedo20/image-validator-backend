import { Router } from 'express'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { userController } from './user.controller.js'

const router = Router()

// rotas para obtenção dos dados do perfil do usuário autenticado, atualização do perfil, exportação de dados, revogação de consentimento e exclusão da conta, protegida por autenticação.

router.put('/profile', authMiddleware, userController.updateProfile)
router.get('/export', authMiddleware, userController.exportData)
router.post('/revoke-consent', authMiddleware, userController.revokeConsent)
router.delete('/', authMiddleware, userController.deleteAccount)

export default router