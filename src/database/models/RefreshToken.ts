import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const refreshTokenSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    token: {
      type: String,
      required: true,
      unique: true
    },

    expires_at: {
      type: Date,
      required: true
    },

    revoked: {
      type: Boolean,
      default: false
    }
  },

  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false
    }
  }
)

export type RefreshTokenDocument = InferSchemaType<
  typeof refreshTokenSchema
> & {
  _id: mongoose.Types.ObjectId
}

export const RefreshTokenModel =
  mongoose.models.RefreshToken ||
  mongoose.model('RefreshToken', refreshTokenSchema)
