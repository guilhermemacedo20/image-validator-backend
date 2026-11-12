import { createHash } from 'node:crypto'

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  normalizeAnalysis,
  parseModelJson
} from '../../domain/policies/ai.policies.js'
import type {
  AIAnalysisResult,
  AnalyzeImageInput,
  DetectorResult
} from '../../domain/types/ai.types.js'
import { geminiImageClient } from '../../infrastructure/ai/gemini.client.js'
import { getGeminiErrorMessage } from '../../infrastructure/ai/geminiErrors.js'
import { sightengineClient } from '../../infrastructure/ai/sightengine.client.js'
import {
  detectImageFormat,
  extractImageMetadata
} from '../../infrastructure/ai/imageMetadata.js'
import { analysisRepository } from '../../infrastructure/persistence/analysis/analysis.repository.js'
import { buildImageAnalysisPrompt } from './prompts/imageAnalysis.prompt.js'

export class AnalysisValidationError extends Error {}

const FORMAT_TO_MIME: Record<string, string> = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  HEIC: 'image/heic'
}

function sanitizeBase64(imageBase64: string): string {
  return imageBase64.replace(/^data:.+;base64,/, '').trim()
}

function sanitizeFileName(fileName?: string | null): string | null {
  if (!fileName) return null
  const base = String(fileName).split(/[\\/]/).pop() ?? ''
  const clean = base.replace(/[\u0000-\u001f]/g, '').trim()
  return clean ? clean.slice(0, 120) : null
}

async function runDetector(
  buffer: Buffer,
  mimeType: string
): Promise<DetectorResult | null> {
  if (!sightengineClient.isConfigured()) return null

  try {
    const detection = await sightengineClient.detect(buffer, mimeType)
    return { provider: sightengineClient.providerName, ...detection }
  } catch (error: any) {
    console.error('Falha no Sightengine, seguindo só com o Gemini:', {
      message: error?.message
    })
    return null
  }
}

export const aiService = {
  async analyzeImage(input: AnalyzeImageInput): Promise<AIAnalysisResult> {
    if (!input.geminiApiKey) {
      throw new AnalysisValidationError(
        'API Key do Gemini não encontrada. Informe uma chave válida para continuar.'
      )
    }

    const base64 = sanitizeBase64(input.imageBase64 || '')
    if (!base64) throw new AnalysisValidationError('Imagem não enviada.')

    const buffer = Buffer.from(base64, 'base64')
    if (buffer.length === 0)
      throw new AnalysisValidationError('Imagem inválida.')
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new AnalysisValidationError('A imagem excede o limite de 7 MB.')
    }

    const detectedMime = FORMAT_TO_MIME[detectImageFormat(buffer)]
    if (!detectedMime) {
      throw new AnalysisValidationError(
        'Formato não suportado. Envie PNG, JPG, WEBP ou HEIC.'
      )
    }
    const declaredMime = (input.mimeType || '').toLowerCase()
    const mimeType = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
      declaredMime
    )
      ? declaredMime
      : detectedMime

    const metadata = extractImageMetadata(buffer)
    const prompt = buildImageAnalysisPrompt(metadata)
    const startedAt = Date.now()

    const detectorPromise = runDetector(buffer, mimeType)

    let rawText: string
    try {
      rawText = await geminiImageClient.generate({
        apiKey: input.geminiApiKey,
        prompt,
        imageBase64: base64,
        mimeType
      })
    } catch (error: any) {
      console.error('Erro Gemini:', { message: error?.message })
      throw new Error(getGeminiErrorMessage(error))
    }

    const raw = parseModelJson(rawText)
    if (!raw) {
      throw new Error(
        'Não foi possível interpretar a resposta da IA. Tente novamente.'
      )
    }

    const detector = await detectorPromise

    const result = normalizeAnalysis(
      raw,
      metadata,
      {
        provider: detector ? 'sightengine+gemini' : 'gemini',
        model: geminiImageClient.modelName,
        durationMs: Date.now() - startedAt,
        analyzedAt: new Date()
      },
      detector
    )

    if (analysisRepository.isAvailable()) {
      try {
        const saved = await analysisRepository.create({
          userId: input.userId,
          fileName: sanitizeFileName(input.fileName),
          mimeType,
          sizeBytes: buffer.length,
          imageHash: createHash('sha256').update(buffer).digest('hex'),
          result
        })
        result.id = saved.id
      } catch (error: any) {
        console.error('Falha ao salvar histórico de análise:', {
          message: error?.message
        })
      }
    }

    return result
  }
}
