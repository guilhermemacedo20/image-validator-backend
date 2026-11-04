import type { Request, Response } from 'express'

import { analysisHistoryService } from '../../../application/ai/analysis-history.service.js'
import {
  aiService,
  AnalysisValidationError
} from '../../../application/ai/ai.service.js'
import { logService } from '../../../application/audit/audit.service.js'
import { env } from '../../../infrastructure/config/env.js'

function normalizeImagePayload(body: any) {
  const rawImage = body?.imageBase64 || body?.image
  let imageBase64 = typeof rawImage === 'string' ? rawImage.trim() : ''
  let mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : ''
  const fileName = typeof body?.fileName === 'string' ? body.fileName : null

  const dataUrlMatch = imageBase64.match(/^data:(.+);base64,(.+)$/)

  if (dataUrlMatch) {
    mimeType = mimeType || dataUrlMatch[1]
    imageBase64 = dataUrlMatch[2]
  }

  return { imageBase64, mimeType, fileName }
}

function getGeminiApiKey(req: Request): string {
  const headerValue = req.headers['x-gemini-api-key']
  const fromHeader = (Array.isArray(headerValue) ? headerValue[0] : headerValue)?.trim()

  if (fromHeader) return fromHeader
  return env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'mock' ? env.GEMINI_API_KEY : ''
}

export const aiController = {
  async analyzeImage(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' })
    }

    const { imageBase64, mimeType, fileName } = normalizeImagePayload(req.body)

    try {
      const result = await aiService.analyzeImage({
        userId: req.user.id,
        imageBase64,
        mimeType,
        fileName,
        geminiApiKey: getGeminiApiKey(req)
      })

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'IMAGE_ANALYSIS_SUCCESS',
        metadata: {
          analysisId: result.id ?? null,
          verdict: result.verdict,
          scoreIa: result.scoreIa,
          durationMs: result.durationMs
        }
      })

      return res.json(result)
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'IMAGE_ANALYSIS_FAILED',
        metadata: { reason: error?.message }
      })

      if (error instanceof AnalysisValidationError) {
        return res.status(400).json({ error: error.message })
      }

      console.error('Erro ao analisar imagem:', { message: error?.message })
      return res.status(502).json({
        error: error?.message || 'Erro ao analisar imagem.'
      })
    }
  },

  async listAnalyses(req: Request, res: Response) {
    try {
      const data = await analysisHistoryService.list(req.user!.id, req.query as Record<string, unknown>)
      return res.json(data)
    } catch (error: any) {
      console.error('Erro ao listar análises:', { message: error?.message })
      return res.status(500).json({ error: 'Erro ao carregar o histórico de análises.' })
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const stats = await analysisHistoryService.stats(req.user!.id)
      return res.json(stats)
    } catch (error: any) {
      console.error('Erro ao calcular estatísticas:', { message: error?.message })
      return res.status(500).json({ error: 'Erro ao carregar as estatísticas.' })
    }
  },

  async getAnalysis(req: Request, res: Response) {
    try {
      const item = await analysisHistoryService.getById(req.user!.id, String(req.params.id))
      if (!item) return res.status(404).json({ error: 'Análise não encontrada.' })
      return res.json(item)
    } catch (error: any) {
      console.error('Erro ao buscar análise:', { message: error?.message })
      return res.status(500).json({ error: 'Erro ao buscar a análise.' })
    }
  },

  async deleteAnalysis(req: Request, res: Response) {
    try {
      const removed = await analysisHistoryService.remove(req.user!.id, String(req.params.id))
      if (!removed) return res.status(404).json({ error: 'Análise não encontrada.' })

      await logService.write(req, {
        userId: req.user!.id,
        email: req.user!.email,
        action: 'IMAGE_ANALYSIS_DELETED',
        metadata: { analysisId: req.params.id }
      })

      return res.status(204).send()
    } catch (error: any) {
      console.error('Erro ao excluir análise:', { message: error?.message })
      return res.status(500).json({ error: 'Erro ao excluir a análise.' })
    }
  }
}
