import { buildDailySeries } from '../../domain/policies/ai.policies.js'
import type {
  AnalysisHistoryItem,
  AnalysisStats,
  AnalysisVerdict,
  PaginatedAnalyses
} from '../../domain/types/ai.types.js'
import { env } from '../../infrastructure/config/env.js'
import { analysisRepository } from '../../infrastructure/persistence/analysis/analysis.repository.js'

const VERDICTS: AnalysisVerdict[] = [
  'AI_GENERATED',
  'REAL',
  'EDITED',
  'INCONCLUSIVE'
]
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
const STATS_DAYS = 14

export function parseListQuery(query: Record<string, unknown>): {
  page: number
  limit: number
  verdict?: AnalysisVerdict
} {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(Number(query.limit)) || DEFAULT_LIMIT)
  )
  const verdictParam =
    typeof query.verdict === 'string' ? query.verdict.toUpperCase() : ''
  const verdict = VERDICTS.includes(verdictParam as AnalysisVerdict)
    ? (verdictParam as AnalysisVerdict)
    : undefined

  return { page, limit, verdict }
}

export const analysisHistoryService = {
  async list(
    userId: string,
    query: Record<string, unknown>
  ): Promise<PaginatedAnalyses> {
    return analysisRepository.listByUser(userId, parseListQuery(query))
  },

  async getById(
    userId: string,
    id: string
  ): Promise<AnalysisHistoryItem | null> {
    return analysisRepository.findByIdForUser(userId, id)
  },

  async remove(userId: string, id: string): Promise<boolean> {
    return analysisRepository.deleteByIdForUser(userId, id)
  },

  async removeAll(userId: string): Promise<number> {
    return analysisRepository.deleteAllByUser(userId)
  },

  async exportAll(userId: string): Promise<AnalysisHistoryItem[]> {
    return analysisRepository.findAllByUser(userId)
  },

  async stats(userId: string, now = new Date()): Promise<AnalysisStats> {
    const since = new Date(now.getTime() - STATS_DAYS * 24 * 60 * 60 * 1000)
    const raw = await analysisRepository.aggregateStats(
      userId,
      since,
      'America/Sao_Paulo'
    )

    const byVerdict = Object.fromEntries(
      VERDICTS.map((v) => [v, raw.byVerdict[v] ?? 0])
    ) as Record<AnalysisVerdict, number>

    return {
      total: raw.total,
      byVerdict,
      averageScoreIa: raw.averageScoreIa,
      lastAnalysisAt: raw.lastAnalysisAt,
      daily: buildDailySeries(raw.daily, STATS_DAYS, now, 'America/Sao_Paulo')
    }
  }
}
