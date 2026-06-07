import fs from "fs"
import { aiService } from "../services/aiService.js"

export const aiController = {
  async analyzeImage(req, res) {
    try {
      const user = req.user

      if (!user) {
        return res.status(401).json({
          error: "Usuário não autenticado",
        })
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Imagem não enviada",
        })
      }

      const buffer = fs.readFileSync(req.file.path)
      const mimeType = req.file.mimetype

      const result = await aiService.analyzeImage(
        buffer,
        mimeType,
        user.id
      )

      fs.unlinkSync(req.file.path)

      return res.json({
        success: true,
        data: result,
      })
    } catch (err) {
      return res.status(500).json({
        error: err.message || "Erro ao analisar imagem",
      })
    }
  },
}