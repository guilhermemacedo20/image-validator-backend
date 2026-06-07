import { Router } from "express"
import multer from "multer"
import rateLimit from "express-rate-limit"
import { aiController } from "../controllers/aiController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

const upload = multer({ dest: "uploads/" })

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req)
  },
  message: {
    error: "Limite de análises atingido. Aguarde 1 minuto.",
  },
})

router.post(
  "/analyze-image",
  authMiddleware,
  aiLimiter,
  upload.single("image"),
  aiController.analyzeImage
)

export default router