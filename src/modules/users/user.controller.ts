import { userRepository } from './user.repository.js'
import { logService } from '../audit/audit.service.js'
import { authRepository } from '../auth/auth.repository.js'

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    consent: Boolean(user.consent),
    consentDate: user.consent_date || null,
    createdAt: user.created_at || null
  }
}

export const userController = {
   async me(req: any, res: any) {
    try {
      const user = await userRepository.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      return res.status(200).json({ user: serializeUser(user) })
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar usuário' })
    }
  },

  async updateProfile(req: any, res: any) {
    try {
      const { firstName, lastName } = req.body

      if (!firstName || !lastName ) {
        return res
          .status(400)
          .json({ error: 'Preencha todos os campos do perfil' })
      }

      await userRepository.updateProfile(req.user.id, {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim()
      })

      const user = await userRepository.findById(req.user.id)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'PROFILE_UPDATED'
      })

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        user: serializeUser(user)
      })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'PROFILE_UPDATE_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async exportData(req: any, res: any) {
    try {
      const user = await userRepository.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'DATA_EXPORT_SUCCESS'
      })

      return res.status(200).json({ data: serializeUser(user) })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'DATA_EXPORT_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async revokeConsent(req: any, res: any) {
    try {
      await userRepository.updateConsent(req.user.id, {
        consent: false,
        consentDate: new Date().toISOString()
      })

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'CONSENT_REVOKED'
      })

      return res
        .status(200)
        .json({ message: 'Consentimento revogado com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'CONSENT_REVOKE_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async deleteAccount(req: any, res: any) {
    try {
      await authRepository.revokeAllUserRefreshTokens(req.user.id)
      await userRepository.deleteById(req.user.id)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'ACCOUNT_DELETED'
      })

      return res.status(200).json({ message: 'Conta excluída com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'ACCOUNT_DELETE_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  }
}
