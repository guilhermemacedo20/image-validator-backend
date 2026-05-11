import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const modelType = process.env.GEMINI_MODEL

if (!apiKey) {
  throw new Error('GEMINI_API_KEY não configurada')
}

const genAI = new GoogleGenerativeAI(apiKey)

export const aiService = {
  async analyzeImage(
    buffer: Buffer,
    mimeType: any,
    userId: string
  ): Promise<AIAnalysisResult> {
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    
    const model =
      genAI.getGenerativeModel({
        model: modelType || 'gemini-1.5-flash'
      })

    const prompt = `
    Analise a imagem e responda APENAS em JSON:

    {
      "score": number (0 a 100),
      "isAIGenerated": boolean,
      "reasons": string[]
    }

    Critérios:
    - anatomia
    - iluminação
    - textura
    - artefatos
    - padrões repetitivos
    `

    const result =
      await model.generateContent([
        prompt,

        {
          inlineData: {
            mimeType,

            data:
              buffer.toString(
                'base64'
              )
          }
        }
      ])

    const text =
      result.response.text()

    let parsed: GeminiResponse

    try {

      parsed = JSON.parse(
        text
      ) as GeminiResponse

    } catch {

      parsed = {
        score: 50,

        isAIGenerated: false,

        reasons: [
          'Erro ao interpretar resposta do Gemini'
        ]
      }
    }

    return {
      provider: 'gemini',
      ...parsed
    }
  },

  mockGemini(buffer: Buffer): GeminiResponse {
    const size = buffer.length

    if (size % 2 === 0) {
      return {
        score: 80,

        isAIGenerated: true,

        reasons: ['Padrões repetitivos detectados', 'Textura inconsistente']
      }
    }

    return {
      score: 30,

      isAIGenerated: false,

      reasons: ['Imagem com características naturais']
    }
  }
}
