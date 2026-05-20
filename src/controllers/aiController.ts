import type { Request, Response } from 'express'

import { aiService } from '../services/aiService.js'

export const aiController = {
  async analyzeImage(req: Request, res: Response) {
    try {
      const user = req.user

      if (!user) {
        return res.status(401).json({
          error: 'Usuário não autenticado.'
        })
      }

      const { imageBase64, mimeType, geminiApiKey } = req.body

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({
          error: 'Imagem e tipo são obrigatórios.'
        })
      }

      if (!geminiApiKey) {
        return res.status(400).json({
          error: 'API Key do Gemini não informada.'
        })
      }

      const result = await aiService.analyzeImage(
        imageBase64,
        mimeType,
        geminiApiKey
      )

      return res.json(result)
    } catch (error) {
      console.error(error)

      return res.status(500).json({
        error: 'Erro ao analisar imagem.'
      })
    }
  }
}
