import mongoose, { Schema, type InferSchemaType } from 'mongoose'

// definição do esquema para a blacklist de tokens de acesso no banco de dados.
const tokenBlacklistSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },

    expires_at: {
      type: Date,
      required: true
    }
  },

  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false
    }
  }
)

export type TokenBlacklistDocument = InferSchemaType<
  typeof tokenBlacklistSchema
> & {
  _id: mongoose.Types.ObjectId
}

export const TokenBlacklistModel =
  mongoose.models.TokenBlacklist ||
  mongoose.model('TokenBlacklist', tokenBlacklistSchema)
