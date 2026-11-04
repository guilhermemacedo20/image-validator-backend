import mongoose from 'mongoose'

import type {
  AnalysisHistoryItem,
  AnalysisVerdict,
  CreateAnalysisRecord,
  DailyAnalysisCount,
  ImageMetadataSummary,
  ListAnalysesParams,
  PaginatedAnalyses
} from '../../../domain/types/ai.types.js'
import { AnalysisModel } from './analysis.model.js'

function toHistoryItem(doc: any): AnalysisHistoryItem {
  const createdAt = doc.created_at ? new Date(doc.created_at).toISOString() : ''
  const verdict = doc.verdict as AnalysisVerdict
  const indicators = Array.isArray(doc.indicators) ? doc.indicators : []

  return {
    id: String(doc._id),
    provider: doc.provider,
    model: doc.model,
    verdict,
    confidence: doc.confidence,
    scoreIa: doc.score_ia,
    scoreReal: doc.score_real,
    scoreEdicao: doc.score_edicao,
    isAIGenerated: verdict === 'AI_GENERATED',
    summary: doc.summary ?? '',
    reasons: indicators.map((i: any) => i.description),
    indicators: indicators.map((i: any) => ({
      category: i.category,
      direction: i.direction,
      weight: i.weight,
      description: i.description
    })),
    metadata: (doc.metadata ?? null) as ImageMetadataSummary,
    durationMs: doc.duration_ms ?? 0,
    analyzedAt: createdAt,
    fileName: doc.file_name ?? null,
    mimeType: doc.mime_type,
    sizeBytes: doc.size_bytes,
    imageHash: doc.image_hash
  }
}

function userObjectId(userId: string): mongoose.Types.ObjectId | null {
  return mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null
}

export const analysisRepository = {
  isAvailable(): boolean {
    return mongoose.connection.readyState === 1
  },

  async create({
    userId,
    fileName,
    mimeType,
    sizeBytes,
    imageHash,
    result
  }: CreateAnalysisRecord): Promise<AnalysisHistoryItem> {
    const doc = await AnalysisModel.create({
      user_id: userId,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      image_hash: imageHash,
      provider: result.provider,
      model: result.model,
      verdict: result.verdict,
      confidence: result.confidence,
      score_ia: result.scoreIa,
      score_real: result.scoreReal,
      score_edicao: result.scoreEdicao,
      summary: result.summary,
      indicators: result.indicators,
      metadata: result.metadata,
      duration_ms: result.durationMs
    })

    return toHistoryItem(doc.toObject())
  },

  async listByUser(
    userId: string,
    { page, limit, verdict }: ListAnalysesParams
  ): Promise<PaginatedAnalyses> {
    const userOid = userObjectId(userId)
    if (!userOid) return { items: [], page, limit, total: 0, totalPages: 0 }

    const filter: Record<string, unknown> = { user_id: userOid }
    if (verdict) filter.verdict = verdict

    const [docs, total] = await Promise.all([
      AnalysisModel.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AnalysisModel.countDocuments(filter)
    ])

    return {
      items: docs.map(toHistoryItem),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  },

  async findByIdForUser(userId: string, id: string): Promise<AnalysisHistoryItem | null> {
    const userOid = userObjectId(userId)
    if (!userOid || !mongoose.isValidObjectId(id)) return null

    const doc = await AnalysisModel.findOne({ _id: id, user_id: userOid }).lean()
    return doc ? toHistoryItem(doc) : null
  },

  async findAllByUser(userId: string): Promise<AnalysisHistoryItem[]> {
    const userOid = userObjectId(userId)
    if (!userOid) return []
    const docs = await AnalysisModel.find({ user_id: userOid }).sort({ created_at: -1 }).lean()
    return docs.map(toHistoryItem)
  },

  async deleteByIdForUser(userId: string, id: string): Promise<boolean> {
    const userOid = userObjectId(userId)
    if (!userOid || !mongoose.isValidObjectId(id)) return false

    const result = await AnalysisModel.deleteOne({ _id: id, user_id: userOid })
    return result.deletedCount > 0
  },

  async deleteAllByUser(userId: string): Promise<number> {
    const userOid = userObjectId(userId)
    if (!userOid) return 0
    const result = await AnalysisModel.deleteMany({ user_id: userOid })
    return result.deletedCount
  },

  async aggregateStats(
    userId: string,
    since: Date,
    timeZone: string
  ): Promise<{
    total: number
    byVerdict: Partial<Record<AnalysisVerdict, number>>
    averageScoreIa: number
    lastAnalysisAt: string | null
    daily: DailyAnalysisCount[]
  }> {
    const userOid = userObjectId(userId)
    const empty = { total: 0, byVerdict: {}, averageScoreIa: 0, lastAnalysisAt: null, daily: [] }
    if (!userOid) return empty

    const countIf = (verdict: AnalysisVerdict) => ({
      $sum: { $cond: [{ $eq: ['$verdict', verdict] }, 1, 0] }
    })

    const [result] = await AnalysisModel.aggregate([
      { $match: { user_id: userOid } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                averageScoreIa: { $avg: '$score_ia' },
                lastAnalysisAt: { $max: '$created_at' }
              }
            }
          ],
          byVerdict: [{ $group: { _id: '$verdict', count: { $sum: 1 } } }],
          daily: [
            { $match: { created_at: { $gte: since } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$created_at', timezone: timeZone }
                },
                total: { $sum: 1 },
                aiGenerated: countIf('AI_GENERATED'),
                real: countIf('REAL'),
                edited: countIf('EDITED'),
                inconclusive: countIf('INCONCLUSIVE')
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ])

    if (!result) return empty

    const totals = result.totals[0]
    const byVerdict: Partial<Record<AnalysisVerdict, number>> = {}
    for (const row of result.byVerdict) byVerdict[row._id as AnalysisVerdict] = row.count

    return {
      total: totals?.total ?? 0,
      byVerdict,
      averageScoreIa: Math.round(totals?.averageScoreIa ?? 0),
      lastAnalysisAt: totals?.lastAnalysisAt
        ? new Date(totals.lastAnalysisAt).toISOString()
        : null,
      daily: result.daily.map((d: any) => ({
        date: d._id,
        total: d.total,
        aiGenerated: d.aiGenerated,
        real: d.real,
        edited: d.edited,
        inconclusive: d.inconclusive
      }))
    }
  }
}
