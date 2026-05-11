interface AIAnalysisResult {
  provider: string
  score: number
  isAIGenerated: boolean
  reasons: string[]
}

interface GeminiResponse {
  score: number
  isAIGenerated: boolean
  reasons: string[]
}