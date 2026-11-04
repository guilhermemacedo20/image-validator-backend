import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const indicatorSchema = new Schema(
  {
    category: { type: String, required: true },
    direction: { type: String, required: true },
    weight: { type: String, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
)

const analysisSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    file_name: { type: String, default: null },
    mime_type: { type: String, required: true },
    size_bytes: { type: Number, required: true },
    image_hash: { type: String, required: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    verdict: {
      type: String,
      enum: ['AI_GENERATED', 'REAL', 'EDITED', 'INCONCLUSIVE'],
      required: true
    },
    confidence: { type: String, enum: ['BAIXA', 'MEDIA', 'ALTA'], required: true },
    score_ia: { type: Number, required: true },
    score_real: { type: Number, required: true },
    score_edicao: { type: Number, required: true },
    summary: { type: String, default: '' },
    indicators: { type: [indicatorSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: null },
    duration_ms: { type: Number, default: 0 }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false
    }
  }
)

analysisSchema.index({ user_id: 1, created_at: -1 })
analysisSchema.index({ user_id: 1, verdict: 1, created_at: -1 })

export type AnalysisDocument = InferSchemaType<typeof analysisSchema> & {
  _id: mongoose.Types.ObjectId
  created_at: Date
}

export const AnalysisModel =
  mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema)
