import { UserModel } from '../database/models/User.js'
import { normalizeMongoDocument } from '../utils/normalizaMongo.js'

export const userRepository = {
  async create({
    email,
    password,
    firstName = null,
    lastName = null,
    phone = null,
    address = null,
    consent = false,
    consentDate = null,
    consentVersion = null
  }: CreateUserParams): Promise<Pick<User, 'id' | 'email'>> {
    const user = await UserModel.create({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      address,
      consent,
      consent_date: consentDate,
      consent_version: consentVersion
    })

    return {
      id: String(user._id),
      email: user.email
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({
      email: email.toLowerCase().trim()
    }).lean()

    return normalizeMongoDocument(user) as User | null
  },

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean()

    return normalizeMongoDocument(user) as User | null
  },

  async saveResetToken(
    userId: string,
    token: string,
    expires: number
  ): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      reset_token: token,
      reset_token_expires: expires
    })

    return true
  },

  async findByToken(token: string): Promise<User | null> {
    const user = await UserModel.findOne({
      reset_token: token
    }).lean()

    return normalizeMongoDocument(user) as User | null
  },

  async clearResetToken(userId: string): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      reset_token: null,
      reset_token_expires: null
    })

    return true
  },

  async updatePassword(
    userId: string,
    password: string
  ): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      password
    })

    return true
  },

  async updateProfile(
    userId: string,
    {
      firstName,
      lastName,
    }: UpdateProfileParams
  ): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      first_name: firstName,
      last_name: lastName
    })

    return true
  },

  async setTwoFactorSecret(
    userId: string,
    secret: string
  ): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      two_factor_secret: secret
    })

    return true
  },

  async enableTwoFactor(userId: string): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      two_factor_enabled: true
    })

    return true
  },

  async disableTwoFactor(userId: string): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      two_factor_enabled: false,
      two_factor_secret: null
    })

    return true
  },

  async updateConsent(
    userId: string,
    {
      consent,
      consentDate = null,
      consentVersion = null
    }: UpdateConsentParams
  ): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      consent,
      consent_date: consentDate,
      consent_version: consentVersion
    })

    return true
  },

  async deleteById(userId: string): Promise<boolean> {
    await UserModel.findByIdAndDelete(userId)

    return true
  },

  async registerFailedLogin(
    userId: string,
    lockMinutes = 15
  ): Promise<boolean> {
    const user = await UserModel.findById(userId)

    if (!user) return true

    const attempts =
      Number(user.failed_login_attempts || 0) + 1

    const update: {
      failed_login_attempts: number
      locked_until?: Date
    } = {
      failed_login_attempts: attempts
    }

    if (attempts >= 5) {
      update.locked_until = new Date(
        Date.now() + lockMinutes * 60 * 1000
      )
    }

    await UserModel.findByIdAndUpdate(userId, update)

    return true
  },

  async resetLoginFailures(userId: string): Promise<boolean> {
    await UserModel.findByIdAndUpdate(userId, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date()
    })

    return true
  }
}