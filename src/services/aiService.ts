import { GoogleGenerativeAI } from '@google/generative-ai'

const modelType = process.env.GEMINI_MODEL

export const aiService = {
  async analyzeImage(
    buffer: Buffer,
    mimeType: string,
    userId: string,
    geminiApiKey: string
  ): Promise<AIAnalysisResult> {
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    if (!geminiApiKey) {
      throw new Error('API Key do Gemini não enviada')
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)

      const model = genAI.getGenerativeModel({
        model: modelType || 'gemini-flash-latest',

        generationConfig: {
          responseMimeType: 'application/json'
        }
      })

      const prompt = `
        Analise a imagem e responda SOMENTE com JSON puro.
        Respondendo o score de acordo com a confiabilidade de que a imagem pode ter sido gerada por IA ou ser real, além disso valide a possibilidade de ser uma edição de imagem feita por humano e as razões devem considerar se foi gerada por IA ou não.

        {
          "scoreIa": number (0 a 100),
          "scoreReal": number (0 a 100),
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

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: buffer.toString('base64')
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
      console.error('Erro Gemini:', error)

      const errorMessage = error?.message || ''

      if (
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('API key not valid')
      ) {
        throw new Error('API Key do Gemini inválida ou não encontrada')
      }

      if (errorMessage.includes('quota')) {
        throw new Error('Limite de uso da API Gemini excedido')
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Muitas requisições para o Gemini. Tente novamente em instantes'
        )
      }

      if (errorMessage.includes('404')) {
        throw new Error('Modelo Gemini não encontrado ou indisponível')
      }

      throw new Error('Erro ao comunicar com a API do Gemini')
    }
  }
}
