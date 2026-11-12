export type AnalysisVerdict = 'AI_GENERATED' | 'REAL' | 'EDITED' | 'INCONCLUSIVE'

export type AnalysisConfidence = 'BAIXA' | 'MEDIA' | 'ALTA'

export type IndicatorCategory =
  | 'ANATOMIA'
  | 'ILUMINACAO'
  | 'TEXTURA'
  | 'ARTEFATOS'
  | 'PADROES'
  | 'TEXTO'
  | 'GEOMETRIA'
  | 'METADADOS'
  | 'EDICAO'
  | 'OUTRO'

export type IndicatorDirection = 'IA' | 'REAL' | 'EDICAO'

export type IndicatorWeight = 'BAIXO' | 'MEDIO' | 'ALTO'

export interface AnalysisIndicator {
  category: IndicatorCategory
  direction: IndicatorDirection
  weight: IndicatorWeight
  description: string
}

export interface ImageMetadataSummary {
  format: string
  width: number | null
  height: number | null
  hasExif: boolean
  cameraMake: string | null
  cameraModel: string | null
  software: string | null
  captureDate: string | null
  hasContentCredentials: boolean
  aiGeneratorHint: string | null
  editingSoftwareHint: string | null
}

export interface DetectorResult {
  provider: string
  scoreIa: number
  topGenerator: string | null
}

export interface AIAnalysisResult {
  id?: string
  provider: string
  model: string
  verdict: AnalysisVerdict
  confidence: AnalysisConfidence
  scoreIa: number
  scoreReal: number
  scoreEdicao: number
  visualScoreIa: number
  detector: DetectorResult | null
  isAIGenerated: boolean
  summary: string
  reasons: string[]
  indicators: AnalysisIndicator[]
  metadata: ImageMetadataSummary
  durationMs: number
  analyzedAt: string
}

export interface GeminiResponse {
  scoreIa?: unknown
  scoreReal?: unknown
  scoreEdicao?: unknown
  confidence?: unknown
  summary?: unknown
  indicators?: unknown
  reasons?: unknown
}

export interface AnalyzeImageInput {
  userId: string
  imageBase64: string
  mimeType: string
  fileName?: string | null
  geminiApiKey: string
}

export interface AnalysisHistoryItem extends AIAnalysisResult {
  id: string
  fileName: string | null
  mimeType: string
  sizeBytes: number
  imageHash: string
}

export interface CreateAnalysisRecord {
  userId: string
  fileName: string | null
  mimeType: string
  sizeBytes: number
  imageHash: string
  result: AIAnalysisResult
}

export interface ListAnalysesParams {
  page: number
  limit: number
  verdict?: AnalysisVerdict
}

export interface PaginatedAnalyses {
  items: AnalysisHistoryItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DailyAnalysisCount {
  date: string
  total: number
  aiGenerated: number
  real: number
  edited: number
  inconclusive: number
}

export interface AnalysisStats {
  total: number
  byVerdict: Record<AnalysisVerdict, number>
  averageScoreIa: number
  lastAnalysisAt: string | null
  daily: DailyAnalysisCount[]
}
