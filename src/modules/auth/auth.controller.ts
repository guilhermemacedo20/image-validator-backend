import { authService } from './auth.service.js'
import { twoFactorService } from '../security/two-factor.service.js'
import { userRepository } from '../users/user.repository.js'
import { logService } from '../audit/audit.service.js'


export const authController = {

  // controlador para lidar com o registro de novos usuários.
  async register(req: any, res: any) {
    try {
      const { email, password, consent } = req.body
      const user = await authService.register({ email, password, consent })

      await logService.write(req, {
        userId: user.id,
        email: user.email,
        action: 'REGISTER_SUCCESS'
      })

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        user
      })
    } catch (error: any) {
      await logService.write(req, {
        email: req.body?.email || null,
        action: 'REGISTER_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com o login de usuários.
  async login(req: any, res: any) {
    try {
      const { email, password, twoFactorCode, twoFactorToken } = req.body
      const result: LoginResponse = await authService.login({
        email,
        password,
        twoFactorCode,
        twoFactorToken
      })

      if (result.requiresTwoFactor) {
        await logService.write(req, {
          email,
          action: 'LOGIN_2FA_REQUIRED'
        })

        return res.status(200).json({
          requiresTwoFactor: true,
          twoFactorToken: result.twoFactorToken,
          message: 'Código 2FA necessário'
        })
      }

      await logService.write(req, {
        userId: result?.user?.id,
        email: result?.user?.email,
        action: 'LOGIN_SUCCESS'
      })

      return res.status(200).json(result)
    } catch (error: any) {
      await logService.write(req, {
        email: req.body?.email || null,
        action: 'LOGIN_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(401).json({ error: error.message })
    }
  },

  // controlador para lidar com a renovação de tokens de acesso usando o refresh token.
  async refresh(req: any, res: any) {
    try {
      const { refreshToken } = req.body
      const tokens = await authService.refresh(refreshToken)

      await logService.write(req, {
        action: 'REFRESH_SUCCESS'
      })

      return res.status(200).json(tokens)
    } catch (error: any) {
      await logService.write(req, {
        action: 'REFRESH_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(401).json({ error: error.message })
    }
  },

  // controlador para lidar com o logout de usuários, revogando tokens de acesso e refresh.
  async logout(req: any, res: any) {
    try {
      const accessToken = req.accessToken
      const { refreshToken } = req.body

      await authService.logout(accessToken, refreshToken)

      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'LOGOUT_SUCCESS'
      })

      return res.status(200).json({ message: 'Logout realizado com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: 'LOGOUT_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com a solicitação de redefinição de senha, enviando um email com instruções.
  async forgotPassword(req: any, res: any) {
    try {
      const { email } = req.body
      await authService.forgotPassword(email)

      await logService.write(req, {
        email,
        action: 'PASSWORD_RESET_REQUESTED'
      })

      return res.status(200).json({
        message: 'Se o email existir, você receberá instruções'
      })
    } catch (error: any) {
      await logService.write(req, {
        email: req.body?.email || null,
        action: 'PASSWORD_RESET_REQUEST_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com a redefinição de senha usando um token válido.
  async resetPassword(req: any, res: any) {
    try {
      const { token, newPassword } = req.body
      await authService.resetPassword(token, newPassword)

      await logService.write(req, {
        action: 'PASSWORD_RESET_SUCCESS'
      })

      return res.status(200).json({ message: 'Senha alterada com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        action: 'PASSWORD_RESET_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com a configuração da autenticação de dois fatores (2FA) para um usuário autenticado.
  async setup2FA(req: any, res: any) {
    try {
      const user = await userRepository.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      const setup = await twoFactorService.setup(user)

      await logService.write(req, {
        userId: user.id,
        email: user.email,
        action: '2FA_SETUP_STARTED'
      })

      return res.status(200).json(setup)
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_SETUP_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com a confirmação da ativação da autenticação de dois fatores (2FA) usando um token válido.
  async confirm2FA(req: any, res: any) {
    try {
      const { token } = req.body
      await twoFactorService.confirmActivation(req.user.id, token)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: '2FA_ENABLED'
      })

      return res.status(200).json({ message: '2FA ativado com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_ENABLE_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  },

  // controlador para lidar com a desativação da autenticação de dois fatores (2FA) para um usuário autenticado.
  async disable2FA(req: any, res: any) {
    try {
      await twoFactorService.disable(req.user.id)

      await logService.write(req, {
        userId: req.user.id,
        email: req.user.email,
        action: '2FA_DISABLED'
      })

      return res.status(200).json({ message: '2FA desativado com sucesso' })
    } catch (error: any) {
      await logService.write(req, {
        userId: req.user?.id || null,
        email: req.user?.email || null,
        action: '2FA_DISABLE_FAILED',
        metadata: { reason: error.message }
      })

      return res.status(400).json({ error: error.message })
    }
  }
}
