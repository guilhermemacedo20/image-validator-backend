import { authService } from '../services/authService.js'
import { twoFactorService } from '../services/twoFactorService.js'
import { userRepository } from '../repositories/userRepository.js'
import { logService } from '../services/logService.js'

export const authController = {
  async register(req, res) {
    try {
      const { email, password } = req.body

      const user = await authService.register({ email, password })

      await logService.write(req, {
        userId: user.id,
        email,
        action: 'REGISTER_SUCCESS',
      })

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        user,
      })
    } catch (error) {
      await logService.write(req, {
        email: req.body?.email || null,
        action: 'REGISTER_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async login(req, res) {
    try {
      const { email, password, twoFactorCode } = req.body

      const result = await authService.login({ email, password, twoFactorCode })

      if (result.requiresTwoFactor) {
        await logService.write(req, {
          email,
          action: 'LOGIN_2FA_REQUIRED',
        })

        return res.status(200).json({
          requiresTwoFactor: true,
          message: 'Código 2FA necessário',
        })
      }

      await logService.write(req, {
        userId: result.user.id,
        email,
        action: 'LOGIN_SUCCESS',
      })

      return res.status(200).json(result)
    } catch (error) {
      await logService.write(req, {
        email: req.body?.email || null,
        action: 'LOGIN_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(401).json({ error: error.message })
    }
  },

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body

      const tokens = await authService.refresh(refreshToken)

      await logService.write(req, {
        action: 'REFRESH_SUCCESS',
      })

      return res.status(200).json(tokens)
    } catch (error) {
      await logService.write(req, {
        action: 'REFRESH_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(401).json({ error: error.message })
    }
  },

  async logout(req, res) {
    try {
      const accessToken = req.accessToken
      const { refreshToken } = req.body

      await authService.logout(accessToken, refreshToken)

      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'LOGOUT_SUCCESS',
      })

      return res.status(200).json({ message: 'Logout realizado com sucesso' })
    } catch (error) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'LOGOUT_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async me(req, res) {
    try {
      const user = await userRepository.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" })
      }

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          twoFactorEnabled: user.two_factor_enabled,
        },
      })
    } catch {
      return res.status(500).json({ error: "Erro ao buscar usuário" })
    }
  },

  async setup2FA(req, res) {
    try {
      const user = await userRepository.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      const setup = await twoFactorService.setup(user)

      await logService.write(req, {
        userId: user.id,
        email: user.email,
        action: '2FA_SETUP_STARTED',
      })

      return res.status(200).json(setup)
    } catch (error) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_SETUP_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async confirm2FA(req, res) {
    try {
      const { token } = req.body

      await twoFactorService.confirmActivation(req.user.id, token)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: '2FA_ENABLED',
      })

      return res.status(200).json({ message: '2FA ativado com sucesso' })
    } catch (error) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_CONFIRM_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(400).json({ error: error.message })
    }
  },

  async disable2FA(req, res) {
    try {
      await twoFactorService.disable(req.user.id)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: '2FA_DISABLED',
      })

      return res.status(200).json({ message: '2FA desativado com sucesso' })
    } catch (error) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_DISABLE_FAILED',
        metadata: { reason: error.message },
      })

      return res.status(400).json({ error: error.message })
    }
  },
}