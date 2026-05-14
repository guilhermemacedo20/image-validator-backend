import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    first_name: {
      type: String,
      default: null
    },

    last_name: {
      type: String,
      default: null
    },

    two_factor_enabled: {
      type: Boolean,
      default: false
    },

    two_factor_secret: {
      type: String,
      default: null
    },

    failed_login_attempts: {
      type: Number,
      default: 0
    },

    locked_until: {
      type: Date,
      default: null
    },

    last_login_at: {
      type: Date,
      default: null
    },

    reset_token: {
      type: String,
      default: null
    },

    reset_token_expires: {
      type: Number,
      default: null
    },

    consent: {
      type: Boolean,
      default: false
    },

    consent_date: {
      type: String,
      default: null
    },

    consent_version: {
      type: String,
      default: null
    }
  },

  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId
}

export const UserModel =
  mongoose.models.User || mongoose.model('User', userSchema)
