import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const auditLogSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    email: {
      type: String,
      default: null
    },

    action: {
      type: String,
      required: true
    },

    ip: {
      type: String,
      default: null
    },

    user_agent: {
      type: String,
      default: null
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null
    }
  },

  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false
    }
  }
)

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId
}

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
