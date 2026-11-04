import type {
  AIAnalysisResult,
  AnalysisConfidence,
  AnalysisIndicator,
  AnalysisVerdict,
  DailyAnalysisCount,
  GeminiResponse,
  ImageMetadataSummary,
  IndicatorCategory,
  IndicatorDirection,
  IndicatorWeight
} from '../types/ai.types.js'

export const VERDICT_THRESHOLDS = {
  AI_MIN: 65,
  REAL_MAX: 35,
  EDIT_MIN: 60
} as const

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
] as const

export const MAX_IMAGE_BYTES = 7 * 1024 * 1024

const CATEGORIES: IndicatorCategory[] = [
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
]
const DIRECTIONS: IndicatorDirection[] = ['IA', 'REAL', 'EDICAO']
const WEIGHTS: IndicatorWeight[] = ['BAIXO', 'MEDIO', 'ALTO']
const CONFIDENCES: AnalysisConfidence[] = ['BAIXA', 'MEDIA', 'ALTA']

const MAX_INDICATORS = 8
const MAX_TEXT = 280

const AI_GENERATOR_PATTERNS: Array<[RegExp, string]> = [
  [/midjourney/i, 'Midjourney'],
  [/dall[\s·-]?e|openai/i, 'DALL·E / OpenAI'],
  [
    /stable[\s-]?diffusion|automatic1111|comfyui|invokeai|fooocus/i,
    'Stable Diffusion'
  ],
  [/firefly/i, 'Adobe Firefly'],
  [/gemini|google imagen/i, 'Google Gemini / Imagen'],
  [/leonardo\.?ai/i, 'Leonardo.Ai'],
  [/ideogram/i, 'Ideogram'],
  [/\bflux\b/i, 'FLUX'],
  [/bing image creator/i, 'Bing Image Creator']
]

const EDITING_SOFTWARE_PATTERNS: Array<[RegExp, string]> = [
  [/photoshop/i, 'Adobe Photoshop'],
  [/lightroom/i, 'Adobe Lightroom'],
  [/gimp/i, 'GIMP'],
  [/snapseed/i, 'Snapseed'],
  [/canva/i, 'Canva'],
  [/picsart/i, 'PicsArt'],
  [/affinity/i, 'Affinity Photo'],
  [/pixelmator/i, 'Pixelmator'],
  [/facetune/i, 'Facetune']
]

export function clampScore(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  const scaled = n > 0 && n <= 1 && !Number.isInteger(n) ? n * 100 : n
  return Math.round(Math.min(100, Math.max(0, scaled)))
}

export function detectAiGenerator(
  text: string | null | undefined
): string | null {
  if (!text) return null
  const match = AI_GENERATOR_PATTERNS.find(([re]) => re.test(text))
  return match ? match[1] : null
}

export function detectEditingSoftware(
  text: string | null | undefined
): string | null {
  if (!text) return null
  const match = EDITING_SOFTWARE_PATTERNS.find(([re]) => re.test(text))
  return match ? match[1] : null
}

export function decideVerdict(
  scoreIa: number,
  scoreEdicao: number
): AnalysisVerdict {
  if (scoreIa >= VERDICT_THRESHOLDS.AI_MIN) return 'AI_GENERATED'
  if (scoreIa <= VERDICT_THRESHOLDS.REAL_MAX) {
    return scoreEdicao >= VERDICT_THRESHOLDS.EDIT_MIN ? 'EDITED' : 'REAL'
  }
  return 'INCONCLUSIVE'
}

export function deriveConfidence(scoreIa: number): AnalysisConfidence {
  const distance = Math.abs(scoreIa - 50)
  if (distance >= 35) return 'ALTA'
  if (distance >= 15) return 'MEDIA'
  return 'BAIXA'
}

function pickEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T
): T {
  if (typeof value !== 'string') return fallback
  const normalized = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
  return (allowed as string[]).includes(normalized)
    ? (normalized as T)
    : fallback
}

function cleanText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== 'string') return ''
  const text = value.replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function sanitizeIndicators(raw: unknown): AnalysisIndicator[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item): AnalysisIndicator | null => {
      if (typeof item === 'string') {
        const description = cleanText(item)
        return description
          ? { category: 'OUTRO', direction: 'IA', weight: 'MEDIO', description }
          : null
      }
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const description = cleanText(obj.description ?? obj.descricao)
      if (!description) return null
      return {
        category: pickEnum(obj.category ?? obj.categoria, CATEGORIES, 'OUTRO'),
        direction: pickEnum(obj.direction ?? obj.aponta_para, DIRECTIONS, 'IA'),
        weight: pickEnum(obj.weight ?? obj.peso, WEIGHTS, 'MEDIO'),
        description
      }
    })
    .filter((i): i is AnalysisIndicator => i !== null)
    .slice(0, MAX_INDICATORS)
}

const DEFAULT_SUMMARY: Record<AnalysisVerdict, string> = {
  AI_GENERATED:
    'A imagem apresenta sinais fortes de ter sido criada por inteligência artificial.',
  REAL: 'A imagem apresenta características compatíveis com uma foto real.',
  EDITED:
    'A imagem parece ser uma foto real, mas com sinais de edição ou montagem.',
  INCONCLUSIVE:
    'Não há evidências suficientes para afirmar se a imagem é real ou gerada por IA.'
}

export function normalizeAnalysis(
  raw: GeminiResponse,
  metadata: ImageMetadataSummary,
  context: {
    provider: string
    model: string
    durationMs: number
    analyzedAt: Date
  }
): AIAnalysisResult {
  let scoreIa = clampScore(raw.scoreIa)
  let scoreReal = clampScore(raw.scoreReal)

  if (scoreIa === null && scoreReal === null) {
    scoreIa = 50
    scoreReal = 50
  } else if (scoreIa === null) {
    scoreIa = 100 - (scoreReal as number)
  } else if (scoreReal === null) {
    scoreReal = 100 - scoreIa
  }

  const sum = (scoreIa as number) + (scoreReal as number)
  scoreIa = sum > 0 ? Math.round(((scoreIa as number) / sum) * 100) : 50
  scoreReal = 100 - scoreIa

  let scoreEdicao = clampScore(raw.scoreEdicao) ?? 0
  const indicators = sanitizeIndicators(raw.indicators ?? raw.reasons)

  if (metadata.aiGeneratorHint) {
    scoreIa = Math.max(scoreIa, 90)
    scoreReal = 100 - scoreIa
    indicators.unshift({
      category: 'METADADOS',
      direction: 'IA',
      weight: 'ALTO',
      description: `Os metadados do arquivo indicam geração por IA (${metadata.aiGeneratorHint}).`
    })
  }

  if (metadata.editingSoftwareHint) {
    scoreEdicao = Math.max(scoreEdicao, 40)
    indicators.push({
      category: 'METADADOS',
      direction: 'EDICAO',
      weight: 'BAIXO',
      description: `O arquivo foi salvo por um editor de imagens (${metadata.editingSoftwareHint}). Isso não prova manipulação, mas indica que houve edição.`
    })
  }

  const verdict = decideVerdict(scoreIa, scoreEdicao)
  const modelConfidence = pickEnum<AnalysisConfidence | ''>(
    raw.confidence,
    CONFIDENCES,
    ''
  )
  const derived = deriveConfidence(scoreIa)
  const confidence: AnalysisConfidence =
    modelConfidence &&
    CONFIDENCES.indexOf(modelConfidence) < CONFIDENCES.indexOf(derived)
      ? modelConfidence
      : derived

  const finalIndicators = indicators.slice(0, MAX_INDICATORS)

  return {
    provider: context.provider,
    model: context.model,
    verdict,
    confidence: verdict === 'INCONCLUSIVE' ? 'BAIXA' : confidence,
    scoreIa,
    scoreReal,
    scoreEdicao,
    isAIGenerated: verdict === 'AI_GENERATED',
    summary: cleanText(raw.summary, 400) || DEFAULT_SUMMARY[verdict],
    reasons: finalIndicators.map((i) => i.description),
    indicators: finalIndicators,
    metadata,
    durationMs: context.durationMs,
    analyzedAt: context.analyzedAt.toISOString()
  }
}

export function toDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function buildDailySeries(
  rows: DailyAnalysisCount[],
  days: number,
  today: Date,
  timeZone: string
): DailyAnalysisCount[] {
  const byDate = new Map(rows.map((r) => [r.date, r]))
  const series: DailyAnalysisCount[] = []

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const key = toDateKey(day, timeZone)
    series.push(
      byDate.get(key) ?? {
        date: key,
        total: 0,
        aiGenerated: 0,
        real: 0,
        edited: 0,
        inconclusive: 0
      }
    )
  }

  return series
}

export function parseModelJson(text: string): GeminiResponse | null {
  if (!text) return null
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()

  const tryParse = (value: string): GeminiResponse | null => {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as GeminiResponse)
        : null
    } catch {
      return null
    }
  }

  const direct = tryParse(cleaned)
  if (direct) return direct

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  return start >= 0 && end > start
    ? tryParse(cleaned.slice(start, end + 1))
    : null
}
