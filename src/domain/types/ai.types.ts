export interface AIAnalysisResult {
  provider: string
  scoreIa: number
  scoreReal: number
  isAIGenerated: boolean
  reasons: string[]
}

export interface GeminiResponse {
  scoreIa: number
  scoreReal: number
  isAIGenerated: boolean
  reasons: string[]
}
