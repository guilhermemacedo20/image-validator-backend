import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema
} from '@google/generative-ai'

import { env } from '../config/env.js'

const enumOf = (values: string[], description: string): ResponseSchema => ({
  type: SchemaType.STRING,
  format: 'enum',
  enum: values,
  description
})

export const IMAGE_ANALYSIS_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scoreIa: {
      type: SchemaType.INTEGER,
      description: 'Probabilidade (0-100) de a imagem ter sido gerada por IA'
    },
    scoreReal: {
      type: SchemaType.INTEGER,
      description: 'Probabilidade (0-100) de ser uma captura real; soma 100 com scoreIa'
    },
    scoreEdicao: {
      type: SchemaType.INTEGER,
      description: 'Probabilidade (0-100) de edição ou montagem feita por pessoa'
    },
    confidence: enumOf(['BAIXA', 'MEDIA', 'ALTA'], 'Confiança geral da análise'),
    summary: {
      type: SchemaType.STRING,
      description: 'Resumo em 1 ou 2 frases simples, em português do Brasil'
    },
    indicators: {
      type: SchemaType.ARRAY,
      description: 'Evidências observadas, da mais forte para a mais fraca',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: enumOf(
            [
              'ANATOMIA',
              'ILUMINACAO',
              'TEXTURA',
              'ARTEFATOS',
              'PADROES',
              'TEXTO',
              'GEOMETRIA',
              'METADADOS',
              'EDICAO',
              'OUTRO'
            ],
            'Categoria da evidência'
          ),
          direction: enumOf(['IA', 'REAL', 'EDICAO'], 'Para qual conclusão a evidência aponta'),
          weight: enumOf(['BAIXO', 'MEDIO', 'ALTO'], 'Força da evidência'),
          description: {
            type: SchemaType.STRING,
            description: 'O que foi visto e onde, em uma frase'
          }
        },
        required: ['category', 'direction', 'weight', 'description']
      }
    }
  },
  required: ['scoreIa', 'scoreReal', 'scoreEdicao', 'confidence', 'summary', 'indicators']
}

export interface GeminiImageRequest {
  apiKey: string
  prompt: string
  imageBase64: string
  mimeType: string
}

export const geminiImageClient = {
  get modelName(): string {
    return env.GEMINI_MODEL
  },

  async generate({ apiKey, prompt, imageBase64, mimeType }: GeminiImageRequest): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: IMAGE_ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.2
      }
    })

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } }
    ])

    return result.response.text()
  }
}
