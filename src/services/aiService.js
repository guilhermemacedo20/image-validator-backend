import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const aiService = {
  async analyzeImage(buffer, mimeType, userId) {
    if (!userId) {
      throw new Error("Usuário não autenticado")
    }

    const mock = this.mockGemini(buffer)

    return {
      provider: "gemini-mock",
      ...mock,
    }

    /*
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: buffer.toString("base64"),
        },
      },
    ])

    const text = result.response.text()

    let parsed

    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = {
        score: 50,
        isAIGenerated: false,
        reasons: ["Erro ao interpretar resposta do Gemini"],
      }
    }

    return {
      provider: "gemini",
      ...parsed,
    }
    */
  },

  mockGemini(buffer) {
    const size = buffer.length

    if (size % 2 === 0) {
      return {
        score: 80,
        isAIGenerated: true,
        reasons: [
          "Padrões repetitivos detectados",
          "Textura inconsistente",
        ],
      }
    }

    return {
      score: 30,
      isAIGenerated: false,
      reasons: ["Imagem com características naturais"],
    }
  },
}