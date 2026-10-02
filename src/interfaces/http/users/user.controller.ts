import { logService } from '../../../application/audit/audit.service.js'
import { userService } from '../../../application/users/user.service.js'

export const userController = {
  async me(req: any, res: any) {
    try {
      const user = await userService.getById(req.user.id)
      return res.status(200).json({ user })
    } catch (error: any) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erro ao buscar usuário' })
    }
  },

  async updateProfile(req: any, res: any) {
    try {
      const { firstName, lastName } = req.body
      const user = await userService.updateProfile(req.user.id, {
        firstName,
        lastName
      })

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'PROFILE_UPDATED'
      })

      return res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        user
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
      const data = await userService.exportData(req.user.id)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: 'DATA_EXPORT_SUCCESS'
      })

      return res.status(200).json({ data })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'DATA_EXPORT_FAILED',
        metadata: { reason: error.message }
      })

      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: error.message })
      }
      return res.status(400).json({ error: error.message })
    }
  },

  async revokeConsent(req: any, res: any) {
    try {
      await userService.revokeConsent(req.user.id)

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
      await userService.deleteAccount(req.user.id)

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
