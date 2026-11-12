import { env } from '../config/env.js'

const ENDPOINT = 'https://api.sightengine.com/1.0/check.json'
const TIMEOUT_MS = 15000
const GENERATOR_MIN_SCORE = 0.5

const GENERATOR_NAMES: Record<string, string> = {
  dalle: 'DALL·E',
  gpt: 'ChatGPT (GPT-Image)',
  midjourney: 'Midjourney',
  stable_diffusion: 'Stable Diffusion',
  flux: 'FLUX',
  firefly: 'Adobe Firefly',
  imagen: 'Google Imagen / Gemini',
  ideogram: 'Ideogram',
  grok: 'Grok',
  recraft: 'Recraft',
  reve: 'Reve',
  seedream: 'Seedream',
  qwen: 'Qwen',
  hunyuan: 'Hunyuan',
  kling: 'Kling',
  krea: 'Krea',
  gan: 'GAN',
  other: 'outro gerador'
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif'
}

export interface SightengineDetection {
  scoreIa: number
  topGenerator: string | null
}

function pickTopGenerator(generators: unknown): string | null {
  if (!generators || typeof generators !== 'object') return null

  let top: string | null = null
  let topScore = 0
  for (const [key, value] of Object.entries(generators as Record<string, unknown>)) {
    const score = Number(value)
    if (Number.isFinite(score) && score > topScore) {
      top = key
      topScore = score
    }
  }

  if (!top || topScore < GENERATOR_MIN_SCORE) return null
  return GENERATOR_NAMES[top] ?? top
}

export const sightengineClient = {
  providerName: 'Sightengine',

  isConfigured(): boolean {
    return Boolean(env.SIGHTENGINE_API_USER && env.SIGHTENGINE_API_SECRET)
  },

  async detect(buffer: Buffer, mimeType: string): Promise<SightengineDetection> {
    const form = new FormData()
    form.append(
      'media',
      new Blob([new Uint8Array(buffer)], { type: mimeType }),
      `image.${EXTENSIONS[mimeType] ?? 'jpg'}`
    )
    form.append('models', 'genai')
    form.append('api_user', env.SIGHTENGINE_API_USER)
    form.append('api_secret', env.SIGHTENGINE_API_SECRET)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        body: form,
        signal: controller.signal
      })
      const data: any = await response.json().catch(() => null)

      if (!response.ok || data?.status !== 'success') {
        throw new Error(
          data?.error?.message || `Sightengine respondeu com status ${response.status}`
        )
      }

      const score = Number(data?.type?.ai_generated)
      if (!Number.isFinite(score)) {
        throw new Error('Resposta do Sightengine sem pontuação de IA.')
      }

      return {
        scoreIa: Math.round(Math.min(1, Math.max(0, score)) * 100),
        topGenerator: pickTopGenerator(data?.type?.ai_generators)
      }
    } finally {
      clearTimeout(timer)
    }
  }
}
