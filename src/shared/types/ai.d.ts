interface AIAnalysisResult {
  provider: string
  scoreIa: number
  scoreReal: number
  isAIGenerated: boolean
  reasons: string[]
}

interface GeminiResponse {
  scoreIa: number
  scoreReal: number
  isAIGenerated: boolean
  reasons: string[]
}