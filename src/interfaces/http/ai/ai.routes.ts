import { Router, Request } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

import { authMiddleware } from '../middlewares/auth.middleware.js'
import { aiController } from './ai.controller.js'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    return req.user?.id?.toString() || ipKeyGenerator(req.ip || '')
  },
  message: {
    error: 'Limite de análises atingido. Aguarde 1 minuto.'
  }
})

router.post(
  '/analyze-image',
  authMiddleware,
  aiLimiter,
  aiController.analyzeImage
)

router.get('/analyses', authMiddleware, aiController.listAnalyses)
router.get('/analyses/stats', authMiddleware, aiController.getStats)
router.get('/analyses/:id', authMiddleware, aiController.getAnalysis)
router.delete('/analyses/:id', authMiddleware, aiController.deleteAnalysis)

export default router
