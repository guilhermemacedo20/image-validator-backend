import type { Request, Response } from 'express'

import { aiService } from './ai.service.js'

function normalizeImagePayload(body: any) {
  const rawImage = body?.imageBase64 || body?.image
  let imageBase64 = typeof rawImage === 'string' ? rawImage.trim() : ''
  let mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : ''

  const dataUrlMatch = imageBase64.match(/^data:(.+);base64,(.+)$/)

  if (dataUrlMatch) {
    mimeType = mimeType || dataUrlMatch[1]
    imageBase64 = dataUrlMatch[2]
  }

  return {
    imageBase64,
    mimeType
  }
}

function getGeminiApiKey(req: Request): string {
  const headerValue = req.headers['x-gemini-api-key']

  if (Array.isArray(headerValue)) {
    return headerValue[0] || ''
  }

  return headerValue || ''
}

export const aiController = {
  async analyzeImage(req: Request, res: Response) {
    try {
      const user = req.user

      if (!user) {
        return res.status(401).json({
          error: 'Usuário não autenticado.'
        })
      }

      const geminiApiKey = getGeminiApiKey(req)
      const { imageBase64, mimeType } = normalizeImagePayload(req.body)

      if (!geminiApiKey) {
        return res.status(400).json({
          error: 'API Key do Gemini não declarada.'
        })
      }

      if (!imageBase64) {
        return res.status(400).json({
          error: 'Imagem não enviada.'
        })
      }

      if (!mimeType) {
        return res.status(400).json({
          error: 'Tipo da imagem não informado.'
        })
      }

      const result = await aiService.analyzeImage(
        imageBase64,
        mimeType,
        geminiApiKey
      )

      return res.json(result)
    } catch (error: any) {
      console.error('Erro ao analisar imagem:', {
        message: error?.message,
        stack: error?.stack
      })

      return res.status(502).json({
        error: error?.message || 'Erro ao analisar imagem.'
      })
    }
  }
}
