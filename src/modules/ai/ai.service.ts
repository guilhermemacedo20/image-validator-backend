import { GoogleGenerativeAI } from '@google/generative-ai'

import { env } from '../../config/env.js'
import { getGeminiErrorMessage } from '../../shared/utils/geminiErrors.js'

// função para sanitizar a string base64, removendo o prefixo data URL se presente.
function sanitizeBase64(imageBase64: string): string {
  return imageBase64.replace(/^data:.+;base64,/, '').trim()
}

// serviço para análise de imagens usando a API do Gemini.
export const aiService = {
  async analyzeImage(
    imageBase64: string,
    mimeType: string,
    geminiApiKey: string
  ): Promise<AIAnalysisResult> {
    if (!geminiApiKey) {
      throw new Error('API Key do Gemini não encontrada. Informe uma chave válida para continuar.')
    }

    if (!imageBase64) {
      throw new Error('Imagem não enviada.')
    }

    if (!mimeType) {
      throw new Error('Tipo da imagem não informado.')
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)

      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })

      const prompt = `
        Analise a imagem e responda SOMENTE com JSON puro.

        Responda o score de acordo com a confiabilidade de que a imagem pode ter sido gerada por IA ou ser real.
        Além disso, valide a possibilidade de ser uma edição de imagem feita por humano.
        As razões devem considerar se foi gerada por IA, se é real ou se há indícios de edição humana.

        {
          "scoreIa": number,
          "scoreReal": number,
          "isAIGenerated": boolean,
          "reasons": string[]
        }

        Critérios:
        - anatomia
        - iluminação
        - textura
        - artefatos
        - padrões repetitivos
        - inconsistências visuais
        - sinais de edição humana
      `

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: sanitizeBase64(imageBase64)
          }
        }
      ])

      const text = result.response.text()

      let parsed: GeminiResponse

      try {
        parsed = JSON.parse(text) as GeminiResponse
      } catch {
        parsed = {
          scoreIa: 0,
          scoreReal: 0,
          isAIGenerated: false,
          reasons: ['Erro ao interpretar resposta do Gemini']
        }
      }

      return {
        provider: 'gemini',
        ...parsed
      }
    } catch (error: any) {
      console.error('Erro Gemini:', {
        message: error
      })

      throw new Error(getGeminiErrorMessage(error))
    }
  }
}
